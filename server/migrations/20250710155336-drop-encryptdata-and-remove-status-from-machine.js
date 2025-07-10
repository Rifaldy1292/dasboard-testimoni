'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Drop table EncryptData
        await queryInterface.dropTable('EncryptData');

        // Remove status column from Machines table
        await queryInterface.removeColumn('Machines', 'status');
    },

    async down(queryInterface, Sequelize) {
        // Recreate EncryptData table
        await queryInterface.createTable('EncryptData', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            encrypt_number: {
                type: Sequelize.INTEGER
            },
            original_text: {
                type: Sequelize.STRING
            },
            key: {
                type: Sequelize.STRING
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Add back status column to Machines table
        await queryInterface.addColumn('Machines', 'status', {
            type: Sequelize.STRING,
            allowNull: true
        });
    }
}; 