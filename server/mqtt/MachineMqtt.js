const { MachineLog, Machine, CuttingTime } = require('../models');
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
        lastMachineLog.running_today = lastMachineLog.Machine.total_running_hours
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