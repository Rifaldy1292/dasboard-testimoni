const { MachineLog, Machine, CuttingTime } = require('../models');
const { Op } = require('sequelize');
const dateCuttingTime = require('../utils/dateCuttingTime');
const WebSocket = require('ws');
const { clientPreferences, messageTypeWebsocketClient } = require('../websocket/handleWebsocket');
const MachineWebsocket = require('../websocket/MachineWebsocket');

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
        const { total_running_hours } = lastMachineLog.Machine;
        // console.log({ total_running_hours })
        lastMachineLog.running_today = total_running_hours

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
 * Handles the change in machine status, logs the change, updates WebSocket clients,
 * and determines if the operation was manual.
 *
 * @param {Object} existMachine - The existing machine record.
 * @param {Object} parseMessage - The parsed MQTT message containing machine status.
 * @param {WebSocket.Server} wss - The WebSocket server instance.
 */
const handleChangeMachineStatus = async (existMachine, parseMessage, wss) => {
    try {
        const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
        const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));

        const lastMachineLog = await MachineLog.findOne({
            where: {
                machine_id: existMachine.id,
                timestamp: {
                    [Op.between]: [startOfToday, endOfToday]
                }
            },
            attributes: ['timestamp', 'id'],
            order: [['timestamp', 'DESC']],
        });

        const differenceTime = new Date() - new Date(lastMachineLog?.timestamp);
        const tenMinutes = 10 * 60 * 1000;
        const isManual = differenceTime <= tenMinutes && parseMessage.status === 'Running';
        if (isManual) {
            lastMachineLog.description = 'Manual Operation';
            lastMachineLog.save();
        }

        await MachineLog.create({
            machine_id: existMachine.id,
            previous_status: existMachine.status,
            current_status: parseMessage.status,
            timestamp: new Date()
        });

        wss.clients.forEach(async (client) => {
            if (client.readyState !== WebSocket.OPEN) return;

            const timelineMessage = messageTypeWebsocketClient.get(client)?.has('timeline');
            const percentageMessage = messageTypeWebsocketClient.get(client)?.has('percentage');

            if (timelineMessage) {
                const lastRequestedDate = clientPreferences.get(client);
                // console.log({ clientPreferences: clientPreferences.get(client) }, 88888)
                if (lastRequestedDate) {
                    console.log(`Skipping timeline update for client with custom date: ${lastRequestedDate}`);
                    return;
                }

                console.log('Sending live timeline update from MQTT');
                return await MachineWebsocket.timelines(client);
            }
            if (percentageMessage) return await MachineWebsocket.percentages(client);
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



module.exports = { getLastMachineLog, createCuttingTime, handleChangeMachineStatus, createMachineAndLogFirstTime };