const RemainingController = require("../controllers/RemainingController");
const MachineWebsocket = require("./MachineWebsocket");
const clientPreferences = new Map();
const messageTypeWebsocketClient = new Map();
/**
 * Handles WebSocket connections and messages, providing endpoints for retrieving
 * machine timelines and percentages.
 *
 * @param {WebSocket.Server} wss - The WebSocket server instance.
 */
const handleWebsocket = (wss) => {
  wss.on("connection", (ws) => {
    console.log("Client connected");

    /**
     * Handles incoming messages from clients.
     *
     * @param {string} message - The message received from the client.
     */
    ws.on("message", async (msg) => {
      /**
       * @typedef {Object} ParsedMessage
       * @property {'timeline' | 'percentage'} type - The message type
       * @property {{id?: number, date?: string}} data - Additional data
       */

      /** @type {ParsedMessage} */
      const parsedMessage = JSON.parse(msg);
      if (!parsedMessage) return console.log("Invalid format", msg);

      const { type, data } = parsedMessage;
      console.log(type, data);
      if (!type) return console.log("Unknown format", messageString);
      /**
       * Records the types of messages sent by the client.
       * @type {Set<string>}
       */
      if (!messageTypeWebsocketClient.has(ws)) {
        messageTypeWebsocketClient.set(ws, new Set());
      }
      /**
       * Adds the type of the message to the record.
       * @param {string} type - The type of message.
       */
      messageTypeWebsocketClient.get(ws).add(type);
      if (data?.date) {
        clientPreferences.set(ws, data.date);
      }
      // console.log(messageTypeWebsocketClient.get('percentage'), 111)
      // console.log(messageTypeWebsocketClient.get('timeline'), 111, 'timeline')
      // console.log(messageTypeWebsocketClient.get(ws).has('percentage'), 'bool')
      // console.log(messageTypeWebsocketClient.get(ws), 'getws')

      // await handleMessageType(type)
      switch (type) {
        case "timeline":
          /**
           * Retrieves machine timelines.
           */
          // console.log({ clientPreferences: clientPreferences.get(ws) }, 88888, 'form ws')
          await MachineWebsocket.timelines(
            ws,
            clientPreferences.get(ws),
            data?.id
          );
          break;
        case "percentage":
          /**
           * Retrieves machine percentages.
           */
          // await MachineWebsocket.percentages(ws, clientPreferences.get(ws));
          await MachineWebsocket.refactorPercentages(
            ws,
            clientPreferences.get(ws)
          );
          break;
        case "remaining":
          await RemainingController.getRemaining(ws);
        // case 'test': {
        //     console.log('test')
        //     break
        // }

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
      clientPreferences.delete(ws);
      messageTypeWebsocketClient.delete(ws);
    });
  });
};

// const handleMessageType = async (type) => {

// }

module.exports = {
  handleWebsocket,
  clientPreferences,
  messageTypeWebsocketClient,
};
