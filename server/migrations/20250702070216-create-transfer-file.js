'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TransferFiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      g_code_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      k_num: {
        type: Sequelize.STRING,
        allowNull: true
      },
      output_wp: {
        type: Sequelize.STRING,
        allowNull: true
      },
      tool_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      total_cutting_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      calculate_total_cutting_time: {
        type: Sequelize.STRING,
        allowNull: true
      },
      next_projects: {
        type: Sequelize.JSONB,
        allowNull: true
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TransferFiles');
  }
};