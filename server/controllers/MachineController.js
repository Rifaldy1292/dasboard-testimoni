const { Op } = require('sequelize');
const { Machine, MachineLog, CuttingTime } = require('../models');
const dateCuttingTime = require('../utils/dateCuttingTime');
const { serverError } = require('../utils/serverError');
const countHour = require('../utils/countHour');


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
            // console.log(dateCuttingTime())
            const totalDayInMonth = date.getDate()

            // [1,2,3...31]
            const allDayInMonth = Array.from({ length: totalDayInMonth }, (_, i) => i + 1);

            const allDateInMonth = Array.from({ length: totalDayInMonth }, (_, i) => {
                i++
                const day = new Date(date.getFullYear(), date.getMonth(), i + 1)
                return day
            });

            const getLogAllDateInMonth = await Promise.all(allDateInMonth.map(async (dateValue) => {
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


            // const example = [1, 2, 3, 4, 9, 0, 2, 0, 1, 0]
            // expect res[1, 3, 6, 10, 19, 19, 21, 21, 22, 22]
            // [value index 0, value index 0 + 1, value index 0, 1, 2]
            const formattedCountLog = []
            for (let i = 0; i < getLogAllDateInMonth.length; i++) {
                let sum = 0
                for (let j = 0; j <= i; j++) {
                    sum += getLogAllDateInMonth[j]
                }
                formattedCountLog.push(sum)

            }

            const convertCountLogToHours = formattedCountLog.map((count) => countHour.convertMilisecondToHour(count))

            const machinName = await Machine.findOne({
                where: {
                    id
                },
                attributes: ['name']
            })

            const formattedResult = {
                name: machinName.name,
                data: convertCountLogToHours,
                length: getLogAllDateInMonth.length,
                lengthFormat: formattedCountLog.length,
            }


            res.json({
                status: 200,
                message: 'success get cutting time by machine id',
                data: formattedResult
            });
        } catch (error) {
            console.log({ error, message: error.message })
            serverError(error, res, 'failed to get cutting time by machine id');
        }
    }

    static async getMachine(req, res) {
        try {
            const id = 290
            const nowDate = new Date()
            const data = await MachineLog.findOne({
                where: {
                    machine_id: id,
                    timestamp: {
                        [Op.between]: [new Date(nowDate.setHours(0, 0, 0, 0)), new Date(nowDate.setHours(23, 59, 59, 999))],
                    }
                },
                order: [['timestamp', 'DESC']]
            })
            res.status(200).json({ status: 200, message: 'success get machine', data });
        } catch (error) {
            serverError(error, res, 'failed to get machine');
        }
    }
}

module.exports = MachineController;