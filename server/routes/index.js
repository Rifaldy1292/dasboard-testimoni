const router = require("express").Router();
const roleRouter = require("./roles");
const userRouter = require("./users");
// const { Machine, MachineLog } = require('../models');
// const { Op } = require("sequelize");

// function convertDateTime(date) {
//     const dateTime = new Date(date);
//     const hours = dateTime.getHours();
//     const minutes = dateTime.getMinutes();
//     return `${hours}:${minutes.toString().padStart(2, '0')}`;
// }

// router.get("/", async (req, res) => {
//     // res.send("Hello World!");
//     const currentDate = new Date();
//     const dateOption = new Date(currentDate);
//     const machines = await Machine.findAll({
//         include: [{
//             model: MachineLog,
//             where: {
//                 // ambil data sesuai hari ini
//                 timestamp: {
//                     [Op.gte]: new Date(dateOption.setHours(0, 0, 0, 0)),
//                     [Op.lte]: new Date(dateOption.setHours(23, 59, 59, 999))
//                 }
//             },
//             attributes: ['current_status', 'timestamp']
//         }],
//         order: [[{ model: MachineLog }, 'timestamp', 'ASC']],
//         attributes: ['name', 'status']
//     });


//     const formattedMachines = machines.map(machine => {
//         const logs = machine.MachineLogs.map(log => {
//             return {
//                 current_status: log.current_status,
//                 timestamp: convertDateTime(log.timestamp)
//             }
//         });
//         return {
//             name: machine.name,
//             status: machine.status,
//             MachineLogs: logs
//         };
//     })

//     // .sort((a, b) => {
//     //     const numberA = parseInt(a.name.slice(3));
//     //     const numberB = parseInt(b.name.slice(3));
//     //     return numberA - numberB;
//     // });
//     res.json(formattedMachines)

// });

router.use("/users", userRouter);
router.use('/roles', roleRouter)
// router.use('/machines', machineRouter)

module.exports = router;