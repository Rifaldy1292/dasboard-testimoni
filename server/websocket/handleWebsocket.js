const RemainingController = require("../controllers/RemainingController");
const MachineWebsocket = require("./MachineWebsocket");
const userMessageCache = require("../cache/userMessageCache");

/**
 * Handles WebSocket connections and messages, providing endpoints for retrieving
 * machine timelines and percentages.
 *
 * @param {WebSocket.Server} wss - The WebSocket server instance.
 */
const handleWebsocket = (wss) => {
  wss.on("connection", (ws) => {
    console.log("Client connected", Math.random().toFixed(3));

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
          console.log("Unknown type", type);
          break;
      }
    });
    /**
     * Handles the close event.
     * When a client disconnects, the references to the client are removed from the maps.
     */
    ws.on("close", () => {
      console.log("Client disconnected");
      userMessageCache.removeClient(ws);
    });
  });
};

module.exports = {
  handleWebsocket
};
