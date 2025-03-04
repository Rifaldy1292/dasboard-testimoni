/**
 * Handles MQTT connections and messages, updating machine status and logs, and
 * sending updates via WebSocket.
 * 
 * @param {mqtt.Client} mqttClient - The MQTT client instance.
 * @param {WebSocket.Server} wss - The WebSocket server instance.
 */
const { Machine, MachineLog, CuttingTime } = require('../models');
const { getRunningTime } = require('../utils/getRunningTime');
const MachineWebsocket = require('../websocket/MachineWebsocket');
const { updateLastMachineLog, createCuttingTime, handleChangeMachineStatus, createMachineAndLogFirstTime } = require('./MachineMqtt');
const WebSocket = require('ws');
const { clientPreferences, messageTypeWebsocketClient } = require('../websocket/handleWebsocket');

const mqttTopics = [
    'mc-1/data', 'mc-2/data', 'mc-3/data', 'mc-4/data', 'mc-5/data',
    'mc-6/data', 'mc-7/data', 'mc-8/data', 'mc-9/data', 'mc-10/data',
    'mc-11/data', 'mc-12/data', 'mc-13/data', 'mc-14/data', 'mc-15/data', 'mc-16/data'
];

const handleMqtt = (mqttClient, wss) => {
    mqttClient.on('connect', async () => {
        mqttTopics.forEach(topic => {
            console.log('MQTT client connected', topic);
            mqttClient.subscribe(topic);
        });
    });

    mqttClient.on('message', async (topic, message) => {
        // console.time('Proses');
        try {
            const parseMessage = JSON.parse(message.toString());

            // create cutting time here
            await createCuttingTime();

            const existMachine = await Machine.findOne({ where: { name: parseMessage.name } });

            // create machine & log if machine not exist
            if (existMachine === null) {
                return await createMachineAndLogFirstTime(parseMessage);
            }

            // if status change
            if (existMachine.status !== parseMessage.status) {
                await handleChangeMachineStatus(existMachine, parseMessage, wss);
            }

            const runningHour = await getRunningTime(existMachine.id);
            existMachine.total_running_hours = runningHour;
            existMachine.status = parseMessage.status;

            await existMachine.save();
            await updateLastMachineLog(existMachine.id, runningHour);


        } catch (error) {
            if (error.message === 'Unexpected token < in JSON at position 0') {
                return console.error({ error, message: 'Invalid JSON' });
            }
            console.error({ error, message: error.message });
        }

        // wss.clients.forEach(async (client) => {
        //     if (client.readyState === WebSocket.OPEN) {
        //         const percentageMessage = messageTypeWebsocketClient.get(client)?.has('percentage');
        //         if (percentageMessage) {
        //             console.log(true)
        //             await MachineWebsocket.percentages(client);
        //         }
        //         // else {
        //         //     // console.log(false)
        //         // }
        //     }
        // });
        // console.timeEnd('Proses');
    });
}

module.exports = handleMqtt;
