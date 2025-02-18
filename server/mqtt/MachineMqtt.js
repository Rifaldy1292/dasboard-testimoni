const { MachineLog, Machine } = require('../models');
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

const handleCuttingTIme = async () => {
    try {

    } catch (error) {
        console.error({ error, message: error.message });
    }
}



module.exports = { getLastMachineLog, handleCuttingTIme };