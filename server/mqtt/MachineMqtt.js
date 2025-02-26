const { MachineLog, Machine, CuttingTime } = require('../models');
const { Op } = require('sequelize');
const dateCuttingTime = require('../utils/dateCuttingTime');


const getLastMachineLog = async (id) => {
    try {
        const lastMachineLog = await MachineLog.findOne({
            order: [
                ['timestamp', 'DESC']
            ],
            attributes: ['current_status', 'running_today', 'id'],
            where: {
                machine_id: id
            },
            include: {
                model: Machine,
                attributes: ['total_running_hours']
            },

        });
        if (!lastMachineLog) {
            return null;
        }
        const { total_running_hours } = lastMachineLog.Machine;
        // console.log({ total_running_hours })
        lastMachineLog.running_today = total_running_hours

        await lastMachineLog.save();
    } catch (error) {
        console.error({ error, message: error.message });
    }
}


const createCuttingTime = async () => {
    try {
        const { date } = dateCuttingTime();
        const existCuttingTime = await CuttingTime.findOne({ where: { period: date } });
        if (existCuttingTime === null) {
            return await CuttingTime.create({
                period: date,
            });
        }
    } catch (error) {
        console.error({ error, message: error.message });
    }
}

function formatTimeDifference(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));

    let result = [];
    if (hours > 0) result.push(`${hours}h`);
    if (minutes > 0) result.push(`${minutes}m`);
    if (seconds > 0) result.push(`${seconds}s`);

    return result.length > 0 ? result.join(" ") : "0s";
}

const handleChangeMachineStatus = async (existMachine, parseMessage) => {
    try {
        const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
        const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));
        // console.log({ existMachine }, 99)
        const lastMachineLog = await MachineLog.findOne({
            where: {
                machine_id: existMachine.id,
                timestamp: {
                    [Op.between]: [startOfToday, endOfToday]
                }
            },
            attributes: ['timestamp', 'id'],
            order: [['timestamp', 'DESC']],
        })


        // console.log({ lastMachineLog }, 444)
        // console.log(parseMessage.status, 11)
        const differenceTime = new Date() - new Date(lastMachineLog?.timestamp);
        const teenMinutes = 10 * 60 * 1000;
        const isManual = differenceTime <= teenMinutes && parseMessage.status === 'Running';
        if (isManual) {
            lastMachineLog.description = 'Manual Operation';
            lastMachineLog.save();
        }

        await MachineLog.create({
            machine_id: existMachine.id,
            previous_status: existMachine.status,
            current_status: parseMessage.status,
            timestamp: new Date()
        });
    } catch (error) {
        console.log({ error, message: error.message });
    }
}

const createMachineAndLogFirstTime = async (parseMessage) => {
    try {
        const createMachine = await Machine.create({
            name: parseMessage.name,
            status: parseMessage.status
        });

        // running_today default 0
        return await MachineLog.create({
            machine_id: createMachine.id,
            current_status: createMachine.status,
            timestamp: new Date()
        });
    } catch (error) {
        console.log({ error, message: error.message });
    }
}



module.exports = { getLastMachineLog, createCuttingTime, handleChangeMachineStatus, createMachineAndLogFirstTime };