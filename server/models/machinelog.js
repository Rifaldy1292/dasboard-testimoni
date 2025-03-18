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
      MachineLog.belongsTo(models.User, { foreignKey: 'user_id' });

    }
  }
  MachineLog.init({
    machine_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    g_code_name: DataTypes.STRING,
    k_num: DataTypes.STRING,
    output_wp: DataTypes.STRING,
    total_cutting_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    calculate_total_cutting_time: {
      type: DataTypes.DECIMAL(8, 5),
      allowNull: false,
      defaultValue: 0
    },
    previous_status: DataTypes.STRING,
    current_status: DataTypes.STRING,
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