'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('MachineLogs', 'next_projects', {
      type: Sequelize.JSONB,
      allowNull: false,
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
    });

    // change collumn next_projects in TransferFile to required default []
    await queryInterface.changeColumn('TransferFiles', 'next_projects', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidProjectsArray(value) {
          if (value !== null && value !== undefined) {
            if (!Array.isArray(value)) {
              throw new Error('Next projects must be an array');
            }
          }
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('MachineLogs', 'next_projects');
    await queryInterface.changeColumn('TransferFiles', 'next_projects', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: true,
    });
  }
};
