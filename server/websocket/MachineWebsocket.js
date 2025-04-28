const { Machine, MachineLog } = require("../models");
const { config } = require("../utils/dateQuery");
const { getRunningTimeMachineLog, getMachineTimeline } = require("../utils/machineUtils");

const DEFAULT_PERFECT_TIME = 24 * 60 * 60 * 1000 // 24 hour in milisecond

/**
 * Generates a description of the running time.
 *
 * @param {number} totalRunningMilliseconds - The total running time in milliseconds.
 * @param {number} perfectTime - The perfect running time in milliseconds (default: 24 hours in ms).
 * @returns {string} The running time description in format "X hour Y minute / A hour B minute".
 */
function countDescription(totalRunningMilliseconds, perfectTime = DEFAULT_PERFECT_TIME) {
  const hours = Math.floor(totalRunningMilliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((totalRunningMilliseconds % (1000 * 60 * 60)) / (1000 * 60))
  const perfectTimeHours = Math.floor(perfectTime / (1000 * 60 * 60))
  const perfectTimeMinutes = Math.floor((perfectTime % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours} hour ${minutes} minute / ${perfectTimeHours} hour ${perfectTimeMinutes} minute`
}

/**
 * Calculates the percentage of running time compared to perfect time.
 * 
 * @param {number} runningMilliseconds - The running time in milliseconds.
 * @param {number} perfectTimeMs - The perfect running time in milliseconds (default: 24 hours in ms).
 * @returns {number} The percentage of running time (0-100).
 */
function percentage(runningMilliseconds, perfectTimeMs = DEFAULT_PERFECT_TIME) {
  const percentage = Math.round((runningMilliseconds / perfectTimeMs) * 100)
  return percentage
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
      if (nowDate.toLocaleDateString("en-CA") > new Date().toLocaleDateString("en-CA")) {
        client.send(
          JSON.stringify({
            type: "timeline",
            data: {
              data: [],
              date: nowDate,
            }
          })
        );
        return;
      }
      const machineTimeline = await getMachineTimeline({ date: reqDate, reqId });
      if (!machineTimeline) {
        return client.send(
          JSON.stringify({
            type: "error",
            message: "No timeline data found",
          })
        );
      }

      const { data, date } = machineTimeline;

      const formattedData = {
        data,
        date,
      };
      client.send(JSON.stringify({ type: "timeline", data: formattedData }));
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
  }

  static async editLogDescription(client, data) {
    try {
      const { id, description } = data;
      await MachineLog.update({ description }, { where: { id } });

      client.send(
        JSON.stringify({
          type: "success",
          message: "Description updated successfully",
        })
      );
      // refetch timeline data
      // await MachineWebsocket.timelines(client);
    } catch (e) {
      console.log({ e, message: e.message });
      client.send(
        JSON.stringify({
          type: "error",
          message: "Failed to update description",
        })
      );
    }
  }
};
