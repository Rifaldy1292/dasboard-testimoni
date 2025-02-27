const { Op } = require('sequelize');
const { MachineLog } = require("../models");

const getRunningTime = async (machineId) => {
    try {
        const logs = await MachineLog.findAll({
            where: {
                machine_id: machineId,
                timestamp: {
                    [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)), // Mulai hari ini,
                    [Op.lte]: new Date(new Date().setHours(23, 59, 59, 999))

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
        return totalRunningTime;
    } catch (error) {
        console.log({ error, message: error.message }, 'from getRunningTime');
    }
}

const getRunningTimeMonth = async () => {
    let error = null
    let data;
    try {

        const tanggalSaatIni = new Date();
        const bulanSaatIni = tanggalSaatIni.getMonth();
        const tahunSaatIni = tanggalSaatIni.getFullYear();

        const logs = await MachineLog.findAll({
            where: {
                timestamp: {
                    [Op.gte]: new Date(tahunSaatIni, bulanSaatIni, 1),
                    [Op.lte]: new Date(tahunSaatIni, bulanSaatIni + 1, 0)
                }
            }
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

        data = totalRunningTime
    } catch (err) {
        error = err
        console.log(err)
    }

    return {
        data,
        error
    };

}

module.exports = { getRunningTime, getRunningTimeMonth }
