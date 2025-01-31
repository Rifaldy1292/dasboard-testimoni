const userRouter = require("express").Router();
const { ADMIN_ROLE_ID, FOLDER_UPLOAD } = require("../config/config.env");
const { changePassword, checkToken, deleteById, editProfile, getAll, getByNIK, login, register, resetPassword } = require("../controllers/UserController")
const authMiddleware = require("../middlewares/auth");
const upload = require("../middlewares/multer");
const { allowRoleId } = require("../middlewares/role");


userRouter.patch('/edit-profile',
    authMiddleware,
    upload.single('profilePicture'),
    editProfile);

userRouter.get(
    "/",
    authMiddleware,
    allowRoleId(ADMIN_ROLE_ID),
    getAll
);

// delete user by id
userRouter.delete("/:id", authMiddleware, allowRoleId(ADMIN_ROLE_ID), deleteById);

// find user by NIK
userRouter.get("/find/:NIK", getByNIK);

userRouter.post("/register", register);
userRouter.post("/login", login);

userRouter.get("/reset-password/:id", resetPassword);
userRouter.get('/check-token', authMiddleware, checkToken);
userRouter.patch('/change-password', authMiddleware, changePassword);



module.exports = userRouter;