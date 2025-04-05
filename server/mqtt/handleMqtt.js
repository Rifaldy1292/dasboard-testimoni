const { Machine } = require("../models");
const { serverError } = require("../utils/serverError");
const {
  handleChangeMachineStatus,
  createMachineAndLogFirstTime,
  updateLastMachineLog,
} = require("./MachineMqtt");
const WebSocket = require("ws");
require("../websocket/handleWebsocket");
const mqtt = require('mqtt');
const { existMachinesCache } = require("../cache");

const mqttClient = mqtt.connect('mqtt://localhost:1883');

const mqttTopics = [
  "mc-1/data",
  "mc-2/data",
  "mc-3/data",
  "mc-4/data",
  "mc-5/data",
  "mc-6/data",
  "mc-7/data",
  "mc-8/data",
  "mc-9/data",
  "mc-10/data",
  "mc-11/data",
  "mc-12/data",
  "mc-13/data",
  "mc-14/data",
  "mc-15/data",
  "mc-16/data",
];

/**
 * @param {WebSocket.Server} wss
 */
const handleMqtt = (wss) => {
  mqttClient.on("connect", async () => {
    mqttTopics.forEach((topic) => {
      console.log("MQTT client connected", topic);
      mqttClient.subscribe(topic);
    });

    // get exist machines and set to cache
    try {
      const existMachines = await Machine.findAll({
        attributes: ["id", "name", "status"],
      })

      existMachines.forEach((machine) => {
        existMachinesCache.set(machine.name, {
          id: machine.id,
          name: machine.name,
          status: machine.status,
        });
      });
    } catch (error) {
      serverError(error, "Failed to get exist machines");
    }

  });

  mqttClient.on("message", async (topic, message) => {
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

      const existMachine = existMachinesCache.get(parseMessage.name);

      // create machine & log if machine not exist
      if (!existMachine) {
        return await createMachineAndLogFirstTime(parseMessage);
      }

      // if status change
      if (existMachine.status !== parseMessage.status) {
        return await handleChangeMachineStatus(existMachine, parseMessage, wss);
      }

      if (existMachine.status === "Running") {
        return await updateLastMachineLog(existMachine.id);
      }
    } catch (error) {
      if (error.message === "Unexpected token < in JSON at position 0") {
        return serverError(error, "Invalid JSON");
      }
      serverError(error, "Failed to handle MQTT message");
    }
  });

  // // clear cache
  // mqttClient.on("offline", () => {
  //   console.log("MQTT client disconnected", 777);
  //   existMachinesCache.clear();
  // });
};

module.exports = handleMqtt;
