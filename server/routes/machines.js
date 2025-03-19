// const upload = require("../middlewares/multer")
const machineRouter = require("express").Router();
const MachineController = require("../controllers/MachineController");
const authMiddleware = require("../middlewares/auth");
const multer = require('multer');
const { MachineLog } = require("../models");
const { where } = require("sequelize");
const { Op } = require("sequelize");

machineRouter.get(
    "/cutting-time",
    authMiddleware,
    MachineController.getCuttingTime
);

const date = new Date()
const allDateInMonth = Array.from({ length: 31 }, (_, i) => {
    i++
    const day = new Date(date.getFullYear(), date.getMonth(), i + 1)
    return day
});

// 2025-03-01
const test = new Date('2025-03-01')
const test2 = new Date('2025-03-01T17:00:00.000Z')
// expect test3 = '2025--3-01' from test2
const test3 = new Date(test2.toISOString().split('T')[0])
machineRouter.get(
    "/cutting-time/id",
    authMiddleware,
    async (req, res) => {
        // const data = await MachineController.getCuttingTimeByMachineId({ machine_id: 461, allDateInMonth });
        // res.send({ length: data.data.length, data })

        try {
            const data = await MachineLog.findOne({
                where: {
                    machine_id: 461,
                    updatedAt: {
                        [Op.between]: [new Date(test3.setHours(0, 0, 0, 0)), new Date(test3.setHours(23, 59, 59, 999))],
                    },
                },
                attributes: ['running_today'],
                order: [['updatedAt', 'DESC']]

            })

            res.send(data)
        } catch (error) {
            console.log({ error, message: error.message })
        }
    }
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
machineRouter.delete(
    "/clear-cache",
    authMiddleware,
    MachineController.clearCache
)

machineRouter.get('/start-time', authMiddleware, MachineController.getStartTime)
machineRouter.put('/start-time', authMiddleware, MachineController.editStartTime)

module.exports = machineRouter;