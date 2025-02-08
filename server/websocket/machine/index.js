const { Op } = require('sequelize');
const { Machine, MachineLog } = require('../../models');
const { percentage, totalHour } = require('../../utils/countHour');

class MachineWebsocket {
    /**
     * 
     * @param {*} client = Webscoket client 
     * @returns 
     */
    static async timelines(client) {
        try {
            // ambil semua machine include machine log where timestamp hari ini
            const machines = await Machine.findAll({
                include: [{
                    model: MachineLog,
                    where: {
                        timestamp: {
                            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    },
                    order: [['timestamp', 'ASC']],
                    attributes: ['current_status', 'timestamp']
                },
                ],
                attributes: ['name', 'status']

            });

            const formattedMachines = machines.map(machine => {
                const logs = machine.MachineLogs.map(log => {
                    return {
                        current_status: log.current_status,
                        timestamp: convertDateTime(log.timestamp)
                    }
                })
                return {
                    name: machine.name,
                    status: machine.status,
                    MachineLogs: logs
                }
            }).sort((a, b) => {
                const numberA = parseInt(a.name.slice(3));
                const numberB = parseInt(b.name.slice(3));
                return numberA - numberB;
            })
            client.send(JSON.stringify({ type: 'timeline', data: formattedMachines }));
        } catch (e) {
            console.log({ e, message: e.message });
            client.send(JSON.stringify({ type: 'error', message: 'Failed to get timeline data' }));
        }
    }

    static async percentages(client) {
        try {
            const machines = await Machine.findAll({
                attributes: ['name', 'status', 'total_running_hours']
            });
            const formattedMessage =
                machines.map(machine => {
                    const runningTime = getRunningHours(machine.total_running_hours)
                    // const running = Math.floor(Math.random() * 100);
                    return {
                        name: machine.name,
                        status: machine.status,
                        // percentage: [runningTime, 100 - runningTime],
                        percentage: [runningTime, 100 - runningTime],
                        description: countDescription(machine.total_running_hours),
                    }
                }).sort((a, b) => {
                    const numberA = parseInt(a.name.slice(3))
                    const numberB = parseInt(b.name.slice(3))
                    return numberA - numberB
                })
            client.send(JSON.stringify({ type: 'percentage', data: formattedMessage }));
        } catch (e) {
            console.log({ e, message: e.message });
            client.send(JSON.stringify({ type: 'error', message: 'Failed to get percentage' }));
        }
    }
}

const perfectTime = 24 //hour


function convertDateTime(date) {
    const dateTime = new Date(date)
    const hours = dateTime.getHours()
    const minutes = dateTime.getMinutes()
    return `${hours}:${minutes.toString().padStart(2, '0')}`
}

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


module.exports = MachineWebsocket;