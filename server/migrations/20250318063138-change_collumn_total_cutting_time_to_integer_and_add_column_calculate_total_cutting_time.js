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



    // 1. Tambahkan kolom baru dengan tipe INTEGER
    await queryInterface.addColumn('MachineLogs', 'temp_total_cutting_time', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // 2. Update nilai yang valid dari STRING ke INTEGER
    await queryInterface.sequelize.query(`
      UPDATE "MachineLogs"
      SET "temp_total_cutting_time" = CAST("total_cutting_time" AS INTEGER)
      WHERE "total_cutting_time" ~ '^-?\\d+$'
    `);

    // 3. Hapus kolom lama
    await queryInterface.removeColumn('MachineLogs', 'total_cutting_time');

    // 4. Ubah nama kolom baru agar sesuai dengan kolom lama
    await queryInterface.renameColumn('MachineLogs', 'temp_total_cutting_time', 'total_cutting_time');

    // 5. Tambahkan kolom baru lainnya (jika dibutuhkan)
    await queryInterface.addColumn('MachineLogs', 'calculate_total_cutting_time', {
      type: Sequelize.DECIMAL(8, 5),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('MachineLogs', 'calculate_total_cutting_time');

    // Kembalikan ke STRING jika rollback dilakukan
    await queryInterface.changeColumn('MachineLogs', 'total_cutting_time', {
      type: Sequelize.STRING,
    }
    );

  }
};
