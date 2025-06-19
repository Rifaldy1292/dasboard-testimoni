const { Machine } = require("./models");
const {
  handleChangeMachineStatus,
  createMachineAndLogFirstTime,
} = require("./mqtt/MachineMqtt");
const WebSocket = require("ws");
require("./websocket/handleWebsocket");
const mqtt = require("mqtt");
const { existMachinesCache } = require("./cache");
const { getAllMachine } = require("./utils/machineUtils");
const { machineLoggerInfo, machineLoggerDebug, machineLoggerError } = require("./utils/logger");
const handleCronJob = require("./helpers/cronjob");
const { mqttClient, MQTT_TOPICS } = require("./constants");


/**
 * @param {WebSocket.Server} wss
 */
const handleMqtt = () => {
  mqttClient.on("connect", async () => {
    MQTT_TOPICS.forEach((topic) => {
      mqttClient.subscribe(topic);
    });
    await getAllMachine();
    machineLoggerInfo("MQTT client connected and subscribed to topics", "handleMqtt");
  });

  mqttClient.on("message", async (topic, message) => {
    const parseMessage = JSON.parse(message.toString());
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
      machineLoggerDebug(
        `Received MQTT message on topic ${topic}`, 'handleMqtt: mqttClient.on', parseMessage
      );
      console.log(parseMessage, 777)

      let existMachine = existMachinesCache.get(parseMessage.name);

      // machineLoggerDebug(
      //   `Checking if machine ${parseMessage.name} exists in cache`,
      //   'handleMqtt',
      //   { existMachine }
      // );

      // create machine & log if machine not exist
      if (!existMachine) {
        const findExistMachine = await Machine.findOne({
          where: { name: parseMessage.name },
          attributes: ["id", "name", "status"],
          raw: true,
        });
        if (!findExistMachine) {
          return await createMachineAndLogFirstTime(parseMessage, mqttClient);
        }

        // if machine exist in db, set to cache
        existMachinesCache.set(findExistMachine.name, {
          id: findExistMachine.id,
          name: findExistMachine.name,
          status: findExistMachine.status,
        });

        existMachine = existMachinesCache.get(findExistMachine.name);
      }

      // if status change
      if (existMachine.status !== parseMessage.status) {
        await handleChangeMachineStatus(existMachine, parseMessage, mqttClient);
      }
    } catch (error) {
      if (error.message === "Unexpected token < in JSON at position 0") {
        return machineLoggerError(error, "Invalid JSON format received from MQTT", parseMessage);
      }
      machineLoggerError(error, "Failed to handle MQTT message", parseMessage);
    }
  });
};

(async () => {
  await handleCronJob();
})();
handleMqtt();