const { Machine, MachineLog, DailyConfig } = require("../models");
const { config, dateQuery } = require("../utils/dateQuery");
const { literal } = require("sequelize");
const {
  getRunningTimeMachineLog,
  getMachineTimeline,
  countRunningTime,
} = require("../utils/machineUtils");
const { serverError } = require("../utils/serverError");

const DEFAULT_PERFECT_TIME = 24 * 60 * 60 * 1000; // 24 hour in milisecond

/**
 * Generates a description of the running time.
 *
 * @param {number} totalRunningMilliseconds - The total running time in milliseconds.
 * @param {number} perfectTime - The perfect running time in milliseconds (default: 24 hours in ms).
 * @returns {string} The running time description in format "X hour Y minute / A hour B minute".
 */
function countDescription(
  totalRunningMilliseconds,
  perfectTime = DEFAULT_PERFECT_TIME
) {
  const hours = Math.floor(totalRunningMilliseconds / (1000 * 60 * 60));
  const minutes = Math.floor(
    (totalRunningMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
  );
  const perfectTimeHours = Math.floor(perfectTime / (1000 * 60 * 60));
  const perfectTimeMinutes = Math.floor(
    (perfectTime % (1000 * 60 * 60)) / (1000 * 60)
  );

  return `${hours} hour ${minutes} minute / ${perfectTimeHours} hour ${perfectTimeMinutes} minute`;
}

/**
 * Calculates the percentage of running time compared to perfect time.
 *
 * @param {number} runningMilliseconds - The running time in milliseconds.
 * @param {number} perfectTimeMs - The perfect running time in milliseconds (default: 24 hours in ms).
 * @returns {number} The percentage of running time (0-100).
 */
function percentage(runningMilliseconds, perfectTimeMs = DEFAULT_PERFECT_TIME) {
  const percentage = Math.round((runningMilliseconds / perfectTimeMs) * 100);
  return percentage;
}

module.exports = class MachineWebsocket {
  /**
   * Retrieves machine timelines and sends them to the client.
   *
   * @param {WebSocket} client - The WebSocket client instance.
   * @param {string} date - The date to retrieve the timeline for.
   * @param {number} reqId - The request ID.
   */
  static async timelines(client, reqDate, reqId) {
    try {
      const nowDate = reqDate ? new Date(reqDate) : new Date();
      if (
        nowDate.toLocaleDateString("en-CA") >
        new Date().toLocaleDateString("en-CA")
      ) {
        client.send(
          JSON.stringify({
            type: "timeline",
            data: {
              data: [],
              date: nowDate,
            },
          })
        );
        return;
      }
      const machineTimeline = await getMachineTimeline({
        date: reqDate,
        reqId,
      });
      if (!machineTimeline) {
        return client.send(
          JSON.stringify({
            type: "error",
            message: "No timeline data found",
          })
        );
      }

      client.send(JSON.stringify({ type: "timeline", data: machineTimeline }));
    } catch (e) {
      console.log({ e, message: e.message });
      client.send(
        JSON.stringify({
          type: "error",
          message: "Failed to get timeline data",
        })
      );
    }
  }

  /**
   * Retrieves machine percentages and sends them to the client.
   *
   * @param {WebSocket} client - The WebSocket client instance.
   */
  static async percentages(client, date) {
    console.time("before");
    try {
      const nowDate = date ? new Date(date) : new Date();

      const machines = await Machine.findAll({
        attributes: ["id", "name", "type"],
      });
      // check if machines is empty or nowDate is greater than current date
      if (!machines.length || nowDate.getTime() > new Date().getTime()) {
        client.send(JSON.stringify({ type: "percentage", data: [] }));
        return;
      }

      const { startHour, startMinute } = config;
      const nowTime = new Date();
      const startTime = new Date();
      startTime.setHours(startHour, startMinute, 0, 0);

      const isNowDate =
        nowDate.toLocaleDateString("en-CA") ===
        nowTime.toLocaleDateString("en-CA");
      const calculateMs = nowTime.getTime() - startTime.getTime();

      const perfectTime = isNowDate ? calculateMs : DEFAULT_PERFECT_TIME;
      // const perfectTime = isNowDate
      //   ? DEFAULT_PERFECT_TIME / 2
      //   : DEFAULT_PERFECT_TIME;

      const machinesWithLastLog = await Promise.all(
        machines.map(async (machine) => {
          const { dataValues } = machine;
          const getRunningTime = await getRunningTimeMachineLog(
            dataValues.id,
            date ? nowDate : undefined
          );
          // console.log({ totalRunningTime, lastLog });
          if (!getRunningTime) {
            return {
              status: "Stopped",
              name: dataValues.type
                ? `${machine.name} (${dataValues.type})`
                : machine.name,
              description: countDescription(0, perfectTime),
              percentage: [0, 100],
            };
          }

          const runningTime = percentage(
            getRunningTime.totalRunningTime ?? 0,
            perfectTime
          );
          const name = dataValues.type
            ? `${machine.name} (${dataValues.type})`
            : machine.name;

          const result = {
            status: getRunningTime.lastLog.dataValues.current_status,
            name,
            description: countDescription(
              getRunningTime.totalRunningTime || 0,
              perfectTime
            ),
            percentage: [runningTime, 100 - runningTime],
          };
          return result;
        })
      );

      const data = {
        data: machinesWithLastLog.sort((a, b) => {
          const numberA = parseInt(a.name.slice(3));
          const numberB = parseInt(b.name.slice(3));
          return numberA - numberB;
        }),
        date: nowDate,
      };
      // console.log(data.data.map((a) => a.percentage), 3)
      client.send(JSON.stringify({ type: "percentage", data }));
    } catch (e) {
      console.log({ e, message: e.message });
      client.send(
        JSON.stringify({ type: "error", message: "Failed to get percentage" })
      );
    }
    console.timeEnd("before");
  }

  /**
   * Optimized version of percentages method that fixes N+1 query issue.
   * Retrieves machine percentages with improved database querying and sends them to the client.
   *
   * @param {WebSocket} client - The WebSocket client instance.
   * @param {{ date: string; shift: 0|1|2}} data}
   */
  static async refactorPercentages(client, data) {
    console.time("after");
    try {
      const { date, shift } = data;
      const reqDate = data.date
      if (!date) return client.send(JSON.stringify({ type: "error", message: "No date provided" }));

      const nowDate = new Date(data.date)
      if (nowDate.getTime() > new Date().getTime()) {
        return client.send(JSON.stringify({ type: "percentage", data: [] }));
      }
      const IS_NOW_DATE =
        nowDate.toLocaleDateString("en-CA") ===
        new Date().toLocaleDateString("en-CA");
      const range = await dateQuery(nowDate);

      const machinesWithLogs = await Machine.findAll({
        attributes: [
          [
            literal(
              `CASE WHEN "type" IS NOT NULL THEN "name" || ' (' || "type" || ')' ELSE "name" END`
            ),
            "name",
          ],
        ],
        include: [
          {
            model: MachineLog,
            attributes: ["current_status", "createdAt"],
            where: { createdAt: range },
          },
        ],
        order: [[{ model: MachineLog }, "createdAt", "ASC"]],
      });

      const { startHour, startMinute } = config;
      const nowTime = new Date();
      const startTime = new Date();
      startTime.setHours(startHour, startMinute, 0, 0);

      const formattedReqDate = new Date(date).toLocaleDateString("en-CA");
      const formattedDate = new Date().toLocaleDateString("en-CA");
      const calculateMs = nowTime.getTime() - startTime.getTime();
      const perfectTime2 = IS_NOW_DATE ? calculateMs : DEFAULT_PERFECT_TIME;
      const perfectTime = shift ? await getCalculatePerfectTimeMs(date, data.shift) : perfectTime2;

      /** @type {undefined | string}  */
      let startFirstShift;

      // check if date is before today
      if (date && formattedReqDate < formattedDate) {
        const findDailyConfig = await DailyConfig.findOne({
          where: {
            date: formattedReqDate,
          },
          attributes: ["startFirstShift", "startSecondShift", 'endFirstShift', 'endSecondShift'],
        });

        if (findDailyConfig) {
          startFirstShift = findDailyConfig.startFirstShift;
        }
      }

      const runningTimeMachines = machinesWithLogs.map((machine) => {
        const { name, MachineLogs } = machine.get({ plain: true });
        const lastLog = MachineLogs[MachineLogs.length - 1];
        let { totalRunningTime, lastRunningTimestamp } =
          countRunningTime(MachineLogs);

        // check if date is today
        if (lastRunningTimestamp && IS_NOW_DATE) {
          const now = new Date().getTime();
          const diff = now - new Date(lastRunningTimestamp).getTime();
          totalRunningTime += diff;
        }

        // check if date is before today
        if (lastRunningTimestamp && startFirstShift) {
          const [hour, minute] = startFirstShift.split(":").map(Number);
          const nextDay = new Date(formattedReqDate);
          nextDay.setDate(nextDay.getDate() + 1);
          nextDay.setHours(hour, minute, 0, 0);

          const calculate = new Date(nextDay) - new Date(lastRunningTimestamp);
          totalRunningTime += calculate;
        }

        const runningTime = percentage(totalRunningTime ?? 0, perfectTime);

        const description = countDescription(
          totalRunningTime || 0,
          perfectTime
        );

        delete machine.MachineLogs;
        return {
          name,
          status: lastLog.current_status,
          description,
          percentage: [runningTime, 100 - runningTime],
        };
      });

      const formattedResult = {
        date: nowDate,
        data: runningTimeMachines.sort((a, b) => {
          const numberA = parseInt(a.name.slice(3));
          const numberB = parseInt(b.name.slice(3));
          return numberA - numberB;
        }),
      };

      client.send(
        JSON.stringify({ type: "percentage", data: formattedResult })
      );
    } catch (error) {
      serverError(error, "from refactor percentages");
      client.send(
        JSON.stringify({ type: "error", message: "Failed to get percentage" })
      );
    }
    console.timeEnd("after");
  }
};

/**
 * 
 * @param {string} date
 * @param {1|2} shift
 */
async function getCalculatePerfectTimeMs(date, shift) {
  try {
    if (!shift || shift > 2) {
      throw new Error("Invalid shift")
    }
    const [startShift, endShift, isSecondShift] = await getShiftTime(date, shift)

    const [firstHour, firstMinute, fisrtSecond] = startShift.split(":").map(Number);
    const [lastHour, lastMinute, lastSecond] = endShift.split(":").map(Number);
    const start = new Date(date)
    const end = new Date(date)
    start.setHours(firstHour, firstMinute, fisrtSecond, 0)
    isSecondShift && end.setDate(end.getDate() + 1)
    end.setHours(lastHour, lastMinute, lastSecond, 0)
    const diff = end.getTime() - start.getTime()
    return diff


  } catch (error) {
    serverError(error, "from getCalculatePerfectTime");
  }
}

/**
 * 
 * @param {string} date 
 * @param {1|2} shift 
 * @returns {Promise<[string, string, boolean]>} [start, end, isSecondShift]
  * @description get shift time from database
 */
async function getShiftTime(date, shift) {
  try {
    const attributes = []
    if (shift === 1) {
      attributes.push("startFirstShift", "endFirstShift")
    } else {
      attributes.push("startSecondShift", "endSecondShift")
    }
    const findDailyConfig = await DailyConfig.findOne({
      where: {
        date: new Date(date).toLocaleDateString('en-CA'),
      },
      attributes
    });
    if (!findDailyConfig) {
      throw new Error("Daily config not found");
    }
    if (shift === 1) {
      const { startFirstShift, endFirstShift } = findDailyConfig
      return [startFirstShift, endFirstShift, false]
    }
    // shift 2
    const { startSecondShift, endSecondShift } = findDailyConfig
    return [startSecondShift, endSecondShift, true]
  } catch (error) {
    serverError(error, "from getTimeStartAndEnd")
  }
}
