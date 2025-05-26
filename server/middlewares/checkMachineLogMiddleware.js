const { MachineLog } = require("../models");
const { serverError } = require("../utils/serverError");
const { getShiftDateRange } = require("../utils/machineUtils");
const { Op } = require("sequelize");

/**
 * Middleware to check machine log for null description
 * If found, return error response and stop execution
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object  
 * @param {NextFunction} next - Express next function
 */
const checkMachineLogMiddleware = async (req, res, next) => {
    try {
        // Get machine_id from params, body, or query
        const machine_id = req.params.machine_id || req.body.machine_id || req.query.machine_id;

        if (!machine_id) {
            return res.status(400).json({
                status: 400,
                message: "machine_id is required",
            });
        }

        // Get current shift date range
        const { dateFrom, dateTo } = await getShiftDateRange(new Date(), 0);

        // Check for machine log with null description
        const machineLog = await MachineLog.findOne({
            where: {
                createdAt: {
                    [Op.between]: [dateFrom, dateTo],
                },
                machine_id,
                description: null,
                current_status: "Stopped",
            },
        });

        // If found machine log with null description, return error
        if (machineLog) {
            return res.status(422).json({
                status: 422,
                message: "Found machine log with null description. Please complete the description before proceeding.",
            });
        }

        // If no issues found, continue to next middleware/controller
        next();
    } catch (error) {
        if (error.message.includes("No daily config")) {
            return res.status(404).json({
                status: 404,
                message: error.message,
            });
        }
        serverError(error, res, "Failed to check machine log");
    }
};

module.exports = checkMachineLogMiddleware;