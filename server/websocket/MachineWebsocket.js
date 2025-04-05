const { Machine, MachineLog, User } = require("../models");
const { percentage, totalHour } = require("../utils/countHour");
const { dateQuery } = require("../utils/dateQuery");

/**
 * Perfect time constant.
 * @type {number}
 */
const perfectTime = 24; // hour

/**
 * Converts a date to a formatted time string.
 *
 * @param {Date} date - The date to convert.
 * @returns {string} The formatted time string. ex: 10:00
 */
function convertDateTime(date) {
  const dateTime = new Date(date);
  const hours = dateTime.getHours();
  const minutes = dateTime.getMinutes();
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Generates a description of the running time.
 *
 * @param {number} totalRunningHours - The total running hours in milliseconds.
 * @returns {string} The running time description.
 */
function countDescription(totalRunningHours) {
  const count = totalHour(totalRunningHours);
  const hour = count.split(".")[0];
  const minute = count.split(".")[1];
  return `${hour} hour ${minute} minute / ${perfectTime} hour`;
}

/**
 * Formats the time difference between two dates.
 *
 * @param {number} ms - The time difference in milliseconds.
 * @returns {string} The formatted time difference ex: 1h 2m 3s
 */
function formatTimeDifference(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));

  let result = [];
  if (hours > 0) result.push(`${hours}h`);
  if (minutes > 0) result.push(`${minutes}m`);
  if (seconds > 0) result.push(`${seconds}s`);

  return result.length > 0 ? result.join(" ") : "0s";
}

module.exports = class MachineWebsocket {
  /**
   * Retrieves machine timelines and sends them to the client.
   *
   * @param {WebSocket} client - The WebSocket client instance.
   * @param {string} date - The date to retrieve the timeline for.
   */
  static async timelines(client, date) {
    try {
      // default date is today
      const currentDate = date || new Date();
      const dateOption = new Date(currentDate);
      // dateOption.setUTCFullYear(
      //   dateOption.getUTCFullYear(),
      //   dateOption.getUTCMonth(),
      //   dateOption.getUTCDate()
      // );
      // console.log(dateQuery(dateOption), 333);
      const machines = await Machine.findAll({
        include: [
          {
            model: MachineLog,
            where: {
              // ambil data sesuai hari ini
              createdAt: dateQuery(dateOption),
            },
            attributes: [
              "id",
              "current_status",
              "createdAt",
              "description",
              "user_id",
              "g_code_name",
              "k_num",
              "output_wp",
              "running_today",
              "createdAt",
            ],
            include: [
              {
                model: User,
                attributes: ["name"],
              },
            ],
          },
        ],
        order: [[{ model: MachineLog }, "createdAt", "ASC"]],
        attributes: ["name", "status", "type"],
      });

      const sortedMachines = machines
        .map((machine) => {
          return {
            ...machine.dataValues,
            name: `${machine.name} (${machine.dataValues.type ?? ''})`,
          };
        })
        .sort((a, b) => {
          const numberA = parseInt(a.name.slice(3));
          const numberB = parseInt(b.name.slice(3));
          return numberA - numberB;
        });

      client.send(JSON.stringify({ type: "asd", data: sortedMachines }));

      if (!sortedMachines.length) {
        client.send(JSON.stringify({ type: "timeline", data: [] }));
        return;
      }

      const formattedMachines = sortedMachines.map((machine) => {
        const logs = machine.MachineLogs.map((log, indexLog) => {
          const operator = log.User?.name || null;
          const currentTime = log.createdAt;
          const nextLog = machine.MachineLogs[indexLog + 1] || null;
          const timeDifference =
            new Date(nextLog?.createdAt || 0) - new Date(currentTime);
          return {
            ...log.dataValues,
            createdAt: convertDateTime(currentTime),
            timeDifference: formatTimeDifference(timeDifference),
            operator,

            // log,
            // nextLog,
          };
        });

        return {
          name: machine.name,
          status: logs[logs.length - 1].current_status,
          MachineLogs: logs,
        };
      });
      const data = {
        data: formattedMachines,
        date: currentDate,
      };
      client.send(JSON.stringify({ type: "timeline", data }));
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
      // nowDate.setUTCFullYear(
      //   nowDate.getUTCFullYear(),
      //   nowDate.getUTCMonth(),
      //   nowDate.getUTCDate()
      // );

      const machines = await Machine.findAll({
        attributes: ["id", "name", "type"],
      });
      // check if machines is empty or nowDate is greater than current date
      if (!machines.length || nowDate.getTime() > new Date().getTime()) {
        client.send(JSON.stringify({ type: "percentage", data: [] }));
        return;
      }

      const machinesWithLastLog = await Promise.all(
        machines.map(async (machine) => {
          const lastLog = await MachineLog.findOne({
            where: {
              machine_id: machine.id,
              createdAt: dateQuery(nowDate),
            },
            order: [["createdAt", "DESC"]],
            attributes: ["running_today", "current_status", "createdAt"],
          });
          // console.log(lastLog, 123)

          // const test = await MachineLog.findAll({
          //     where: {
          //         machine_id: machine.id,
          //         updatedAt: dateQuery(nowDate)
          //     },
          //     order: [['updatedAt', 'DESC']],
          //     attributes: ['running_today', 'current_status'],
          //     limit: 5
          // });
          // console.log(test, 123)

          const runningTime = percentage(
            lastLog?.running_today || 0,
            perfectTime
          );

          const result = {
            status: lastLog?.current_status || "Stopped",
            name: `${machine.name} (${machine.dataValues.type ?? ''})`,
            description: countDescription(lastLog?.running_today || 0),
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
