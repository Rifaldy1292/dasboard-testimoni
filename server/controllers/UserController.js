require('dotenv').config();
const path = require('path');
const { User, Role, Machine } = require('../models');
const { tokenGenerator } = require('../helpers/jsonwebtoken');
const { encryptPassword, decryptPassword } = require('../helpers/bcrypt');
const { OPERATOR_ROLE_ID } = require('../config/config.env');
const { serverError } = require('../utils/serverError');

class UserController {
    static async getAll(req, res) {
        try {
            const { role } = req.query;
            const whereCondition = {};
            if (role === 'Operator') {
                whereCondition.role_id = OPERATOR_ROLE_ID
            }
            const users = await User.findAll({
                where: whereCondition,
                include: [{
                    model: Role,
                    attributes: ['name']
                },
                {
                    model: Machine,
                    attributes: ['name']
                }],
                attributes: ['id', 'name', 'NIK', 'machine_id', 'profile_image', 'createdAt', 'updatedAt'],
                raw: true
            });
            // allowDelete = cannot delete yourself
            const formattedResult = users.map(user => {
                user.allowDelete = user.id !== req.user.id;
                user.roleName = user['Role.name'];
                user.machineName = user['Machines.name'];
                user.imageUrl = user.profile_image ? `${req.protocol}://${req.get('host')}/${user.profile_image}` : null;
                delete user['Role.name'];
                delete user['Machines.name'];
                delete user['profile_image'];
                return user;
            });
            res.status(200).json({ status: 200, message: 'success get user list', data: formattedResult });
        } catch (err) {
            serverError(err, res, 'Failed to get user list');
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
            serverError(error, res, 'Failed to register user');
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
            const { id, name, role_id, profile_image } = FoundNIK
            const imageUrl = profile_image ? `${req.protocol}://${req.get('host')}/${profile_image}` : null

            const token = tokenGenerator({ id, name, NIK: FoundNIK.NIK, role_id, role: FoundNIK.Role.name, imageUrl });
            res.status(200).json({ data: { token }, message: 'success login', status: 200 });
        } catch (error) {
            serverError(error, res, 'Login failed');
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.user;
            const user = await User.findByPk(id, {
                attributes: ['id', 'name', 'NIK', 'createdAt', 'updatedAt', 'profile_image'],
                raw: true
            });
            if (!user) {
                return res.status(404).json({ message: 'User not found', status: 404 });
            }
            user.imageUrl = user.profile_image ? `${req.protocol}://${req.get('host')}/${user.profile_image}` : null;
            delete user['profile_image'];
            res.status(200).json({ status: 200, message: 'success get user by id', data: user });
        } catch (err) {
            serverError(err, res, 'Failed to get user');
        }
    }

    static async getByNIK(req, res) {
        try {
            const { NIK } = req.params;
            const user = await User.findOne({
                where: { NIK },
                include: [{
                    model: Role,
                    attributes: ['name']
                }],
                attributes: ['id', 'name', 'NIK', 'createdAt', 'updatedAt'],
                raw: true
            });
            if (!user) {
                return res.status(404).json({ message: 'NIK not found', status: 404 });
            }
            user.role = user['Role.name'];
            delete user['Role.name'];
            res.status(200).json({ status: 200, message: 'success get user by NIK', data: user });
        } catch (err) {
            serverError(err, res, 'Failed to get user ');
        }
    }

    static async deleteById(req, res) {
        try {
            const id = +req.params.id;
            // cannot delete yourself
            if (id === req.user.id) {
                return res.status(403).json({ message: 'Forbidden', status: 403 });
            }
            const deletedCount = await User.destroy({
                where: {
                    id: id, // Primary key
                },
            });

            if (deletedCount === 0) {
                return res.status(404).json({ message: 'User not found', status: 404 });
            }
            res.status(200).json({ status: 200, message: 'success delete user ', deletedCount });
        } catch (err) {
            serverError(err, res, 'Failed to delete user');
        }
    }

    static async resetPassword(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found', status: 404 });
            }
            // generate token untuk reset password 30 mnt
            const token = tokenGenerator({ id: user.id, NIK: user.NIK, name: user.name }, '30m');
            res.status(200).json({ status: 200, message: 'success reset password', data: { token } });
        } catch (error) {
            serverError(error, res, 'Failed to reset password');
        }
    }

    static async checkToken(req, res) {
        try {
            res.status(200).json({ status: 200, message: 'success check token' });
        } catch (error) {
            serverError(error, res, 'Failed to check token');
        }
    }

    static async changePassword(req, res) {
        try {
            const { id } = req.user;
            const { password } = req.body;
            const hashedPassword = await encryptPassword(password, 10);
            const updatedCount = await User.update({
                password: hashedPassword
            }, {
                where: { id }
            });
            if (updatedCount[0] === 0) {
                return res.status(404).json({ message: 'User not found', status: 404 });
            }
            res.status(200).json({ status: 200, message: 'success update password', updatedCount });
        } catch (error) {
            serverError(error, res, 'Failed to change password');
        }
    }
    static async editProfile(req, res) {
        try {
            const { id } = req.user;
            const name = req.body.name

            if (!req.file) {
                const updatedCount = await User.update({
                    name: name
                }, {
                    where: { id }
                })
                if (updatedCount[0] === 0) {
                    return res.status(404).json({ message: 'User not found', status: 404 });
                }
                return res.status(200).json({ status: 200, message: 'success update profile' });
            }

            const fileName = `${id}_${name}_profile${path.extname(req.file.originalname)}`

            // Construct the relative path for the uploaded image.
            const relativeImagePath = `uploads/${fileName}`;

            // Construct the base URL of the application.
            const baseUrl = `${req.protocol}://${req.get('host')}`;

            // Construct the full image URL by combining the base URL and relative path.
            const imageUrl = `${baseUrl}/${relativeImagePath}`;


            // Update the user's profile information in the database, including the new relative image path.
            const updatedCount = await User.update({
                name: req.body.name, // Update the user's name from the request body.
                profile_image: relativeImagePath // Store the relative image path in the database.
            }, {
                where: { id } // Update the user with the matching ID.
            });

            // Check if the user was found and updated.
            if (updatedCount[0] === 0) {
                return res.status(404).json({ message: 'User not found', status: 404 });
            }

            // Send a success response with the updated image URL.
            res.status(200).json({
                status: 200,
                message: 'Successfully updated profile',
                data: {
                    imageUrl // Send the full image URL in the response.
                }
            });

        } catch (error) {
            serverError(error, res, 'Failed to edit profile');
        }
    }

}

module.exports = UserController