const { Op } = require('sequelize');
const { MachineLog } = require("../models");

const getRunningTime = async (machineId) => {
    const logs = await MachineLog.findAll({
        where: {
            machine_id: machineId,
            timestamp: {
                [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) // Mulai hari ini
            }
        },
        order: [['timestamp', 'ASC']]
    });

    let totalRunningTime = 0; // Dalam milidetik
    let lastRunningTimestamp = null;

    logs.forEach((log) => {
        if (log.current_status === "Running") {
            lastRunningTimestamp = log.timestamp;
        } else if (lastRunningTimestamp) {
            const duration = new Date(log.timestamp) - new Date(lastRunningTimestamp);
            totalRunningTime += duration;
            lastRunningTimestamp = null;
        }
    });

    // Jika masih dalam status running hingga sekarang
    if (lastRunningTimestamp) {
        totalRunningTime += new Date() - new Date(lastRunningTimestamp);
    }
    // console.log({
    //     totalRunningTime,
    //     lastRunningTimestamp
    // })
    const totalJam = Math.floor(totalRunningTime / (1000 * 60 * 60));
    const totalMenit = Math.floor((totalRunningTime % (1000 * 60 * 60)) / (1000 * 60));

    const jamDenganKoma = `${totalJam}.${totalMenit.toString().padStart(2, '0')}`;
    // console.log({ jamDenganKoma: Number(jamDenganKoma), totalRunningTime })

    return Number(jamDenganKoma);
}

module.exports = getRunningTime

// // convert to %
// const perfect = 10
// const test = 9

// const percentage = (test / perfect) * 100

// console.log(`${percentage}%`)