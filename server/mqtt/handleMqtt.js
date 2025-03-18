/**
 * Handles MQTT connections and messages, updating machine status and logs, and
 * sending updates via WebSocket.
 * 
 * @param {mqtt.Client} mqttClient - The MQTT client instance.
 * @param {WebSocket.Server} wss - The WebSocket server instance.
 */
const { Machine, MachineLog, CuttingTime } = require('../models');
const { updateLastMachineLog } = require('../utils/getRunningTime');
const MachineWebsocket = require('../websocket/MachineWebsocket');
const { createCuttingTime, handleChangeMachineStatus, createMachineAndLogFirstTime } = require('./MachineMqtt');
const WebSocket = require('ws');
const { clientPreferences, messageTypeWebsocketClient } = require('../websocket/handleWebsocket');

const mqttTopics = [
    'mc-1/data', 'mc-2/data', 'mc-3/data', 'mc-4/data', 'mc-5/data',
    'mc-6/data', 'mc-7/data', 'mc-8/data', 'mc-9/data', 'mc-10/data',
    'mc-11/data', 'mc-12/data', 'mc-13/data', 'mc-14/data', 'mc-15/data', 'mc-16/data'
];

/**
 * 
 * @param {mqtt.Client} mqttClient 
 * @param {WebSocket.Server} wss 
 */
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
            /**
             * Parses the received MQTT message into a JavaScript object.
             * @type {Object}
             * @example 
             * {
             *   "name": "mc-1",
             *   "status": "Running" | "Stopped", 
             *    "user_id": 1,
             *    "ipAddress": "38.0.101.76",
             *    "output_wp": 2112 // encrypt value
             *    "k_num": 2112 // encrypt value
             *    "tool_name": 2112 // encrypt value
             *    "total_cutting_time   : 2112 // encrypt value
             *     "calculate_total_cutting_time": 1.2222
             }
             */
            const parseMessage = JSON.parse(message.toString());
            // console.log(parseMessage, 77777)

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

            existMachine.status = parseMessage.status;
            
            await existMachine.save();
            await updateLastMachineLog(existMachine.id);
            // await updateLastMachineLog(existMachine.id, runningHour);


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
