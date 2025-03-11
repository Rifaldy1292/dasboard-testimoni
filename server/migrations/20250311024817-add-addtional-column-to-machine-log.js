'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('MachineLogs', 'user_id', {
      type: Sequelize.INTEGER,
    });

    await queryInterface.addColumn('MachineLogs', 'g_code_name', {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn('MachineLogs', 'k_num', {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn('MachineLogs', 'output_wp', {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn('MachineLogs', 'total_cutting_time', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('MachineLogs', 'user_id');
    await queryInterface.removeColumn('MachineLogs', 'g_code_name');
    await queryInterface.removeColumn('MachineLogs', 'k_num');
    await queryInterface.removeColumn('MachineLogs', 'output_wp');
    await queryInterface.removeColumn('MachineLogs', 'total_cutting_time');
  }
};
