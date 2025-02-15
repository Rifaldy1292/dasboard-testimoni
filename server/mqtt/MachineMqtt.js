const { MachineLog, Machine } = require('../models');


const target = 600; // Total target hours for the month

function getTarget() {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    const totalDayInMonth = new Date(year, month + 1, 0).getDate(); // Get number of days in the current month

    const targetPerDay = target / totalDayInMonth; // Calculate target hours per day

    const calculatedTargets = Array.from({ length: totalDayInMonth }, (_, i) => (i + 1) * targetPerDay); // Calculate cumulative target for each day

    const formattedResult = calculatedTargets.map((item) => Math.round(item))
    // console.log({ test, length: test.length });

    return formattedResult;
}

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



module.exports = { getLastMachineLog, handleCuttingTIme, getTarget };