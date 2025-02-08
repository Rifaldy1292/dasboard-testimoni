/**
 * Handles MQTT connections and messages, updating machine status and logs, and
 * sending updates via WebSocket.
 * 
 * @param {mqtt.Client} mqttClient - The MQTT client instance.
 * @param {WebSocket.Server} wss - The WebSocket server instance.
 */
const { Machine, MachineLog } = require('../models');
const { getRunningTime } = require('../utils/getRunningTime');
const MachineWebsocket = require('../websocket/machine');

const mqttTopics = [
    'mc-1/data', 'mc-2/data', 'mc-3/data', 'mc-4/data', 'mc-5/data',
    'mc-6/data', 'mc-7/data', 'mc-8/data', 'mc-9/data', 'mc-10/data',
    'mc-11/data', 'mc-12/data', 'mc-13/data', 'mc-14/data', 'mc-15/data'
];

const handleMqtt = (mqttClient, wss) => {
    mqttClient.on('connect', async () => {
        console.log('MQTT client connected');
        mqttTopics.forEach(topic => {
            mqttClient.subscribe(topic);
        });
    });

    mqttClient.on('message', async (topic, message) => {
        console.time('Proses');
        try {
            const parseMessage = JSON.parse(message.toString());
            const existMachine = await Machine.findOne({ where: { name: parseMessage.name } });

            if (existMachine === null) {
                const createMachine = await Machine.create({
                    name: parseMessage.name,
                    status: parseMessage.status
                });

                await MachineLog.create({
                    machine_id: createMachine.id,
                    current_status: createMachine.status,
                    timestamp: new Date()
                });

                return;
            }

            if (existMachine.status !== parseMessage.status) {
                await MachineLog.create({
                    machine_id: existMachine.id,
                    previous_status: existMachine.status,
                    current_status: parseMessage.status,
                    timestamp: new Date()
                });
            }

            const runningHour = await getRunningTime(existMachine.id);
            existMachine.total_running_hours = runningHour;
            existMachine.status = parseMessage.status;

            await existMachine.save();

        } catch (error) {
            console.error({ error, message: error.message });
        }

        wss.clients.forEach(async (client) => {
            if (client.readyState === WebSocket.OPEN) {
                await MachineWebsocket.timelines(client);
                await MachineWebsocket.percentages(client);
            }
        });
        console.timeEnd('Proses');
    });
}

module.exports = handleMqtt;
