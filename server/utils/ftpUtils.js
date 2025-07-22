const { exec } = require('child_process');
const { promisify } = require('util');
const { logInfo, logError } = require('./logger');

const execAsync = promisify(exec);

/**
 * Check if port is open/in use
 * @param {number|string} port - Port number to check
 * @returns {Promise<boolean>} - True if port is open, false otherwise
 */
async function isPortOpen(port) {
    try {
        const checkCommand = `lsof -ti:${port}`;
        const result = await execAsync(checkCommand);
        return result.stdout.trim().length > 0;
    } catch (error) {
        // If lsof returns error, it means no process is using the port
        return false;
    }
}

/**
 * Close FTP connection and forcefully kill the port
 * @param {Client} ftpClient - FTP client instance
 * @param {number|string} port - Port number to kill
 * @param {boolean} isMC3 - Whether this is MC3 connection
 * @returns {Promise<void>}
 */
async function closeConnection(ftpClient, port, isMC3 = false) {
    // Close FTP client connection
    if (!isMC3) {
        await ftpClient.close();
        logInfo(`FTP client connection closed successfully`, "ftpUtils.closeConnection");
    }

    // Check if port is open before attempting to kill
    const portIsOpen = await isPortOpen(port);
    if (!portIsOpen) {
        logInfo(`Port ${port} is not in use, no need to kill processes`, "ftpUtils.closeConnection");
        return;
    }

    try {
        // Force kill processes using the port
        const killCommand = `lsof -ti:${port} | xargs -r kill -9`;
        await execAsync(killCommand);
        logInfo(`Port ${port} processes killed successfully`, "ftpUtils.closeConnection");
    } catch (error) {
        // If no processes found on port, this is not an error
        if (!error.message.includes('No such process')) {
            logError(error, `Error killing port ${port}: ${error.message}`);
        }
    }
}

module.exports = {
    closeConnection,
    isPortOpen
};
