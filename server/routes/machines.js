const machineRouter = require("express").Router();
const MachineController = require("../controllers/MachineController");
const authMiddleware = require("../middlewares/auth");

machineRouter.get(
    "/timeline",
    authMiddleware,
    MachineController.getAll
);

module.exports = machineRouter;