const machineRouter = require("express").Router();
const MachineController = require("../controllers/MachineController");
const authMiddleware = require("../middlewares/auth");

machineRouter.get(
    "/cutting-time",
    authMiddleware,
    MachineController.getCuttingTime
);

// machineRouter.get(
//     "/cutting-time/id",
//     authMiddleware,
//     MachineController.getCuttingTimeByMachineId
// );

machineRouter.get(
    "/options",
    authMiddleware,
    MachineController.getMachineOption
)

module.exports = machineRouter;