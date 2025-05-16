const router = require("express").Router();
const { exec } = require('child_process');
const roleRouter = require("./roles");
const userRouter = require("./users");
const machineRouter = require("./machines");
const settingsRoutes = require("./settings.routes");


router.get("/", async (req, res) => {
    res.send("Hello World!");
});

router.get('/total-commit', (req, res) => {
    exec('git rev-list --count HEAD', (err, stdout) => {
        if (err) return res.status(500).send('Error');
        const withDots = stdout.trim().split('').join('.');
        res.send({ data: `v ${withDots}` });
    });
});

router.use("/users", userRouter);
router.use('/machines', machineRouter);
router.use('/roles', roleRouter)
router.use('/machines', machineRouter)
router.use('/settings', settingsRoutes)

module.exports = router;