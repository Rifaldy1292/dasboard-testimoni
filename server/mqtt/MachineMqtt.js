const { MachineLog, Machine, CuttingTime } = require('../models');
const { Op } = require('sequelize');
const dateCuttingTime = require('../utils/dateCuttingTime');
const WebSocket = require('ws');
const { clientPreferences, messageTypeWebsocketClient } = require('../websocket/handleWebsocket');
const MachineWebsocket = require('../websocket/MachineWebsocket');
const { dateQuery } = require('../utils/dateQuery');

const updateLastMachineLog = async (id, runningHour) => {
    try {
        await MachineLog.update(
            { running_today: runningHour },
            {
                where: { machine_id: id, createdAt: dateQuery() },
                order: [['createdAt', 'DESC']],
                limit: 1
            }
        );
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


/**
 * Handles machine status changes, creating new logs when necessary.
 *
 * @param {Machine} existMachine - The machine record.
 * @param {Object} parseMessage - The parsed MQTT message.
 * @param {WebSocket.Server} wss - The WebSocket server.
 */
const handleChangeMachineStatus = async (existMachine, parseMessage, wss) => {
    try {
        // Find the last log for today
        const lastMachineLog = await MachineLog.findOne({
            where: {
                machine_id: existMachine.id,
                createdAt: dateQuery()
            },
            attributes: ['createdAt', 'id'],
            order: [['createdAt', 'DESC']],
        });

        // Check if the status change is within 10 minutes of the last log
        // and if the new status is 'Running'
        const differenceTime = new Date() - new Date(lastMachineLog?.createdAt);
        const tenMinutes = 10 * 60 * 1000;
        const isManual = differenceTime <= tenMinutes && parseMessage.status === 'Running';
        if (isManual) {
            // Update the last log to indicate it was a manual operation
            lastMachineLog.description = 'Manual Operation';
            lastMachineLog.save();
        }

        // Create a new log with the updated status
        await MachineLog.create({
            machine_id: existMachine.id,
            previous_status: existMachine.status,
            current_status: parseMessage.status,
            timestamp: new Date()
        });

        // Send an update to all connected clients
        wss.clients.forEach(async (client) => {
            if (client.readyState !== WebSocket.OPEN) return;

            // Check if the client has requested a timeline or percentage update
            const timelineMessage = messageTypeWebsocketClient.get(client)?.has('timeline');
            const percentageMessage = messageTypeWebsocketClient.get(client)?.has('percentage');

            // Check if the client has a custom date
            const lastRequestedDate = clientPreferences.get(client);
            if (lastRequestedDate) {
                // If the client has a custom date, skip the update
                console.log(`Skipping update for client with custom date: ${lastRequestedDate}`);
                return;
            }

            // Send the update to the client
            if (timelineMessage) {
                console.log('Sending live timeline update from MQTT');
                await MachineWebsocket.timelines(client);
            } else if (percentageMessage) {
                await MachineWebsocket.percentages(client);
            }
        });

    } catch (error) {
        console.log({ error, message: error.message });
    }
}

const createMachineAndLogFirstTime = async (parseMessage) => {
    try {
        const createMachine = await Machine.create({
            name: parseMessage.name,
            status: parseMessage.status,
            ip_address: parseMessage.ipAddress
        });

        // running_today default 0
        return await MachineLog.create({
            machine_id: createMachine.id,
            current_status: createMachine.status,
            timestamp: new Date()
        });
    } catch (error) {
        console.log({ error, message: error.message });
    }
}



module.exports = { updateLastMachineLog, createCuttingTime, handleChangeMachineStatus, createMachineAndLogFirstTime };