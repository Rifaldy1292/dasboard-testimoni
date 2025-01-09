const jwt = require('jsonwebtoken');
const { JWT_SECRET_CODE } = require('../config/config.env');

const secret = JWT_SECRET_CODE

const tokenGenerator = (payload, expiresIn) => {
    if (!expiresIn) {
        return jwt.sign(payload, secret);
    }
    return jwt.sign(payload, secret, { expiresIn });
}

const tokenValidator = (token) => {
    return jwt.verify(token, secret);
}

module.exports = { tokenGenerator, tokenValidator }
