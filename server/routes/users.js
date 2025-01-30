const userRouter = require("express").Router();
const { ADMIN_ROLE_ID } = require("../config/config.env");
const { changePassword, checkToken, deleteById, editProfile, getAll, getByNIK, login, register, resetPassword } = require("../controllers/UserController")
const authMiddleware = require("../middlewares/auth");
const { allowRoleId } = require("../middlewares/role");

const multer = require('multer');
const path = require('path');
const uploadPath = path.join(__dirname, '..', 'public/uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}_${req.user.name}_profile.jpg`); // Asumsikan req.user.id adalah ID pengguna
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Maksimum 5MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        if (mimeType && extName) {
            return cb(null, true);
        }
        cb(new Error("Hanya format gambar yang diperbolehkan (jpeg, jpg, png, gif)"));
    },
});


userRouter.patch('/edit-profile',
    authMiddleware,
    (req, res, next) => { if (allowRoleId(req.user.id)) next() },
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