const {
  Machine,
  EncryptData,
  MachineOperatorAssignment,
} = require("../models");
const { serverError } = require("../utils/serverError");

const { PassThrough } = require("stream"); // ✅ Tambahkan ini
const fs = require("fs");
const path = require("path");
const { Client, FTPError } = require("basic-ftp");
const { encryptToNumber } = require("../helpers/crypto");
const { encryptionCache } = require("../cache");

const localDir = (machine_id) =>
  path.join(__dirname, "..", "public", "cnc_files", machine_id);

const FTPHP = {
  host: "192.168.18.32",
  port: "2221",
  user: "android",
  password: "android",
};
class FTPController {
  /**
   * @description Transfer file to machine using FTP
   * @param {request} req - Request object
   * @param {response} res - Response object
   */
  static async transferFiles(req, res) {
    const client = new Client();
    const { machine_id, isUndo } = req.body;
    try {
      const { files } = req;
      if (!files || !files.length || !machine_id) {
        return res.status(400).json({ message: "Bad request", status: 400 });
      }
      const { ip_address, name } = await Machine.findOne({
        where: { id: machine_id },
        attributes: ["ip_address", "name"],
      });

      if (!ip_address || !name) {
        return res.status(404).json({ message: "Machine not found" });
      }
      // Buat direktori temp jika belum ada
      const tempDir = path.join(__dirname, "..", "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Konfigurasi dengan timeout yang lebih tinggi
      await client.access({
        ...FTPHP,
        // host: ip_address,
        // port: 21,
        // user: "MC",
        // password: "MC",
        // secure: false,
        // timeout: 300000, // 5 menit
      });

      // Set mode ASCII
      await client.send("TYPE A");

      const remotePath = "/Storage Card/USER/DataCenter";
      if (name === "MC-14" || name === "MC-15") {
        await client.ensureDir(remotePath);
      }

      for (const file of files) {
        console.log(
          `Starting upload: ${file.originalname} (Size: ${file.buffer.length} bytes)`
        );

        const customMachine = name === "MC-14" || name === "MC-15";
        const filePath = customMachine
          ? `${remotePath}/${file.originalname}`
          : file.originalname;

        // Jika file lebih besar dari 1MB, pecah menjadi bagian-bagian
        if (file.buffer.length > 1024 * 1024) {
          // Simpan file ke disk sementara
          const tempFilePath = path.join(tempDir, file.originalname);
          await fs.promises.writeFile(tempFilePath, file.buffer);

          try {
            // Upload file dari disk
            await client.uploadFrom(tempFilePath, filePath);
            console.log(`Completed upload: ${file.originalname}`);
          } catch (uploadError) {
            console.error(`Error uploading file: ${uploadError.message}`);
            throw uploadError;
          } finally {
            // Hapus file sementara
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          }
        } else {
          // Untuk file kecil, gunakan metode stream
          const stream = new PassThrough();
          stream.end(file.buffer);
          await client.uploadFrom(stream, filePath);
          console.log(`Completed upload: ${file.originalname}`);
        }
      }

      //  Setelah sukses transfer, simpan hasil enkripsi ke database
      for (const [encrypt_number, original_text] of encryptionCache.entries()) {
        const existingData = await EncryptData.findOne({
          where: { encrypt_number },
          attributes: ["id"],
        });
        if (!existingData) {
          await EncryptData.create({ encrypt_number, original_text });
        }
      }

      //  Hapus dari Map setelah tersimpan ke database
      encryptionCache.clear();

      // find MachineOperatorAssignment.is_using_custom, if true, then update is_using_custom to false
      const { is_using_custom, id } = await MachineOperatorAssignment.findOne({
        where: { machine_id },
        attributes: ["id", "is_using_custom"],
      });

      if (is_using_custom) {
        await MachineOperatorAssignment.update(
          { is_using_custom: false },
          { where: { id } }
        );
      }

      res.status(200).json({
        status: 200,
        message: `Successfully ${isUndo ? "undo" : "transfer"} files`,
      });
    } catch (error) {
      serverError(error, res, `Failed to ${isUndo ? "undo" : "transfer"} files`);
    } finally {
      client.close();
    }
  }

  static clearCache(_, res) {
    encryptionCache.clear();
    res.status(204).send();
  }

  static async undoRemove(req, res) {
    try {
      const { machine_id, fileName } = req.query;
      if (!machine_id || !fileName) {
        return res.status(400).json({
          message: "machine_id and fileName are required",
          status: 400,
        });
      }

      // check if file exists on pc
      const localDirectory = localDir(machine_id);
      const filePath = path.join(localDirectory, fileName);
      if (!fs.existsSync(filePath)) {
        return res
          .status(400)
          .json({ message: "File not found on PC", status: 400 });
      }
      //get file
      const file = fs.readFileSync(filePath);
      req.files = [{ buffer: file, originalname: fileName }];
      req.body = { machine_id, isUndo: true };

      await FTPController.transferFiles(req, res);
      // remove file from pc
      fs.unlinkSync(filePath);
    } catch (error) {
      serverError(error, res, "Failed to undo file");
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

      if (!ip_address) {
        return res
          .status(400)
          .json({ message: "Machine not found", status: 400 });
      }
      await client.access({
        // host: ip_address,
        // port: 21,
        // user: "MC",
        // password: "MC",
        // secure: false,
        ...FTPHP,
      });

      const customMachine = name === "MC-14" || name === "MC-15";
      const remotePath = "/Storage Card/USER/DataCenter";
      const localDirectory = localDir(machine_id);
      // make sure directory public/cnc_files/machine_id exist on pc
      if (!fs.existsSync(localDirectory)) {
        fs.mkdirSync(localDirectory, { recursive: true });
      }

      // remove all files
      if (!fileName) {
        if (!customMachine) {
          // // push all files in machine to public/cnc_files/machine_id
          const allFiles = await client.list();
          for (const file of allFiles) {
            await client.downloadTo(
              path.join(localDirectory, file.name),
              file.name
            );
          }
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

      const downloadFile = await client.downloadTo(
        path.join(localDirectory, fileName),
        fileName
      );

      const rmoveFile = await client.remove(fileName);
      console.log({ removeFile: rmoveFile, downloadFile }, 222);
      return res.status(200).json({
        status: 200,
        message: `File ${fileName} removed from ${name}`,
      });
    } catch (error) {
      //   * {
      //   error: FTPError: 550 STOR requested action not taken: File exists.
      //       at FTPContext._onControlSocketData (D:\dashboard-machine\server\node_modules\basic-ftp\dist\FtpContext.js:283:39)
      //       at Socket.<anonymous> (D:\dashboard-machine\server\node_modules\basic-ftp\dist\FtpContext.js:127:44)
      //       at Socket.emit (node:events:518:28)
      //       at addChunk (node:internal/streams/readable:561:12)
      //       at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
      //       at Readable.push (node:internal/streams/readable:392:5)
      //       at TCP.onStreamRead (node:internal/stream_base_commons:191:23) {
      //     code: 550
      //   },
      //   message: '550 STOR requested action not taken: File exists.'
      // }
      // handle file exist
      if (error instanceof FTPError && error.message.includes("File exists")) {
        return res.status(500).json({
          status: 500,
          message: "File already exist",
        });
      }
      serverError(error, res, "Failed to remove file from machine");
    } finally {
      client.close();
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

      // console.log(ip_address, 222);

      await client.access({
        ...FTPHP,
        // host: ip_address,
        // port: 21,
        // user: "MC",
        // password: "MC",
        // secure: false,
      });

      const customDirMachine = name === "MC-14" || name === "MC-15";
      if (customDirMachine) {
        const remotePath = "/Storage Card/USER/DataCenter/";
        await client.cd(remotePath);
      }
      // get all files from local directory
      const files = await client.list();
      const fileNames = files.map((file) => ({
        fileName: file.name,
        isDeleted: false,
      }));
      const localDirectory = localDir(machine_id);

      if (!fs.existsSync(localDirectory)) {
        fs.mkdirSync(localDirectory, { recursive: true });
      }
      const localFiles = fs.readdirSync(localDirectory);
      const localFileNames = localFiles.map((file) => ({
        fileName: file,
        isDeleted: true,
      }));
      const allFiles = [...fileNames, ...localFileNames];
      // compare local files with remote

      res.status(200).json({
        status: 200,
        message: "success get list files",
        data: allFiles,
      });
    } catch (error) {
      serverError(error, res, "Failed to get list files");
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
  static async encryptContentValue(req, res) {
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


}

module.exports = FTPController;

// Executing (default): SELECT "ip_address", "name" FROM "Machines" AS "Machine" WHERE "Machine"."id" = '66';
// {
//   error: FTPError: 550 RETR requested action not taken: Permission denied.
//       at FTPContext._onControlSocketData (D:\dashboard-machine\server\node_modules\basic-ftp\dist\FtpContext.js:283:39)
//       at Socket.<anonymous> (D:\dashboard-machine\server\node_modules\basic-ftp\dist\FtpContext.js:127:44)
//       at Socket.emit (node:events:518:28)
//       at addChunk (node:internal/streams/readable:561:12)
//       at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
//       at Readable.push (node:internal/streams/readable:392:5)
//       at TCP.onStreamRead (node:internal/stream_base_commons:191:23) {
//     code: 550
//   },
//   stack: 'FTPError: 550 RETR requested action not taken: Permission denied.\n' +
//     '    at FTPContext._onControlSocketData (D:\\dashboard-machine\\server\\node_modules\\basic-ftp\\dist\\FtpContext.js:283:39)\n' +
//     '    at Socket.<anonymous> (D:\\dashboard-machine\\server\\node_modules\\basic-ftp\\dist\\FtpContext.js:127:44)\n' +
//     '    at Socket.emit (node:events:518:28)\n' +
//     '    at addChunk (node:internal/streams/readable:561:12)\n' +
//     '    at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)\n' +
//     '    at Readable.push (node:internal/streams/readable:392:5)\n' +
//     '    at TCP.onStreamRead (node:internal/stream_base_commons:191:23)',
//   description: 'Failed to remove file from machine',
//   message: '550 RETR requested action not taken: Permission denied.'
// }


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
