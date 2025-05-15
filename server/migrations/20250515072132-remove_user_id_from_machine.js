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
    await queryInterface.removeColumn('Machines', 'user_id');
    // delete machine_id from user
    await queryInterface.removeColumn('Users', 'machine_id');
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // add machine_id to user
    await queryInterface.addColumn('Users', 'machine_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Machines',
        key: 'id'
      }
    });
    await queryInterface.addColumn('Machines', 'user_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    });
  }
};
