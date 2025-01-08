
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
        id: process.env.OPERATOR_ROLE_ID,
        name: 'Operator',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: process.env.REVIEWER_ROLE_ID,
        name: 'Reviewer',
        createdAt: new Date(),
        updatedAt: new Date()
    }
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
