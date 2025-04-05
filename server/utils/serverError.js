

/**
 * Handle server error
 * @param {Error} error - error object
 * @param {Response | null | undefined} res - response http object
 * @param {string | undefined} description - message to be sent
 */
const serverError = (error, res, description) => {
    console.log({ error, stack: error.stack, description, message: error.message });
    if (res && typeof res !== 'string' && description) return res.status(500).json({ status: 500, message: description });
}

module.exports = { serverError }