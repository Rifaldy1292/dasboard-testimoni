const { Op } = require('sequelize');
const { MachineLog } = require("../models");
const { dateQuery } = require("./dateQuery");

const getRunningTime = async (machineId) => {
    try {
        // get running time in now
        const logs = await MachineLog.findAll({
            where: {
                machine_id: machineId,
                timestamp: dateQuery()
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
        const nowDay = new Date();
        const nowMonth = nowDay.getMonth();
        const nowYear = nowDay.getFullYear();

        const logs = await MachineLog.findAll({
            where: {
                timestamp: {
                    [Op.gte]: new Date(nowYear, nowMonth, 1),
                    [Op.lte]: new Date(nowYear, nowMonth + 1, 0)
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
