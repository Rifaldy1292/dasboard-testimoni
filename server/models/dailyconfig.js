'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DailyConfig extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DailyConfig.init({
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      primaryKey: true,

    },
    startFirstShift: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    startSecondShift: {
      type: DataTypes.TIME,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'DailyConfig',
  });

  DailyConfig.beforeCreate(async (dailyConfig, options) => {
    const { startFirstShift, startSecondShift, date } = dailyConfig;
    // console.log({ dailyConfig })
    // Konversi string waktu ke menit untuk perbandingan yang akurat
    const [firstHour, firstMinute] = startFirstShift.split(':').map(Number);
    const [secondHour, secondMinute] = startSecondShift.split(':').map(Number);

    const firstTimeInMinutes = firstHour * 60 + firstMinute;
    const secondTimeInMinutes = secondHour * 60 + secondMinute;

    if (firstTimeInMinutes >= secondTimeInMinutes) {
      throw new Error('Start time of first shift must be less than start time of second shift');
    }

    // unique constraint on date
    const existingDailyConfig = await DailyConfig.findOne({
      where: {
        date,
      }, attributes: ['date']
    });
    if (existingDailyConfig) {
      throw new Error('Daily config already exists for this date');
    }
  });

  return DailyConfig;
};