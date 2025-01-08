const { hash, compare } = require('bcrypt');
const { SALTROUNDS } = require('../config/config.env');

const saltRounds = SALTROUNDS

const encryptPassword = async (data) => {
    const result = await hash(data, saltRounds)
    return result
}

const decryptPassword = async (data, hash) => {
    const result = await compare(data, hash)
    return result
}

module.exports = {
    encryptPassword
    , decryptPassword
}