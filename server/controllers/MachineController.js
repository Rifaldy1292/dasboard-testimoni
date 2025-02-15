const { Op } = require('sequelize');
const { Machine, MachineLog, CuttingTime } = require('../models');
const dateCuttingTime = require('../utils/dateCuttingTime');
const { serverError } = require('../utils/serverError');


class MachineController {
    static async getCuttingTime(req, res) {
        try {
            const { period } = req.body;
            const { date, month } = dateCuttingTime(period)

            const cuttingTime = await CuttingTime.findOne({ where: { period: date } });
            if (!cuttingTime) {
                return res.status(404).json({ status: 404, message: 'cutting time not found' });
            }
            const machineIds = await Machine.findAll({ attributes: ['id', 'name'] });

            const totalDayInMonth = date.getDate()
            const allDayInMonth = Array.from({ length: totalDayInMonth }, (_, i) => i + 1);

            const allCuttingTime = await Promise.all(machineIds.map(async (machine) => {
                const mappedAllDay = allDayInMonth.map(async (day) => {
                    const cuttingTime = await MachineLog.findOne({
                        order: [['timestamp', 'DESC']],
                        where: {
                            machine_id: machine.id,
                            timestamp: {
                                [Op.between]: [new Date(date.getFullYear(), date.getMonth(), day, 0, 0, 0), new Date(date.getFullYear(), date.getMonth(), day, 23, 59, 59)],
                            },
                        },
                    });
                    // console.log(222222222222222, { cuttingTime: cuttingTime.dataValues })
                    return await cuttingTime;
                })
                const result = await { ...machine.dataValues, cuttingTime: await Promise.all(mappedAllDay) }
                return result;
            }));

            // const getAllMachineLog = machineIds.map((machine) => {
            //     const getLogInDay = allDayInMonth.map(async (day) => {
            //         const log = await MachineLog.findOne({
            //             where: {
            //                 machine_id: machine.id,
            //                 date: {
            //                     [Op.between]: [new Date(date.getFullYear(), date.getMonth(), day, 0, 0, 0), new Date(date.getFullYear(), date.getMonth(), day, 23, 59, 59)],
            //                 },
            //             },
            //         });
            //         return log;
            //     })
            //     return getLogInDay;
            // })

            // const getLogInDay = allDayInMonth.map(async (day) => {
            //     const log = await MachineLog.findOne({
            //         where: {
            //             date: {
            //                 [Op.between]: [new Date(date.getFullYear(), date.getMonth(), day, 0, 0, 0), new Date(date.getFullYear(), date.getMonth(), day, 23, 59, 59)],
            //             },
            //         },
            //     });
            //     return log;
            // });

            const data = {
                date,
                allDayInMonth,
                allCuttingTime
            }
            res.status(200).json({ status: 200, message: 'success get cutting time', data });
        } catch (error) {
            serverError(error, res, 'failed to get cutting time');
        }
    }
}

module.exports = MachineController;