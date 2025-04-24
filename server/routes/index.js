const router = require("express").Router();
const roleRouter = require("./roles");
const userRouter = require("./users");
const machineRouter = require("./machines");
const { Op } = require("sequelize");
const settingsRoutes = require("./settings.routes");


router.get("/", async (req, res) => {
    res.send("Hello World!");
});

router.use("/users", userRouter);
router.use('/machines', machineRouter);
router.use('/roles', roleRouter)
router.use('/machines', machineRouter)
router.use('/settings', settingsRoutes)

module.exports = router;