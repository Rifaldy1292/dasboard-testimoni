const { MachineLog, Machine, CuttingTime } = require('../models');
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
        const { total_running_hours } = lastMachineLog.Machine
        lastMachineLog.running_today = total_running_hours

        const teenMinutes = 10 * 60 * 1000;
        if (total_running_hours) {
            lastMachineLog.description = 'Manual Operation';
        }
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



module.exports = { getLastMachineLog, createCuttingTime };