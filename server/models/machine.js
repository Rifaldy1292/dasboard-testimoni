'use strict';
const {
  Model,
  Op
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Machine extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Machine.hasMany(models.MachineLog, { foreignKey: 'machine_id' });
      Machine.hasOne(models.MachineOperatorAssignment, { foreignKey: 'machine_id' });
    }
  }
  Machine.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'Machine',
  });

  // unique name machine
  Machine.beforeCreate(async (machine, options) => {
    const existingMachine = await Machine.findOne({
      where: {
        name: machine.name
      },
      attributes: ['id']
    });
    if (existingMachine) {
      throw new Error('Machine name already exists');
    }
  });

  return Machine;
};