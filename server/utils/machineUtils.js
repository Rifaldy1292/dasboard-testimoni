const { Op, literal } = require("sequelize");
const { MachineLog, Machine, DailyConfig, User } = require("../models");
const { serverError } = require("./serverError");
const { machineLoggerInfo } = require("./logger");
const machineCache = require("../cache");

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
      if (!lastRunningTimestamp) {
        lastRunningTimestamp = log.createdAt;
      }
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
 * Get shift date range based on date and shift
 * @param {Date | string} date - The date to get shift range from
 * @param {number} shift - Shift number (0 = all day, 1 = first shift, 2 = second shift)
 * @returns {Promise<{dateFrom: Date, dateTo: Date}>} Date range for the specified shift
 */
const getShiftDateRange = async (date, shift) => {
  try {
    const formattedDate = new Date(date).toLocaleDateString("en-CA");
    const dailyConfig = await DailyConfig.findOne({
      where: { date: formattedDate },
      attributes: ["startFirstShift", "endFirstShift", "startSecondShift", "endSecondShift"],
      raw: true,
    });

    if (!dailyConfig) {
      throw new Error(`No daily config for ${formattedDate}`);
    }

    const dateFrom = new Date(date);
    const dateTo = new Date(date);
    const { startFirstShift, endFirstShift, startSecondShift, endSecondShift } = dailyConfig;

    switch (shift) {
      case 0: {
        const [hour, minute, second] = startFirstShift.split(':').map(Number);
        const [hour2, minute2, second2] = endSecondShift.split(':').map(Number);
        dateFrom.setHours(hour, minute, second);
        dateTo.setDate(dateTo.getDate() + 1);
        dateTo.setHours(hour2, minute2, second2);
        break;
      }
      case 1: {
        const [hour, minute, second] = startFirstShift.split(':').map(Number);
        const [hour2, minute2, second2] = endFirstShift.split(':').map(Number);
        dateFrom.setHours(hour, minute, second);
        dateTo.setHours(hour2, minute2, second2);
        break;
      }
      case 2: {
        const [hour, minute, second] = startSecondShift.split(':').map(Number);
        const [hour2, minute2, second2] = endSecondShift.split(':').map(Number);
        dateFrom.setHours(hour, minute, second);
        dateTo.setHours(hour2, minute2, second2);
        dateTo.setDate(dateFrom.getDate() + 1);
        break;
      }
    }

    return { dateFrom, dateTo };
  } catch (error) {
    throw error;
  }
}
const getAllMachine = async () => {
  try {
    machineCache.clear();
    const existMachines = await Machine.findAll({
      attributes: ["id", "name"],
      include: [
        {
          model: MachineLog,
          attributes: ["k_num", "current_status"],
          limit: 1,
          order: [["createdAt", "DESC"]],
        },
      ],
    });


    existMachines.forEach((machine) => {
      const { id, name, MachineLogs } = machine.get({ plain: true });
      machineCache.set(machine.name, {
        id: id,
        name: name,
        status: MachineLogs[0]?.current_status || null,
        k_num: MachineLogs[0]?.k_num || null,
      });
    });

    machineLoggerInfo("Get all machines from database", machineCache.getAll());
  } catch (error) {
    serverError(error, "Failed to get exist machines");
  }
};

// req id from machineController
const getMachineTimeline = async ({ date, reqId, shift }) => {
  try {
    const dateOption = new Date(date);
    const isNowDate =
      dateOption.toLocaleDateString("en-CA") ===
      new Date().toLocaleDateString("en-CA");
    const { dateFrom, dateTo } = await getShiftDateRange(dateOption, shift);
    const whereMachine = {};
    const whereMachineLog = {
      createdAt: {
        [Op.between]: [dateFrom, dateTo],
      }
    };
    // req id passed from machineController
    if (reqId) {
      whereMachine.id = {
        [Op.eq]: reqId,
      };
      whereMachineLog.current_status = "Stopped";
      whereMachineLog.description = null;
    }

    const machines = await Machine.findAll({
      attributes: [
        [
          literal(
            `CASE WHEN "Machine"."type" IS NOT NULL THEN "Machine"."name" || ' (' || "Machine"."type" || ')' ELSE "Machine"."name" END`
          ),
          "name",
        ],
        "status",
      ],
      where: whereMachine,
      include: [
        {
          model: MachineLog,
          where: whereMachineLog,
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
      order: [[{ model: MachineLog }, "createdAt", "ASC"]],
    });

    const sortedMachines = machines.sort((a, b) => {
      const numberA = parseInt(a.name.slice(3));
      const numberB = parseInt(b.name.slice(3));
      return numberA - numberB;
    });

    if (!sortedMachines.length) {
      return;
    }
    const MILISECOND = 1000;


    const formattedMachines = sortedMachines.map((machine) => {
      const logs = machine.MachineLogs.map((log, indexLog) => {
        const { dataValues, current_status, calculate_total_cutting_time } = log;
        const splitCalculate = calculate_total_cutting_time ? calculate_total_cutting_time.split(".") : [];
        const remaining = calculate_total_cutting_time ? `remaining ${splitCalculate[0]} project, ${formatTimeDifference(
          Number(splitCalculate[1]) * MILISECOND
        )}` : null;
        const operator = dataValues.User?.name || null;
        // calculate_total_cutting_time is in seconds
        const currentTime = log.createdAt;
        const isLastLog = indexLog === machine.MachineLogs.length - 1;
        const nextLog = machine.MachineLogs[indexLog + 1] || null;
        const lastLogAndIsnowDate = isLastLog && isNowDate;
        // const timeDifference = lastLogAndIsnowDate ? new Date() - new Date(currentTime) :
        //   new Date(nextLog?.createdAt || 0) - new Date(currentTime);
        let timeDifference = 0
        switch (true) {
          case lastLogAndIsnowDate:
            timeDifference = new Date() - new Date(currentTime);
            break;
          case isLastLog && !isNowDate:
            timeDifference = dateTo - new Date(currentTime);
            break;
          default:
            timeDifference = new Date(nextLog?.createdAt || 0) - new Date(currentTime);
        }
        return {
          ...log.dataValues,
          timeDifference: formatTimeDifference(timeDifference),
          timeDifferenceMs: timeDifference,
          k_num: current_status === "Running" ? log.k_num : null,
          isLastLog,
          output_wp: current_status === "Running" ? log.output_wp : null,
          g_code_name: current_status === "Running" ? log.g_code_name : null,
          operator,
          remaining
          // log,
          // nextLog,
        };
      });

      const nextLog =
        machine.MachineLogs[machine.MachineLogs.length - 1] || null;
      const nextCalculate = nextLog.calculate_total_cutting_time
        ? Number(nextLog.calculate_total_cutting_time.split(".")[1])
        : 0;
      const nextTime = nextCalculate * MILISECOND;
      const nextTimeDifference = formatTimeDifference(nextTime);

      const extendLogs = isNowDate
        ? [
          ...logs,

          {
            isNext: true,
            createdAt: nextLog.createdAt,
            timeDifference: nextTimeDifference,
            timeDifferenceMs: nextTime,
            operator: nextLog.User?.name || null,
            description: "Remaining",
          },
        ]
        : logs;
      // console.log({ nextLog: extendLogs[extendLogs.length - 1] });

      // reqId is passed from machineController
      return {
        name: machine.name,
        status: logs[logs.length - 1].current_status,
        MachineLogs: reqId ? logs : extendLogs,
      };
    });

    return { data: formattedMachines, date: dateOption, dateFrom, dateTo };
  } catch (error) {
    // 'No daily config for 2025-05-15'
    if (error.message.includes("No daily config")) throw error
    serverError(error, "getMachineTimeline");
  }
};



module.exports = {
  getAllMachine,
  getMachineTimeline,
  countRunningTime,
  getShiftDateRange,
};
