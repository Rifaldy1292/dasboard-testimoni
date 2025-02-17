const { Op } = require('sequelize');
const { Machine, MachineLog } = require('../models');
const { percentage, totalHour } = require('../utils/countHour');
const { getTarget } = require('../mqtt/MachineMqtt');



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
 * Class representing the Machine Websocket.
 */
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
                        timestamp: {
                            [Op.gte]: new Date(dateOption.setHours(0, 0, 0, 0)),
                            [Op.lte]: new Date(dateOption.setHours(23, 59, 59, 999))
                        }
                    },
                    attributes: ['current_status', 'timestamp']
                }],
                order: [[{ model: MachineLog }, 'timestamp', 'ASC']],
                attributes: ['name', 'status']
            });

            client.send(JSON.stringify({ type: 'asd', data: machines }));

            const formattedMachines = machines.map(machine => {
                const logs = machine.MachineLogs.map(log => {
                    return {
                        current_status: log.current_status,
                        timestamp: convertDateTime(log.timestamp)
                    }
                });
                return {
                    name: machine.name,
                    status: machine.status,
                    MachineLogs: logs
                };
            }).sort((a, b) => {
                const numberA = parseInt(a.name.slice(3));
                const numberB = parseInt(b.name.slice(3));
                return numberA - numberB;
            });
            client.send(JSON.stringify({ type: 'timeline', data: formattedMachines }));
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
    static async percentages(client) {
        try {
            const machines = await Machine.findAll({
                attributes: ['name', 'status', 'total_running_hours']
            });
            const formattedMessage = machines.map(machine => {
                const runningTime = getRunningHours(machine.total_running_hours);
                return {
                    name: machine.name,
                    status: machine.status,
                    total_running_hours: machine.total_running_hours,
                    percentage: [runningTime, 100 - runningTime],
                    description: countDescription(machine.total_running_hours),
                };
            }).sort((a, b) => {
                const numberA = parseInt(a.name.slice(3));
                const numberB = parseInt(b.name.slice(3));
                return numberA - numberB;
            });
            client.send(JSON.stringify({ type: 'percentage', data: formattedMessage }));
        } catch (e) {
            console.log({ e, message: e.message });
            client.send(JSON.stringify({ type: 'error', message: 'Failed to get percentage' }));
        }
    }

    static async cuttingTime(client) {
        try {
            const result = getTarget();
            console.log(result)
            client.send(JSON.stringify({ type: 'cuttingTime', data: result }));
        } catch (error) {
            console.error({ error, message: error.message });
            client.send(JSON.stringify({ type: 'error', message: 'Failed to get cutting time' }));
        }
    }
}

