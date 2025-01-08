const roleMiddleware = {
    allowRoleId: (role_id) => {
        return (req, res, next) => {
            if (req.user.role_id === role_id) {
                next();
            } else {
                res.status(403).json({ message: 'You are not allowed' });
            }
        }
    }
}

module.exports = roleMiddleware;