require('dotenv').config()

const { PORT, SALTROUNDS, JWT_SECRET_CODE, ADMIN_ROLE_ID,
    OPERATOR_ROLE_ID,
    REVIEWER_ROLE_ID } = process.env

// '+' is used to convert string to number
module.exports = {
    PORT: +PORT,
    SALTROUNDS: +SALTROUNDS,
    JWT_SECRET_CODE,
    ADMIN_ROLE_ID: +ADMIN_ROLE_ID,
    OPERATOR_ROLE_ID: +OPERATOR_ROLE_ID,
    REVIEWER_ROLE_ID: +REVIEWER_ROLE_ID,
}