const router = require("express").Router();
const roleRouter = require("./roles");
const userRouter = require("./users");
const machineRouter = require("./machines");
const { User, Role, Machine } = require('../models');

router.get("/", async (req, res) => {
    // res.send("Hello World!");
    const result = await Machine.findAll({
        attributes: ['name', 'status', 'total_running_hours']
    })
    res.send(result)

});

router.use("/users", userRouter);
router.use('/roles', roleRouter)
router.use('/machines', machineRouter)

module.exports = router;