const { MachineLog, DailyConfig } = require('../models');
const { dateQuery } = require('./dateQuery');
const { serverError } = require('./serverError');

/**
 * Calculates the total running time of a machine based on today's machine logs
 *  
 * @param {number|string} machine_id - ID of the machine to calculate running time for
 * @param {Date|undefined} reqDate - Date to filter machine logs by (optional)
 * @returns {Promise<{totalRunningTime: number, lastLog: {id: number, createdAt: Date} }|undefined>} Object containing totalRunningTime and lastMachineLog, or undefined if no logs exist
 * @throws {Error} If an error occurs during the calculation process
 */
const getRunningTimeMachineLog = async (machine_id, reqDate) => {
    try {
        // Fetch all machine logs for today, ordered by creation time
        const range = await dateQuery(reqDate);
        const logs = await MachineLog.findAll({
            where: {
                machine_id,
                createdAt: range,
            },
            order: [["createdAt", "ASC"]],
            attributes: ["id", "createdAt", "current_status"],
        });

        // If no logs found, return undefined
        if (!logs.length) {
            return undefined;
        }

        const lastLog = logs[logs.length - 1];

        // Calculate total running time
        let totalRunningTime = 0; // In milliseconds
        let lastRunningTimestamp = null;

        logs.forEach((log) => {
            const { current_status, createdAt } = log.dataValues;
            if (current_status === "Running") {
                lastRunningTimestamp = createdAt;
            } else if (lastRunningTimestamp) {
                const calculate = new Date(createdAt) - new Date(lastRunningTimestamp);
                totalRunningTime += calculate;
                lastRunningTimestamp = null;
            }
        });

        if (lastRunningTimestamp) {
            if (!reqDate) {
                const calculate = new Date() - new Date(lastRunningTimestamp);
                totalRunningTime += calculate;
                return {
                    totalRunningTime,
                    lastLog: logs[logs.length - 1],
                };
            }
            else {
                const formattedReqDate = new Date(reqDate).toLocaleDateString('en-CA');
                const formattedDate = new Date().toLocaleDateString('en-CA');
                // jika tanggal lebih dari hari ini
                // console.log({ formattedReqDate, formattedDate }, formattedReqDate > formattedDate, 88888)
                if (formattedReqDate > formattedDate) {
                    return {
                        totalRunningTime: 0,
                        lastLog,
                    };
                }
                // // jika tanggal hari ini, maka hitung waktu berjalan
                if (formattedReqDate === formattedDate) {
                    const calculate = new Date() - new Date(lastRunningTimestamp);
                    totalRunningTime += calculate;
                    return {
                        totalRunningTime,
                        lastLog,
                    };
                }
                // const findDailyConfig = await DailyConfig.findOne({
                //     where: {
                //         date: formattedDate,
                //     },
                //     attributes: ['startFirstShift'],
                // });

                // if (!findDailyConfig) {
                //     return {
                //         totalRunningTime: 0,
                //         lastLog: logs[logs.length - 1],
                //     };
                // }

                // const [hour, minute] = findDailyConfig.dataValues.startFirstShift.split(':');

                // // jika tanggal bukan hari ini
                // const newDate = new Date(formattedDate);
                // newDate.setDate(newDate.getDate() + 1);
                // newDate.setHours(hour, minute, 0, 0);

                // const calculate = new Date(newDate) - new Date(lastRunningTimestamp);
                // totalRunningTime += calculate;
                // return {
                //     totalRunningTime,
                //     lastLog: logs[logs.length - 1],
                // };




                const nextLogID = lastLog.dataValues.id + 1;

                const nextLogData = await MachineLog.findOne({
                    where: {
                        id: nextLogID,
                    },
                    attributes: ['createdAt'],
                })
                if (!nextLogData.dataValues.createdAt) {
                    return {
                        totalRunningTime,
                        lastLog,
                    };
                }
                // const calculate = new Date(lastLogDate) - new Date(lastRunningTimestamp);
                const test = new Date(nextLogData.dataValues.createdAt).toISOString()
                const calculate = new Date(test) - new Date(lastRunningTimestamp);
                totalRunningTime += calculate;
            }

        }

        // console.log({ totalRunningTime })


        return {
            totalRunningTime,
            lastLog: logs[logs.length - 1],
        };

    } catch (error) {
        serverError(error, "getRunningTimeMachineLog");
    }
};

module.exports = {
    getRunningTimeMachineLog,
};