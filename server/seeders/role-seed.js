const { OPERATOR_ROLE_ID, ADMIN_ROLE_ID, REVIEWER_ROLE_ID } = require("../config/config.env");
'use strict';

const roles = [
    {
        id: ADMIN_ROLE_ID,
        name: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: OPERATOR_ROLE_ID,
        name: 'Operator',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: REVIEWER_ROLE_ID,
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
