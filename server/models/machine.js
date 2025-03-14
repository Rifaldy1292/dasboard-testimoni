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
      Machine.belongsTo(models.Brand, { foreignKey: 'brand_id' });
      Machine.hasMany(models.MachineLog, { foreignKey: 'machine_id' });
      Machine.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  Machine.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    total_running_hours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: false
    },
    brand_id: DataTypes.INTEGER,
    power_input: DataTypes.INTEGER,
    stroke_axxis: DataTypes.STRING,
    spindel_rpm: DataTypes.STRING,
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },

    user_id: DataTypes.INTEGER
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
  })
  Machine.beforeBulkCreate(async (machines, options) => {
    const existingMachines = await Machine.findAll({
      where: {
        name: {
          [Op.in]: machines.map(machine => machine.name)
        }
      }
    });
    if (existingMachines.length > 0) {
      throw new Error('Machine name already exists');
    }
  })

  return Machine;
};