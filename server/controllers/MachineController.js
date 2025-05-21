const { Machine, CuttingTime, MachineLog, DailyConfig } = require("../models");
const dateCuttingTime = require("../utils/dateCuttingTime");
const { serverError } = require("../utils/serverError");

const { getRunningTimeMachineLog, getMachineTimeline } = require("../utils/machineUtils");
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
      MachineController.refactorGetCuttingTime(req, res);
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

  // static async refactorGetCuttingTime(req, res) {
  //   try {
  //     const { period } = req.query;
  //     const { date } = dateCuttingTime(period);

  //     const cuttingTime = await CuttingTime.findOne({
  //       where: { period: date },
  //       attributes: ["period", "target"],
  //     });

  //     if (!cuttingTime) {
  //       throw new Error("cutting time not found");
  //     }
  //     // 28
  //     const totalDayInMonth = date.getDate();

  //     const objTargetCuttingTime = objectTargetCuttingTime(
  //       cuttingTime.target,
  //       totalDayInMonth
  //     );

  //     // [1,2,3...31]
  //     const allDayInMonth = Array.from(
  //       { length: totalDayInMonth },
  //       (_, i) => i + 1
  //     );
  //     // const allDayInMonth = [9]

  //     const allDateInMonth = Array.from({ length: totalDayInMonth }, (_, i) => {
  //       const day = new Date(date.getUTCFullYear(), date.getUTCMonth(), i + 1);
  //       return day;
  //     });

  //     const dailyConfigInMonth = await DailyConfig.findAll({
  //       raw: true,
  //       attributes: ["date", "startFirstShift"],
  //       where: {
  //         date: {
  //           [Op.in]: allDateInMonth,
  //         }
  //       }
  //     })

  //     const dateInDailyConfig = dailyConfigInMonth.map((dailyConfig) => {
  //       const { date, startFirstShift } = dailyConfig;
  //       const [hour, minute] = startFirstShift.split(':').map(Number);
  //       const dateFrom = new Date(date)
  //       dateFrom.setHours(hour, minute, 0, 0);
  //       const dateTo = new Date(date)
  //       dateTo.setDate(dateTo.getDate() + 1);
  //       const endMinute = minute === 0 ? 59 : minute - 1;
  //       dateTo.setHours(hour + 8, endMinute, 59, 999);
  //       const result = {
  //         [Op.between]: [dateFrom, dateTo]
  //       }
  //       return result;
  //     });

  //     console.log(dateInDailyConfig)

  //   } catch (error) {
  //     serverError(error, res, "Failed to refactor get cutting time");
  //   }
  // }

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
