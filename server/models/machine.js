'use strict';
const {
  Model
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
      Machine.belongsTo(models.Status, { foreignKey: 'status_id' });
      Machine.hasMany(models.User, { foreignKey: 'user_id' });
    }
  }
  Machine.init({
    name: DataTypes.STRING,
    brand_id: DataTypes.INTEGER,
    power_input: DataTypes.INTEGER,
    stroke_axxis: DataTypes.STRING,
    spindel_rpm: DataTypes.STRING,
    status_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Machine',
  });
  return Machine;
};