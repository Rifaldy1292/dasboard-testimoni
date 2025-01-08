const router = require("express").Router();
const userRouter = require("./users");
// const { User, Role, Machine } = require('../models');

router.get("/", async (req, res) => {
    res.send("Hello World!");
    // const result = await Role.findAll()
    // res.json(result)

});

router.use("/users", userRouter);

module.exports = router;