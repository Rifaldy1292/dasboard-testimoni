const { Machine, MachineOperatorAssignment } = require("../models");
const { serverError } = require("../utils/serverError");

const { PassThrough } = require("stream"); // ✅ Tambahkan ini
const fs = require("fs");
const path = require("path");
const { Client, FTPError } = require("basic-ftp");
const { encryptToNumber } = require("../helpers/crypto");
const { logInfo, logError } = require("../utils/logger");
const FTPMC3Controller = require("./FTPMC3.controller");
const RemainingController = require("./RemainingController");

const localDir = (machine_id) =>
  path.join(__dirname, "..", "public", "cnc_files", machine_id);

const FTPHP = {
  host: "192.168.18.32",
  port: "2221",
  user: "android",
  password: "android",
  secure: false,
};

// const FTPMachine = (ip_address)

class FTPController {
  localDir = (machine_id) =>
    path.join(__dirname, "..", "public", "cnc_files", machine_id);

  /**
   *
   * @param {Request} req
   * @param {string} req.params.machine_id - ID of the machine
   * @returns {Promise<{ ip_address: string, name: string } | null>}
   */
  static async getMachineIpAndName(machine_id) {
    if (!machine_id) {
      throw new Error("Machine ID is required");
    }

    const machine = await Machine.findOne({
      where: { id: machine_id },
      attributes: ["ip_address", "name"],
      raw: true,
    });

    if (!machine) return null;

    return machine;
  }

  /**
   * @description Transfer file to machine using FTP
   * @param {request} req - Request object
   * @param {response} res - Response object
   */
  static async transferFiles(req, res) {
    const { files } = req;
    const { machine_id, isUndo } = req.body;

    if (!files || !files.length || !machine_id) {
      return res.status(400).json({ message: "Bad request", status: 400 });
    }
    const machine = await FTPController.getMachineIpAndName(machine_id);

    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    const { ip_address, name } = machine;
    if (name === "MC-3") {
      return await FTPMC3Controller.handleMC3TransferFiles(
        ip_address,
        name,
        machine_id,
        files,
        res
      ).catch((error) => console.error(error));
    }

    const client = new Client();
    try {
      // Buat direktori temp jika belum ada
      const tempDir = path.join(__dirname, "..", "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Konfigurasi dengan timeout yang lebih tinggi
      await client.access({
        // ...FTPHP,
        host: ip_address,
        port: 21,
        user: "MC",
        password: "MC",
        secure: false,
        timeout: 300000, // 5 menit
      });

      // Set mode ASCII
      await client.send("TYPE A");

      const remotePath = "/Storage Card/USER/DataCenter";
      if (name === "MC-14" || name === "MC-15") {
        await client.ensureDir(remotePath);
      }

      for (const file of files) {
        logInfo(
          `Processing file: ${file.originalname} (Size: ${file.buffer.length} bytes)`,
          "FTPController.transferFiles"
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
            logInfo(
              `Completed upload: ${file.originalname} to ${filePath}`,
              "FTPController.transferFiles"
            );
          } catch (uploadError) {
            logError(
              uploadError,
              `Error uploading file: ${uploadError.message}`
            );
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
          logInfo(
            `Completed upload: ${file.originalname} to ${filePath}`,
            "FTPController.transferFiles"
          );
        }
      }

      res.status(200).json({
        status: 200,
        message: `Successfully ${isUndo ? "undo" : "transfer"} files`,
      });

      RemainingController.handleChangeMachineOperatorAssignment(machine_id);
    } catch (error) {
      serverError(
        error,
        res,

        `Failed to ${isUndo ? "undo" : "transfer"} files`
      );
    } finally {
      client.close();
    }
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
    // type all or single
    const { fileName, machine_id } = req.query;

    if (!machine_id)
      return res
        .status(400)
        .json({ message: "machine_id is required", status: 400 });
    const { ip_address, name } = await Machine.findOne({
      where: { id: machine_id },
      attributes: ["ip_address", "name"],
      raw: true,
    });

    if (!ip_address) {
      return res
        .status(404)
        .json({ message: "Machine not found", status: 404 });
    }
    // Handle MC-3 connection only
    if (name === "MC-3") {
      return await FTPMC3Controller.handleMC3DeleteFiles(
        ip_address,
        name,
        machine_id,
        fileName,
        res
      );
    }
    const client = new Client();
    try {

      await client.access({
        host: ip_address,
        port: 21,
        user: "MC",
        password: "MC",
        secure: false,
        // ...FTPHP,
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

      await client.downloadTo(path.join(localDirectory, fileName), fileName);

      const removeFile = await client.remove(fileName);
      logInfo(
        `File ${fileName} removed from ${name} and downloaded to ${localDirectory}`,
        "FTPController.removeFileFromMachine",
        removeFile
      );
      return res.status(200).json({
        status: 200,
        message: `File ${fileName} removed from ${name}`,
      });
    } catch (error) {
      //   message: '550 STOR requested action not taken: File exists.'
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
    const { machine_id } = req.params;

    const { ip_address, name } = await Machine.findOne({
      where: { id: machine_id },
      raw: true,
      attributes: ["ip_address", "name"],
    });

    if (!ip_address || !name) {
      return res.status(400).json({
        message: "Machine not found",
        status: 400,
      });
    }

    // Handle MC-3  connection only
    if (name === "MC-3") {
      return await FTPMC3Controller.handleMC3GetListFiles(
        ip_address,
        name,
        machine_id,
        res
      );
    }

    // Handle mesin lain dengan basic-ftp (existing code)
    const client = new Client();
    try {
      logInfo(`Connecting to machine ${name} at ${ip_address}`);

      await client.access({
        host: ip_address,
        port: 21,
        user: "MC",
        password: "MC",
        secure: false,
      });

      const customDirMachine = name === "MC-14" || name === "MC-15";
      if (customDirMachine) {
        const remotePath = "/Storage Card/USER/DataCenter/";
        await client.cd(remotePath);
      }

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

      res.status(200).json({
        status: 200,
        message: "success get list files",
        data: allFiles,
      });
    } catch (error) {
      console.log(error);
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

      const [gCodeNameEnc, kNumEnc, outputWPEnt, toolNameEnc] =
        await Promise.all([
          encryptToNumber(gCodeName, "g_code_name"),
          encryptToNumber(kNum, "k_num"),
          encryptToNumber(outputWP, "output_wp"),
          encryptToNumber(toolName, "tool_name"),
        ]);
      const encryptValue = {
        gCodeName: gCodeNameEnc,
        kNum: kNumEnc,
        outputWP: outputWPEnt,
        toolName: toolNameEnc,
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
