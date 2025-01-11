const { tokenValidator } = require('../helpers/jsonwebtoken')
const { User } = require('../models')

const authMiddleware = async (req, res, next) => {
    try {
        // use bearer token
        const authHeader = req.header("Authorization");
        if (!authHeader) return res.status(401).json({ message: "Token not found", status: 401 });
        const token = authHeader.split(" ")[1];
        // console.log(token)
        if (!token) {
            return res.status(401).json({ message: "Token not found", status: 401 });
        }

        const decoded = tokenValidator(token); // Dekode token untuk mendapatkan informasi pengguna
        // cek user in db
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "User not found", status: 401 });
        }
        // console.log(user)
        req.user = decoded; // Menambahkan informasi pengguna yang didekodekan ke req.user
        // console.log('req.user', req.user)
        next(); // Lanjut ke middleware atau handler berikutnya
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            console.log(error.message)
            return res.status(401).json({ message: 'Invalid token', status: 401 });
        }
        return res.status(401).json({ message: error.message, status: 401 });
    }
}


module.exports = authMiddleware