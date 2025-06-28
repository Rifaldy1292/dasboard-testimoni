const ftp = require("ftp");
const fs = require("fs");
const path = require("path");
const { logInfo, logError } = require("../utils/logger");
const net = require("net");
const os = require("os");

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

const FTPHP = {
  host: "192.168.18.32",
  port: "2221",
  user: "android",
  password: "android",
  secure: false,
};

class FTPMC3Controller {
  /**
   * Handle MC-3 dengan mendapatkan list file menggunakan Active Mode
   */
  static async handleMC3GetListFiles(ip_address, name, machine_id, res) {
    const ftpClient = new ftp();

    try {
      logInfo(
        `Getting file list from ${name} at ${ip_address} (Forced Active Mode)`,
        "FTPController.handleMC3GetListFiles"
      );

      // Event listeners SEBELUM connect
      ftpClient.on("ready", () => {
        logInfo(
          `Successfully connected to ${name} - Forcing Active Mode`,
          "FTPController.handleMC3GetListFiles"
        );

        // Set ASCII mode first (seperti FFFTP)
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

          // FORCE Active Mode - override internal PASV behavior
          // const originalList = ftpClient.list;
          ftpClient.list = function (path, callback) {
            if (typeof path === "function") {
              callback = path;
              path = ".";
            }

            // Create data server for Active Mode
            const dataServer = net.createServer();

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
              logError(
                err,
                "FTPController.handleMC3GetListFiles",
                "Data server error"
              );
              callback(err);
            });
          };

          // Get list files using our custom Active Mode implementation
          ftpClient.list((err, list) => {
            if (err) {
              logError(
                err,
                "FTPController.handleMC3GetListFiles",
                "Failed to get file list"
              );
              ftpClient.end();
              return res.status(500).json({
                status: 500,
                message: "Failed to get file list from MC-3",
                error: err.message,
              });
            }
            console.log(list, 999);

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

            const combinedFiles = [...remoteFiles, ...localFiles];

            logInfo(
              `Retrieved ${list.length} remote files and ${localFiles.length} local files from ${name}`,
              "FTPController.handleMC3GetListFiles"
            );

            // Close connection
            ftpClient.end();

            res.status(200).json({
              status: 200,
              message: "Success get list files from MC-3",
              data: combinedFiles,
            });
          });
        });
      });

      ftpClient.on("error", (error) => {
        logError(
          error,
          "FTPController.handleMC3GetListFiles",
          "FTP connection error"
        );

        ftpClient.destroy();

        if (error.code === "ECONNRESET") {
          return res.status(503).json({
            status: 503,
            message: "MC-3 connection was reset",
          });
        }

        if (error.code === "ECONNREFUSED") {
          return res.status(503).json({
            status: 503,
            message: "MC-3 is not accessible",
          });
        }

        return res.status(500).json({
          status: 500,
          message: "Failed to connect to MC-3",
          error: error.message,
        });
      });

      ftpClient.on("timeout", () => {
        logError(
          new Error("FTP connection timed out"),
          "FTPController.handleMC3GetListFiles",
          "Connection timeout"
        );

        ftpClient.destroy();
        return res.status(408).json({
          status: 408,
          message: "Connection to MC-3 timed out",
        });
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
        } else {
          logInfo(
            `Connection to ${name} closed`,
            "FTPController.handleMC3GetListFiles"
          );
        }
      });

      // Connect configuration untuk MC-3 - tanpa PASV
      logInfo(
        `Attempting to connect to ${ip_address}:21 with Active Mode only`,
        "FTPController.handleMC3GetListFiles"
      );

      ftpClient.connect({
        host: ip_address,
        port: 21,
        user: "MC",
        password: "MC",
        secure: false, // No SSL untuk FANUC
        connTimeout: 15000, // 15 second connection timeout
        pasvTimeout: 0, // Disable PASV timeout
        keepalive: 0, // Disable keepalive

        debug: (message) => {
          logInfo(
            `MC-3 Debug: ${message}`,
            "FTPController.handleMC3GetListFiles"
          );
          console.log(`[MC-3 Debug] ${message}`);
        },
      });
    } catch (error) {
      // clearTimeout(connectionTimeout);
      logError(
        error,
        "FTPController.handleMC3GetListFiles",
        "Unexpected error during connection setup"
      );

      return res.status(500).json({
        status: 500,
        message: "Failed to setup connection to MC-3",
        error: error.message,
      });
    }
  }
}
module.exports = FTPMC3Controller;
