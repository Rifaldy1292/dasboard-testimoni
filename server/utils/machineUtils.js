const { Op, literal } = require("sequelize");
const { MachineLog, Machine, DailyConfig, User, CuttingTime } = require("../models");
const { serverError } = require("./serverError");
const dateCuttingTime = require("./dateCuttingTime");

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
 * Converts milliseconds to hours and returns it as a string with one decimal place.
 * @param {number} milliseconds - The time in milliseconds.
 * @returns {string} The time in hours with one decimal place.
 */
function convertMilisecondToHour(milliseconds) {
  const seconds = milliseconds / 1000;
  const minute = seconds / 60;
  const hours = minute / 60;
  return Number(hours.toFixed(1));
}

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
      attributes: [
        "startFirstShift",
        "endFirstShift",
        "startSecondShift",
        "endSecondShift",
      ],
      raw: true,
    });

    if (!dailyConfig) {
      throw new Error(`No daily config for ${formattedDate}`);
    }

    const dateFrom = new Date(date);
    const dateTo = new Date(date);
    const { startFirstShift, endFirstShift, startSecondShift, endSecondShift } =
      dailyConfig;

    switch (shift) {
      case 0: {
        const [hour, minute, second] = startFirstShift.split(":").map(Number);
        const [hour2, minute2, second2] = endSecondShift.split(":").map(Number);
        dateFrom.setHours(hour, minute, second);
        dateTo.setDate(dateTo.getDate() + 1);
        dateTo.setHours(hour2, minute2, second2);
        break;
      }
      case 1: {
        const [hour, minute, second] = startFirstShift.split(":").map(Number);
        const [hour2, minute2, second2] = endFirstShift.split(":").map(Number);
        dateFrom.setHours(hour, minute, second);
        dateTo.setHours(hour2, minute2, second2);
        break;
      }
      case 2: {
        const [hour, minute, second] = startSecondShift.split(":").map(Number);
        const [hour2, minute2, second2] = endSecondShift.split(":").map(Number);
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
      },
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
            "next_projects"
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
        const { User, current_status, calculate_total_cutting_time, ...rest } =
          log.get({ plain: true });

        const splitCalculate = calculate_total_cutting_time
          ? calculate_total_cutting_time.split(".")
          : [];
        const remaining = calculate_total_cutting_time
          ? `remaining ${splitCalculate[0]} project, ${formatTimeDifference(
            Number(splitCalculate[1]) * MILISECOND
          )}`
          : null;
        const operator = User?.name || null;
        // calculate_total_cutting_time is in seconds
        const currentTime = log.createdAt;
        const isLastLog = indexLog === machine.MachineLogs.length - 1;
        const nextLog = machine.MachineLogs[indexLog + 1] || null;
        const lastLogAndIsnowDate = isLastLog && isNowDate;
        // const timeDifference = lastLogAndIsnowDate ? new Date() - new Date(currentTime) :
        //   new Date(nextLog?.createdAt || 0) - new Date(currentTime);
        let timeDifference = 0;
        switch (true) {
          case lastLogAndIsnowDate:
            timeDifference = new Date() - new Date(currentTime);
            break;
          case isLastLog && !isNowDate:
            timeDifference = dateTo - new Date(currentTime);
            break;
          default:
            timeDifference =
              new Date(nextLog?.createdAt || 0) - new Date(currentTime);
        }
        return {
          ...rest,
          current_status,
          timeDifference: formatTimeDifference(timeDifference),
          timeDifferenceMs: timeDifference,
          k_num: current_status === "Running" ? log.k_num : null,
          isLastLog,
          output_wp: current_status === "Running" ? log.output_wp : null,
          g_code_name: current_status === "Running" ? log.g_code_name : null,
          operator,
          remaining,
          // log,
          // nextLog,
        };
      });

      const lastLog =
        machine.MachineLogs[machine.MachineLogs.length - 1] || null;
      const nextCalculate = lastLog.calculate_total_cutting_time
        ? Number(lastLog.calculate_total_cutting_time.split(".")[1])
        : 0;
      const nextTime = nextCalculate * MILISECOND;
      const nextTimeDifference = formatTimeDifference(nextTime);

      // next_projects
      const next_projects = lastLog.next_projects?.length ? lastLog.next_projects.map((project) => {
        const total_cutting_time_ms = project.total_cutting_time * MILISECOND;
        return {
          isNext: true,
          description: "Remaining",
          createdAt: lastLog.createdAt,
          operator: lastLog.User?.name || null,
          remaining: null,
          timeDifference: formatTimeDifference(total_cutting_time_ms),
          timeDifferenceMs: total_cutting_time_ms,
          next_projects: []
        }
      }) : [];


      const extendLogs = isNowDate
        ? [
          ...logs,
          ...next_projects,

          // {
          //   isNext: true,
          //   createdAt: lastLog.createdAt,
          //   timeDifference: nextTimeDifference,
          //   timeDifferenceMs: nextTime,
          //   operator: lastLog.User?.name || null,
          //   description: "Remaining",
          //   next_projects: lastLog.next_projects || [],
          // },
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
    if (error.message.includes("No daily config")) throw error;
    serverError(error, "getMachineTimeline");
  }
};

const handleGetCuttingTime = async (date, machineIds = null) => {
  try {
    // period is "2025-05-27T07:32:56.581Z"

    const dateResult = dateCuttingTime(date).date;

    const allDateInMonth = Array.from(
      { length: dateResult.getDate() },
      (_, i) => i + 1
    );

    // {period: "2025-05-31", target: 600}
    const cuttingTime = await CuttingTime.findOne({
      where: { period: dateResult },
      attributes: ["period", "target"],
      raw: true,
    });

    if (!cuttingTime) {
      throw new Error("cutting time not found, let's create it");
    }
    const startDateInMonth = new Date(dateResult.getFullYear(), dateResult.getMonth(), 1);
    const endDateInMonth = new Date(dateResult.getFullYear(), dateResult.getMonth() + 1, 0);
    const endDateCuttingTime = endDateInMonth
    endDateCuttingTime.setDate(endDateCuttingTime.getDate() + 1); // set to next day to include the last day of the month

    const [allLogInMonth, allConfigInMonth] = await Promise.all([
      Machine.findAll({
        where: machineIds ? { id: { [Op.in]: machineIds } } : {},
        attributes: ["id", "name"],
        include: [
          {
            model: MachineLog,
            attributes: [
              "current_status",
              "createdAt",
            ],
            where: {
              createdAt: {
                [Op.between]: [startDateInMonth, endDateCuttingTime]
              }
            },
          }
        ],
        order: [[{ model: MachineLog }, "createdAt", "ASC"]],
      }),
      DailyConfig.findAll({
        attributes: ["id", "date", "startFirstShift", "endFirstShift", "startSecondShift", "endSecondShift"],
        raw: true,
        order: [["date", "ASC"]],
        where: {
          // date: { [Op.in]: ['2025-06-02', "2025-06-03", "2025-06-04"] },
          date: {
            [Op.between]: [startDateInMonth, endDateInMonth]
          }
        },
      })

    ]);

    if (!allLogInMonth.length || !allConfigInMonth.length) {
      return res.status(200).json({
        status: 200,
        message: "success get cutting time",
        data: []
      });
    }

    // sort machine
    const format = Array.isArray(allLogInMonth) && allLogInMonth.sort((a, b) => {
      const numberA = parseInt(a.name.slice(3));
      const numberB = parseInt(b.name.slice(3));
      return numberA - numberB;
    }).map((mc) => {
      const { name, MachineLogs } = mc.get({ plain: true });

      const groupLogByShiftInDateConfig = Array.isArray(allConfigInMonth) && allConfigInMonth.map((config) => {
        const { date, startFirstShift, endFirstShift, startSecondShift, endSecondShift } = config;

        // example startFirstShift: "07:00:00"
        const [startHour1, startMinute1, startSecond1] = startFirstShift.split(':').map(Number);
        const [endHour1, endMinute1, endSecond1] = endFirstShift.split(':').map(Number);
        const [startHour2, startMinute2, startSecond2] = startSecondShift.split(':').map(Number);
        const [endHour2, endMinute2, endSecond2] = endSecondShift.split(':').map(Number);

        const dateConfig = new Date(date);
        const startShift1 = new Date(date);
        const endShift1 = new Date(date);
        const startShift2 = new Date(date);
        const endShift2 = new Date(date);

        // Set hours, minutes, seconds, and milliseconds to 0
        startShift1.setHours(startHour1, startMinute1, startSecond1, 0);
        endShift1.setHours(endHour1, endMinute1, endSecond1, 0);
        startShift2.setHours(startHour2, startMinute2, startSecond2, 0);
        endShift2.setHours(endHour2, endMinute2, endSecond2, 0);
        // shift 2 is end is next day
        endShift2.setDate(endShift2.getDate() + 1);

        // Define time range checkers
        const betweenLogCombine = (logDate) => logDate.getTime() >= startShift1.getTime() && logDate.getTime() <= endShift2.getTime();
        const betweenLog1 = (logDate) => logDate.getTime() >= startShift1.getTime() && logDate.getTime() <= endShift1.getTime();
        const betweenLog2 = (logDate) => logDate.getTime() >= startShift2.getTime() && logDate.getTime() <= endShift2.getTime();

        // filter logs by shift
        const logCombineShift = MachineLogs.filter((log) => betweenLogCombine(new Date(log.createdAt)));
        const logShift1 = MachineLogs.filter((log) => betweenLog1(new Date(log.createdAt)));
        const logShift2 = MachineLogs.filter((log) => betweenLog2(new Date(log.createdAt)));


        // count running time
        const runningTimeCombineShift = countRunningTime(logCombineShift);
        const runningTime1 = countRunningTime(logShift1);
        const runningTime2 = countRunningTime(logShift2);

        let countCombineShift = runningTimeCombineShift.totalRunningTime;
        let count1 = runningTime1.totalRunningTime;
        let count2 = runningTime2.totalRunningTime;

        const isNowDate = (date) => date.toLocaleDateString() === new Date().toLocaleDateString() && date.getHours() >= startHour1

        // Handle current running calculation
        if (runningTimeCombineShift.lastRunningTimestamp) {
          const lastRunningDate = new Date(runningTimeCombineShift.lastRunningTimestamp);
          if (isNowDate(lastRunningDate) && betweenLogCombine(lastRunningDate)) {
            countCombineShift += new Date().getTime() - lastRunningDate.getTime();
          } else {
            countCombineShift += endShift2.getTime() - lastRunningDate.getTime();
          }

        }

        if (runningTime1.lastRunningTimestamp) {
          const lastRunningDate = new Date(runningTime1.lastRunningTimestamp);
          if (isNowDate(lastRunningDate) && betweenLog1(lastRunningDate)) {
            count1 += new Date().getTime() - lastRunningDate.getTime();
          } else {
            count1 += endShift1.getTime() - lastRunningDate.getTime();
          }

        }

        if (runningTime2.lastRunningTimestamp) {
          const lastRunningDate = new Date(runningTime2.lastRunningTimestamp);
          if (isNowDate(lastRunningDate) && betweenLog2(lastRunningDate)) {
            count2 += new Date().getTime() - lastRunningDate.getTime();
          } else {
            count2 += endShift2.getTime() - lastRunningDate.getTime();
          }
        }

        return {
          date: dateConfig.getDate(),
          count: {
            combine: count1 + count2,
            shift1: count1,
            shift2: count2,
          },
          shifts: {
            // without second
            combine: `${startFirstShift.slice(0, -3)} - ${endSecondShift.slice(0, -3)}`,
            shift1: `${startFirstShift.slice(0, -3)} - ${endFirstShift.slice(0, -3)}`,
            shift2: `${startSecondShift.slice(0, -3)} - ${endSecondShift.slice(0, -3)}`,
          }
        };
      });





      const notFoundConfig = allDateInMonth.filter((day) => {
        return !groupLogByShiftInDateConfig.some((item) => item.date === day);
      });

      const notFoundConfigFormatted = notFoundConfig.length ? notFoundConfig.map((day) => {
        return {
          date: day,
          count: {
            combine: 0,
            shift1: 0,
            shift2: 0,
          },
          shifts: {
            combine: null,
            shift1: null,
            shift2: null,
          }
        };
      }) : [];

      // if notFoundConfig.length, add to groupLogByShiftInDateConfig and sort by date
      const combinedData = [...groupLogByShiftInDateConfig, ...notFoundConfigFormatted].sort((a, b) => a.date - b.date)

      // index 1 + index 2

      const formattedLogCount = Array.isArray(combinedData) && combinedData.map((item, index) => {
        let sumCombine = 0
        let sumShift1 = 0
        let sumShift2 = 0

        for (let j = 0; j <= index; j++) {
          const { count } = combinedData[j];
          sumCombine += count.combine || 0;
          sumShift1 += count.shift1 || 0;
          sumShift2 += count.shift2 || 0;
        }

        const { combine, shift1, shift2 } = item.count

        return {
          ...item,
          count: {
            combine: convertMilisecondToHour(combine),
            shift1: convertMilisecondToHour(shift1),
            shift2: convertMilisecondToHour(shift2),
            calculate: {
              combine: convertMilisecondToHour(sumCombine),
              shift1: convertMilisecondToHour(sumShift1),
              shift2: convertMilisecondToHour(sumShift2),
            }
          }
        }
      })

      return {
        name,
        data: formattedLogCount,
      };
    });

    const extendedWithTarget = [
      objectTargetCuttingTime2(cuttingTime.target, allDateInMonth.length),
      ...format
    ];

    return {
      ...cuttingTime,
      allDateInMonth,
      data: extendedWithTarget,
    }
  } catch (error) {
    throw error;
  }

}

module.exports = {
  getMachineTimeline,
  countRunningTime,
  getShiftDateRange,
  handleGetCuttingTime
};
