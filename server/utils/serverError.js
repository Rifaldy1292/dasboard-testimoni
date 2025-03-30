

/**
 * Handle server error
 * @param {Error} error - error object
 * @param {Response} res - response http object
 * @param {string} description - message to be sent
 */
const serverError = (error, res, description) => {
    console.log({ error, stack: error.stack, description, message: error.message });
    if (res && description) return res.status(500).json({ status: 500, message: description });
}

module.exports = { serverError }