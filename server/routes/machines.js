const machineRouter = require("express").Router();
const MachineController = require("../controllers/MachineController");
const authMiddleware = require("../middlewares/auth");

machineRouter.get(
    "/timeline",
    authMiddleware,
    // MachineController.timelines
);

module.exports = machineRouter;