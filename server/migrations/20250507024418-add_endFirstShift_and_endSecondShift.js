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
    // ERROR: column "endFirstShift" of relation "DailyConfigs" already exists
    await queryInterface.removeColumn('DailyConfigs', 'endFirstShift');
    await queryInterface.addColumn('DailyConfigs', 'endFirstShift', {
      type: Sequelize.TIME,
      allowNull: false,
      defaultValue: '16:00:00',
    });

    await queryInterface.addColumn('DailyConfigs', 'endSecondShift', {
      type: Sequelize.TIME,
      allowNull: false,
      defaultValue: '05:59:00',
    });
  },


  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('DailyConfigs', 'endFirstShift');
    await queryInterface.removeColumn('DailyConfigs', 'endSecondShift');
  }
};
