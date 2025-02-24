'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('MachineLogs', 'description', {
      type: Sequelize.STRING,
      allowNull: true, // Bisa diubah sesuai kebutuhan
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('MachineLogs', 'description');
  }
};
