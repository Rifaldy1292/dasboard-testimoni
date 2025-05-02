const { Op } = require("sequelize");
const { existMachinesCache } = require("../cache");
const { MachineLog, Machine, DailyConfig, User } = require("../models");
const { dateQuery, config } = require("./dateQuery");
const { serverError } = require("./serverError");

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

/**
 * Calculates the total running time and last running timestamp from machine logs
 *
 * @param {Array<{createdAt: string, current_status: "Running" | "Stopped"}>} logs - Array of machine log objects containing status and createdAt
 * @returns {{totalRunningTime: number, lastRunningTimestamp: null | string}} Object containing totalRunningTime and lastRunningTimestamp
 * @property {number} totalRunningTime - Total time the machine was running in milliseconds
 * @property {Date|null} lastRunningTimestamp - Timestamp of last running status or null
 */
const countRunningTime = (logs) => {
  let totalRunningTime = 0;
  let lastRunningTimestamp = null;

  logs.forEach((log) => {
    if (log.current_status === "Running") {
      lastRunningTimestamp = log.createdAt;
    } else if (lastRunningTimestamp) {
      const timeDifference =
        new Date(log.createdAt) - new Date(lastRunningTimestamp);
      totalRunningTime += timeDifference;
      lastRunningTimestamp = null;
    }
  });

  return {
    totalRunningTime,
    lastRunningTimestamp,
  };
};
/**
 * Calculates the total running time of a machine based on today's machine logs
 *
 * @param {number|string} machine_id - ID of the machine to calculate running time for
 * @param {Date|undefined} reqDate - Date to filter machine logs by (optional)
 * @returns {Promise<{totalRunningTime: number, lastLog: {id: number, createdAt: Date} }|undefined>} Object containing totalRunningTime and lastMachineLog, or undefined if no logs exist
 * @throws {Error} If an error occurs during the calculation process
 */
const getRunningTimeMachineLog = async (machine_id, reqDate) => {
  try {
    // Fetch all machine logs for today, ordered by creation time
    const range = await dateQuery(reqDate);
    const logs = await MachineLog.findAll({
      where: {
        machine_id,
        createdAt: range,
      },
      order: [["createdAt", "ASC"]],
      attributes: ["id", "createdAt", "current_status"],
    });

    // If no logs found, return undefined
    if (!logs.length) {
      return undefined;
    }

    const lastLog = logs[logs.length - 1];

    // Calculate total running time
    const count = countRunningTime(logs);
    let lastRunningTimestamp = count.lastRunningTimestamp;
    let totalRunningTime = count.totalRunningTime;

    // if last log is "Running"
    if (lastRunningTimestamp) {
      // if reqDate is undefined, use current date
      if (!reqDate) {
        const calculate = new Date() - new Date(lastRunningTimestamp);
        totalRunningTime += calculate;
        return {
          totalRunningTime,
          lastLog: logs[logs.length - 1],
        };
      } else {
        // reqDate is defined
        const formattedReqDate = new Date(reqDate).toLocaleDateString("en-CA");
        const formattedDate = new Date().toLocaleDateString("en-CA");
        // jika tanggal lebih dari hari ini
        // console.log({ formattedReqDate, formattedDate }, formattedReqDate > formattedDate, 88888)
        if (formattedReqDate > formattedDate) {
          return {
            totalRunningTime: 0,
            lastLog,
          };
        }
        // // jika tanggal hari ini, maka hitung waktu berjalan
        if (formattedReqDate === formattedDate) {
          const calculate = new Date() - new Date(lastRunningTimestamp);
          totalRunningTime += calculate;
          return {
            totalRunningTime,
            lastLog,
          };
        }

        const findDailyConfig = await DailyConfig.findOne({
          where: {
            date: formattedReqDate,
          },
          attributes: ["startFirstShift"],
        });

        if (!findDailyConfig) {
          return {
            totalRunningTime,
            lastLog,
          };
        }

        const [hour, minute] =
          findDailyConfig.dataValues.startFirstShift.split(":");
        const nextDay = new Date(formattedReqDate);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(Number(hour), Number(minute), 0, 0);
        const calculate = new Date(nextDay) - new Date(lastRunningTimestamp);
        totalRunningTime += calculate;
      }
    }

    // console.log({ totalRunningTime })

    return {
      totalRunningTime,
      lastLog: logs[logs.length - 1],
    };
  } catch (error) {
    serverError(error, "getRunningTimeMachineLog");
  }
};

const getAllMachine = async () => {
  try {
    existMachinesCache.clear();
    const existMachines = await Machine.findAll({
      attributes: ["id", "name", "status"],
    });

    existMachines.forEach((machine) => {
      existMachinesCache.set(machine.name, {
        id: machine.id,
        name: machine.name,
        status: machine.status,
      });
    });
  } catch (error) {
    serverError(error, "Failed to get exist machines");
  }
};

const getMachineTimeline = async ({ date, reqId }) => {
  try {
    // default date is today
    const currentDate = date || new Date();
    const dateOption = new Date(currentDate);
    const isNowDate =
      dateOption.toLocaleDateString("en-CA") ===
      new Date().toLocaleDateString("en-CA");
    const range = await dateQuery(date ? dateOption : undefined);
    const whereMachine = {};
    if (reqId) {
      whereMachine.id = {
        [Op.eq]: reqId,
      };
    }

    console.log(reqId, 'reqId')

    // console.log(whereMachine.id, 22, 'id',);

    const machines = await Machine.findAll({
      include: [
        {
          model: MachineLog,
          where: {
            createdAt: range,
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
            "createdAt",
            "calculate_total_cutting_time",
          ],
          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        },
      ],
      where: whereMachine,
      order: [[{ model: MachineLog }, "createdAt", "ASC"]],
      attributes: ["name", "status", "type"],
    });
    // console.log(machines, 22)

    const sortedMachines = machines
      .map((machine) => {
        const { name, type } = machine.dataValues;
        return {
          ...machine.dataValues,
          name: name + `${type ? ` (${type})` : ""}`,
        };
      })
      .sort((a, b) => {
        const numberA = parseInt(a.name.slice(3));
        const numberB = parseInt(b.name.slice(3));
        return numberA - numberB;
      });

    if (!sortedMachines.length) {
      return;
    }

    const formattedMachines = sortedMachines.map((machine) => {
      const logs = machine.MachineLogs.map((log, indexLog) => {
        const { dataValues, current_status } = log;
        const operator = dataValues.User?.name || null;
        // calculate_total_cutting_time is in seconds
        const currentTime = log.createdAt;
        const isLastLog = indexLog === machine.MachineLogs.length - 1;
        const nextLog = machine.MachineLogs[indexLog + 1] || null;
        const timeDifference =
          new Date(nextLog?.createdAt || 0) - new Date(currentTime);
        return {
          ...log.dataValues,
          created_at: new Date(currentTime).toLocaleString(),
          createdAt: new Date(currentTime).toLocaleTimeString('id-ID', { hour: 'numeric', minute: '2-digit' }),
          timeDifference: formatTimeDifference(timeDifference),
          k_num: current_status === "Running" ? log.k_num : null,
          isLastLog,
          output_wp: current_status === "Running" ? log.output_wp : null,
          g_code_name: current_status === "Running" ? log.g_code_name : null,
          operator,
          // log,
          // nextLog,
        };
      });

      const nextLog =
        machine.MachineLogs[machine.MachineLogs.length - 1] || null;
      const nextCalculate = nextLog.calculate_total_cutting_time
        ? Number(nextLog.calculate_total_cutting_time.split(".")[1])
        : 0;
      const nextTimeDifference = formatTimeDifference(nextCalculate * 1000);

      const extendLogs = isNowDate
        ? [
          ...logs,

          {
            isNext: true,
            timeDifference: nextTimeDifference,
            createdAt: dateOption.toLocaleTimeString("en-CA", {
              hour: "numeric",
              minute: "numeric",
              hour12: false,
            }),
            operator: nextLog.User?.name || null,
            description: "Remaining",
          },
        ]
        : logs;
      // console.log({ nextLog: extendLogs[extendLogs.length - 1] });

      return {
        name: machine.name,
        status: logs[logs.length - 1].current_status,
        MachineLogs: extendLogs,
      };
    });

    return { data: formattedMachines, date: currentDate };
  } catch (error) {
    serverError(error, "getMachineTimeline");
  }
};

module.exports = {
  getRunningTimeMachineLog,
  getAllMachine,
  getMachineTimeline,
  countRunningTime,
};
