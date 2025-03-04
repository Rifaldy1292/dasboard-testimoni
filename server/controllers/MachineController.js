const { Op } = require('sequelize');
const { Machine, MachineLog, CuttingTime } = require('../models');
const dateCuttingTime = require('../utils/dateCuttingTime');
const { serverError } = require('../utils/serverError');
const countHour = require('../utils/countHour');

const { PassThrough } = require('stream'); // ✅ Tambahkan ini
const { Client } = require('basic-ftp');
const dateQuery = require('../utils/dateQuery');

class MachineController {
    /**
     * @description Transfer file to machine using FTP
     * @param {request} req - Request object
     * @param {response} res - Response object
     */
    static async transferFiles(req, res) {
        const client = new Client();
        try {
            /**
             * @prop {string} machine_id - Machine ID
             * @prop {string} user_id - User ID
             */
            const { machine_id, user_id } = req.query
            /**
             * @prop {Array} files - Array of uploaded files
             */
            const { files } = req
            if (!machine_id || !user_id) return res.status(400).json({ message: 'machine_id or user_id is required', status: 400 })
            if (!files || files.length === 0) {
                return res.status(400).json({ message: 'No file uploaded', status: 400 });
            }
            const machineIp = await Machine.findOne({ where: { id: machine_id }, attributes: ['ip_address'] })
            if (!machineIp) {
                return res.status(400).json({ message: 'Machine not found', status: 400 });
            }
            const modifiedFile = files.map((file) => {
                const fileName = file.originalname.split('.')[0]
                // last 4 character ex: O1234
                const modifiedName = 'O' + fileName.slice(fileName.length - 4)
                const modifiedContent = file.buffer.toString().replace('%', `%\n( user_id: ${user_id} )\n( machine_id: ${machine_id} )`);
                return {
                    ...file,
                    buffer: Buffer.from(modifiedContent),
                    originalname: modifiedName
                }
            })
            // console.log({ modifiedFile, machine_id, user_id })
            await client.access({
                host: "192.168.1.8",//mesin CNC
                port: 21,
                user: "MC",
                password: "MC",
                secure: false,
            })


            for (const file of modifiedFile) {
                const stream = new PassThrough(); // ✅ Buat stream dari Buffer
                stream.end(file.buffer);
                console.log(`Uploading: ${file.originalname}`); // Debugging

                await client.uploadFrom(stream, file.originalname);
            }

            res.status(200).json({ status: 200, message: 'Files uploaded successfully', machineIp: machineIp.ip_address })

        } catch (error) {
            if (error.code === 550 || error.message === '550 STOR requested action not taken: File exists.') {
                return res.status(400).json({ status: 400, message: 'File already exists on machine' })
            }

            serverError(error, res, 'Failed to transfer files');
        } finally {
            client.close()
        }
    }
    static async getCuttingTime(req, res) {
        try {
            const { period } = req.query;
            const { date } = dateCuttingTime(period)

            const cuttingTime = await CuttingTime.findOne({ where: { period: date }, attributes: ['period', 'target'] });

            // machineIds from query, default all
            const machineIds = req.query.machineIds ?? await Machine.findAll({ attributes: ['id', 'name'] });

            if (!cuttingTime || !machineIds.length) {
                return res.status(204).send()
            }

            const sortedMachineIds = machineIds.sort((a, b) => {
                const numberA = parseInt(a.name.slice(3));
                const numberB = parseInt(b.name.slice(3));
                return numberA - numberB;
            });

            // 28
            const totalDayInMonth = date.getDate()

            const objTargetCuttingTime = objectTargetCuttingTime(cuttingTime.target, totalDayInMonth)

            // [1,2,3...31]
            const allDayInMonth = Array.from({ length: totalDayInMonth }, (_, i) => i + 1);

            const allDateInMonth = Array.from({ length: totalDayInMonth }, (_, i) => {
                i++
                const day = new Date(date.getFullYear(), date.getMonth(), i + 1)
                return day
            });

            const cuttingTimeInMonth = await Promise.all(sortedMachineIds.map(async (machine) => {
                const data = await MachineController.getCuttingTimeByMachineId({ machine_id: machine.id, allDateInMonth })
                return { name: machine.name, ...data }
            }));

            const extendedCuttingTimeInMonth = [objTargetCuttingTime, ...cuttingTimeInMonth]


            const data = {
                cuttingTime,
                allDayInMonth,
                cuttingTimeInMonth: extendedCuttingTimeInMonth
            }
            res.status(200).json({ status: 200, message: 'success get cutting time', data });
        } catch (error) {
            serverError(error, res, 'Failed to get cutting time');
        }
    }

    static async getCuttingTimeByMachineId({ machine_id, allDateInMonth }) {
        try {
            if (!machine_id || !allDateInMonth) throw new Error('machine_id or allDateInMonth is required')


            const getLogAllDateInMonth = await Promise.all(allDateInMonth.map(async (dateValue) => {
                console.log({ dateValue }, 333)
                const fixDate = new Date(dateValue.toISOString().split('T')[0])
                const log = await MachineLog.findOne({
                    where: {
                        machine_id,
                        updatedAt: dateQuery(fixDate)
                    },
                    attributes: ['running_today'],
                    order: [['updatedAt', 'DESC']]
                });

                const numberOfLog = log?.running_today ?? 0

                return numberOfLog;
            }))


            // const example = [1, 2, 3, 4, 9, 0, 2, 0, 1, 0]
            // expect res[1, 3, 6, 10, 19, 19, 21, 21, 22, 22]
            // [value index 0, value index 0 + 1, value index 0, 1, 2]
            const formattedCountLog = []
            for (let i = 0; i < getLogAllDateInMonth.length; i++) {
                let sum = 0
                for (let j = 0; j <= i; j++) {
                    sum += getLogAllDateInMonth[j]
                }
                formattedCountLog.push(sum)

            }

            const convertCountLogToHours = formattedCountLog.map((count) => countHour.convertMilisecondToHour(count))
            const runningToday = getLogAllDateInMonth.map((count) => countHour.convertMilisecondToHour(count))

            return { data: convertCountLogToHours, actual: runningToday }
        } catch (error) {
            console.error({ error }, 88888888888888)
            throw new Error(error);
        }
    }

    static async getMachineOption(req, res) {
        try {
            const machines = await Machine.findAll({ attributes: ['id', 'name'] });
            const sortedMachine = machines.sort((a, b) => {
                const numberA = parseInt(a.name.slice(3));
                const numberB = parseInt(b.name.slice(3));
                return numberA - numberB;
            })
            res.status(200).json({ status: 200, message: 'success get machine option', data: sortedMachine });
        } catch (error) {
            serverError(error, res, 'Failed to get machine option');
        }
    }
}

const objectTargetCuttingTime = (target, totalDayInMonth) => {

    const targetPerDay = target / totalDayInMonth; // Calculate target hours per day

    const calculatedTargets = Array.from({ length: totalDayInMonth }, (_, i) => (i + 1) * targetPerDay); // Calculate cumulative target for each day

    const formattedResult = calculatedTargets.map((item) => Math.round(item))
    // console.log({ test, length: test.length });
    return {
        name: 'Target',
        data: formattedResult, // data ubah jadi actual
    };
}


module.exports = MachineController;

/**
 * {
  error: FTPError: 550 STOR requested action not taken: File exists.
      at FTPContext._onControlSocketData (D:\dashboard-machine\server\node_modules\basic-ftp\dist\FtpContext.js:283:39)
      at Socket.<anonymous> (D:\dashboard-machine\server\node_modules\basic-ftp\dist\FtpContext.js:127:44)
      at Socket.emit (node:events:518:28)
      at addChunk (node:internal/streams/readable:561:12)
      at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
      at Readable.push (node:internal/streams/readable:392:5)
      at TCP.onStreamRead (node:internal/stream_base_commons:191:23) {
    code: 550
  },
  message: '550 STOR requested action not taken: File exists.'
}
Executing (default): SELECT "id", "name", "password", "role_id", "NIK", "machine_id", "profile_image", "createdAt", "updatedAt" FROM "Users" AS "User" WHERE "User"."id" = 8;
Executing (default): SELECT "id", "name" FROM "Machines" AS "Machine";
Executing (default): SELECT "id", "name", "password", "role_id", "NIK", "machine_id", "profile_image", "createdAt", "updatedAt" FROM "Users" AS "User" WHERE "User"."id" = 8;
Executing (default): SELECT "User"."id", "User"."name", "User"."NIK", "User"."machine_id", "User"."profile_image", "User"."createdAt", "User"."updatedAt", "Role"."name" AS "Role.name", "Machines"."name" AS "Machines.name" FROM "Users" AS "User" LEFT OUTER JOIN "Roles" AS "Role" ON "User"."role_id" = "Role"."id" LEFT OUTER JOIN "Machines" AS "Machines" ON "User"."id" = "Machines"."user_id" WHERE "User"."role_id" = 2;
Executing (default): SELECT "id", "name", "password", "role_id", "NIK", "machine_id", "profile_image", "createdAt", "updatedAt" FROM "Users" AS "User" WHERE "User"."id" = 8;
Executing (default): SELECT "ip_address" FROM "Machines" AS "Machine" WHERE "Machine"."id" = '68';
{
  error: Error: Timeout (control socket)
      at Socket.<anonymous> (D:\dashboard-machine\server\node_modules\basic-ftp\dist\FtpContext.js:319:33)
      at Object.onceWrapper (node:events:632:28)
      at Socket.emit (node:events:518:28)
      at Socket._onTimeout (node:net:595:8)
      at listOnTimeout (node:internal/timers:581:17)
      at process.processTimers (node:internal/timers:519:7),
  message: 'Timeout (control socket)'
}

 */