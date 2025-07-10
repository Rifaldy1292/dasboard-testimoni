const { literal, Op } = require("sequelize");
const {
  Machine,
  MachineLog,
  User,
  MachineOperatorAssignment,
} = require("../models");
const {
  countRunningTime,
  getShiftDateRange,
} = require("../utils/machineUtils");
const { serverError } = require("../utils/serverError");

class RemainingController {
  /**
   *
   * @param {WebSocket} WebSocket
   */
  static async getRemaining(ws) {
    try {
      const { dateFrom, dateTo } = await getShiftDateRange(new Date(), 0);
      const allMachinesWithLastLogAndUser = await Machine.findAll({
        where: { is_zooler: false },
        attributes: [
          "id",
          [
            literal(
              `CASE WHEN "Machine"."type" IS NOT NULL THEN "Machine"."name" || ' (' || "Machine"."type" || ')' ELSE "Machine"."name" END`
            ),
            "name",
          ],
          "type",
        ],
        include: [
          {
            model: MachineLog,
            where: {
              createdAt: { [Op.between]: [dateFrom, dateTo] },
            },
            order: [["createdAt", "DESC"]],
            limit: 1,
            include: [
              {
                model: User,
                attributes: ["id", "name", "profile_image"],
              },
            ],
            attributes: [
              "id",
              "current_status",
              "total_cutting_time",
              "user_id",
              "g_code_name",
              "calculate_total_cutting_time",
              "createdAt",
            ],
          },
          {
            model: MachineOperatorAssignment,
            attributes: [
              "id",
              "user_id",
              "is_work",
              "description",
              "is_using_custom",
            ],
          },
        ],
      });

      const formattedResponse = await Promise.all(
        allMachinesWithLastLogAndUser
          .sort((a, b) => {
            const numberA = parseInt(a.name.slice(3));
            const numberB = parseInt(b.name.slice(3));
            return numberA - numberB;
          })
          .map(async (machine) => {
            const mc = JSON.parse(JSON.stringify(machine));
            mc.is_work = false;
            mc.description = null;
            mc.User = mc.MachineLogs[0]?.User ?? {};

            if (mc.MachineOperatorAssignment) {
              const { user_id, is_work, description, is_using_custom } =
                mc.MachineOperatorAssignment;
              if (is_using_custom) {
                const findUser = await User.findByPk(user_id, {
                  attributes: ["id", "name", "profile_image"],
                });
                mc.is_work = is_work;
                mc.description = description;
                mc.User = findUser;
              }

              delete mc.MachineOperatorAssignment;
            }

            const log = mc.MachineLogs[0];
            mc.log = mc.MachineLogs.length ? log : {};
            mc.log.runningOn = 0;
            // total cutting time is second, convert to minutes
            mc.log.total_cutting_time = Math.round(
              log?.total_cutting_time ?? 0 / 60
            );
            delete mc.log?.User;
            delete mc.MachineLogs;
            if (mc.log) {
              if (!log?.g_code_name) return mc;
              // count running time by g_code_name
              const allLogMachineWhereGCode = await MachineLog.findAll({
                where: {
                  machine_id: mc.id,
                  createdAt: {
                    [Op.between]: [dateFrom, dateTo],
                  },
                  g_code_name: log.g_code_name,
                },
                order: [["createdAt", "ASC"]],
                attributes: ["createdAt", "current_status"],
                raw: true,
              });

              if (!allLogMachineWhereGCode.length) return mc;

              // count running time
              const count = countRunningTime(allLogMachineWhereGCode);
              // console.log({ count }, 999)
              let totalRunningTime = count.totalRunningTime;
              let lastRunningTimestamp = count.lastRunningTimestamp;
              if (lastRunningTimestamp) {
                totalRunningTime +=
                  new Date().getTime() -
                  new Date(lastRunningTimestamp).getTime();
              }

              // totalRunningTime is ms, convert to minutes
              mc.log.runningOn = Math.round(totalRunningTime / 1000 / 60);
            }

            return mc;
          })
      );

      ws.send(
        JSON.stringify({
          type: "remaining",
          data: formattedResponse,
        })
      );
    } catch (error) {
      if (error.message.includes("No daily config")) {
        return ws.send(
          JSON.stringify({ type: "error", message: error.message })
        );
      }
      serverError(error, "Failed to get remaining");
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to get remaining",
        })
      );
    }
  }

  /**
   * Edit operator assignment for a machine
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {number} req.body.machine_id - ID of the machine
   * @param {number} req.body.user_id - ID of the user/operator
   * @param {boolean | undefined} [req.body.is_work] - Whether the operator is working
   * @param {string | undefined | null} [req.body.description] - Description of the assignment
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async createOrEditOperatorInMachine(req, res) {
    try {
      const { machine_id, user_id, is_work, description } = req.body;
      if (!machine_id || !user_id) {
        return res.status(400).json({ message: "Bad request", status: 400 });
      }

      const existingAssignment = await MachineOperatorAssignment.findOne({
        where: { machine_id },
        attributes: ["id"],
        raw: true,
      });

      // create or update assignment
      if (!existingAssignment) {
        const postPayload = {
          machine_id,
          user_id,
          description,
          is_work,
          is_using_custom: true,
        };
        await MachineOperatorAssignment.create(postPayload);
      } else {
        const editPayload = {
          user_id,
          description,
          is_work,
          is_using_custom: true,
        };
        await MachineOperatorAssignment.update(editPayload, {
          where: {
            machine_id,
          },
        });
      }

      res.status(201).json({
        status: 201,
        message: "success edit operator",
      });
    } catch (error) {
      serverError(error, res, "Failed to edit operator remaining");
    }
  }

  /**
   * When a file transfer is done, update MachineOperatorAssignment.is_using_custom to false if it is true
   * @param {number} machine_id - ID of the machine
   * @returns {Promise<void>}
   */
  static async handleChangeMachineOperatorAssignment(machine_id) {
    try {
      await MachineOperatorAssignment.update(
        { is_using_custom: false },
        { where: { machine_id } }
      );
    } catch (error) {
      logError(
        error,
        `Failed to update MachineOperatorAssignment for machine_id: ${machine_id} when transferring files`
      );
    }
  }
}

module.exports = RemainingController;
