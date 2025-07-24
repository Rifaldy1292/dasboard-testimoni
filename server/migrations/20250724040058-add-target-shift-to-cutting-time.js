'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('CuttingTimes', 'target_shift', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {
        green: 10,
        yellow: 8,
        red: 8
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('CuttingTimes', 'target_shift');
  }
};
