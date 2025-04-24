'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MachineOperatorAssignment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // has one machine
      MachineOperatorAssignment.hasOne(models.Machine, { foreignKey: 'machine_id' });
    }
  }
  MachineOperatorAssignment.init({
    machine_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    is_using_custom: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    is_work: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'MachineOperatorAssignment',
  });

  // uniq
  MachineOperatorAssignment.beforeCreate(async (machineOperatorAssignment, options) => {
    const { machine_id, user_id } = machineOperatorAssignment;
    if (!machine_id || !user_id) {
      throw new Error('machine_id and user_id are required');
    }
    const existingAssignment = await MachineOperatorAssignment.findOne({
      where: {
        machine_id
      },
      attributes: ['id']
    })

    if (existingAssignment) {
      throw new Error('Machine already has an assignment');
    }
  })

  return MachineOperatorAssignment;
};