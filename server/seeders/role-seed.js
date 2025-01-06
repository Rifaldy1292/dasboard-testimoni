
'use strict';
const roles = [
    {
        name: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
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
