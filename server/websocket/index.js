import { percentage, totalHour } from '../utils/countHour'

const { Machine } = require('../models')
const perfectTime = 24 //hour

// runningHour = miliseconds
function getRunningHours(runningHour) {
    return percentage(runningHour, perfectTime)
}

function countDescription(totalRunningHours) {
    const count = totalHour(totalRunningHours)
    const hour = count.split('.')[0]
    const minute = count.split('.')[1]
    return `${hour} hour ${minute} minute / ${perfectTime} hour`
}

/**
 *  @param wss {WebSocket.Server}
 *
 */
export const handleWebsocket = (wss) => {
    wss.on('connection', async (ws) => {
        console.log('Client connected');
        try {
            // send default data(day)
            const machineCount = await Machine.count();
            wss.clients.forEach(async (client) => {
                if (client.readyState === WebSocket.OPEN && machineCount !== 0) {
                    const machines = await Machine.findAll({
                        attributes: ['name', 'status', 'total_running_hours']
                    });

                    const formattedMessage =
                        machines.map(machine => {
                            const runningTime = getRunningHours(machine.total_running_hours)
                            return {
                                name: machine.name,
                                status: machine.status,
                                percentage: [runningTime, 100 - runningTime],
                                description: countDescription(machine.total_running_hours),
                            }
                        })

                    client.send(JSON.stringify({ type: 'percentage', data: formattedMessage }));
                }
            });
        } catch (error) {

        }
        /**
     * param message {string}
     * 
     */

        // msg = message
        ws.on('message', async (msg, ws) => {
            const { type, message } = JSON.parse(msg)
            console.log({ type, message })
            if (!type) return console.log('Unknown type', type, message)
            switch (type) {
                case 'timeline':
                    console.log('from server timeline', message)
                    break
            }
        })
    })


}