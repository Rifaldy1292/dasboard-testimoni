const { Machine, CuttingTime, MachineLog, DailyConfig, User } = require("../models");
const dateCuttingTime = require("../utils/dateCuttingTime");
const { serverError } = require("../utils/serverError");
const { logInfo, logError } = require("../utils/logger");

const { getMachineTimeline, countRunningTime } = require("../utils/machineUtils");
const { Op } = require("sequelize");



/**
 * Generates a monthly target data structure for cutting time calculations
 * @param {number} target - The total target hours for the month
 * @param {number} totalDayInMonth - The number of days in the month
 * @returns {Object} An object containing:
 *   - name: "TARGET" string identifier
 *   - data: Array of daily target objects, each containing:
 *     - date: The day of the month (1-31)
 *     - shifts: Object with shift1, shift2, and combine properties (all null)
 *     - count: Object containing:
 *       - calculate: Object with shift calculations
 *       - shift1: null
 *       - shift2: null 
 *       - combine: Calculated cumulative target for that day
 */
const objectTargetCuttingTime2 = (target, totalDayInMonth) => {
  const targetPerDay = target / totalDayInMonth; // Calculate target hours per day

  const calculatedTargets = Array.from(
    { length: totalDayInMonth },
    (_, i) => {
      const date = i + 1;
      const target = Math.round((date * targetPerDay));
      return {
        date,
        shifts: {
          shift1: null,
          shift2: null,
          combine: null,
        },
        count: {
          calculate: {
            shift1: null,
            shift2: null,
            combine: target,
          },
          shift1: null,
          shift2: null,
          combine: null,
        }
      };
    }
  ); // Calculate cumulative target for each day

  return {
    name: "TARGET",
    data: calculatedTargets,
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
 * 
 * @param {number} ms 
 * @returns {string} formatted time difference in hh:mm:ss
 */
function formatTimeDifference(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}


class MachineController {
  /**
interface ShiftTime {
  start: string | null
  end: string | null
}

interface DummyData {
  // name is machine name
  name: string
  data: Array<{
    date: number
    shifts: {
      shift1: ShiftTime
      shift2: ShiftTime
    }
    count: {
      shift1: number | null
      shift2: number | null
      combine: number | null
    }
  }>
}

   */
  static async getCuttingTime(req, res) {
    try {
      // period is "2025-05-27T07:32:56.581Z"
      const { period, machineIds } = req.query;
      if (!period) {
        return res.status(400).json({
          status: 400,
          message: "Bad request, period is required",
        });
      }
      const dateResult = dateCuttingTime(period).date;

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
        return res.status(404).json({
          status: 404,
          message: "Cutting time not found, let's create it",
        });
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

      res.send({
        status: 200,
        message: "success get cutting time",
        data: {
          ...cuttingTime,
          allDateInMonth,
          data: extendedWithTarget,
          format
        }
      });


    } catch (error) {
      serverError(error, res, "Failed to get cutting time");
    }
  }

  static async getMachineOption(_, res) {
    try {
      const machines = await Machine.findAll({ attributes: ["id", "name", 'type', 'ip_address'] });

      const sortedMachine = machines.sort((a, b) => {
        const numberA = parseInt(a.name.slice(3));
        const numberB = parseInt(b.name.slice(3));
        return numberA - numberB;
      });

      if (!sortedMachine.length) {
        return res.status(200).send({ data: [] });
      }

      const formattedMachines = sortedMachine.map((machine) => {
        const { name } = machine;
        const result = { ...machine.dataValues };
        if (name === "MC-1" || name === "MC-6") {
          result.startMacro = 500;
        } else if (name === "MC-14" || name === "MC-15") {
          result.startMacro = 560;
        } else {
          result.startMacro = 540;
        }
        return result;
      });

      res.status(200).json({
        status: 200,
        message: "success get machine option",
        data: formattedMachines,
      });
    } catch (error) {
      serverError(error, res, "Failed to get machine option");
    }
  }

  static async editLogDescription(req, res) {
    try {
      const { id, description } = req.body;
      const updateCount = await MachineLog.update({ description }, { where: { id } });
      if (updateCount === 0) {
        return res.status(404).json({
          status: 404,
          message: "Machine log not found",
        });
      }

      res.status(200).json({
        status: 200,
        message: "Description updated successfully",
      });
    } catch (error) {
      serverError(error, res, "Failed to edit log description");
    }
  }

  static async getMachineLogByMachineId(req, res) {
    try {
      const { machine_id } = req.params;
      if (!machine_id) {
        return res.status(400).json({
          status: 400,
          message: "machine_id is required",
        });
      }
      const data = await getMachineTimeline({ reqId: machine_id, date: new Date(), shift: 0 });
      res.status(200).json({
        status: 200,
        message: "success get machine log by machine id",
        data,
      });
    } catch (error) {
      serverError(error, res, "Failed to get machine log by machine id");
    }
  }
  static async downloadMachineLogsMonthly(req, res) {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          status: 400,
          message: "Bad request, date is required",
        });
      }

      const CONTEXT = "downloadMachineLogsMonthly";
      logInfo(`Download machine logs request for date: ${date}`, CONTEXT);

      // Parse tanggal dan dapatkan rentang bulan
      const targetDate = new Date(date);
      const startDateInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endDateInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      startDateInMonth.setDate(startDateInMonth.getDate() - 1); // Set ke hari terakhir bulan sebelumnya
      endDateInMonth.setDate(endDateInMonth.getDate() + 1);  // Set ke hari terakhir bulan ini


      const [allMachines, AllDailyConfig] = await Promise.all([
        Machine.findAll({
          attributes: ['id', "name"],
          include: [
            {
              model: MachineLog,
              attributes: [
                "machine_id",
                "user_id",
                "g_code_name",
                "k_num",
                "output_wp",
                "current_status",
                "description",
                "createdAt",
              ],
              where: {
                createdAt: {
                  [Op.between]: [startDateInMonth, endDateInMonth]
                }
              },
              include: [
                {
                  model: User,
                  attributes: ["name"],
                  required: false // Left join untuk case dimana user_id null
                }
              ],
              required: false, // Left join untuk case dimana tidak ada logs
              order: [["createdAt", "ASC"]]
            }
          ],
          order: [
            [{ model: MachineLog }, "createdAt", "ASC"]
          ]
        }),
        DailyConfig.findAll({
          attributes: ["id", "date", "startFirstShift", "endFirstShift", "startSecondShift", "endSecondShift"],
          raw: true,
          order: [["date", "ASC"]],
          where: {
            date: {
              [Op.between]: [startDateInMonth, endDateInMonth]
            }
          },
        })
      ]);

      // Format data menjadi 1 array flat dengan time difference
      const machineWithTimeDifference = Array.isArray(allMachines) && allMachines.sort((a, b) => {
        const numberA = parseInt(a.name.slice(3));
        const numberB = parseInt(b.name.slice(3));
        return numberA - numberB;

      })
      const formats = []
      machineWithTimeDifference.forEach(machine => {
        const { MachineLogs, name } = machine.get({ plain: true });
        const formattedLogs = MachineLogs.map((log, index) => {
          const { createdAt, g_code_name, User, k_num, output_wp, current_status, description } = log;
          const currentLogTime = new Date(createdAt);
          const nextLog = MachineLogs[index + 1];
          const nextLogTime = nextLog ? new Date(nextLog.createdAt).getTime() : 0;
          const timeDifference = nextLogTime - currentLogTime.getTime();

          return {
            // Machine info
            name,

            // Log info
            g_code_name,
            k_num,
            output_wp,
            current_status,
            description,
            start: currentLogTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replaceAll('.', ':'), // format time to 2 digit hour and minute
            end: nextLog ? new Date(nextLog.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replaceAll('.', ':') : null, // next log time or null if last log,
            date: currentLogTime.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            // User info
            operator: User ? User.name : null,

            // Time difference seconds
            total: Math.round(timeDifference / 1000), // convert milliseconds to seconds
            total2: formatTimeDifference(timeDifference), // formatted time difference
          };

        })

        formats.push(...formattedLogs);
      })



      res.status(200).json({
        status: 200,
        message: "Success get machine logs for download",
        data: formats
      });
    } catch (error) {
      logError(error, 'downloadMachineLogsMonthly');
      serverError(error, res, "Failed to download machine logs");
    }
  }

}

module.exports = MachineController;
