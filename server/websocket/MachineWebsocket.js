const { Op, where } = require('sequelize');
const { Machine, MachineLog } = require('../models');
const { percentage, totalHour } = require('../utils/countHour');
const { dateQuery } = require('../utils/dateQuery');

/**
 * Perfect time constant.
 * @type {number}
 */
const perfectTime = 24; // hour

/**
 * Converts a date to a formatted time string.
 * 
 * @param {Date} date - The date to convert.
 * @returns {string} The formatted time string. ex: 10:00
 */
function convertDateTime(date) {
    const dateTime = new Date(date);
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calculates the running hours percentage.
 * 
 * @param {number} runningHour - The running hours in milliseconds.
 * @returns {number} The calculated percentage.
 */
function getRunningHours(runningHour) {
    return percentage(runningHour, perfectTime);
}

/**
 * Generates a description of the running time.
 * 
 * @param {number} totalRunningHours - The total running hours in milliseconds.
 * @returns {string} The running time description.
 */
function countDescription(totalRunningHours) {
    const count = totalHour(totalRunningHours);
    const hour = count.split('.')[0];
    const minute = count.split('.')[1];
    return `${hour} hour ${minute} minute / ${perfectTime} hour`;
}

/**
 * Formats the time difference between two dates.
 * 
 * @param {number} ms - The time difference in milliseconds.
 * @returns {string} The formatted time difference ex: 1h 2m 3s
 */
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



module.exports = class MachineWebsocket {

    /**
     * Retrieves machine timelines and sends them to the client.
     * 
     * @param {WebSocket} client - The WebSocket client instance.
     * @param {string} date - The date to retrieve the timeline for.
     */
    static async timelines(client, date) {
        try {
            // default date is today
            const currentDate = date || new Date();
            const dateOption = new Date(currentDate);
            const machines = await Machine.findAll({
                include: [{
                    model: MachineLog,
                    where: {
                        // ambil data sesuai hari ini
                        timestamp: dateQuery(dateOption)
                    },
                    attributes: ['id', 'current_status', 'timestamp', 'description']
                }],
                order: [[{ model: MachineLog }, 'timestamp', 'ASC']],
                attributes: ['name', 'status']
            });

            const sortedMachines = machines.sort((a, b) => {
                const numberA = parseInt(a.name.slice(3));
                const numberB = parseInt(b.name.slice(3));
                return numberA - numberB;
            });

            client.send(JSON.stringify({ type: 'asd', data: machines }));

            if (!sortedMachines.length) {
                client.send(JSON.stringify({ type: 'timeline', data: [] }));
                return;
            }


            const formattedMachines = sortedMachines.map((machine, index) => {
                const logs = machine.MachineLogs.map((log, indexLog) => {
                    const currentTime = log.timestamp;
                    const nextLog = machine.MachineLogs[indexLog + 1] || null;
                    const timeDifference = new Date(nextLog?.timestamp || 0) - new Date(currentTime);
                    return {
                        ...log.dataValues,
                        timestamp: convertDateTime(currentTime),
                        timeDifference: formatTimeDifference(timeDifference),
                        // log,
                        // nextLog,
                    }
                });


                return {
                    name: machine.name,
                    status: machine.status,
                    MachineLogs: logs
                };
            })
            const data = {
                data: formattedMachines,
                date: currentDate
            }
            client.send(JSON.stringify({ type: 'timeline', data }));
        } catch (e) {
            console.log({ e, message: e.message });
            client.send(JSON.stringify({ type: 'error', message: 'Failed to get timeline data' }));
        }
    }

    /**
     * Retrieves machine percentages and sends them to the client.
     * 
     * @param {WebSocket} client - The WebSocket client instance.
     */
    static async percentages(client, date) {
        try {
            const nowDate = date || new Date();
            const machines = await Machine.findAll({
                include: [{
                    model: MachineLog,
                    where: {
                        updatedAt: dateQuery(nowDate)
                    },
                    attributes: ['running_today']
                }],
                attributes: ['name', 'status', 'total_running_hours'],
                // ambil data sesuai hari ini
                order: [[{ model: MachineLog }, 'updatedAt', 'DESC']],
                subQuery: false

            });
            const formattedMessage = machines.map(machine => {
                // ini bisa improfe performa
                // const runningTime = getRunningHours(machine.total_running_hours);
                const lastLog = machine.MachineLogs[0].running_today
                const runningTime = getRunningHours(lastLog);
                return {
                    // ...machine.dataValues,
                    name: machine.name,
                    status: machine.status,
                    total_running_hours: lastLog,
                    percentage: [runningTime, 100 - runningTime],
                    description: countDescription(lastLog)
                };
            }).sort((a, b) => {
                const numberA = parseInt(a.name.slice(3));
                const numberB = parseInt(b.name.slice(3));
                return numberA - numberB;
            });
            const data = {
                data: formattedMessage,
                date: nowDate
            }
            client.send(JSON.stringify({ type: 'percentage', data }));
        } catch (e) {
            console.log({ e, message: e.message });
            client.send(JSON.stringify({ type: 'error', message: 'Failed to get percentage' }));
        }
    }

    static async editLogDescription(client, data) {
        try {
            const { id, description } = data;
            const updatedLog = await MachineLog.update({ description }, { where: { id } });

            client.send(JSON.stringify({ type: 'success', message: 'Description updated successfully' }));
            // refetch timeline data
            // await MachineWebsocket.timelines(client);
        } catch (e) {
            console.log({ e, message: e.message });
            client.send(JSON.stringify({ type: 'error', message: 'Failed to update description' }));
        }
    }

}

