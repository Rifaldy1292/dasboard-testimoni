const ftp = require("ftp");
const fs = require("fs");
const path = require("path");
const { logInfo, logError } = require("../utils/logger");
const net = require("net");
const os = require("os");
const { PassThrough } = require("stream");
const RemainingController = require("./RemainingController");
const Client = require("ftp");
const { closeConnection } = require("../utils/ftpUtils");

const MAX_TIMEOUT = 10000;

const localDir = (machine_id) =>
  path.join(__dirname, "..", "public", "cnc_files", machine_id);

// Manual PORT command untuk Active Mode
const getLocalAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
};

/**
 * @type {Client.Options} 
 */
const FTPMachine = {
  port: 21,
  user: "MC",
  password: "MC",
  secure: false,
  connTimeout: MAX_TIMEOUT,
  pasvTimeout: 0,
  keepalive: 0,
  debug: (message) => {
    logInfo(message, "FTPMachine.debug");
  }


};

/**
 * Handle closing the FTP connection
 * @param {Client} ftp - The FTP client instance
 */
const handleCloseConnection = async (ftp) => {
  await closeConnection(ftp, FTPMachine.port, true);
  ftp.end();
  ftp.destroy();
};

class FTPMC3Controller {
  /**
   * Handle MC-3 dengan mendapatkan list file menggunakan Active Mode
   */
  static async handleMC3GetListFiles(ip_address, name, machine_id, res) {
    const ftpClient = new ftp();
    let isResponseSent = false;
    // let operationTimeout;

    const sendResponse = (statusCode, message, data = null, error = null) => {
      if (isResponseSent) return;
      isResponseSent = true;
      handleCloseConnection(ftpClient);

      const response = {
        status: statusCode,
        message: message,
      };

      if (data) response.data = data;
      if (error) response.error = error;

      return res.status(statusCode).json(response);
    };

    try {
      logInfo(
        `Getting file list from ${name} at ${ip_address} (Forced Active Mode)`,
        "FTPController.handleMC3GetListFiles"
      );

      // Increase timeout untuk MC-3 yang lambat (10 detik)
      // operationTimeout = setTimeout(() => {
      //   logError(
      //     new Error("Operation timeout after 10 seconds"),
      //     "FTPController.handleMC3GetListFiles",
      //     "Operation took too long"
      //   );
      //   sendResponse(408, "Timeout: Operasi MC-3 melebihi 10 detik");
      // }, MAX_TIMEOUT);

      ftpClient.on("error", (error) => {
        handleCloseConnection(ftpClient);
        logError(
          error,
          "FTPController.handleMC3DeleteFiles",
          "FTP connection error"
        );

        return sendResponse(500, "Connection error", null, error.message);
      });

      ftpClient.on("timeout", () => {
        logError(
          new Error("FTP connection timed out"),
          "FTPController.handleMC3GetListFiles",
          "Connection timeout"
        );
        return sendResponse(408, "Timeout: Koneksi ke MC-3 timeout");
      });

      ftpClient.on("end", () => {
        logInfo(
          `Connection to ${name} ended gracefully`,
          "FTPController.handleMC3GetListFiles"
        );
      });

      ftpClient.on("close", (hadError) => {
        if (hadError && !isResponseSent) {
          logError(
            new Error("Connection closed with error"),
            "FTPController.handleMC3GetListFiles",
            "Connection closed unexpectedly"
          );
          return sendResponse(
            503,
            "Koneksi ke MC-3 terputus secara tidak terduga"
          );
        } else {
          logInfo(
            `Connection to ${name} closed`,
            "FTPController.handleMC3GetListFiles"
          );
        }
      });

      // Setup ready handler
      ftpClient.on("ready", () => {
        logInfo(
          `Successfully connected to ${name} - Forcing Active Mode`,
          "FTPController.handleMC3GetListFiles"
        );

        // Set ASCII mode first
        ftpClient.ascii((asciiErr) => {
          if (asciiErr) {
            logError(
              asciiErr,
              "FTPController.setAsciiMode",
              "Failed to set ASCII mode, continuing anyway"
            );
          } else {
            logInfo(
              `ASCII mode set successfully for ${name}`,
              "FTPController.setAsciiMode"
            );
          }

          // Override list method untuk Active Mode
          ftpClient.list = function (path, callback) {
            if (typeof path === "function") {
              callback = path;
              path = ".";
            }

            const dataServer = net.createServer();
            let dataTimeout;

            // Timeout khusus untuk data transfer (8 detik)
            dataTimeout = setTimeout(() => {
              dataServer.close();
              callback(new Error("Data transfer timeout after 8 seconds"));
            }, MAX_TIMEOUT);

            dataServer.listen(0, () => {
              const port = dataServer.address().port;
              const localIP = getLocalAddress();
              const portHigh = Math.floor(port / 256);
              const portLow = port % 256;
              const ipParts = localIP.split(".");

              const portCommand = `PORT ${ipParts.join(
                ","
              )},${portHigh},${portLow}`;

              logInfo(
                `Sending PORT command: ${portCommand}`,
                "FTPController.handleMC3GetListFiles"
              );

              ftpClient._send(
                portCommand,
                (err, responseText, responseCode) => {
                  if (err || responseCode !== 200) {
                    clearTimeout(dataTimeout);
                    dataServer.close();
                    return callback(
                      new Error(`PORT command failed: ${err || responseText}`)
                    );
                  }

                  logInfo(
                    `PORT command successful: ${responseText}`,
                    "FTPController.handleMC3GetListFiles"
                  );

                  let dataReceived = "";

                  dataServer.once("connection", (dataSocket) => {
                    logInfo(
                      "Data connection established for LIST command",
                      "FTPController.handleMC3GetListFiles"
                    );

                    dataSocket.on("data", (chunk) => {
                      dataReceived += chunk.toString();
                    });

                    dataSocket.on("end", () => {
                      clearTimeout(dataTimeout);
                      logInfo(
                        `List data received: ${dataReceived.length} bytes`,
                        "FTPController.handleMC3GetListFiles"
                      );

                      // Parse file list
                      const lines = dataReceived.trim().split("\n");
                      const fileList = lines
                        .map((line) => {
                          const parts = line.trim().split(/\s+/);
                          if (parts.length >= 9) {
                            return {
                              name: parts.slice(8).join(" "),
                              size: parseInt(parts[4]) || 0,
                            };
                          } else {
                            return {
                              name: line.trim(),
                              size: 0,
                              date: null,
                              type: "file",
                            };
                          }
                        })
                        .filter(
                          (file) =>
                            file.name && file.name !== "." && file.name !== ".."
                        );

                      dataServer.close();
                      callback(null, fileList);
                    });

                    dataSocket.on("error", (err) => {
                      clearTimeout(dataTimeout);
                      logError(
                        err,
                        "FTPController.handleMC3GetListFiles",
                        "Data socket error"
                      );
                      dataServer.close();
                      callback(err);
                    });
                  });

                  // // Send LIST command
                  ftpClient._send("LIST", (listErr, listResponse, listCode) => {
                    if (listErr || (listCode !== 150 && listCode !== 125)) {
                      clearTimeout(dataTimeout);
                      dataServer.close();
                      return callback(
                        new Error(
                          `LIST command failed: ${listErr || listResponse}`
                        )
                      );
                    }

                    logInfo(
                      `LIST command sent successfully: ${listResponse}`,
                      "FTPController.handleMC3GetListFiles"
                    );
                  });
                }
              );
            });

            dataServer.on("error", (err) => {
              clearTimeout(dataTimeout);
              logError(
                err,
                "FTPController.handleMC3GetListFiles",
                "Data server error"
              );
              dataServer.close();
              callback(new Error(`Data server error: ${err.message}`));
            });
          };

          // Get list files
          ftpClient.list((err, list) => {
            if (err) {
              logError(
                err,
                "FTPController.handleMC3GetListFiles",
                "Failed to get file list"
              );
              return sendResponse(
                500,
                "Gagal mendapatkan list file dari MC-3",
                null,
                err.message
              );
            }

            // Format remote files
            const remoteFiles = list.map((file) => ({
              fileName: file.name || file,
              isDeleted: false,
            }));

            // Get local files
            const localDirectory = localDir(machine_id);
            const localFiles = [];

            try {
              if (!fs.existsSync(localDirectory)) {
                fs.mkdirSync(localDirectory, { recursive: true });
              }

              const localFileList = fs.readdirSync(localDirectory);
              localFileList.forEach((file) => {
                localFiles.push({
                  fileName: file,
                  isDeleted: true,
                });
              });
            } catch (localError) {
              logError(
                localError,
                "FTPController.handleMC3GetListFiles",
                "Failed to read local directory"
              );
            }

            // Remove duplicates - prioritaskan remote files
            const remoteFileNames = new Set(remoteFiles.map((f) => f.fileName));
            const uniqueLocalFiles = localFiles.filter(
              (f) => !remoteFileNames.has(f.fileName)
            );
            const combinedFiles = [...remoteFiles, ...uniqueLocalFiles];

            logInfo(
              `Retrieved ${list.length} remote files and ${uniqueLocalFiles.length} local files from ${name}`,
              "FTPController.handleMC3GetListFiles"
            );

            return sendResponse(
              200,
              "Berhasil mendapatkan list file dari MC-3",
              combinedFiles
            );
          });
        });
      });

      // Connect dengan timeout yang lebih panjang untuk MC-3
      logInfo(
        `Attempting to connect to ${ip_address}:21 with Active Mode only`,
        "FTPController.handleMC3GetListFiles"
      );


      ftpClient.connect({
        ...FTPMachine,
        host: ip_address,
      });
    } catch (error) {
      logError(
        error,
        "FTPController.handleMC3GetListFiles",
        "Unexpected error during connection setup"
      );
      return sendResponse(
        500,
        "Gagal setup koneksi ke MC-3",
        null,
        error.message
      );
    }
  }

  /**
   * Handle transfer files to MC-3
   * @param {string} ip_address - IP address of the MC-3 machine
   * @param {string} name - Name of the MC-3 machine
   * @param {string} machine_id - ID of the machine
   * @param {Express.Response} res - Express response object
   * @returns {Promise<Response>} - Express response with status and message
   */
  static async handleMC3TransferFiles(
    ip_address,
    is_zooler,
    name,
    machine_id,
    files,
    res
  ) {
    try {
      const localDirectory = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "transfer_files",
        name
      );
      // if folder exist, delete folder
      if (fs.existsSync(localDirectory)) {
        fs.rmSync(localDirectory, { recursive: true, force: true });
      }
      fs.mkdirSync(localDirectory, { recursive: true });
      files.forEach((file) => {
        fs.writeFileSync(
          path.join(localDirectory, file.originalname),
          file.buffer
        );
      });
      logInfo(
        `Files uploaded to local folder: ${localDirectory}`,
        "FTPMC3Controller.uploadFileToLocalFolder"
      );
      if (!is_zooler) {
        RemainingController.handleChangeMachineOperatorAssignment(machine_id);
      }
      return res.status(200).json({
        status: 200,
        message: `Berhasil transfer file ke ${localDirectory}`,
      });
    } catch (error) {
      logError(error, "FTPController.handleMC3TransferFiles");
      return res.status(500).json({
        status: 500,
        message: `Gagal transfer file ke MC-3`,
      });
    }

    // const ftpClient = new ftp();
    // let isResponseSent = false;
    // let operationTimeout;
    // let isConnectionClosed = false;
    // let filesTransferred = 0;
    // const totalFiles = files.length;

    // const closeConnection = () => {
    //   if (isConnectionClosed) return;
    //   isConnectionClosed = true;

    //   if (operationTimeout) {
    //     clearTimeout(operationTimeout);
    //   }

    //   try {
    //     ftpClient.removeAllListeners();
    //     ftpClient.end();
    //     ftpClient.destroy();
    //   } catch (err) {
    //     console.log("Cleanup error (ignored):", err.message);
    //   }
    // };

    // const sendResponse = (statusCode, message, data = null, error = null) => {
    //   if (isResponseSent) return;
    //   isResponseSent = true;
    //   closeConnection();

    //   const response = {
    //     status: statusCode,
    //     message: message,
    //   };

    //   if (data) response.data = data;
    //   if (error) response.error = error;

    //   return res.status(statusCode).json(response);
    // };

    // // Function to transfer single file using Active Mode
    // const transferSingleFile = (file, callback) => {
    //   const dataServer = net.createServer();
    //   let dataTimeout;
    //   let transferCompleted = false;

    //   // Timeout for single file transfer (15 seconds per file)
    //   dataTimeout = setTimeout(() => {
    //     if (!transferCompleted) {
    //       transferCompleted = true;
    //       dataServer.close();
    //       callback(
    //         new Error(`Transfer timeout for file: ${file.originalname}`)
    //       );
    //     }
    //   }, 15000);

    //   dataServer.listen(0, () => {
    //     const port = dataServer.address().port;
    //     const localIP = getLocalAddress();
    //     const portHigh = Math.floor(port / 256);
    //     const portLow = port % 256;
    //     const ipParts = localIP.split(".");

    //     const portCommand = `PORT ${ipParts.join(",")},${portHigh},${portLow}`;

    //     logInfo(
    //       `Sending PORT command for ${file.originalname}: ${portCommand}`,
    //       "FTPController.handleMC3TransferFiles"
    //     );

    //     ftpClient._send(portCommand, (err, responseText, responseCode) => {
    //       if (err || responseCode !== 200) {
    //         if (!transferCompleted) {
    //           transferCompleted = true;
    //           clearTimeout(dataTimeout);
    //           dataServer.close();
    //           return callback(
    //             new Error(
    //               `PORT command failed for ${file.originalname}: ${
    //                 err || responseText
    //               }`
    //             )
    //           );
    //         }
    //       }

    //       logInfo(
    //         `PORT command successful for ${file.originalname}: ${responseText}`,
    //         "FTPController.handleMC3TransferFiles"
    //       );

    //       dataServer.once("connection", (dataSocket) => {
    //         logInfo(
    //           `Data connection established for ${file.originalname}`,
    //           "FTPController.handleMC3TransferFiles"
    //         );

    //         let totalBytes = 0;

    //         // Send file data
    //         dataSocket.write(file.buffer);
    //         totalBytes = file.buffer.length;

    //         logInfo(
    //           `File ${file.originalname} data sent: ${totalBytes} bytes`,
    //           "FTPController.handleMC3TransferFiles"
    //         );

    //         // Close data connection
    //         dataSocket.end();

    //         dataSocket.on("error", (socketErr) => {
    //           if (!transferCompleted) {
    //             transferCompleted = true;
    //             clearTimeout(dataTimeout);
    //             dataServer.close();
    //             callback(
    //               new Error(
    //                 `Data socket error for ${file.originalname}: ${socketErr.message}`
    //               )
    //             );
    //           }
    //         });

    //         dataSocket.on("close", () => {
    //           if (!transferCompleted) {
    //             clearTimeout(dataTimeout);
    //             dataServer.close();
    //             logInfo(
    //               `Data transfer completed for ${file.originalname}`,
    //               "FTPController.handleMC3TransferFiles"
    //             );

    //             // Wait for 226 response
    //             setTimeout(() => {
    //               if (!transferCompleted) {
    //                 transferCompleted = true;
    //                 callback(null);
    //               }
    //             }, 1000);
    //           }
    //         });
    //       });

    //       // Send STOR command with proper filename escaping
    //       const escapedFilename = file.originalname.includes(" ")
    //         ? `"${file.originalname}"`
    //         : file.originalname;
    //       ftpClient._send(
    //         `STOR ${escapedFilename}`,
    //         (storErr, storResponse, storCode) => {
    //           if (storErr || (storCode !== 150 && storCode !== 125)) {
    //             if (!transferCompleted) {
    //               transferCompleted = true;
    //               clearTimeout(dataTimeout);
    //               dataServer.close();
    //               return callback(
    //                 new Error(
    //                   `STOR command failed for ${file.originalname}: ${
    //                     storErr || storResponse
    //                   }`
    //                 )
    //               );
    //             }
    //           }

    //           logInfo(
    //             `STOR command sent successfully for ${file.originalname}: ${storResponse}`,
    //             "FTPController.handleMC3TransferFiles"
    //           );
    //         }
    //       );
    //     });
    //   });

    //   dataServer.on("error", (serverErr) => {
    //     if (!transferCompleted) {
    //       transferCompleted = true;
    //       clearTimeout(dataTimeout);
    //       dataServer.close();
    //       callback(
    //         new Error(
    //           `Data server error for ${file.originalname}: ${serverErr.message}`
    //         )
    //       );
    //     }
    //   });
    // };

    // try {
    //   logInfo(
    //     `Transferring ${totalFiles} files to ${name} at ${ip_address} (Forced Active Mode)`,
    //     "FTPController.handleMC3TransferFiles"
    //   );

    //   // Operation timeout (total 60 seconds for all files)
    //   operationTimeout = setTimeout(() => {
    //     logError(
    //       new Error("File transfer timeout after 60 seconds"),
    //       "FTPController.handleMC3TransferFiles",
    //       "Transfer operation took too long"
    //     );
    //     sendResponse(408, "Timeout: Transfer file ke MC-3 melebihi 60 detik");
    //   }, 60000);

    //   // Setup error handlers first
    //   ftpClient.on("error", (error) => {
    //     logError(
    //       error,
    //       "FTPController.handleMC3TransferFiles",
    //       "FTP connection error during file transfer"
    //     );
    //     console.log(error);

    //     // if (error.message && error.message.includes("Unable to parse PASV")) {
    //     //   return sendResponse(
    //     //     500,
    //     //     "MC-3 tidak mendukung PASV mode, menggunakan Active Mode",
    //     //     null,
    //     //     error.message
    //     //   );
    //     // }

    //     // if (error.code === "ECONNRESET") {
    //     //   return sendResponse(503, "Koneksi MC-3 terputus saat transfer");
    //     // }

    //     // if (error.code === "ECONNREFUSED") {
    //     //   return sendResponse(
    //     //     503,
    //     //     "MC-3 tidak dapat diakses untuk transfer file"
    //     //   );
    //     // }

    //     // if (error.code === "ETIMEDOUT") {
    //     //   return sendResponse(408, "Timeout koneksi ke MC-3 saat transfer");
    //     // }

    //     return sendResponse(
    //       500,
    //       "Gagal transfer file ke MC-3",
    //       null,
    //       error.message
    //     );
    //   });

    //   ftpClient.on("timeout", () => {
    //     logError(
    //       new Error("FTP connection timed out during transfer"),
    //       "FTPController.handleMC3TransferFiles",
    //       "Connection timeout"
    //     );
    //     return sendResponse(408, "Timeout koneksi ke MC-3 saat transfer");
    //   });

    //   ftpClient.on("end", () => {
    //     logInfo(
    //       `Connection to ${name} ended gracefully after transfer`,
    //       "FTPController.handleMC3TransferFiles"
    //     );
    //   });

    //   ftpClient.on("close", (hadError) => {
    //     if (hadError && !isResponseSent) {
    //       logError(
    //         new Error("Connection closed with error during transfer"),
    //         "FTPController.handleMC3TransferFiles",
    //         "Connection closed unexpectedly"
    //       );
    //       return sendResponse(
    //         503,
    //         "Koneksi ke MC-3 terputus secara tidak terduga saat transfer"
    //       );
    //     }
    //   });

    //   // Setup ready handler
    //   ftpClient.on("ready", () => {
    //     logInfo(
    //       `Successfully connected to ${name} - Starting file transfer`,
    //       "FTPController.handleMC3TransferFiles"
    //     );

    //     // Set binary mode for file transfer
    //     ftpClient.binary((binaryErr) => {
    //       if (binaryErr) {
    //         logError(
    //           binaryErr,
    //           "FTPController.handleMC3TransferFiles",
    //           "Failed to set binary mode"
    //         );
    //         return sendResponse(
    //           500,
    //           "Gagal mengatur binary mode",
    //           null,
    //           binaryErr.message
    //         );
    //       }

    //       logInfo(
    //         `Binary mode set successfully for ${name}`,
    //         "FTPController.handleMC3TransferFiles"
    //       );

    //       // Transfer files one by one sequentially
    //       let currentFileIndex = 0;

    //       const transferNextFile = () => {
    //         if (currentFileIndex >= totalFiles) {
    //           // All files transferred successfully
    //           logInfo(
    //             `All ${totalFiles} files transferred successfully to ${name}`,
    //             "FTPController.handleMC3TransferFiles"
    //           );
    //           return sendResponse(
    //             200,
    //             `Berhasil transfer ${totalFiles} file ke MC-3`
    //           );
    //         }

    //         const file = files[currentFileIndex];

    //         logInfo(
    //           `Transferring file ${currentFileIndex + 1}/${totalFiles}: ${
    //             file.originalname
    //           }`,
    //           "FTPController.handleMC3TransferFiles"
    //         );

    //         transferSingleFile(file, (err) => {
    //           if (err) {
    //             logError(
    //               err,
    //               "FTPController.handleMC3TransferFiles",
    //               `Failed to transfer file ${file.originalname} to MC-3`
    //             );
    //             return sendResponse(
    //               500,
    //               `Gagal transfer file ${file.originalname} ke MC-3`,
    //               null,
    //               err.message
    //             );
    //           }

    //           filesTransferred++;
    //           logInfo(
    //             `Successfully transferred file ${filesTransferred}/${totalFiles}: ${file.originalname}`,
    //             "FTPController.handleMC3TransferFiles"
    //           );

    //           currentFileIndex++;

    //           // Add small delay between transfers for stability
    //           setTimeout(() => {
    //             transferNextFile();
    //           }, 1000);
    //         });
    //       };

    //       // Start transferring files
    //       transferNextFile();
    //     });
    //   });

    //   // Connect to FTP server
    //   logInfo(
    //     `Attempting to connect to ${ip_address}:21 for file transfer`,
    //     "FTPController.handleMC3TransferFiles"
    //   );

    //   ftpClient.connect({
    //     ...FTPMachine,
    //     host: ip_address,
    //     connTimeout: 10000, // Increase connection timeout
    //     debug: (message) => {
    //       logInfo(
    //         `MC-3 Transfer Debug: ${message}`,
    //         "FTPController.handleMC3TransferFiles"
    //       );
    //       console.log(`[MC-3 Transfer Debug] ${message}`);
    //     },
    //   });
    // } catch (error) {
    //   logError(
    //     error,
    //     "FTPController.handleMC3TransferFiles",
    //     "Unexpected error during file transfer setup"
    //   );
    //   return sendResponse(
    //     500,
    //     "Gagal setup transfer file ke MC-3",
    //     null,
    //     error.message
    //   );
    // }
  }

  /**
   * @param {string} ip_address - IP address of the MC-3 machine
   * @param {string} name - Name of the MC-3 machine
   * @param {string} machine_id - ID of the machine
   * @param {string} fileName - Name of the file to delete
   * @param {Express.Response} res - Express response object
   * @returns {Promise<Response>} - Express response with status and message
   * */
  static async handleMC3DeleteFiles(
    ip_address,
    name,
    machine_id,
    fileName,
    res
  ) {
    const Ftp = new ftp();
    try {
      logInfo(
        `Deleting file ${fileName} from ${name} at ${ip_address} (Forced Active Mode)`,
        "FTPController.handleMC3DeleteFiles"
      );
      // Setup error handlers FIRST untuk mencegah unhandled errors
      Ftp.on("error", (error) => {
        console.log(error, error.message, 999);
        handleCloseConnection(Ftp);
        logError(
          error,
          "FTPController.handleMC3DeleteFiles.ftp.onError",
          "FTP connection error"
        );

        return res.status(500).json({
          status: 500,
          message: "Connection Error",
        });
      });

      Ftp.on("ready", () => {
        Ftp.delete(fileName, (error) => {
          if (error) {
            handleCloseConnection(Ftp);
            logError(
              error,
              "FTPController.handleMC3DeleteFiles",
              "FTP delete error"
            );
            return res.status(500).json({
              status: 500,
              message: `Gagal menghapus file ${fileName} dari MC-3`,
            });
          }
          handleCloseConnection(Ftp);
          return res.status(200).json({
            status: 200,
            message: `Berhasil menghapus file ${fileName} `
          });
        });
      });

      Ftp.connect({
        host: ip_address,
        ...FTPMachine,
      });
    } catch (error) {
      handleCloseConnection(Ftp);
      logError(error, "FTPController.handleMC3DeleteFiles");
      return res.status(500).json({
        status: 500,
        message: `Gagal menghapus file dari MC-3`,
      });
    }
  }
}

module.exports = FTPMC3Controller;
