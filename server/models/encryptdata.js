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
  EncryptData.beforeCreate(async (encryptData, options) => {
    const { original_text, key } = encryptData;
    // not allow if original_text and key is empty
    if (!original_text || !key) {
      throw new Error("original_text and key must be provided");
    }
    const existingEntry = await EncryptData.findOne({
      where: { original_text, key },
      attributes: ['id'],
      raw: true,
    });

    if (existingEntry) {
      throw new Error("Data with the same original_text and key already exists");
    }

  });

  return EncryptData;
};