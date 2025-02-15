const machineRouter = require("express").Router();
const MachineController = require("../controllers/MachineController");
const authMiddleware = require("../middlewares/auth");

machineRouter.get(
    "/cutting-time",
    authMiddleware,
    MachineController.getCuttingTime
);

module.exports = machineRouter;