const router = require("express").Router();
const roleRouter = require("./roles");
const userRouter = require("./users");
const { User, Role, Machine } = require('../models');

router.get("/", async (req, res) => {
    // res.send("Hello World!");
    const result = await Machine.findAll()
    res.send(result)

});

router.use("/users", userRouter);
router.use('/roles', roleRouter)

module.exports = router;