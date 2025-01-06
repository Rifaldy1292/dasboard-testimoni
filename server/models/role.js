'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // role has many users
      Role.hasMany(models.User, { foreignKey: 'role_id' });
    }
  }
  Role.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        notNull: true,
        min: 3
      }
    }
  }, {
    sequelize,
    modelName: 'Role',
  });
  return Role;
};