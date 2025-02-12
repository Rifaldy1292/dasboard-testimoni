'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MachineLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      MachineLog.belongsTo(models.Machine, { foreignKey: 'machine_id' });
    }
  }
  MachineLog.init({
    machine_id: DataTypes.INTEGER,
    previous_status: DataTypes.STRING,
    current_status: DataTypes.STRING,
    timestamp: DataTypes.DATE,
    running_today: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'MachineLog',
  });
  return MachineLog;
};