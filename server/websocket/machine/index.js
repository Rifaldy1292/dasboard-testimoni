const { Op } = require('sequelize');
const { Machine, MachineLog } = require('../models');

function convertDateTime(date) {
    const dateTime = new Date(date)
    const hours = dateTime.getHours()
    const minutes = dateTime.getMinutes()
    return `${hours}:${minutes.toString().padStart(2, '0')}`
}

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
            })

            const sortedMachines = formattedMachines.sort((a, b) => {
                const numberA = parseInt(a.name.slice(3));
                const numberB = parseInt(b.name.slice(3));
                return numberA - numberB;
            })

            client.send(JSON.stringify({ type: 'timeline', data: sortedMachines }));
        } catch (e) {
            console.log({ e, message: e.message });
            client.send(JSON.stringify({ type: 'error', message: 'Failed to get timeline' }));
        }
    }
}

module.exports = MachineWebsocket;