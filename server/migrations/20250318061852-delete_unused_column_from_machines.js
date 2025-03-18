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
    await queryInterface.removeColumn('Machines', 'total_running_hours');

    await queryInterface.removeColumn('Machines', 'brand_id');

    await queryInterface.removeColumn('Machines', 'power_input');

    await queryInterface.removeColumn('Machines', 'stroke_axxis');

    await queryInterface.removeColumn('Machines', 'spindel_rpm');

  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
