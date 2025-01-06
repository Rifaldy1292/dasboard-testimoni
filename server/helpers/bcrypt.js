const { hash, compare } = require('bcrypt')
require('dotenv').config();

const saltRounds = +process.env.SALTROUNDS || 4

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