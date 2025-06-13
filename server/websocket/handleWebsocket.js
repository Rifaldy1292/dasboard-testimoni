const mqtt = require("mqtt");
const RemainingController = require("../controllers/RemainingController");
const MachineWebsocket = require("./MachineWebsocket");
const userMessageCache = require("../cache/userMessageCache");
const { logDebug, logError } = require("../utils/logger");

const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://localhost:1883";
const NOTIFICATION_TOPIC = "machine/update";

/**
 * Handles WebSocket connections and messages, providing endpoints for retrieving
 * machine timelines and percentages.
 *
 * @param {WebSocket.Server} wss - The WebSocket server instance.
 */
const handleWebsocket = (wss) => {

  wss.on("connection", (ws) => {
    logDebug("New client connected", "handleWebsocket", {
      id: ws._socket.remotePort,
      address: ws._socket.remoteAddress,
    });

    /**
     * Handles incoming messages from clients.
     *
     * @param {string} message - The message received from the client.
     */
    ws.on("message", (msg) => {
      /**
       * @typedef {Object} ParsedMessage
       * @property {'timeline' | 'percentage'} type - The message type
       * @property {{id?: number; date?: string; shift?: 0|1|2}} data - Additional data
       */

      /** @type {ParsedMessage} */
      const parsedMessage = JSON.parse(msg);
      if (!parsedMessage) return console.log("Invalid format", msg);

      const { type, data, close } = parsedMessage;
      // console.log(`Received message type: ${type}`, data);

      if (!type) return console.log("Unknown format", parsedMessage);

      // Handle close flag
      if (close) {
        userMessageCache.removeMessageType(ws, type)
        return
      }

      // Add message type and data to cache for other types
      userMessageCache.addMessageType(ws, type, data);
      // console.log("Client data", userMessageCache.clientData.get(ws));

      switch (type) {
        case "timeline":
          /**
           * Retrieves machine timelines.
           */
          MachineWebsocket.timelines(
            ws,
            data,
          );
          break;
        case "percentage":
          MachineWebsocket.percentages(
            ws,
            data
          );
          break;
        case "remaining":
          RemainingController.getRemaining(ws);
          break;
        default:
          logDebug(`Unknown message type: ${type}`, "handleWebsocket", {
            type,
            data,
          });
          break;
      }
    });
    /**
     * Handles the close event.
     * When a client disconnects, the references to the client are removed from the maps.
     */
    ws.on("close", () => {
      logDebug("Client disconnected", "handleWebsocket", {
        id: ws._socket.remotePort,
        address: ws._socket.remoteAddress,
      });
      userMessageCache.removeClient(ws);
    });
  });

  // Connect to MQTT broker for notifications
  const mqttClient = mqtt.connect(MQTT_BROKER);
  mqttClient.on("connect", () => {
    mqttClient.subscribe(NOTIFICATION_TOPIC);
  });
  mqttClient.on("error", (error) => {
    logDebug("MQTT connection error", "handleWebsocket", error);
  });
  mqttClient.on("message", (topic, msg) => {
    if (topic !== NOTIFICATION_TOPIC) return;
    logDebug("Received MQTT message", "handleWebsocket", {
      topic,
      message: msg.toString(),
    });
    try {
      // Send an update to all connected clients
      wss.clients.forEach(async (client) => {
        if (client.readyState !== WebSocket.OPEN) return;

        // Check message types using new cache
        const hasTimelineType = userMessageCache.hasMessageType(client, 'timeline');
        const hasPercentageType = userMessageCache.hasMessageType(client, 'percentage');
        const hasRemainingType = userMessageCache.hasMessageType(client, 'remaining');

        // Only send updates if client requested current date
        if (!userMessageCache.isCurrentDate(client)) return;

        const lastDate = userMessageCache.getLastDate(client);
        const shift = userMessageCache.getShift(client);

        if (hasTimelineType) {
          logDebug("Sending live timeline update from MQTT", "handleWebsocket", {
            lastDate,
            shift,
          });
          await MachineWebsocket.timelines(client, { date: lastDate, shift: shift ?? 0 });
        }

        if (hasPercentageType) {
          await MachineWebsocket.percentages(client, { date: lastDate, shift: shift ?? 0 });
        }

        if (hasRemainingType) {
          await RemainingController.getRemaining(client);
        }
      });

    } catch (error) {
      logError(error, "handleWebsocket: Failed to parse MQTT message");
    }
  });

}
module.exports = {
  handleWebsocket
};
