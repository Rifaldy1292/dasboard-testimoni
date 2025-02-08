const { percentages, timelines } = require('./machine')



/**
 *  @param wss {WebSocket.Server}
 *
 */
const handleWebsocket = (wss) => {
    wss.on('connection', (ws) => {
        console.log('Client connected');

        // msg = message
        ws.on('message', async (msg) => {
            const { type, message } = JSON.parse(msg)
            console.log({ type, message })
            if (!type) return console.log('Unknown format', msg)
            switch (type) {
                case 'timeline':
                    await timelines(ws)
                    break
                case 'percentage': {
                    await percentages(ws)
                    break
                }
                default:
                    console.log('Unknown type', type, message)
                    break
            }
        })
    })


}

module.exports = handleWebsocket