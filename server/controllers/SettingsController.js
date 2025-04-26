const {
    DailyConfig, CuttingTime, Machine } = require("../models");
const { serverError } = require("../utils/serverError");

let { config } = require("../utils/dateQuery");


class SettingsController {
    static getStartTime(req, res) {
        const { startHour, id, startMinute } = config;
        res.status(200).json({
            data: { startHour, id, startMinute },
            message: "succesfully get start time ",
        });
    }

    static async editStartTime(req, res) {
        try {
            const { reqStartHour, reqStartMinute, id } = req.body;
            if (
                typeof reqStartHour !== "number" ||
                typeof reqStartMinute !== "number" ||
                !id
            ) {
                return res
                    .status(400)
                    .json({ message: "invalid request!", status: 400 });
            }
            let hourStartSecond = reqStartHour + 12;
            if (hourStartSecond > 24) {
                hourStartSecond = hourStartSecond - 24;
            }

            const { startFirstShift, startSecondShift } = {
                startFirstShift: `${reqStartHour}:${reqStartMinute}`,
                startSecondShift: `${hourStartSecond}:${reqStartMinute}`,
            };

            const countUpdate = await DailyConfig.update(
                { startFirstShift, startSecondShift },
                { where: { id } }
            );

            if (countUpdate[0] === 0) {
                return res.status(400).json({ message: "failed to update start time" });
            }

            config.startHour = reqStartHour;
            config.startMinute = reqStartMinute;
            config.id = id;
            res.status(201).json({ message: "succesfully Edit start time " });
        } catch (error) {
            serverError(error, res, "failed to Edit start time");
        }
    }

    static async getListDailyConfig(req, res) {
        try {
            const data = await DailyConfig.findAll({
                attributes: ["id", "date", "startFirstShift"],
                order: [["date", "DESC"]],
            });

            res.status(200).json({
                status: 200,
                message: "succesfully get daily config",
                data,
            });
        } catch (error) {
            serverError(error, res, "failed to get daily config");
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