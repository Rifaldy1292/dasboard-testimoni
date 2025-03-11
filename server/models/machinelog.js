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
    user_id: DataTypes.INTEGER,
    g_code_name: DataTypes.STRING,
    k_num: DataTypes.STRING,
    output_wp: DataTypes.STRING,
    total_cutting_time: DataTypes.STRING,
    previous_status: DataTypes.STRING,
    current_status: DataTypes.STRING,
    timestamp: DataTypes.DATE,
    description: DataTypes.STRING,
    running_today: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'MachineLog',
  });

  // MachineLog.beforeCreate(async (machineLog, options) => {
  //   console.log({ machineLog: machineLog.running_today }, 'koko', machineLog)
  // })
  return MachineLog;
};