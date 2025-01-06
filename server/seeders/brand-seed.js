
'use strict';
const brands = [
    {
        name: 'Google',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Twitter',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Github',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Facebook',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkInsert('Brands', brands, {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Users', null, {});
    }
};
