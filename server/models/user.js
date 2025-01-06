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
    nik: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        isNumeric: true,
        max: 9,
        min: 9
      }
    },
    machine_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};