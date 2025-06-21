'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // type key is enum ('g_code_name' | 'k_num' | 'output_wp | 'tool_name' )
    await queryInterface.addColumn('EncryptData', 'key', {
      type: Sequelize.ENUM('g_code_name', 'k_num', 'output_wp', 'tool_name'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('EncryptData', 'key');
  }
};
