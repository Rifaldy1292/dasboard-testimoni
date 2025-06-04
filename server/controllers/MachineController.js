const { Machine, CuttingTime, MachineLog, DailyConfig } = require("../models");
const dateCuttingTime = require("../utils/dateCuttingTime");
const { serverError } = require("../utils/serverError");

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
            date: { [Op.in]: ['2025-06-02', "2025-06-03", "2025-06-04"] },
            // date: {
            //   [Op.between]: [startDateInMonth, endDateInMonth]
            // }
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

          // Parse shift times
          const [startHour1, startMinute1, startSecond1] = startFirstShift.split(':').map(Number);
          const [endHour1, endMinute1, endSecond1] = endFirstShift.split(':').map(Number);
          const [startHour2, startMinute2, startSecond2] = startSecondShift.split(':').map(Number);
          const [endHour2, endMinute2, endSecond2] = endSecondShift.split(':').map(Number);

          const dateConfig = new Date(date);
          const startShift1 = new Date(date);
          const endShift1 = new Date(date);
          const startShift2 = new Date(date);
          const endShift2 = new Date(date);

          // Set shift times
          startShift1.setHours(startHour1, startMinute1, startSecond1, 0);
          endShift1.setHours(endHour1, endMinute1, endSecond1, 0);
          startShift2.setHours(startHour2, startMinute2, startSecond2, 0);
          endShift2.setHours(endHour2, endMinute2, endSecond2, 0);

          // Shift 2 ends next day
          endShift2.setDate(endShift2.getDate() + 1);

          // Define time range checkers
          const betweenLogCombine = (logDate) => logDate.getTime() >= startShift1.getTime() && logDate.getTime() <= endShift2.getTime();
          const betweenLog1 = (logDate) => logDate.getTime() >= startShift1.getTime() && logDate.getTime() <= endShift1.getTime();
          const betweenLog2 = (logDate) => logDate.getTime() >= startShift2.getTime() && logDate.getTime() <= endShift2.getTime();

          // Filter logs by shift
          const logCombineShift = MachineLogs.filter((log) => betweenLogCombine(new Date(log.createdAt)));
          const logShift1 = MachineLogs.filter((log) => betweenLog1(new Date(log.createdAt)));
          const logShift2 = MachineLogs.filter((log) => betweenLog2(new Date(log.createdAt)));

          // Count running time
          const runningTimeCombineShift = countRunningTime(logCombineShift);
          const runningTime1 = countRunningTime(logShift1);
          const runningTime2 = countRunningTime(logShift2);

          let countCombineShift = runningTimeCombineShift.totalRunningTime;
          let count1 = runningTime1.totalRunningTime;
          let count2 = runningTime2.totalRunningTime;

          const now = new Date();
          const isCurrentDay = (date) => {
            return date.toLocaleDateString() === now.toLocaleDateString();
          };

          // Handle current running calculation for combine shift
          if (runningTimeCombineShift.lastRunningTimestamp) {
            const lastRunningDate = new Date(runningTimeCombineShift.lastRunningTimestamp);

            if (isCurrentDay(lastRunningDate) && betweenLogCombine(now)) {
              // Machine is currently running within combine shift time
              countCombineShift += now.getTime() - lastRunningDate.getTime();
            } else if (lastRunningDate.getTime() < endShift2.getTime()) {
              // Machine stopped before shift end
              countCombineShift += Math.min(endShift2.getTime(), now.getTime()) - lastRunningDate.getTime();
            }
          }

          // Handle current running calculation for shift 1
          if (runningTime1.lastRunningTimestamp) {
            const lastRunningDate = new Date(runningTime1.lastRunningTimestamp);

            if (isCurrentDay(lastRunningDate) && betweenLog1(now)) {
              // Machine is currently running within shift 1 time
              count1 += now.getTime() - lastRunningDate.getTime();
            } else if (lastRunningDate.getTime() < endShift1.getTime()) {
              // Machine stopped before shift 1 end
              count1 += Math.min(endShift1.getTime(), now.getTime()) - lastRunningDate.getTime();
            }
          }

          // Handle current running calculation for shift 2
          if (runningTime2.lastRunningTimestamp) {
            const lastRunningDate = new Date(runningTime2.lastRunningTimestamp);

            if (isCurrentDay(lastRunningDate) && betweenLog2(now)) {
              // Machine is currently running within shift 2 time
              count2 += now.getTime() - lastRunningDate.getTime();
            } else if (lastRunningDate.getTime() < endShift2.getTime()) {
              // Machine stopped before shift 2 end
              count2 += Math.min(endShift2.getTime(), now.getTime()) - lastRunningDate.getTime();
            }
          }

          // Debug logging
          console.log(`Machine: ${name}, Date: ${dateConfig.getDate()}`);
          console.log(`Shift1 range: ${startShift1.toISOString()} - ${endShift1.toISOString()}`);
          console.log(`Shift2 range: ${startShift2.toISOString()} - ${endShift2.toISOString()}`);
          console.log(`Combined range: ${startShift1.toISOString()} - ${endShift2.toISOString()}`);
          console.log(`Shift1 logs count: ${logShift1.length}`);
          console.log(`Shift2 logs count: ${logShift2.length}`);
          console.log(`Combined logs count: ${logCombineShift.length}`);
          console.log(`Count1: ${convertMilisecondToHour(count1)}`);
          console.log(`Count2: ${convertMilisecondToHour(count2)}`);
          console.log(`CountCombineShift: ${convertMilisecondToHour(countCombineShift)}`);
          console.log(`Sum (count1 + count2): ${convertMilisecondToHour(count1 + count2)}`);
          console.log('---');

          return {
            date: dateConfig.getDate(),
            count: {
              combine: countCombineShift, // Use combine shift calculation as it's more accurate
              shift1: count1,
              shift2: count2,
            },
            shifts: {
              combine: `${startFirstShift.slice(0, -3)} - ${endSecondShift.slice(0, -3)}`,
              shift1: `${startFirstShift.slice(0, -3)} - ${endFirstShift.slice(0, -3)}`,
              shift2: `${startSecondShift.slice(0, -3)} - ${endSecondShift.slice(0, -3)}`,
            }
          };
        });



        // const groupLogByShiftInDateConfig = Array.isArray(allConfigInMonth) && allConfigInMonth.map((config) => {
        //   const { date, startFirstShift, endFirstShift, startSecondShift, endSecondShift } = config;

        //   // Parse shift times
        //   const [startHour1, startMinute1, startSecond1] = startFirstShift.split(':').map(Number);
        //   const [endHour1, endMinute1, endSecond1] = endFirstShift.split(':').map(Number);
        //   const [startHour2, startMinute2, startSecond2] = startSecondShift.split(':').map(Number);
        //   const [endHour2, endMinute2, endSecond2] = endSecondShift.split(':').map(Number);

        //   const dateConfig = new Date(date);
        //   const startShift1 = new Date(date);
        //   const endShift1 = new Date(date);
        //   const startShift2 = new Date(date);
        //   const endShift2 = new Date(date);

        //   // Set shift times
        //   startShift1.setHours(startHour1, startMinute1, startSecond1, 0);
        //   endShift1.setHours(endHour1, endMinute1, endSecond1, 0);
        //   startShift2.setHours(startHour2, startMinute2, startSecond2, 0);
        //   endShift2.setHours(endHour2, endMinute2, endSecond2, 0);

        //   // Shift 2 ends next day
        //   endShift2.setDate(endShift2.getDate() + 1);

        //   // Define time range checkers
        //   const betweenLogCombine = (logDate) => logDate.getTime() >= startShift1.getTime() && logDate.getTime() <= endShift2.getTime();
        //   const betweenLog1 = (logDate) => logDate.getTime() >= startShift1.getTime() && logDate.getTime() <= endShift1.getTime();
        //   const betweenLog2 = (logDate) => logDate.getTime() >= startShift2.getTime() && logDate.getTime() <= endShift2.getTime();

        //   // Filter logs by shift
        //   const logCombineShift = MachineLogs.filter((log) => betweenLogCombine(new Date(log.createdAt)));
        //   const logShift1 = MachineLogs.filter((log) => betweenLog1(new Date(log.createdAt)));
        //   const logShift2 = MachineLogs.filter((log) => betweenLog2(new Date(log.createdAt)));

        //   // Count running time
        //   const runningTimeCombineShift = countRunningTime(logCombineShift);
        //   const runningTime1 = countRunningTime(logShift1);
        //   const runningTime2 = countRunningTime(logShift2);

        //   let countCombineShift = runningTimeCombineShift.totalRunningTime;
        //   let count1 = runningTime1.totalRunningTime;
        //   let count2 = runningTime2.totalRunningTime;

        //   const now = new Date();
        //   const isCurrentDay = (date) => {
        //     return date.toLocaleDateString() === now.toLocaleDateString();
        //   };

        //   // Handle current running calculation for combine shift
        //   if (runningTimeCombineShift.lastRunningTimestamp) {
        //     const lastRunningDate = new Date(runningTimeCombineShift.lastRunningTimestamp);

        //     if (isCurrentDay(lastRunningDate) && betweenLogCombine(now)) {
        //       // Machine is currently running within combine shift time
        //       countCombineShift += now.getTime() - lastRunningDate.getTime();
        //     } else if (lastRunningDate.getTime() < endShift2.getTime()) {
        //       // Machine stopped before shift end
        //       countCombineShift += Math.min(endShift2.getTime(), now.getTime()) - lastRunningDate.getTime();
        //     }
        //   }

        //   // Handle current running calculation for shift 1
        //   if (runningTime1.lastRunningTimestamp) {
        //     const lastRunningDate = new Date(runningTime1.lastRunningTimestamp);

        //     if (isCurrentDay(lastRunningDate) && betweenLog1(now)) {
        //       // Machine is currently running within shift 1 time
        //       count1 += now.getTime() - lastRunningDate.getTime();
        //     } else if (lastRunningDate.getTime() < endShift1.getTime()) {
        //       // Machine stopped before shift 1 end
        //       count1 += Math.min(endShift1.getTime(), now.getTime()) - lastRunningDate.getTime();
        //     }
        //   }

        //   // Handle current running calculation for shift 2
        //   if (runningTime2.lastRunningTimestamp) {
        //     const lastRunningDate = new Date(runningTime2.lastRunningTimestamp);

        //     if (isCurrentDay(lastRunningDate) && betweenLog2(now)) {
        //       // Machine is currently running within shift 2 time
        //       count2 += now.getTime() - lastRunningDate.getTime();
        //     } else if (lastRunningDate.getTime() < endShift2.getTime()) {
        //       // Machine stopped before shift 2 end
        //       count2 += Math.min(endShift2.getTime(), now.getTime()) - lastRunningDate.getTime();
        //     }
        //   }

        //   // Debug logging
        //   console.log(`Machine: ${name}, Date: ${dateConfig.getDate()}`);
        //   console.log(`Shift1 range: ${startShift1.toISOString()} - ${endShift1.toISOString()}`);
        //   console.log(`Shift2 range: ${startShift2.toISOString()} - ${endShift2.toISOString()}`);
        //   console.log(`Combined range: ${startShift1.toISOString()} - ${endShift2.toISOString()}`);
        //   console.log(`Shift1 logs count: ${logShift1.length}`);
        //   console.log(`Shift2 logs count: ${logShift2.length}`);
        //   console.log(`Combined logs count: ${logCombineShift.length}`);
        //   console.log(`Count1: ${convertMilisecondToHour(count1)}`);
        //   console.log(`Count2: ${convertMilisecondToHour(count2)}`);
        //   console.log(`CountCombineShift: ${convertMilisecondToHour(countCombineShift)}`);
        //   console.log(`Sum (count1 + count2): ${convertMilisecondToHour(count1 + count2)}`);
        //   console.log('---');

        //   return {
        //     date: dateConfig.getDate(),
        //     count: {
        //       combine: countCombineShift, // Use combine shift calculation as it's more accurate
        //       combineTest: countCombineShift,
        //       shift1: count1,
        //       shift2: count2,
        //     },
        //     shifts: {
        //       combine: `${startFirstShift.slice(0, -3)} - ${endSecondShift.slice(0, -3)}`,
        //       shift1: `${startFirstShift.slice(0, -3)} - ${endFirstShift.slice(0, -3)}`,
        //       shift2: `${startSecondShift.slice(0, -3)} - ${endSecondShift.slice(0, -3)}`,
        //     }
        //   };
        // });


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

}

module.exports = MachineController;
