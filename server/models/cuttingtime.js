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
    },
    target_shift: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        green: 10,
        yellow: 8,
        red: 8
      },
      validate: {
        isValidTargetShift(value) {
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new Error('target_shift must be an object');
          }

          const requiredFields = ['green', 'yellow', 'red'];
          for (const field of requiredFields) {
            if (!value.hasOwnProperty(field)) {
              throw new Error(`target_shift must contain ${field} property`);
            }

            const fieldValue = value[field];
            if (typeof fieldValue !== 'number' || isNaN(fieldValue) || fieldValue < 1 || fieldValue > 100) {
              throw new Error(`target_shift.${field} must be a number between 1 and 100`);
            }
          }

          // Validate logical order
          if (value.green < value.yellow) {
            throw new Error('Green target must be greater than or equal to yellow target');
          }

          if (value.yellow < value.red) {
            throw new Error('Yellow target must be greater than or equal to red target');
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'CuttingTime',
  });

  // unique period
  CuttingTime.beforeCreate(async (cuttingTime, options) => {
    const existCuttingTime = await CuttingTime.findOne({ where: { period: cuttingTime.period }, attributes: ['period'] });
    if (existCuttingTime) {
      throw new Error('Cutting time for this month already exists');
    }
  });
  return CuttingTime;
};