

/**
 * Handle server error
 * @param {Error} error - error object
 * @param {Response} res - response http object
 * @param {string} message - message to be sent
 */
const serverError = (error, res, message) => {
    console.log({ error, message: error.message });
    if (res && message) return res.status(500).json({ status: 500, message });
}

module.exports = { serverError }