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
            const machineIds = await Machine.findAll({ attributes: ['id', 'name'] });

            if (!cuttingTime || !machineIds.length) {
                return res.status(404).json({ status: 404, message: 'cutting time not found', data: [] });
            }
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

    static async getCuttingTimeByMachineId(req, res) {
        try {
            const id = 290;
            const { date, month } = dateCuttingTime()
            console.log(dateCuttingTime())
            const totalDayInMonth = date.getDate()

            // [1,2,3...31]
            const allDayInMonth = Array.from({ length: totalDayInMonth }, (_, i) => i + 1);

            const allDateInMonth = Array.from({ length: totalDayInMonth }, (_, i) => {
                i++
                const day = new Date(date.getFullYear(), date.getMonth(), i + 1)
                return day
            });

            const getLogInAllDateInMonth = await Promise.all(allDateInMonth.map(async (dateValue) => {
                const log = await MachineLog.findOne({
                    where: {
                        machine_id: id,
                        timestamp: {
                            [Op.between]: [new Date(dateValue.setHours(0, 0, 0, 0)), new Date(dateValue.setHours(23, 59, 59, 999))],
                        },
                    },
                    attributes: ['running_today'],
                    order: [['timestamp', 'DESC']]
                });

                const numberOfLog = log?.running_today ?? 0
                return numberOfLog;
            }))

            const nowDate = new Date()

            const test = await MachineLog.findOne({
                where: {
                    machine_id: id,
                    timestamp: {
                        [Op.between]: [new Date(nowDate.setHours(0, 0, 0, 0)), new Date(nowDate.setHours(23, 59, 59, 999))],
                    },
                },
                attributes: ['running_today'],
                order: [['timestamp', 'DESC']]
            })
            // const test = await Promise.all(allDayInMonth.map(async (dayValue) => {
            //     const lastLogInDay = await MachineLog.findOne({
            //         where: {
            //             machine_id: id,
            //             timestamp: {
            //                 [Op.between]: [new Date(date.getFullYear(), date.getMonth(), dayValue, 0, 0, 0), new Date(date.getFullYear(), date.getMonth(), dayValue, 23, 59, 59)],
            //             },
            //         },
            //     });

            // get log
            // const machine = await MachineLog.findAll({
            //     where:
            //     {
            //         machine_id: id,
            //         // timestamp: {
            //         //     [Op.between]: [new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0), new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)],
            //         // },

            //         // data hari ini
            //         timestamp: {
            //             [Op.between]: [date.setHours(0, 0, 0, 0), date.setHours(23, 59, 59, 999)],
            //         },
            //     },
            //     attributes: [
            //         'id',
            //         'machine_id',
            //         'current_status',
            //         'timestamp',
            //         'running_today',
            //     ],
            //     order: [['timestamp', 'DESC']]
            // });

            const all = await MachineLog.findAll({
                where: {
                    machine_id: id,
                    timestamp: {
                        [Op.between]: [new Date(nowDate.setHours(0, 0, 0, 0)), new Date(nowDate.setHours(23, 59, 59, 999))],
                    },
                },
                attributes: [
                    'running_today',
                ],
                order: [['timestamp', 'DESC']]
            });


            res.json({
                status: 200,
                message: 'success get cutting time by machine id',
                data: {
                    getLogInAllDateInMonth,
                    length: getLogInAllDateInMonth.length,
                    // test,
                    // all,
                    // allDayInMonth,
                    // allDateInMonth,
                }
            });
        } catch (error) {
            console.log({ error, message: error.message })
            serverError(error, res, 'failed to get cutting time by machine id');
        }
    }
}

module.exports = MachineController;