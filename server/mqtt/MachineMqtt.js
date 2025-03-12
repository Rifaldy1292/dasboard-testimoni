const { MachineLog, Machine, CuttingTime } = require('../models');
const dateCuttingTime = require('../utils/dateCuttingTime');
const WebSocket = require('ws');
const { clientPreferences, messageTypeWebsocketClient } = require('../websocket/handleWebsocket');
const MachineWebsocket = require('../websocket/MachineWebsocket');
const { dateQuery } = require('../utils/dateQuery');
const { decryptFromNumber } = require('../helpers/crypto');

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
        const { user_id, status, g_code_name, k_num, output_wp, tool_name, total_cutting_time } = parseMessage
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
        const isManual = differenceTime <= tenMinutes && status === 'Running';
        if (isManual) {
            // Update the last log to indicate it was a manual operation
            lastMachineLog.description = 'Manual Operation';
            lastMachineLog.save();
        }

        const decryptGCodeName = decryptFromNumber(g_code_name);
        const decryptKNum = decryptFromNumber(k_num);
        const decryptOutputWp = decryptFromNumber(output_wp);
        const decryptToolName = decryptFromNumber(tool_name);
        const decryptTotalCuttingTime = decryptFromNumber(total_cutting_time);

        // Create a new log with the updated status
        await MachineLog.create({
            user_id,
            machine_id: existMachine.id,
            previous_status: existMachine.status,
            current_status: status,
            timestamp: new Date(),
            g_code_name: decryptGCodeName,
            k_num: decryptKNum,
            output_wp: decryptOutputWp,
            tool_name: decryptToolName,
            total_cutting_time: decryptTotalCuttingTime
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
/**
 * Creates a machine and logs the first entry with the provided message data.
 * 
 * @param {Object} parseMessage - The parsed message containing machine data.
 * @param {string} parseMessage.name - Name of the machine.
 * @param {'Running'|'Stopped'} parseMessage.status - Status of the machine.
 * @param {number} parseMessage.user_id - User ID associated with the machine.
 * @param {string} parseMessage.ipAddress - IP address of the machine.
 * @param {number} parseMessage.output_wp - Encrypted output workpiece value.
 * @param {number} parseMessage.k_num - Encrypted K number value.
 * @param {number} parseMessage.tool_name - Encrypted tool name value.
 * @param {number} parseMessage.total_cutting_time - Encrypted total cutting time value.
 */
const createMachineAndLogFirstTime = async (parseMessage) => {
    try {
        const { name, status, user_id, g_code_name, k_num, output_wp, tool_name, total_cutting_time, ipAddress } = parseMessage

        const createMachine = await Machine.create({
            name: name,
            status: status,
            ip_address: ipAddress,
        });

        const decryptGCodeName = decryptFromNumber(g_code_name);
        const decryptKNum = decryptFromNumber(k_num);
        const decryptOutputWp = decryptFromNumber(output_wp);
        const decryptToolName = decryptFromNumber(tool_name);
        const decryptTotalCuttingTime = decryptFromNumber(total_cutting_time);


        // running_today default 0
        return await MachineLog.create({
            machine_id: createMachine.id,
            current_status: createMachine.status,
            timestamp: new Date(),
            user_id,
            g_code_name: decryptGCodeName,
            k_num: decryptKNum,
            output_wp: decryptOutputWp,
            tool_name: decryptToolName,
            total_cutting_time: decryptTotalCuttingTime
        });
    } catch (error) {
        console.log({ error, message: error.message });
    }
}

module.exports = { updateLastMachineLog, createCuttingTime, handleChangeMachineStatus, createMachineAndLogFirstTime };