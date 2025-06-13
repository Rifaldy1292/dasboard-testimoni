const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Custom console format with full line coloring
const consoleFormat = winston.format.combine(
    winston.format.timestamp({
        format: () => new Date().toLocaleString('id-ID', { hour12: false })
    }),
    winston.format.printf(({ level, message, timestamp }) => {
        // Create colored text based on log level
        const colors = {
            error: "\x1b[31m", // Red
            warn: "\x1b[33m",  // Yellow
            info: "\x1b[32m",  // Green
            debug: "\x1b[36m", // Cyan
            reset: "\x1b[0m"   // Reset color
        };

        // Get the color based on log level or default to reset
        const color = colors[level] || colors.reset;

        // Return the colored text (entire line)
        return `${color}${level} - ${timestamp} - ${message}${colors.reset}`;
    })
);

// Custom file format with the desired order: level - timestamp - message
const customFileFormat = winston.format.combine(
    winston.format.timestamp({
        format: () => new Date().toLocaleString('id-ID', { hour12: false })
    }),
    winston.format.printf(({ level, message, timestamp }) => {
        // Return the formatted text in the requested order
        return `${level} - ${timestamp} - ${message}`;
    })
);

// JSON format for specific log files (error.log and info.log)
const jsonFileFormat = winston.format.combine(
    winston.format.timestamp({
        format: () => new Date().toLocaleString('id-ID', { hour12: false })
    }),
    winston.format.json()
);

// Create Winston logger with custom formats
const logger = winston.createLogger({
    level: 'info',
    transports: [
        // Error logs (JSON format)
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            format: jsonFileFormat
        }),

        // Info logs (JSON format)
        new winston.transports.File({
            filename: path.join(logDir, 'info.log'),
            level: 'info',
            format: jsonFileFormat
        }),

        // Combined logs with custom format (level - timestamp - message)
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            format: customFileFormat
        }),

        // Console output with full color
        new winston.transports.Console({
            format: consoleFormat
        })
    ],
});

const machineLogger = winston.createLogger({
    level: 'info',
    transports: [
        // Error logs (JSON format)
        new winston.transports.File({
            filename: path.join(logDir, 'error_machine.log'),
            level: 'error',
            format: jsonFileFormat
        }),

        // Info logs (JSON format)
        new winston.transports.File({
            filename: path.join(logDir, 'info_machine.log'),
            level: 'info',
            format: jsonFileFormat
        }),

        // Combined logs with custom format (level - timestamp - message)
        new winston.transports.File({
            filename: path.join(logDir, 'combined_machine.log'),
            format: customFileFormat
        }),

        // Console output with full color
        new winston.transports.Console({
            format: consoleFormat
        })
    ],
});


/**
 * Enhanced error logger that simplifies error logging by accepting an error object and context
 *
 * @param {Error} error - The error object to log
 * @param {string} context - Context where the error occurred
 * @param {object} [additionalData={}] - Optional additional data to include in the log
 */
const machineLoggerError = (error, context, additionalData = {}) => {
    machineLogger.error({
        message: `Error in ${context}: ${error.message}`,
        stack: error.stack,
        context,
        ...additionalData
    });
};

/**
 * Enhanced info logger that automatically adds context
 * 
 * @param {string} message - The info message to log
 * @param {string} context - Context for this info message
 * @param {object} [additionalData={}] - Optional additional data to include
 */
const machineLoggerInfo = (message, context, additionalData = {}) => {
    if (typeof additionalData === 'object' && Object.keys(additionalData).length > 0) {
        machineLogger.info({
            message: `[${context}] ${message}`,
            context,
            ...additionalData
        });
    } else {
        machineLogger.info(`[${context}] ${message}`);
    }
};

/**
 * Enhanced warning logger that automatically adds context
 * 
 * @param {string} message - The warning message to log
 * @param {string} context - Context for this warning
 * @param {object} [additionalData={}] - Optional additional data to include
 */
const machineLoggerWarn = (message, context, additionalData = {}) => {
    if (typeof additionalData === 'object' && Object.keys(additionalData).length > 0) {
        machineLogger.warn({
            message: `[${context}] ${message}`,
            context,
            ...additionalData
        });
    } else {
        machineLogger.warn(`[${context}] ${message}`);
    }
};



/**
 * Enhanced error logger that simplifies error logging by accepting an error object and context
 *
 * @param {Error} error - The error object to log
 * @param {string} context - Context where the error occurred
 * @param {object} [additionalData={}] - Optional additional data to include in the log
 */
const logError = (error, context, additionalData = {}) => {
    logger.error({
        message: `Error in ${context}: ${error.message}`,
        stack: error.stack,
        context,
        ...additionalData
    });
};

/**
 * Enhanced info logger that automatically adds context
 * 
 * @param {string} message - The info message to log
 * @param {string} context - Context for this info message
 * @param {object} [additionalData={}] - Optional additional data to include
 */
const logInfo = (message, context, additionalData = {}) => {
    if (typeof additionalData === 'object' && Object.keys(additionalData).length > 0) {
        logger.info({
            message: `[${context}] ${message}`,
            context,
            ...additionalData
        });
    } else {
        logger.info(`[${context}] ${message}`);
    }
};

/**
 * Enhanced warning logger that automatically adds context
 * 
 * @param {string} message - The warning message to log
 * @param {string} context - Context for this warning
 * @param {object} [additionalData={}] - Optional additional data to include
 */
const logWarn = (message, context, additionalData = {}) => {
    if (typeof additionalData === 'object' && Object.keys(additionalData).length > 0) {
        logger.warn({
            message: `[${context}] ${message}`,
            context,
            ...additionalData
        });
    } else {
        logger.warn(`[${context}] ${message}`);
    }
};

/**
 * Enhanced debug logger that automatically adds context
 * 
 * @param {any} message - The debug message or object to log
 * @param {string} context - Context for this debug message
 * @param {object} [additionalData={}] - Optional additional data to include
 */
const logDebug = (message, context, additionalData = {}) => {
    if (typeof additionalData === 'object' && Object.keys(additionalData).length > 0) {
        logger.debug({
            message: `[${context}] ${typeof message === 'object' ? JSON.stringify(message) : message}`,
            context,
            ...additionalData
        });
    } else {
        logger.debug(`[${context}] ${typeof message === 'object' ? JSON.stringify(message) : message}`);
    }
};

/**
 * Enhanced debug logger for machine-specific operations
 * 
 * @param {any} message - The debug message or object to log
 * @param {string} context - Context for this debug message
 * @param {object} [additionalData={}] - Optional additional data to include
 */
const machineLoggerDebug = (message, context, additionalData = {}) => {
    if (typeof additionalData === 'object' && Object.keys(additionalData).length > 0) {
        machineLogger.debug({
            message: `[${context}] ${typeof message === 'object' ? JSON.stringify(message) : message}`,
            context,
            ...additionalData
        });
    } else {
        machineLogger.debug(`[${context}] ${typeof message === 'object' ? JSON.stringify(message) : message}`);
    }
};

module.exports = {
    logError,
    logInfo,
    logWarn,
    logDebug,
    machineLoggerDebug,
    machineLoggerError,
    machineLoggerInfo,
    machineLoggerWarn
};
