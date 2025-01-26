const { OPERATOR_ROLE_ID, ADMIN_ROLE_ID, REVIEWER_ROLE_ID } = require("../config/config.env");
'use strict';


const users = [
    {
        id: Math.floor(Math.random() * 10),
        name: 'Jonfry',
        NIK: 123456789,
        password: "$2a$05$roVU0LDUfYqGviSFGtrLHOmaqVjyYo4zi/nkCrWnsPlJf5CK4JJri",
        role_id: +ADMIN_ROLE_ID,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: Math.floor(Math.random() * 10),
        name: 'Admin Yamaha',
        NIK: 111111111,
        password: "$2a$05$rDaZybe8wP7WWtV8eKTQfOejfubPSEhKmlzijstnP6pWy5xE6Z6T2",
        role_id: +ADMIN_ROLE_ID,
        createdAt: new Date(),
        updatedAt: new Date()
    },

];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkInsert('Users', users, {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Users', null, {});
    }
};
