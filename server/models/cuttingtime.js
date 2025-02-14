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
    target: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 600
    }
  }, {
    sequelize,
    modelName: 'CuttingTime',
  });
  return CuttingTime;
};