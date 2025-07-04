'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TransferFile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TransferFile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  TransferFile.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    g_code_name: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'G-code name must be less than 255 characters'
        }
      }
    },
    k_num: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'K number must be less than 100 characters'
        }
      }
    },
    output_wp: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Output WP must be less than 255 characters'
        }
      }
    },
    tool_name: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Tool name must be less than 255 characters'
        }
      }
    },
    total_cutting_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: {
          msg: 'Total cutting time must be an integer'
        },
        min: {
          args: [0],
          msg: 'Total cutting time must be greater than or equal to 0'
        }
      }
    },
    calculate_total_cutting_time: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '0',
      validate: {
        len: {
          args: [0, 500],
          msg: 'Calculate total cutting time must be less than 500 characters'
        }
      }
    },
    next_projects: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidProjectsArray(value) {
          if (value !== null && value !== undefined) {
            // Harus array
            if (!Array.isArray(value)) {
              throw new Error('Next projects must be an array');
            }

            // Validasi setiap item dalam array
            value.length && value.forEach((project, index) => {
              if (typeof project !== 'object' || project === null) {
                throw new Error(`Project at index ${index} must be an object`);
              }


              const nextProjectKeyAllowed = ['user_id', 'k_num', 'g_code_name', 'tool_name', 'total_cutting_time', 'calculate_total_cutting_time', 'output_wp'];

              // All keys are required but values can be null

              // 1. Check if all required keys exist
              nextProjectKeyAllowed.forEach(requiredKey => {
                if (!project.hasOwnProperty(requiredKey)) {
                  console.log(project, 999)

                  throw new Error(`Missing required key '${requiredKey}' in project at index ${index}`);
                }
              });

              // 2. Check for extra keys not allowed
              Object.keys(project).forEach(key => {
                if (!nextProjectKeyAllowed.includes(key)) {
                  throw new Error(`Invalid key '${key}' in project at index ${index}. Allowed keys: ${nextProjectKeyAllowed.join(', ')}`);
                }
              });

              // 3. Validate each field value (can be null, but if not null must be valid)
              const validateUserId = typeof project.user_id === 'number' || project.user_id === null
              const validateGCodeName = typeof project.g_code_name === 'string' || project.g_code_name === null
              const validateToolName = typeof project.tool_name === 'string' || project.tool_name === null
              const validateTotalCuttingTime = typeof project.total_cutting_time === 'number' || project.total_cutting_time === null
              const validateCalculateTotalCuttingTime = typeof project.calculate_total_cutting_time === 'string' || project.calculate_total_cutting_time === null
              const validateOutputWp = typeof project.output_wp === 'string' || project.output_wp === null

              if (!validateUserId || !validateCalculateTotalCuttingTime || !validateOutputWp || !validateGCodeName || !validateToolName || !validateTotalCuttingTime) {
                throw new Error(`Missing field in project at index ${index}`);
              }


            })
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'TransferFile',
  });
  return TransferFile;
};