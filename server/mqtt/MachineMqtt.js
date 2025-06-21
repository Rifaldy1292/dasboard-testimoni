const { MachineLog, Machine } = require("../models");
const { decryptFromNumber } = require("../helpers/crypto");
const { MqttClient } = require("mqtt");
const { machineLoggerDebug, machineLoggerError } = require("../utils/logger");
const { machineCache } = require("../cache");

/**
 *
 * @param {MqttClient} client
 */
const handleSendToWebsocket = (client) => {
  client.publish("machine/update", JSON.stringify(Math.random()));
};

/**
 * Checks if the createdAt timestamp of a log is within the last 6 minutes.
 * @param {Date} createdAt
 * @returns {boolean}
 */
const isBetweenTimeManualLog = (createdAt) => {
  const sixMinutees = 6 * 60 * 1000;
  const timeDifference = new Date().getTime() - new Date(createdAt).getTime();
  return timeDifference < sixMinutees;
}

/**
 *
 * @param {{ createdAt: Date, current_status: string}} log
 * @returns {Promise<boolean>}
 */
const isManualLog = async () => {
  const log = await MachineLog.findOne({
    raw: true,
    attributes: ["createdAt"],
  }).catch((error) => {
    machineLoggerError(error, "isManualLog");
  });
  if (!log || !log.createdAt) return false;
  return isBetweenTimeManualLog(log.createdAt);
};


/**
 * Handles machine status changes, creating new logs when necessary.
 *
 * @param {Machine} existMachine - The machine record.
 * @param {Object} parseMessage - The parsed MQTT message.
 * @param {MqttClient} client - The MQTT client or WebSocket client.
 * @returns {Promise<void>}
 */
const handleChangeMachineStatus = async (
  existMachine,
  parseMessage,
  client
) => {
  const {
    user_id,
    status,
    g_code_name,
    k_num,
    output_wp,
    tool_name,
    total_cutting_time,
    calculate_total_cutting_time,
  } = parseMessage;
  try {
    const isManualOperation = status === "Stopped" && existMachine.status === "Running";
    const isManualOperationDetected = isManualOperation || await isManualLog();
    const effectiveStatus = isManualOperationDetected ? "Running" : status;
    if (existMachine.status === effectiveStatus) return;


    // not update if status is same
    machineLoggerDebug(
      `Change machine status for ${existMachine.name} from ${existMachine.status} to ${status}`,
      "handleChangeMachineStatus"
    );


    const [decryptGCodeName, decryptKNum, decryptOutputWp, decryptToolName] = await Promise.all([
      decryptFromNumber(g_code_name),
      decryptFromNumber(k_num),
      decryptFromNumber(output_wp),
      decryptFromNumber(tool_name),
    ]);

    await updateDescriptionLastMachineLog(existMachine.id);
    // Create a new log with the updated status
    await MachineLog.create({
      user_id,
      machine_id: existMachine.id,
      current_status: status,
      previous_status: existMachine.status,
      g_code_name: decryptGCodeName,
      k_num: decryptKNum,
      output_wp: decryptOutputWp,
      tool_name: decryptToolName,
      total_cutting_time: total_cutting_time || 0,
      calculate_total_cutting_time: calculate_total_cutting_time || null,
    });

    // update exist machines cache
    machineCache.set(existMachine.name, {
      id: existMachine.id,
      name: existMachine.name,
      status,
      k_num: decryptKNum
    });

    // Send an update to all connected clients
    handleSendToWebsocket(client);
  } catch (error) {
    machineLoggerError(error, "handleChangeMachineStatus", {
      existMachine,
      parseMessage,
    });
  }
};

/**
 * Creates a machine and logs the first entry with the provided message data.
 *
 * @param {Object} parseMessage - The parsed message containing machine data.
 * @param {string} parseMessage.name - Name of the machine.
 * @param {'Running'|'Stopped'} parseMessage.status - Status of the machine.
 * @param {number} parseMessage.user_id - User ID associated with the machine.
 * @param {string} parseMessage.ipAddress - IP address of the machine.
 * @param {number} parseMessage.output_wp - Encrypted output workpiece value.
 * @param {number} parseMessage.k_num - Encrypted K number value.
 * @param {number} parseMessage.tool_name - Encrypted tool name value.
 * @param {number} parseMessage.total_cutting_time - Encrypted total cutting time value.
 * @param {number} parseMessage.calculate_total_cutting_time - Calculated total cutting time.
 * @param {MqttClient} client - The MQTT client or WebSocket client.
 * @returns {Promise<void>}
 */
const createMachineAndLogFirstTime = async (parseMessage, client) => {
  const {
    name,
    status,
    user_id,
    g_code_name,
    k_num,
    output_wp,
    tool_name,
    total_cutting_time,
    ipAddress,
    calculate_total_cutting_time,
  } = parseMessage;
  try {
    const [createMachine, decryptGCodeName, decryptKNum, decryptOutputWp, decryptToolName] = await Promise.all([
      Machine.create({
        name,
        ip_address: ipAddress,
      }),
      decryptFromNumber(g_code_name),
      decryptFromNumber(k_num),
      decryptFromNumber(output_wp),
      decryptFromNumber(tool_name),
    ]);

    await MachineLog.create({
      user_id,
      machine_id: createMachine.id,
      current_status: status,
      previous_status: null,
      g_code_name: decryptGCodeName,
      k_num: decryptKNum,
      output_wp: decryptOutputWp,
      tool_name: decryptToolName,
      total_cutting_time: total_cutting_time || 0,
      calculate_total_cutting_time: calculate_total_cutting_time || null,
    });

    //  push to cache
    machineCache.set(name, {
      id: createMachine.id,
      name,
      status,
      k_num: decryptKNum,
    });

    handleSendToWebsocket(client);
  } catch (error) {
    machineLoggerError(error, "createMachineAndLogFirstTime", {
      parseMessage,
    });
  }
};

/**
 * Update the running time of the last machine log of a given machine.
 *
 * @param {number} machine_id - The ID of the machine to update.
 * @returns {Promise<void>}
 */
const updateDescriptionLastMachineLog = async (machine_id) => {
  try {
    const lastLog = await MachineLog.findOne({
      where: { machine_id },
      attributes: ["id", "createdAt", "current_status"],
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    if (!lastLog) return;
    const { id, createdAt, current_status } = lastLog;

    const betweenTime = isBetweenTimeManualLog(createdAt);
    const isRunning = current_status === "Stopped";
    const isManual = isRunning && betweenTime;
    if (!isManual) return;

    await MachineLog.update(
      {
        description: "Manual Operation",
      },
      {
        where: { id },
      }
    );
  } catch (error) {
    machineLoggerError(error, "updateDescriptionLastMachineLog", {
      machine_id,
    });
  }
};

module.exports = {
  handleChangeMachineStatus,
  createMachineAndLogFirstTime,
};
