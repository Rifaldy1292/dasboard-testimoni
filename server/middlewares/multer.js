const multer = require('multer');
const path = require('path');
const { FOLDER_UPLOAD } = require('../config/config.env');
const uploadPath = path.join(__dirname, '..', FOLDER_UPLOAD);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}_${req.user.name}_profile${path.extname(file.originalname)}`); // Asumsikan req.user.id adalah ID pengguna
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Maksimum 3MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif|nt/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        // if (mimeType && extName) {
        //     return cb(null, true);
        // }
        cb(new Error("Hanya format gambar yang diperbolehkan (jpeg, jpg, png, gif, nt)"));
    },
});

module.exports = upload;