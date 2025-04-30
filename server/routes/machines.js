// const upload = require("../middlewares/multer")
const machineRouter = require("express").Router();
const MachineController = require("../controllers/MachineController");
const authMiddleware = require("../middlewares/auth");
const multer = require('multer');
const remainingController = require("../controllers/RemainingController");
const FTPController = require("../controllers/FTPController");
const SettingsController = require("../controllers/SettingsController");

machineRouter.get(
    "/cutting-time",
    authMiddleware,
    MachineController.getCuttingTime
);


// dropdown
machineRouter.get(
    "/options",
    authMiddleware,
    MachineController.getMachineOption
)

const storage = multer.memoryStorage();
const middlewareTransferFiles = multer({ storage: storage, limits: { fieldSize: 50 * 1024 * 1024, } });

machineRouter.post(
    "/transfer",
    middlewareTransferFiles.array('files', 300),
    authMiddleware,
    FTPController.transferFiles)

machineRouter.post(
    "/encrypt-content",
    authMiddleware,
    FTPController.encyptContentValue
)

machineRouter.get(
    "/list-files/:machine_id",
    authMiddleware,
    FTPController.getListFiles
)

machineRouter.delete(
    "/remove-files",
    authMiddleware,
    FTPController.removeFileFromMachine
)

machineRouter.post(
    "/undo-delete-files",
    authMiddleware,
    FTPController.undoRemove
)
machineRouter.delete(
    "/clear-cache",
    authMiddleware,
    FTPController.clearCache
)

machineRouter.get(
    "/machine-log/:machine_id",
    authMiddleware,
    MachineController.getMachineLogByMachineId
)

machineRouter.patch(
    "/machine-log",
    authMiddleware,
    MachineController.editLogDescription
)

machineRouter.get('/is-ready-transfer-files', authMiddleware, FTPController.checkIsReadyTransferFile)
machineRouter.put('/remaining', authMiddleware, remainingController.editOperatorInMachine)

module.exports = machineRouter;

