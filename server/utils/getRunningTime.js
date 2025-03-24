const { MachineLog } = require("../models");
const { dateQuery } = require("./dateQuery");
const { serverError } = require("./serverError");
/**
 * Update the running time of the last machine log of a given machine.
 * 
 * @param {number} machine_id - The ID of the machine to update.
 * @returns {Promise<void>}
 */
const updateLastMachineLog = async (machine_id) => {
  try {
    // get running time in now
    // const dateRange = dateQuery()
    // console.log(dateRange);
    const logs = await MachineLog.findAll({
      where: {
        machine_id,
        createdAt: dateQuery(),
      },
      order: [["createdAt", "ASC"]],
      attributes: ["createdAt", "current_status", "id", "running_today"],
    });

    // console.log('length', logs.length);

    if (logs.length === 0) return;

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

    // update running today in last log
    const update = await MachineLog.update(
      { running_today: totalRunningTime },
      {
        where: { id: logs[logs.length - 1].id },
      }
    )

    // console.log(update);

  } catch (error) {
    serverError(error)
    console.log("from updateLastMachineLog");
  }
};

// const updateLastMachineLogMonth = async () => {
//     lt error = null
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
