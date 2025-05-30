const { Machine, CuttingTime, MachineLog, DailyConfig } = require("../models");
const dateCuttingTime = require("../utils/dateCuttingTime");
const { serverError } = require("../utils/serverError");

const { getRunningTimeMachineLog, getMachineTimeline, countRunningTime } = require("../utils/machineUtils");
const { Op } = require("sequelize");

const objectTargetCuttingTime = (target, totalDayInMonth) => {
  const targetPerDay = target / totalDayInMonth; // Calculate target hours per day

  const calculatedTargets = Array.from(
    { length: totalDayInMonth },
    (_, i) => (i + 1) * targetPerDay
  ); // Calculate cumulative target for each day

  const formattedResult = calculatedTargets.map((item) => Math.round(item));
  // console.log({ test, length: test.length });
  return {
    name: "Target",
    data: formattedResult, // data ubah jadi actual
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
  static async getCuttingTime(req, res) {
    try {
      const { period, machineIds } = req.query;
      if (!period) {
        return res.status(400).json({
          status: 400,
          message: "period is required",
        });
      }
      const { date } = dateCuttingTime(period);

      const cuttingTime = await CuttingTime.findOne({
        where: { period: date },
        attributes: ["period", "target"],
      });

      if (!cuttingTime) return res.status(404).json({
        status: 404,
        message: "cutting time not found",
      });

      // machineIds from query, default all
      const machines = machineIds?.length ? machineIds : await Machine.findAll({ attributes: ["id", "name"] });

      const sortedMachineIds = machines.sort((a, b) => {
        const numberA = parseInt(a.name.slice(3));
        const numberB = parseInt(b.name.slice(3));
        return numberA - numberB;
      });

      // 28
      const totalDayInMonth = date.getDate();

      const objTargetCuttingTime = objectTargetCuttingTime(
        cuttingTime.target,
        totalDayInMonth
      );

      // [1,2,3...31]
      const allDayInMonth = Array.from(
        { length: totalDayInMonth },
        (_, i) => i + 1
      );
      // const allDayInMonth = [9]

      const allDateInMonth = Array.from({ length: totalDayInMonth }, (_, i) => {
        const day = new Date(date.getUTCFullYear(), date.getUTCMonth(), i + 1);
        return day;
      });

      // test: only 2025-05-04
      // const allDateInMonth = [new Date("2025-05-04")];

      const cuttingTimeInMonth = await Promise.all(
        sortedMachineIds.map(async (machine) => {
          const data = await MachineController.getCuttingTimeByMachineId({
            machine_id: machine.id,
            allDateInMonth: allDateInMonth,
          });
          return { name: machine.name, ...data };
        })
      );

      const extendedCuttingTimeInMonth = [
        objTargetCuttingTime,
        ...cuttingTimeInMonth,
      ];

      const data = {
        cuttingTime,
        allDayInMonth,
        cuttingTimeInMonth: extendedCuttingTimeInMonth,
      };
      res
        .status(200)
        .json({ status: 200, message: "success get cutting time", data });
      // MachineController.refactorGetCuttingTime(req, res);
    } catch (error) {
      serverError(error, res, "Failed to get cutting time");
    }
  }

  static async getCuttingTimeByMachineId({ machine_id, allDateInMonth }) {
    try {
      if (!machine_id || !allDateInMonth) {
        throw new Error("machine_id or allDateInMonth is required");
      }

      const getLogAllDateInMonth = await Promise.all(
        allDateInMonth.map(async (dateValue) => {
          // console.log({ dateValue }, 333);
          const reqDate = new Date(dateValue).toLocaleDateString("en-CA");
          const date = new Date().toLocaleDateString("en-CA");
          if (reqDate > date) {
            return 0;
          }
          const runningToday = await getRunningTimeMachineLog(
            machine_id,
            dateValue
          );

          const numberOfLog = runningToday?.totalRunningTime ?? 0;

          return numberOfLog;
        })
      );

      // console.log({ getLogAllDateInMonth })

      // const example = [1, 2, 3, 4, 9, 0, 2, 0, 1, 0]
      // expect res[1, 3, 6, 10, 19, 19, 21, 21, 22, 22]
      // [value index 0, value index 0 + 1, value index 0, 1, 2]
      const formattedCountLog = [];
      for (let i = 0; i < getLogAllDateInMonth.length; i++) {
        let sum = 0;
        for (let j = 0; j <= i; j++) {
          sum += getLogAllDateInMonth[j];
        }
        formattedCountLog.push(sum);
      }

      const convertCountLogToHours = formattedCountLog.map((count) =>
        convertMilisecondToHour(count)
      );
      const runningToday = getLogAllDateInMonth.map((count) =>
        convertMilisecondToHour(count)
      );

      return { data: convertCountLogToHours, actual: runningToday };
    } catch (error) {
      serverError(error, "Failed to get cutting time by machine id");
    }
  }


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
      combined: number | null
    }
  }>
}

   */
  static async refactorGetCuttingTime(req, res) {
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

      // {period: "2025-05-31", target: 600}
      const cuttingTime = await CuttingTime.findOne({
        where: { period: dateResult },
        attributes: ["period", "target"],
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
            date: {
              [Op.between]: [startDateInMonth, endDateInMonth]
            }
          },
        })

      ]);

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

          const betweenLogCombine = (logDate) => logDate.getTime() >= startShift1.getTime() && logDate.getTime() <= endShift2.getTime();

          const betweenLog1 = (logDate) => logDate.getTime() >= startShift1.getTime() && logDate.getTime() <= endShift1.getTime();

          const betweenLog2 = (logDate) => logDate.getTime() >= startShift2.getTime() && logDate.getTime() <= endShift2.getTime();

          // filter data by shift

          const logCombineShift = MachineLogs.filter((log) => {
            const logDate = new Date(log.createdAt);
            return betweenLogCombine(logDate);
          });

          const logShift1 = logCombineShift.filter((log) => {
            const logDate = new Date(log.createdAt);
            return betweenLog1(logDate);
          });

          const logShift2 = logCombineShift.filter((log) => {
            const logDate = new Date(log.createdAt);
            return betweenLog2(logDate);
          });


          // count running time
          const runningTimeCombineShift = countRunningTime(logCombineShift);
          const runningTime1 = countRunningTime(logShift1);
          const runningTime2 = countRunningTime(logShift2);

          let countCombineShift = runningTimeCombineShift.totalRunningTime;
          let count1 = runningTime1.totalRunningTime;
          let count2 = runningTime2.totalRunningTime;

          const isNowDate = (date) => date.toLocaleDateString() === new Date().toLocaleDateString();

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
              combine: countCombineShift,
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


        const allDateInMonth = Array.from(
          { length: dateResult.getDate() },
          (_, i) => i + 1)

        const notFoundConfig = allDateInMonth.filter((day) => {
          return !groupLogByShiftInDateConfig.some((item) => item.date === day);
        });

        const notFoundConfigFormatted = notFoundConfig.map((day) => {
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
        });

        // if notFoundConfig.length, add to groupLogByShiftInDateConfig and sort by date
        const combinedData = notFoundConfig.length ? [...groupLogByShiftInDateConfig, ...notFoundConfigFormatted].sort((a, b) => a.date - b.date) : groupLogByShiftInDateConfig;



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
            notFoundConfig,
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

      res.send({
        status: 200,
        message: "success refactor get cutting time",
        data: format
      });


    } catch (error) {
      serverError(error, res, "Failed to refactor get cutting time");
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
