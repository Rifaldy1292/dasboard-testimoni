const machineRouter = require("express").Router();
const MachineController = require("../controllers/MachineController");
const authMiddleware = require("../middlewares/auth");

machineRouter.get(
    "/cutting-time",
    authMiddleware,
    MachineController.getCuttingTime
);

const date = new Date()
const allDateInMonth = Array.from({ length: 28 }, (_, i) => {
    i++
    const day = new Date(date.getFullYear(), date.getMonth(), i + 1)
    return day
});


machineRouter.get(
    "/cutting-time/id",
    authMiddleware,
    async (req, res) => {
        const data = await MachineController.getCuttingTimeByMachineId({ machine_id: 290, allDateInMonth });
        res.send({ length: data.data.length, data })
    }
);

// dropdown
machineRouter.get(
    "/options",
    authMiddleware,
    MachineController.getMachineOption
)

module.exports = machineRouter;