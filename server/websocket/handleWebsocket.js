const MachineWebsocket = require('./machine')
/**
 * Handles WebSocket connections and messages, providing endpoints for retrieving
 * machine timelines and percentages.
 *
 * @param {WebSocket.Server} wss - The WebSocket server instance.
 */
const handleWebsocket = (wss) => {
    wss.on('connection', (ws) => {
        console.log('Client connected');

        /**
         * Handles incoming messages from clients.
         *
         * @param {string} message - The message received from the client.
         */
        ws.on('message', async (message) => {
            const { type, message: messageType } = JSON.parse(message)
            console.log({ type, messageType })
            if (!type) return console.log('Unknown format', message)
            switch (type) {
                case 'timeline':
                    /**
                     * Retrieves machine timelines.
                     */
                    await MachineWebsocket.timelines(ws)
                    break
                case 'percentage':
                    /**
                     * Retrieves machine percentages.
                     */
                    await MachineWebsocket.percentages(ws)
                    break
                default:
                    console.log('Unknown type', type, messageType)
                    break
            }
        })
    })
}

module.exports = handleWebsocket
