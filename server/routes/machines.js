// const upload = require("../middlewares/multer")
const machineRouter = require("express").Router();
const MachineController = require("../controllers/MachineController");
const authMiddleware = require("../middlewares/auth");
const multer = require('multer');
const { MachineLog } = require("../models");
const { where } = require("sequelize");
const { Op } = require("sequelize");
const remainingController = require("../controllers/RemainingController");

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
    MachineController.transferFiles)

machineRouter.post(
    "/encrypt-content",
    authMiddleware,
    MachineController.encyptContentValue
)

machineRouter.get(
    "/list-files/:machine_id",
    authMiddleware,
    MachineController.getListFiles
)

machineRouter.delete(
    "/remove-files",
    authMiddleware,
    MachineController.removeFileFromMachine
)

machineRouter.post(
    "/undo-delete-files",
    authMiddleware,
    MachineController.undoRemove
)
machineRouter.delete(
    "/clear-cache",
    authMiddleware,
    MachineController.clearCache
)

machineRouter.get('/start-time', authMiddleware, MachineController.getStartTime)
machineRouter.put('/start-time', authMiddleware, MachineController.editStartTime)
machineRouter.get('/is-ready-transfer-files', authMiddleware, MachineController.checkIsReadyTransferFile)
machineRouter.put('/remaining', authMiddleware, remainingController.editOperatorInMachine)

module.exports = machineRouter;

