const roleRouter = require("express").Router();
const { ADMIN_ROLE_ID } = require("../config/config.env");
const RoleController = require("../controllers/RoleController");
const authMiddleware = require("../middlewares/auth");
const roleMiddleware = require("../middlewares/role");

roleRouter.get(
    "/",
    authMiddleware,
    roleMiddleware.allowRoleId(ADMIN_ROLE_ID),
    RoleController.getAll
);

module.exports = roleRouter;