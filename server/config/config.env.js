require('dotenv').config()

const { PORT, SALTROUNDS, JWT_SECRET_CODE, ADMIN_ROLE_ID,
    OPERATOR_ROLE_ID,
    REVIEWER_ROLE_ID } = process.env

module.exports = {
    PORT,
    SALTROUNDS,
    JWT_SECRET_CODE,
    ADMIN_ROLE_ID,
    OPERATOR_ROLE_ID,
    REVIEWER_ROLE_ID,
}