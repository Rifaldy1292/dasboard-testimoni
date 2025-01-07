
require("dotenv").config();
'use strict';

const roles = [
    {
        id: process.env.ADMIN_ROLE_ID,
        name: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: process.env.ADMIN_OPERATOR_ID,
        name: 'Operator',
        createdAt: new Date(),
        updatedAt: new Date()
    },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkInsert('Roles', roles, {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Users', null, {});
    }
};
