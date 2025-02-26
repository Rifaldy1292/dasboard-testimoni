const MachineWebsocket = require('./MachineWebsocket')
const clientPreferences = new Map()
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
        ws.on('message', async (msg) => {
            if (!JSON.parse(msg)) return console.log('Invalid format', msg)
            const { type, message, data } = JSON.parse(msg)
            console.log(type, message, data)
            if (!type) return console.log('Unknown format', message)
            switch (type) {
                case 'timeline':
                    /**
                     * Retrieves machine timelines.
                     */
                    if (data.date) {
                        clientPreferences.set(ws, data.date)
                    }

                    await MachineWebsocket.timelines(ws, data.date)
                    break
                case 'percentage':
                    /**
                     * Retrieves machine percentages.
                     */
                    await MachineWebsocket.percentages(ws)
                    break
                case 'cuttingTime':
                    await MachineWebsocket.cuttingTime(ws)
                    break
                case 'test': {
                    console.log('test')
                    break
                }
                case 'editLogDescription': {
                    await MachineWebsocket.editLogDescription(ws, data)
                    // refetch
                    // await MachineWebsocket.timelines(ws, clientPreferences.get(ws))
                    break
                }
                default:
                    console.log('Unknown type', type)
                    break
            }
        })
        ws.on('close', () => {
            console.log('Client disconnected')
            clientPreferences.delete(ws)
        })
    })
}

module.exports = { handleWebsocket, clientPreferences }
