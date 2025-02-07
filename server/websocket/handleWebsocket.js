/**
 *  @param wss {WebSocket.Server}
 *
 */
export const handleWebsocket = (wss) => {
    wss.on('connection', async (ws) => {
        console.log('Client connected');

        // send default data(day)
        wss.clients.forEach(async (client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'timeline' }))
            }
        })

    })
};