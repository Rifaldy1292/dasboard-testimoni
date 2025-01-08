require('dotenv').config();
const QA_ID = +process.env.QA_ROLE_ID || 1
const DEV_ID = +process.env.DEV_ROLE_ID || 2


const checkRoleQA = (req, res, next) => {
    try {
        const role = req.user.role_id
        if (role === QA_ID) {
            next();
        }
        else {
            return res.status(403).json({ message: 'Access denied', role });
        }
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}
const checkRoleDev = (req, res, next) => {
    try {
        const role = req.user.role_id
        if (role === DEV_ID) {
            next();
        }
        else {
            return res.status(403).json({ message: 'Access denied', role });
        }
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}

module.exports = { checkRoleQA, checkRoleDev }