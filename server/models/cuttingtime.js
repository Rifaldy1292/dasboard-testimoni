'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CuttingTime extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CuttingTime.init({
    machine_id: DataTypes.INTEGER,
    period: { // period represents the month and year, e.g. 2020-01
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    target: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 600
    }
  }, {
    sequelize,
    modelName: 'CuttingTime',
  });

  // unique period
  CuttingTime.beforeCreate(async (cuttingTime, options) => {
    // console.log('from validate', cuttingTime, 777777)
    const existCuttingTime = await CuttingTime.findOne({ where: { period: cuttingTime.period }, attributes: ['period'] });
    if (existCuttingTime) {
      throw new Error('Cutting time for this month already exists');
    }
  });
  return CuttingTime;
};