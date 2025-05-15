const { Machine, MachineLog, DailyConfig } = require("../models");
const { config, dateQuery } = require("../utils/dateQuery");
const { literal, Op } = require("sequelize");
const {
  getRunningTimeMachineLog,
  getMachineTimeline,
  countRunningTime,
  getShiftDateRange,
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
   * @param {string} reqDate - The date to retrieve the timeline for.
   */
  static async timelines(client, reqDate) {
    try {
      const nowDate = new Date(reqDate);
      if (
        nowDate.toLocaleDateString("en-CA") >
        new Date().toLocaleDateString("en-CA")
      ) {
        return client.send(
          JSON.stringify({
            type: "timeline",
            data: {
              data: [],
              date: nowDate,
            },
          })
        );
      }
      const machineTimeline = await getMachineTimeline({
        date: reqDate,
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
   * @param {{ date: string, shift: 0| 1 | 2 }} data - The data object containing date and shift.
   */
  static async percentages(client, data) {
    console.time("after");
    try {
      const { date, shift } = data;
      if (!date || shift < 0 || shift > 2) return client.send(JSON.stringify({ type: "error", message: "Bad request!" }));

      const nowDate = new Date(date)
      if (nowDate.getTime() > new Date().getTime()) {
        return client.send(JSON.stringify({ type: "percentage", data: [] }));
      }

      // const { dateFrom, dateTo } = await getShiftDateRange(date, shift);
      const { dateFrom, dateTo } = await getShiftDateRange(date, 0);
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
            where: {
              createdAt: {
                [Op.between]: [dateFrom, dateTo]
              }
            },
          },
        ],
        order: [[{ model: MachineLog }, "createdAt", "ASC"]],
      });

      if (!machinesWithLogs.length) {
        return client.send(JSON.stringify({ type: 'percentage', data: { dateFrom, dateTo, data: [] } }))
      }

      const IS_NOW_DATE =
        nowDate.toLocaleDateString("en-CA") ===
        new Date().toLocaleDateString("en-CA");
      const calculateMs = new Date().getTime() - dateFrom.getTime();
      const perfectTime = IS_NOW_DATE && shift === 0 ? calculateMs : dateTo.getTime() - dateFrom.getTime();


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
        // before today
        if (lastRunningTimestamp && !IS_NOW_DATE) {
          const diff = dateTo.getTime() - new Date(lastRunningTimestamp).getTime();
          totalRunningTime += diff;
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
        dateFrom,
        dateTo,
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
      // message: 'No daily config for 2025-05-04'
      if (error.message.includes("No daily config")) {
        return client.send(JSON.stringify({ type: 'error', message: error.message }))
      }
      serverError(error, "from refactor percentages");
      client.send(
        JSON.stringify({ type: "error", message: "Failed to get percentage" })
      );
    }
    console.timeEnd("after");
  }
};