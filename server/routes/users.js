const userRouter = require("express").Router();
const { ADMIN_ROLE_ID } = require("../config/config.env");
const RemainingController = require("../controllers/RemainingController");
const { changePassword, checkToken, deleteById, editProfile, getAll, getByNIK, login, register, resetPassword, getById } = require("../controllers/UserController")
const authMiddleware = require("../middlewares/auth");
const upload = require("../middlewares/multer");
const { allowRoleId } = require("../middlewares/role");

userRouter.get(
    "/",
    authMiddleware,
    // allowRoleId(ADMIN_ROLE_ID),
    getAll
);

// delete user by id
userRouter.delete("/:id", authMiddleware, allowRoleId(ADMIN_ROLE_ID), deleteById);

// find user by NIK
userRouter.get("/find/:NIK", getByNIK);
userRouter.get("/find",
    authMiddleware,
    getById);

userRouter.post("/register", register);
userRouter.post("/login", login);

userRouter.get("/reset-password/:id", resetPassword);
userRouter.get('/check-token', authMiddleware, checkToken);
userRouter.patch('/change-password', authMiddleware, changePassword);

userRouter.patch('/edit-profile',
    authMiddleware,
    upload.single('profilePicture'),
    editProfile);

userRouter.get('/remaining', authMiddleware, RemainingController.getRemaining);
userRouter.patch('/remaining', authMiddleware, RemainingController.editOperatorInMachine);

module.exports = userRouter;