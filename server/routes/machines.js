// const upload = require("../middlewares/multer")
const machineRouter = require("express").Router();
const MachineController = require("../controllers/MachineController");
const authMiddleware = require("../middlewares/auth");
const checkMachineLogMiddleware = require("../middlewares/checkMachineLogMiddleware");
const multer = require('multer');
const RemainingController = require("../controllers/RemainingController");
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

// Apply check middleware to transfer files route
machineRouter.post(
    "/transfer",
    middlewareTransferFiles.array('files', 300),
    authMiddleware,
    checkMachineLogMiddleware, // Check machine log before transfer
    FTPController.transferFiles
)

machineRouter.post(
    "/encrypt-content",
    authMiddleware,
    FTPController.encryptContentValue
)

machineRouter.get(
    "/list-files/:machine_id",
    authMiddleware,
    FTPController.getListFiles
)

// Apply check middleware to remove files route
machineRouter.delete(
    "/remove-files",
    authMiddleware,
    checkMachineLogMiddleware, // Check machine log before remove
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

// Apply check middleware to ready transfer check
machineRouter.get('/is-ready-transfer-files',
    authMiddleware,
    checkMachineLogMiddleware, // Check machine log before confirming ready
    (_, res) => (res.status(204).send())
);

machineRouter.put('/remaining', authMiddleware, RemainingController.editOperatorInMachine)

module.exports = machineRouter;

