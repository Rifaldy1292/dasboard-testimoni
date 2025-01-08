require('dotenv').config();
const { User, Role, Machine } = require('../models');
const { tokenGenerator } = require('../helpers/jsonwebtoken');
const { encryptPassword, decryptPassword } = require('../helpers/bcrypt');
class UserController {
    static async getAll(req, res) {
        try {
            const users = await User.findAll({
                include: [{
                    model: Role,
                    attributes: ['name']
                },
                {
                    model: Machine,
                    attributes: ['name']
                }],
                attributes: ['id', 'name', 'NIK', 'machine_id', 'createdAt', 'updatedAt'],
                raw: true
            });
            const formattedResult = users.map(user => {
                user.roleName = user['Role.name'];
                user.machineName = user['Machines.name'];
                delete user['Role.name'];
                delete user['Machines.name'];
                return user;
            });
            res.status(200).json({ status: 200, message: 'success get user list', data: formattedResult });
        } catch (err) {
            res.status(500).json({ message: err.message, status: 500 });
        }
    }
    static async register(req, res) {
        try {
            const { name, NIK, role_id, password } = req.body;

            // hash setelah password di validasi
            const hashedPassword = await encryptPassword(password, 10);

            await User.create({
                name,
                NIK,
                role_id: role_id || process.env.OPERATOR_ROLE_ID,
                password: hashedPassword
            });
            res.status(201).json({ status: 201, message: 'success register' });
        } catch (error) {
            if (error.name === 'SequelizeValidationError') {
                const message = error.errors.map((err) => err.message);
                return res.status(400).json({ message, status: 400 });

            }
            if (error.message === 'NIK already exists') {
                return res.status(400).json({ message: error.message, status: 400 });
            }
            res.status(500).json({ message: error.message, status: 500 });
        }
    }
    static async login(req, res) {
        try {
            const { NIK, password } = req.body;
            // Custom validation for length NIK

            const FoundNIK = await User.findOne({
                where: { NIK }, include: [{
                    model: Role,
                    attributes: ['name'],
                }],
            });
            if (!FoundNIK) {
                return res.status(401).json({ message: ' NIK not found', status: 401 });
            }
            const matchPassword = await decryptPassword(password, FoundNIK.password);
            if (!matchPassword) {
                return res.status(401).json({ message: 'Wrong password', status: 401 });
            }
            const { id, name, role_id } = FoundNIK
            const token = tokenGenerator({ id, name, NIK: FoundNIK.NIK, role_id, role: FoundNIK.Role.name });
            res.status(200).json({ data: { token }, message: 'success login', status: 200 });
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: error.message, status: 500 });
        }
    }

}

module.exports = UserController