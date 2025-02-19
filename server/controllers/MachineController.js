const { Op } = require('sequelize');
const { Machine, MachineLog, CuttingTime } = require('../models');
const dateCuttingTime = require('../utils/dateCuttingTime');
const { serverError } = require('../utils/serverError');
const countHour = require('../utils/countHour');


class MachineController {
    static async getCuttingTime(req, res) {
        try {
            const { period } = req.query;
            const { date } = dateCuttingTime(period)

            const cuttingTime = await CuttingTime.findOne({ where: { period: date }, attributes: ['period', 'target'] });

            // machineIds from query, default all
            const machineIds = req.query.machineIds ?? await Machine.findAll({ attributes: ['id', 'name'] });

            if (!cuttingTime || !machineIds.length) {
                return res.status(204).send()
            }

            const sortedMachineIds = machineIds.sort((a, b) => {
                const numberA = parseInt(a.name.slice(3));
                const numberB = parseInt(b.name.slice(3));
                return numberA - numberB;
            });

            // 28
            const totalDayInMonth = date.getDate()

            const objTargetCuttingTime = objectTargetCuttingTime(cuttingTime.target, totalDayInMonth)

            // [1,2,3...31]
            const allDayInMonth = Array.from({ length: totalDayInMonth }, (_, i) => i + 1);

            const allDateInMonth = Array.from({ length: totalDayInMonth }, (_, i) => {
                i++
                const day = new Date(date.getFullYear(), date.getMonth(), i + 1)
                return day
            });

            const cuttingTimeInMonth = await Promise.all(sortedMachineIds.map(async (machine) => {
                const data = await MachineController.getCuttingTimeByMachineId({ machine_id: machine.id, allDateInMonth })
                return { name: machine.name, ...data }
            }));

            const extendedCuttingTimeInMonth = [objTargetCuttingTime, ...cuttingTimeInMonth]


            const data = {
                cuttingTime,
                allDayInMonth,
                cuttingTimeInMonth: extendedCuttingTimeInMonth
            }
            res.status(200).json({ status: 200, message: 'success get cutting time', data });
        } catch (error) {
            serverError(error, res, 'Failed to get cutting time');
        }
    }

    static async getCuttingTimeByMachineId({ machine_id, allDateInMonth }) {
        try {
            if (!machine_id || !allDateInMonth) throw new Error('machine_id or allDateInMonth is required')


            const getLogAllDateInMonth = await Promise.all(allDateInMonth.map(async (dateValue) => {
                const log = await MachineLog.findOne({
                    where: {
                        machine_id,
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
            const runningToday = getLogAllDateInMonth.map((count) => countHour.convertMilisecondToHour(count))

            return { data: convertCountLogToHours, runningToday }
        } catch (error) {
            console.error({ error }, 88888888888888)
            throw new Error(error);
        }
    }

    static async getMachineOption(req, res) {
        try {
            const machines = await Machine.findAll({ attributes: ['id', 'name'] });
            const sortedMachine = machines.sort((a, b) => {
                const numberA = parseInt(a.name.slice(3));
                const numberB = parseInt(b.name.slice(3));
                return numberA - numberB;
            })
            res.status(200).json({ status: 200, message: 'success get machine option', data: sortedMachine });
        } catch (error) {
            serverError(error, res, 'Failed to get machine option');
        }
    }
}

const objectTargetCuttingTime = (target, totalDayInMonth) => {

    const targetPerDay = target / totalDayInMonth; // Calculate target hours per day

    const calculatedTargets = Array.from({ length: totalDayInMonth }, (_, i) => (i + 1) * targetPerDay); // Calculate cumulative target for each day

    const formattedResult = calculatedTargets.map((item) => Math.round(item))
    // console.log({ test, length: test.length });
    return {
        name: 'Target',
        data: formattedResult, // data ubah jadi actual
        runningToday: formattedResult
    };
}


module.exports = MachineController;