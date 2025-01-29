const userRouter = require("express").Router();
const { ADMIN_ROLE_ID } = require("../config/config.env");
const UserController = require("../controllers/UserController");
const authMiddleware = require("../middlewares/auth");
const roleMiddleware = require("../middlewares/role");

const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { User } = require("../models");
const uploadPath = path.join(__dirname, 'public', 'uploads', 'profile_pictures'); // Sesuaikan path sesuai kebutuhan

// Konfigurasi Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}_profile.jpg`); // Asumsikan req.user.id adalah ID pengguna
    }
});
const upload = multer({ storage: storage });


userRouter.get(
    "/",
    authMiddleware,
    roleMiddleware.allowRoleId(ADMIN_ROLE_ID),
    UserController.getAll
);

// delete user by id
userRouter.delete("/:id", authMiddleware, roleMiddleware.allowRoleId(ADMIN_ROLE_ID), UserController.deleteById);

// find user by NIK
userRouter.get("/find/:NIK", UserController.getByNIK);

userRouter.post("/register", UserController.register);
userRouter.post("/login", UserController.login);

userRouter.get("/reset-password/:id", UserController.resetPassword);
userRouter.get('/check-token', authMiddleware, UserController.checkToken);
userRouter.patch('/change-password', authMiddleware, UserController.changePassword);


userRouter.patch('/edit-profile', authMiddleware, upload.single('profilePicture'), async (req, res) => {
    try {
        const { id } = req.user;
        const oldImagePath = path.join(uploadPath, `${id}_profile.jpg`);

        // Hapus foto profil lama (jika ada)
        fs.unlink(oldImagePath, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Gagal menghapus foto profil lama');
            }
        });
        // const updatedCount = await User.update({
        //     name
        // }, {
        //     where: { id }
        // });
        // if (updatedCount[0] === 0) {
        //     return res.status(404).json({ message: 'User not found', status: 404 });
        // }
        res.status(200).json({ status: 200, message: 'success update profile', });
    } catch (error) {
        console.log({ error, message: error.message });
        res.status(500).json({ message: 'Internal Server Error', status: 500 });
    }
});


module.exports = userRouter;