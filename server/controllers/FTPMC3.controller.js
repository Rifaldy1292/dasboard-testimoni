const ftp = require("ftp");
const fs = require("fs");
const path = require("path");
const { logInfo, logError } = require("../utils/logger");
const net = require("net");
const os = require("os");

const MAX_TIMEOUT = 5000;
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

class FTPMC3Controller {
  /**
   * Handle MC-3 dengan mendapatkan list file menggunakan Active Mode
   */
  static async handleMC3GetListFiles(ip_address, name, machine_id, res) {
    const ftpClient = new ftp();
    let isResponseSent = false;
    let operationTimeout;
    let isConnectionClosed = false;

    const closeConnection = () => {
      if (isConnectionClosed) return;
      isConnectionClosed = true;

      if (operationTimeout) {
        clearTimeout(operationTimeout);
      }

      try {
        ftpClient.removeAllListeners();
        ftpClient.end();
        ftpClient.destroy();
      } catch (err) {
        console.log("Cleanup error (ignored):", err.message);
      }
    };

    const sendResponse = (statusCode, message, data = null, error = null) => {
      if (isResponseSent) return;
      isResponseSent = true;
      closeConnection();

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

      // Manual timeout untuk keseluruhan operasi (5 detik)
      operationTimeout = setTimeout(() => {
        logError(
          new Error("Operation timeout after 5 seconds"),
          "FTPController.handleMC3GetListFiles",
          "Operation took too long"
        );
        sendResponse(408, "Timeout: Operasi MC-3 melebihi 5 detik");
      }, MAX_TIMEOUT);

      // Setup ALL event listeners SEBELUM connect untuk mencegah unhandled errors
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

            // Timeout khusus untuk data transfer (3 detik)
            dataTimeout = setTimeout(() => {
              dataServer.close();
              callback(new Error("Data transfer timeout after 3 seconds"));
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

                  // Send LIST command
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
                "Failed to get file list from MC-3",
                null,
                err.message
              );
            }

            console.log(list, "File list from MC-3");

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
              "Success get list files from MC-3",
              combinedFiles
            );
          });
        });
      });

      // ERROR handler - PENTING: Setup sebelum connect untuk menangkap semua error
      ftpClient.on("error", (error) => {
        logError(
          error,
          "FTPController.handleMC3GetListFiles",
          "FTP connection error"
        );

        // Handle different error types
        if (error.code === "ECONNRESET") {
          return sendResponse(503, "MC-3 connection was reset");
        }

        if (error.code === "ECONNREFUSED") {
          return sendResponse(503, "MC-3 is not accessible");
        }

        if (error.code === "ETIMEDOUT") {
          return sendResponse(408, "Connection to MC-3 timed out");
        }

        if (error.message && error.message.includes("timeout")) {
          return sendResponse(408, "Connection to MC-3 timed out");
        }

        return sendResponse(
          500,
          "Failed to connect to MC-3",
          null,
          error.message
        );
      });

      ftpClient.on("timeout", () => {
        logError(
          new Error("FTP connection timed out"),
          "FTPController.handleMC3GetListFiles",
          "Connection timeout"
        );
        return sendResponse(408, "Connection to MC-3 timed out");
      });

      ftpClient.on("end", () => {
        logInfo(
          `Connection to ${name} ended gracefully`,
          "FTPController.handleMC3GetListFiles"
        );
      });

      ftpClient.on("close", (hadError) => {
        if (hadError) {
          logError(
            new Error("Connection closed with error"),
            "FTPController.handleMC3GetListFiles",
            "Connection closed unexpectedly"
          );
          // Jika close dengan error dan belum ada response, kirim error
          if (!isResponseSent) {
            return sendResponse(503, "Connection to MC-3 closed unexpectedly");
          }
        } else {
          logInfo(
            `Connection to ${name} closed`,
            "FTPController.handleMC3GetListFiles"
          );
        }
      });

      // Connect dengan timeout yang lebih agresif
      logInfo(
        `Attempting to connect to ${ip_address}:21 with Active Mode only`,
        "FTPController.handleMC3GetListFiles"
      );

      ftpClient.connect({
        host: ip_address,
        port: 21,
        user: "MC",
        password: "MC",
        secure: false,
        connTimeout: MAX_TIMEOUT,
        pasvTimeout: 0,
        keepalive: 0,

        debug: (message) => {
          logInfo(
            `MC-3 Debug: ${message}`,
            "FTPController.handleMC3GetListFiles"
          );
          console.log(`[MC-3 Debug] ${message}`);
        },
      });
    } catch (error) {
      logError(
        error,
        "FTPController.handleMC3GetListFiles",
        "Unexpected error during connection setup"
      );
      return sendResponse(
        500,
        "Failed to setup connection to MC-3",
        null,
        error.message
      );
    }
  }
}

module.exports = FTPMC3Controller;
