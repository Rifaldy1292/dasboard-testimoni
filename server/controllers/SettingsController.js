const {
    DailyConfig, CuttingTime, Machine } = require("../models");
const { serverError } = require("../utils/serverError");

const { Op } = require("sequelize");


class SettingsController {
    static async editDailyConfig(req, res) {
        try {
            const { id, field, value } = req.body
            if (!id || !field || !value) return res.status(400).json({
                status: 400,
                message: "Bad Request"
            });
            const updateCount = await DailyConfig.update({
                [field]: value
            }, {
                where: {
                    id
                }
            })

            if (!updateCount[0]) return res.status(404).json({
                status: 404,
                message: "Daily Config not found"
            })
            res.status(204).send()
        } catch (error) {
            serverError(error, res, "failed to Edit start time");
        }
    }

    static async deleteDailyConfig(req, res) {
        try {
            const { id } = req.params;

            if (!id) return res.status(400).json({
                status: 400,
                message: "Bad Request: ID is required"
            });

            const deleteCount = await DailyConfig.destroy({
                where: {
                    id
                }
            });

            if (!deleteCount) return res.status(404).json({
                status: 404,
                message: "Daily Config not found"
            });

            res.status(204).send()
        } catch (error) {
            serverError(error, res, "Failed to delete daily config");
        }
    }

    static async getListDailyConfig(req, res) {
        try {
            const { period } = req.query
            if (!period.includes('T') || (!period.includes('Z') && !period.match(/[+-]\d{2}:\d{2}$/))) {
                return res.status(400).json({
                    status: 400,
                    message: "Invalid ISO format. Expected format: YYYY-MM-DDTHH:mm:ss.sssZ"
                });
            }
            const date = new Date(period).toLocaleDateString('en-CA');

            const startDate = new Date(date);
            startDate.setDate(1);
            const endDate = new Date(date);
            endDate.setFullYear(endDate.getFullYear(), endDate.getMonth() + 1, 0);

            const startDateStr = startDate.toLocaleDateString('en-CA')
            const endDateStr = endDate.toLocaleDateString('en-CA')

            const data = await DailyConfig.findAll({
                where: {
                    date: {
                        [Op.between]: [startDateStr, endDateStr]
                    }
                },
                attributes: ["id", "date", "startFirstShift", "startSecondShift", "endFirstShift", "endSecondShift"],
                order: [["date", "DESC"]],
            });

            res.status(200).json({
                status: 200,
                message: "Successfully get daily config",
                data,
            });
        } catch (error) {
            serverError(error, res, "Failed to get daily config");
        }
    }

    static async getListCuttingTime(req, res) {
        try {
            const data = await CuttingTime.findAll({
                attributes: ["id", "target", "target_shift", 'period'],
                order: [["period", "DESC"]],
            });

            res.status(200).json({
                status: 200,
                message: "succesfully get cutting time",
                data,
            });
        } catch (error) {
            serverError(error, res, "failed to get cutting time");
        }
    }

    static async createDailyConfig(req, res) {
        try {
            const { date, startFirstShift, endFirstShift, startSecondShift, endSecondShift } = req.body;

            // Validasi input
            if (!date || !startFirstShift || !endFirstShift || !startSecondShift || !endSecondShift) {
                return res.status(400).json({
                    status: 400,
                    message: "All fields are required"
                });
            }

            // Cek apakah konfigurasi untuk tanggal tersebut sudah ada
            const existingConfig = await DailyConfig.findOne({
                where: { date },
                attributes: ['id'],
                raw: true
            });

            if (existingConfig) {
                return res.status(400).json({
                    status: 400,
                    message: "Configuration for this date already exists"
                });
            }

            await DailyConfig.create({
                date,
                startFirstShift,
                endFirstShift,
                startSecondShift,
                endSecondShift
            });

            res.status(204).json()
        } catch (error) {
            serverError(error, res, "Failed to create daily config");
        }
    }

    static async editCuttingTime(req, res) {
        try {
            const { id } = req.params;
            const { target, target_shift } = req.body;

            if (!id || (target === undefined && target_shift === undefined)) return res.status(400).json({
                status: 400,
                message: "Bad Request: id and at least one of target or target_shift are required"
            });

            const updateData = {};
            if (target !== undefined) updateData.target = +target;
            if (target_shift !== undefined) {
                // Validate target_shift structure
                if (typeof target_shift !== 'object' || 
                    !target_shift.hasOwnProperty('green') || 
                    !target_shift.hasOwnProperty('yellow') || 
                    !target_shift.hasOwnProperty('red')) {
                    return res.status(400).json({
                        status: 400,
                        message: "Bad Request: target_shift must contain green, yellow, and red properties"
                    });
                }
                updateData.target_shift = target_shift;
            }

            const [updateCount] = await CuttingTime.update(updateData, {
                where: {
                    id
                }
            });

            if (updateCount === 0) return res.status(404).json({
                status: 404,
                message: "CuttingTime not found"
            });

            res.status(204).send();
        } catch (error) {
            serverError(error, res, "Failed to edit cutting time");
        }
    }
}
module.exports = SettingsController;