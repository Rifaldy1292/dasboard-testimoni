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
            res.status(201).send({ status: 201, message: "Edit Success" })
        } catch (error) {
            serverError(error, res, "failed to Edit start time");
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
            // console.log(`Fetching data for period: ${period}, date range: ${startDateStr} to ${endDateStr}`);

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
                attributes: ["id", "target", 'period'],
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

}
module.exports = SettingsController;