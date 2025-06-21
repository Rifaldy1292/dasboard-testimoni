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
      // has one machine
      MachineOperatorAssignment.belongsTo(models.Machine, { foreignKey: 'machine_id' });
      MachineOperatorAssignment.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  MachineOperatorAssignment.init({
    machine_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Machines',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
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
      defaultValue: "Dandori tool",
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