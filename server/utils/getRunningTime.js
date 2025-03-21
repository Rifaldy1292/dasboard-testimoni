const { MachineLog } = require("../models");
const { dateQuery } = require("./dateQuery");

const updateLastMachineLog = async (machineId) => {
  try {
    // get running time in now
    const logs = await MachineLog.findAll({
      where: {
        machine_id: machineId,
        createdAt: dateQuery(),
      },
      order: [["createdAt", "ASC"]],
      attributes: ["createdAt", "current_status", "id", "running_today"],
    });

    let totalRunningTime = 0; // Dalam milidetik
    let lastRunningTimestamp = null;

    logs.forEach((log) => {
      if (log.current_status === "Running") {
        lastRunningTimestamp = log.createdAt;
      } else if (lastRunningTimestamp) {
        const duration =
          new Date(log.createdAt) - new Date(lastRunningTimestamp);
        totalRunningTime += duration;
        lastRunningTimestamp = null;
      }
    });

    // Jika masih dalam status running hingga sekarang
    if (lastRunningTimestamp) {
      totalRunningTime += new Date() - new Date(lastRunningTimestamp);
    }
    // logs[logs.length - 1].running_today = totalRunningTime
    const lastLog = logs[logs.length - 1];
    console.log({ lastLog: lastLog.dataValues });
    if (lastLog) {
      lastLog.running_today = totalRunningTime;
      await lastLog.save();
      // await MachineLog.update(
      // { running_today: totalRunningTime },
      // {
      //   where: { id: lastLog.id },
      // }
      //   );
    }
  } catch (error) {
    console.log({ error, message: error.message }, "from updateLastMachineLog");
  }
};

// const updateLastMachineLogMonth = async () => {
//     let error = null
//     let data;
//     try {
//         const nowDay = new Date();
//         const nowMonth = nowDay.getMonth();
//         const nowYear = nowDay.getFullYear();

//         const logs = await MachineLog.findAll({
//             where: {
//                 timestamp: {
//                     [Op.gte]: new Date(nowYear, nowMonth, 1),
//                     [Op.lte]: new Date(nowYear, nowMonth + 1, 0)
//                 }
//             }
//         });

//         let totalRunningTime = 0; // Dalam milidetik
//         let lastRunningTimestamp = null;

//         logs.forEach((log) => {
//             if (log.current_status === "Running") {
//                 lastRunningTimestamp = log.timestamp;
//             } else if (lastRunningTimestamp) {
//                 const duration = new Date(log.timestamp) - new Date(lastRunningTimestamp);
//                 totalRunningTime += duration;
//                 lastRunningTimestamp = null;
//             }
//         });

//         // Jika masih dalam status running hingga sekarang
//         if (lastRunningTimestamp) {
//             totalRunningTime += new Date() - new Date(lastRunningTimestamp);
//         }

//         data = totalRunningTime
//     } catch (err) {
//         error = err
//         console.log(err)
//     }

//     return {
//         data,
//         error
//     };

// }

module.exports = { updateLastMachineLog };
