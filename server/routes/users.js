const userRouter = require("express").Router();
const { ADMIN_ROLE_ID } = require("../config/config.env");
const UserController = require("../controllers/UserController");
const authMiddleware = require("../middlewares/auth");
const roleMiddleware = require("../middlewares/role");

userRouter.get(
    "/",
    authMiddleware,
    roleMiddleware.allowRoleId(ADMIN_ROLE_ID),
    UserController.getAll
);

// find user by NIK
userRouter.get("/:NIK", UserController.getByNIK);


userRouter.post("/register", UserController.register);
userRouter.post("/login", UserController.login);
module.exports = userRouter;