const { Machine, MachineLog, DailyConfig, User } = require("../models");
const { serverError } = require("../utils/serverError");
const { logInfo, logError } = require("../utils/logger");

const {
  getMachineTimeline,
  handleGetCuttingTime,
} = require("../utils/machineUtils");
const { Op } = require("sequelize");

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

      const result = await handleGetCuttingTime(period, machineIds);

      res.send({
        status: 200,
        message: "success get cutting time",
        data: result,
      });
    } catch (error) {
      if (error.message === "cutting time not found, let's create it") {
        return res.status(404).json({
          status: 404,
          message: "Cutting time not found, let's create it",
        });
      }
      serverError(error, res, "Failed to get cutting time");
    }
  }

  static async getMachineOption(req, res) {
    const { is_zooler } = req.query;
    const query = { attributes: ["id", "name", "type", "ip_address"] };
    if (is_zooler) {
      query.attributes.push("is_zooler");
    } else {
      query.where = { is_zooler: false };
    }
    try {
      const machines = await Machine.findAll(query);

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
        if (name === "MC-1" || name === "MC-3" || name === "MC-6") {
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
      const updateCount = await MachineLog.update(
        { description },
        { where: { id } }
      );
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
      const data = await getMachineTimeline({
        reqId: machine_id,
        date: new Date(),
        shift: 0,
      });
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
      const startDateInMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        1
      );
      const endDateInMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0
      );
      startDateInMonth.setDate(startDateInMonth.getDate() - 1); // Set ke hari terakhir bulan sebelumnya
      endDateInMonth.setDate(endDateInMonth.getDate() + 1); // Set ke hari terakhir bulan ini

      const [allMachines, AllDailyConfig] = await Promise.all([
        Machine.findAll({
          where: { is_zooler: false },
          attributes: ["id", "name"],
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
                  [Op.between]: [startDateInMonth, endDateInMonth],
                },
              },
              include: [
                {
                  model: User,
                  attributes: ["name"],
                  required: false, // Left join untuk case dimana user_id null
                },
              ],
              required: false, // Left join untuk case dimana tidak ada logs
              order: [["createdAt", "ASC"]],
            },
          ],
          order: [[{ model: MachineLog }, "createdAt", "ASC"]],
        }),
        DailyConfig.findAll({
          attributes: [
            "id",
            "date",
            "startFirstShift",
            "endFirstShift",
            "startSecondShift",
            "endSecondShift",
          ],
          raw: true,
          order: [["date", "ASC"]],
          where: {
            date: {
              [Op.between]: [startDateInMonth, endDateInMonth],
            },
          },
        }),
      ]);

      // Format data menjadi 1 array flat dengan time difference
      const machineWithTimeDifference =
        Array.isArray(allMachines) &&
        allMachines.sort((a, b) => {
          const numberA = parseInt(a.name.slice(3));
          const numberB = parseInt(b.name.slice(3));
          return numberA - numberB;
        });
      const formats = [];
      machineWithTimeDifference.forEach((machine) => {
        const { MachineLogs, name } = machine.get({ plain: true });
        const formattedLogs = MachineLogs.map((log, index) => {
          const {
            createdAt,
            g_code_name,
            User,
            k_num,
            output_wp,
            current_status,
            description,
          } = log;
          const currentLogTime = new Date(createdAt);
          const nextLog = MachineLogs[index + 1];
          const nextLogTime = nextLog
            ? new Date(nextLog.createdAt).getTime()
            : 0;
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
            start: currentLogTime
              .toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })
              .replaceAll(".", ":"), // format time to 2 digit hour and minute
            end: nextLog
              ? new Date(nextLog.createdAt)
                  .toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  .replaceAll(".", ":")
              : null, // next log time or null if last log,
            date: currentLogTime.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            // User info
            operator: User ? User.name : null,

            // Time difference seconds
            total: Math.round(timeDifference / 1000), // convert milliseconds to seconds
          };
        });

        formats.push(...formattedLogs);
      });

      res.status(200).json({
        status: 200,
        message: "Success get machine logs for download",
        data: formats,
      });
    } catch (error) {
      logError(error, "downloadMachineLogsMonthly");
      serverError(error, res, "Failed to download machine logs");
    }
  }

  static async deleteMachineLog(req, res) {
    try {
      const { logId } = req.params;
      const log = await MachineLog.findByPk(logId);

      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }

      await log.destroy();

      res.status(200).json({ message: "Log deleted successfully" });
    } catch (error) {
      serverError(error, res, "Failed to delete machine log");
    }
  }
}

module.exports = MachineController;
