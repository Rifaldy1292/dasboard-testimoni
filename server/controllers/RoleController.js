const { Role } = require('../models');

class RoleController {
    async getAll(req, res) {
        try {
            const roles = await Role.findAll();
            return res.status(200).json({ message: 'succes get role list', data: roles, status: 200 });
        } catch (e) {
            res.status(500).json({ message: e.message, status: 500 });
        }
    }
}

module.exports = new RoleController();