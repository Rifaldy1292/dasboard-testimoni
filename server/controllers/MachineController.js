const { Machine, MachineLog, CuttingTime, EncryptData } = require("../models");
const dateCuttingTime = require("../utils/dateCuttingTime");
const { serverError } = require("../utils/serverError");
const countHour = require("../utils/countHour");

const { PassThrough } = require("stream"); // ✅ Tambahkan ini
const { Client } = require("basic-ftp");
let { dateQuery, config } = require("../utils/dateQuery");
const { encryptToNumber } = require("../helpers/crypto");
const { encryptionCache } = require("../cache");

const hostHp = "192.168.8.119";
const pwHp = "android";
const portHp = 2221;

class MachineController {
  static clearCache(req, res) {
    encryptionCache.clear();
    res.status(200).json({ message: "cache cleared" });
  }
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
       */
      const { machine_id } = req.body;
      /**
       * @prop {Array} files - Array of uploaded files
       */
      const { files } = req;
      console.log({ body: req.body });
      if (!machine_id)
        return res
          .status(400)
          .json({ message: "machine_id is required", status: 400 });
      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ message: "No file uploaded", status: 400 });
      }
      const { ip_address, name } = await Machine.findOne({
        where: { id: machine_id },
        attributes: ["ip_address", "name"],
      });
      if (!ip_address) {
        return res
          .status(400)
          .json({ message: "Machine not found", status: 400 });
      }

      // console.log(machineIp.dataValues.ip_address, 22)
      await client.access({
        host: ip_address,
        port: 21,
        user: "MC",
        password: "MC",
        // host: hostHp,
        // port: portHp,
        // user: pwHp,
        // password: pwHp,
        secure: false,
      });

      const remotePath = "/Storage Card/USER/DataCenter";
      if (name === "MC-14" || name === "MC-15") {
        await client.ensureDir(remotePath); // Pastikan direktori tujuan ada
      }

      for (const file of files) {
        const stream = new PassThrough(); // ✅ Buat stream dari Buffer
        stream.end(file.buffer);
        console.log(`Uploading: ${file.originalname}`); // Debugging

        const customMachine = name === "MC-14" || name === "MC-15";

        const path = customMachine
          ? `${remotePath}/${file.originalname}`
          : file.originalname;

        await client.uploadFrom(stream, path);
      }

      // ✅ Setelah sukses transfer, simpan hasil enkripsi ke database
      for (const [encrypt_number, original_text] of encryptionCache.entries()) {
        const existingData = await EncryptData.findOne({
          where: { encrypt_number },
          attributes: ["id"],
        });
        if (!existingData) {
          await EncryptData.create({ encrypt_number, original_text });
        }
      }

      // ✅ Hapus dari Map setelah tersimpan ke database
      encryptionCache.clear();

      res
        .status(200)
        .json({ status: 200, message: "Files uploaded successfully" });
    } catch (error) {
      console.log({ error, message: error.message });
      if (error.code === "ECONNREFUSED")
        return res
          .status(500)
          .json({ message: "Failed to connect to machine", status: 500 });
      if (
        error.code === 550 ||
        error.message === "550 STOR requested action not taken: File exists."
      ) {
        return res
          .status(400)
          .json({ status: 400, message: "File already exists on machine" });
      }

      serverError(error, res, "Failed to transfer files");
    } finally {
      client.close();
    }
  }

  /**
   * Remove file from machine
   * @param {Request} req - request object
   * @param {Response} res - response object
   * @param {string} req.query.machine_id - machine id
   * @param {string} [req.query.fileName] - file name to remove, if not provided, all files will be removed
   * @returns {Promise<void>}
   */
  static async removeFileFromMachine(req, res) {
    const client = new Client();
    try {
      // type all or single
      const { fileName, machine_id } = req.query;

      if (!machine_id)
        return res
          .status(400)
          .json({ message: "machine_id is required", status: 400 });
      const { ip_address, name } = await Machine.findOne({
        where: { id: machine_id },
        attributes: ["ip_address", "name"],
      });

      if (!ip_address)
        return res
          .status(400)
          .json({ message: "Machine not found", status: 400 });
      await client.access({
        // host: "172.20.80.210",//mesin CNC
        // host: "192.168.8.119",//mesin CNC
        host: ip_address,
        port: 21,
        user: "MC",
        password: "MC",
        secure: false,
      });

      const customMachine = name === "MC-14" || name === "MC-15";
      const remotePath = "/Storage Card/USER/DataCenter";

      // remove all files
      if (!fileName) {
        if (!customMachine) {
          await client.removeDir("/");
          return res
            .status(200)
            .json({ status: 200, message: `All files removed from ${name}` });
        }

        await client.ensureDir(remotePath); // Pastikan direktori tujuan ada
        await client.removeDir(remotePath);
        return res
          .status(200)
          .json({ status: 200, message: `All files removed from ${name}` });
      }

      // remove single file
      if (customMachine) {
        await client.cd(remotePath);
      }
      await client.remove(fileName);
      return res.status(200).json({
        status: 200,
        message: `File ${fileName} removed from ${name}`,
      });
    } catch (error) {
      serverError(error, res, "Failed to remove all file from machine");
    } finally {
      client.close();
    }
  }

  /**
   * Encrypt content value
   * @param {Express.Request} req.body - Request body
   * @param {string | undefined} [req.body.gCodeName] - G code name
   * @param {string} req.body.kNum - K num
   * @param {string} req.body.outputWP - Output wp
   * @param {string} req.body.toolName - Tool name
   * @param {string} req.body.totalCuttingTime - Total cutting time
   * @returns {Promise<Object>} - Response with encrypted content value
   * @throws {Error} - If there is an error when encrypting content value
   */
  static async encyptContentValue(req, res) {
    try {
      const { gCodeName, kNum, outputWP, toolName } = req.body;

      const encryptValue = {
        gCodeName: encryptToNumber(gCodeName),
        kNum: encryptToNumber(kNum),
        outputWP: encryptToNumber(outputWP),
        toolName: encryptToNumber(toolName),
      };

      res.status(201).json({
        status: 201,
        message: "success encrypt content value",
        data: encryptValue,
      });
    } catch (error) {
      serverError(error, res, "Failed to encrypt content value");
    }
  }

  static getStartTime(req, res) {
    res.status(200).json({
      data: { startHour: config.startHour, startMinute: config.startMinute },
      message: "succesfully get start time ",
    });
  }

  static editStartTime(req, res) {
    try {
      const { reqStartHour, reqStartMinute } = req.body;
      if (
        (typeof reqStartHour !== "number", typeof reqStartMinute !== "number")
      )
        return res
          .status(400)
          .json({ message: "reqStartHour and reqStartMinute is Required" });

      config.startHour = reqStartHour;
      config.startMinute = reqStartMinute;
      res.status(201).json({ message: "succesfully Edit start time " });
    } catch (error) {
      serverError(error, res, "failed to Edit start time");
    }
  }

  static async getCuttingTime(req, res) {
    try {
      const { period } = req.query;
      const { date } = dateCuttingTime(period);

      const cuttingTime = await CuttingTime.findOne({
        where: { period: date },
        attributes: ["period", "target"],
      });

      // machineIds from query, default all
      const machineIds =
        req.query.machineIds ??
        (await Machine.findAll({ attributes: ["id", "name"] }));

      if (!cuttingTime || !machineIds.length) {
        return res.status(204).send();
      }

      const sortedMachineIds = machineIds.sort((a, b) => {
        const numberA = parseInt(a.name.slice(3));
        const numberB = parseInt(b.name.slice(3));
        return numberA - numberB;
      });

      // 28
      const totalDayInMonth = date.getDate();

      const objTargetCuttingTime = objectTargetCuttingTime(
        cuttingTime.target,
        totalDayInMonth
      );

      // [1,2,3...31]
      const allDayInMonth = Array.from(
        { length: totalDayInMonth },
        (_, i) => i + 1
      );

      const allDateInMonth = Array.from({ length: totalDayInMonth }, (_, i) => {
        i++;
        const day = new Date(date.getFullYear(), date.getMonth(), i + 1);
        return day;
      });

      const cuttingTimeInMonth = await Promise.all(
        sortedMachineIds.map(async (machine) => {
          const data = await MachineController.getCuttingTimeByMachineId({
            machine_id: machine.id,
            allDateInMonth,
          });
          return { name: machine.name, ...data };
        })
      );

      const extendedCuttingTimeInMonth = [
        objTargetCuttingTime,
        ...cuttingTimeInMonth,
      ];

      const data = {
        cuttingTime,
        allDayInMonth,
        cuttingTimeInMonth: extendedCuttingTimeInMonth,
      };
      res
        .status(200)
        .json({ status: 200, message: "success get cutting time", data });
    } catch (error) {
      serverError(error, res, "Failed to get cutting time");
    }
  }

  static async getCuttingTimeByMachineId({ machine_id, allDateInMonth }) {
    try {
      if (!machine_id || !allDateInMonth)
        throw new Error("machine_id or allDateInMonth is required");

      const getLogAllDateInMonth = await Promise.all(
        allDateInMonth.map(async (dateValue) => {
          console.log({ dateValue }, 333);
          // const fixDate = new Date(dateValue.toISOString().split("T")[0]);
          const log = await MachineLog.findOne({
            where: {
              machine_id,
              createdAt: dateQuery(dateValue),
            },
            attributes: ["running_today"],
            order: [["createdAt", "DESC"]],
          });

          const numberOfLog = log?.running_today ?? 0;

          return numberOfLog;
        })
      );

      // const example = [1, 2, 3, 4, 9, 0, 2, 0, 1, 0]
      // expect res[1, 3, 6, 10, 19, 19, 21, 21, 22, 22]
      // [value index 0, value index 0 + 1, value index 0, 1, 2]
      const formattedCountLog = [];
      for (let i = 0; i < getLogAllDateInMonth.length; i++) {
        let sum = 0;
        for (let j = 0; j <= i; j++) {
          sum += getLogAllDateInMonth[j];
        }
        formattedCountLog.push(sum);
      }

      const convertCountLogToHours = formattedCountLog.map((count) =>
        countHour.convertMilisecondToHour(count)
      );
      const runningToday = getLogAllDateInMonth.map((count) =>
        countHour.convertMilisecondToHour(count)
      );

      return { data: convertCountLogToHours, actual: runningToday };
    } catch (error) {
      console.error({ error }, 88888888888888);
      throw new Error(error);
    }
  }

  static async getMachineOption(req, res) {
    try {
      const machines = await Machine.findAll({ attributes: ["id", "name"] });

      const sortedMachine = machines.sort((a, b) => {
        const numberA = parseInt(a.name.slice(3));
        const numberB = parseInt(b.name.slice(3));
        return numberA - numberB;
      });

      if (!sortedMachine.length) {
        return res.status(200).send({ data: [] });
      }

      const formattedMachines = sortedMachine.map((machine) => {
        const { name } = machine;
        const result = { ...machine.dataValues };
        if (name === "MC-1" || name === "MC-6") {
          result.startMacro = 500;
        } else if (name === "MC-14" || name === "MC-15") {
          result.startMacro = 560;
        } else {
          result.startMacro = 540;
        }
        return result;
      });

      res.status(200).json({
        status: 200,
        message: "success get machine option",
        data: formattedMachines,
      });
    } catch (error) {
      serverError(error, res, "Failed to get machine option");
    }
  }

  static async getListFiles(req, res) {
    const client = new Client();
    try {
      const { machine_id } = req.params;

      const { ip_address, name } = await Machine.findOne({
        where: { id: machine_id },
        attributes: ["ip_address", "name"],
      });
      if (!ip_address)
        return res
          .status(400)
          .json({ message: "Machine not found", status: 400 });

      console.log(ip_address, 222);

      await client.access({
        // host: "172.20.80.210",//mesin CNC
        // host: "192.168.8.119",//mesin CNC
        host: ip_address,
        port: 21,
        user: "MC",
        password: "MC",
        secure: false,
      });
      if (name === "MC-14" || name === "MC-15") {
        const remotePath = "/Storage Card/USER/DataCenter/";
        await client.cd(remotePath);
      }
      const files = await client.list();
      const fileNames = files.map((file) => {
        return {
          fileName: file.name,
        };
      });
      res.status(200).json({
        status: 200,
        message: "success get list files",
        data: fileNames,
      });
    } catch (error) {
      serverError(error, res, "Failed to get list files");
    } finally {
      client.close();
    }
  }
}

const objectTargetCuttingTime = (target, totalDayInMonth) => {
  const targetPerDay = target / totalDayInMonth; // Calculate target hours per day

  const calculatedTargets = Array.from(
    { length: totalDayInMonth },
    (_, i) => (i + 1) * targetPerDay
  ); // Calculate cumulative target for each day

  const formattedResult = calculatedTargets.map((item) => Math.round(item));
  // console.log({ test, length: test.length });
  return {
    name: "Target",
    data: formattedResult, // data ubah jadi actual
  };
};

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
