const { MachineLog, Machine, TransferFile } = require("../models");
const { MqttClient } = require("mqtt");
const { machineLoggerDebug, machineLoggerError, machineLoggerInfo } = require("../utils/logger");
const { machineCache } = require("../cache");

const setupMachineCache = async () => {
  try {
    const existMachines = await Machine.findAll({
      attributes: ["id", "name"],
      raw: true,
    });

    Array.isArray(existMachines) && existMachines.sort((a, b) => {
      const numberA = parseInt(a.name.slice(3));
      const numberB = parseInt(b.name.slice(3));
      return numberA - numberB;
    }).forEach((machine) => {
      const { id, name } = machine;
      machineCache.set(machine.name, {
        id: id,
        name: name,
        status: null,
        transfer_file_id: null,
        createdAt: null,
      });
    });

    // console.log(machineCache.getAll(), 444);

    // console.log(machineCache.getAll(), 555);

    machineLoggerInfo("Get all machines from database", machineCache.getAll());
  } catch (error) {
    machineLoggerError(error, "setupMachineCache");
  }
};


/**
 * Get the transfer file from the database.
 * @param {number} transfer_file_id - The ID of the transfer file.
 * @returns {Promise<{user_id: number, g_code_name: string, k_num: number, output_wp: number, tool_name: string, total_cutting_time: number, calculate_total_cutting_time: number}>} The transfer file object.
 */
const getTransferFile = async (transfer_file_id) => {
  let objTransferFile = {
    user_id: null,
    g_code_name: null,
    k_num: null,
    output_wp: null,
    tool_name: null,
    total_cutting_time: null,
    calculate_total_cutting_time: null,
  };
  if (!transfer_file_id) return objTransferFile;
  try {
    const transferFile = await TransferFile.findByPk(transfer_file_id, {
      raw: true,
    });
    if (!transferFile) return objTransferFile;
    objTransferFile = transferFile;
    return objTransferFile;

  } catch (error) {
    machineLoggerError(error, "getTransferFile", { transfer_file_id });
    return objTransferFile;
  }
};

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
};

/**
 *
 * @param {machineCache} existMachine - The existing machine record.
 * @param {Object} parseMessage - The parsed MQTT message containing machine data.
 * @returns {boolean}
 */
const isManualLog = (existMachine, parseMessage) => {
  const actualMachineStatus = parseMessage.status;
  const statusFromCache = existMachine.status;
  const isNull = machineCache.isNullStatus(existMachine.name);
  if (isNull) return false;

  //  isManualOperation is when the status is "Stopped" but the machine cache is  running
  const isManualOperation =
    actualMachineStatus === "Stopped" && statusFromCache === "Running";
  if (!isManualOperation) return false;


  const { createdAt } = existMachine;
  if (!createdAt) return false;
  return isBetweenTimeManualLog(createdAt);



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
  const { status, transfer_file_id } = parseMessage;

  if (!machineCache.hasDataChanged(existMachine.name, status, transfer_file_id)) {
    return;
  }

  try {

    const machineCacheStatus = existMachine.status;

    //  isManualOperation is when the status is "Stopped" but the machine cache is  running
    const isManualOperation = isManualLog(existMachine, parseMessage);
    const effectiveStatus = isManualOperation ? "Running" : status;
    const allowUpdate = machineCacheStatus === null || machineCacheStatus !== effectiveStatus;
    if (!allowUpdate) return;
    machineLoggerDebug(
      `Change machine status for ${existMachine.name} from ${existMachine.status} to ${effectiveStatus}`,
      "handleChangeMachineStatus"
    );

    const {
      user_id,
      g_code_name,
      k_num,
      output_wp,
      tool_name,
      total_cutting_time,
      calculate_total_cutting_time,
    } = await getTransferFile(transfer_file_id);


    await updateDescriptionLastMachineLog(existMachine.id);
    // Create a new log with the updated status
    const newLog = await MachineLog.create({
      user_id,
      machine_id: existMachine.id,
      current_status: effectiveStatus,
      previous_status: existMachine.status,
      g_code_name,
      k_num,
      output_wp,
      tool_name,
      total_cutting_time,
      calculate_total_cutting_time,
    });

    const plainNewLog = newLog.get({ plain: true });

    // update exist machines cache
    machineCache.updateCacheData(existMachine.name, {
      status: effectiveStatus,
      transfer_file_id,
      createdAt: plainNewLog.createdAt,
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
 * @param {{name: string, status: 'Running'|'Stopped' | 'DISCONNECT' | null, transfer_file_id: number, ipAddress?: string}} parseMessage - The parsed message containing machine data.
* @param {MqttClient} client - The MQTT client or WebSocket client.
 * @returns {Promise<void>}
 */
const createMachineAndLogFirstTime = async (parseMessage, client) => {
  const {
    name,
    status,
    transfer_file_id,
  } = parseMessage;
  try {

    const createMachine = await Machine.create({
      name,
      ipAddress: parseMessage.ipAddress || null,
    });

    const {
      user_id,
      g_code_name,
      k_num,
      output_wp,
      tool_name,
      total_cutting_time,
      calculate_total_cutting_time,
    } = await getTransferFile(transfer_file_id);

    const newLog = await MachineLog.create({
      user_id,
      machine_id: createMachine.id,
      current_status: status,
      previous_status: null,
      g_code_name,
      k_num,
      output_wp,
      tool_name,
      total_cutting_time: total_cutting_time || 0,
      calculate_total_cutting_time: calculate_total_cutting_time || null,
    });

    const plainNewLog = newLog.get({ plain: true });

    //  push to cache
    machineCache.set(name, {
      id: machine.id,
      name,
      status,
      transfer_file_id,
      createdAt: plainNewLog.createdAt,
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
  setupMachineCache,
};
