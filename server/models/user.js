'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // User has one role
      User.belongsTo(models.Role, { foreignKey: 'role_id' });
    }
  }
  User.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        notNull: true,
        min: 3
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        notNull: true,
        min: 3
      }
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    NIK: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'NIK cannot be empty'
        },
        notNull: {
          msg: 'NIK cannot be null'
        },
        isNumeric: true,

      }
    },
    machine_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  User.beforeCreate(async (user, options) => {
    if (user.NIK.toString().length !== 9) {
      throw new Error('NIK must be 9 digits')
    }
    const existNIK = await User.findOne({ where: { NIK: user.NIK } });
    if (existNIK) {
      throw new Error('NIK already exists');
    }
  })
  return User;
};