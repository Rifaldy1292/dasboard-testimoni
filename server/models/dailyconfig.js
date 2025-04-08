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
  return DailyConfig;
};