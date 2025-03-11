'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EncryptData extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  EncryptData.init({
    encrypt_number: DataTypes.INTEGER,
    original_text: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'EncryptData',
  });
  return EncryptData;
};