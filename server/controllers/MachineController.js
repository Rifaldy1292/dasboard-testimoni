const { Op } = require('sequelize');
const { Machine, MachineLog } = require('../models');
class MachineController {
    static async getAll(req, res) {
        try {
            // ambil semua machine include machine log dengan hari ini
            const machines = await Machine.findAll({
                include: [{
                    model: MachineLog,
                    where: {
                        timestamp: {
                            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    },
                    order: [['timestamp', 'ASC']]
                }],

            });
            return res.status(200).json({ message: 'succes get role list', data: machines, status: 200 });
        } catch (e) {
            console.log({ e, message: e.message });
            res.status(500).json({ message: 'Failed to get machines', status: 500 });
        }
    }
}

module.exports = MachineController;