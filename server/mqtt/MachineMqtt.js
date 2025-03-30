const { MachineLog, Machine, CuttingTime } = require("../models");
const dateCuttingTime = require("../utils/dateCuttingTime");
const WebSocket = require("ws");
const {
  clientPreferences,
  messageTypeWebsocketClient,
} = require("../websocket/handleWebsocket");
const MachineWebsocket = require("../websocket/MachineWebsocket");
const { dateQuery } = require("../utils/dateQuery");
const { decryptFromNumber } = require("../helpers/crypto");
const { serverError } = require("../utils/serverError");
const { existMachinesCache } = require("../cache");

const createCuttingTime = async () => {
  try {
    const { date } = dateCuttingTime();
    const existCuttingTime = await CuttingTime.findOne({
      where: { period: date },
      attributes: ["period"],
    });
    if (existCuttingTime === null) {
      return await CuttingTime.create({
        period: date,
      });
    }
  } catch (error) {
    console.error({ error, message: error.message });
  }
};

function formatTimeDifference(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));

  let result = [];
  if (hours > 0) result.push(`${hours}h`);
  if (minutes > 0) result.push(`${minutes}m`);
  if (seconds > 0) result.push(`${seconds}s`);

  return result.length > 0 ? result.join(" ") : "0s";
}

/**
 * Handles the manual logging of machine operations.
 *
 * @param {number} machine_id - The ID of the machine to check for manual logs.
 * @param {'Running' | 'Stopped'} status - The current status of the machine.
 * @returns {Promise<boolean>} - Returns true if the operation is manual, false otherwise.
 */
const handleIsManualLog = async (machine_id) => {
  try {
    const lastMachineLog = await MachineLog.findOne({
      where: {
        machine_id,
        createdAt: dateQuery(),
      },
      attributes: ["createdAt"],
      order: [["createdAt", "DESC"]],
    });
    if (lastMachineLog === null) return false;
    const differenceTime = new Date() - new Date(lastMachineLog?.createdAt);
    const fiveTenMinutes = 15 * 60 * 1000;
    const isManual = differenceTime <= fiveTenMinutes;
    return isManual;
  } catch (error) {
    serverError(error);
    return false;
  }
};

/**
 * Handles machine status changes, creating new logs when necessary.
 *
 * @param {Machine} existMachine - The machine record.
 * @param {Object} parseMessage - The parsed MQTT message.
 * @param {WebSocket.Server} wss - The WebSocket server.
 */
const handleChangeMachineStatus = async (existMachine, parseMessage, wss) => {
  try {
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
    // Find the last log for today

    const isManual = await handleIsManualLog(existMachine.id, status);

    // console.log({ isManual }, 333)

    // update machine status
    await Machine.update({ status }, { where: { id: existMachine.id } });

    // update exist machines cache
    existMachinesCache.set(existMachine.name, { ...existMachine, status });

    const decryptGCodeName = await decryptFromNumber(g_code_name);
    const decryptKNum = await decryptFromNumber(k_num);
    const decryptOutputWp = await decryptFromNumber(output_wp);
    const decryptToolName = await decryptFromNumber(tool_name);

    // console.log({ decryptGCodeName, decryptKNum, decryptToolName, decryptOutputWp, decryptTotalCuttingTime }, 124)

    // Create a new log with the updated status
    await MachineLog.create({
      user_id,
      machine_id: existMachine.id,
      previous_status: existMachine.status,
      current_status: isManual ? "Running" : status,
      description: isManual ? "Manual Operation" : null,
      g_code_name: decryptGCodeName,
      k_num: decryptKNum,
      output_wp: decryptOutputWp,
      tool_name: decryptToolName,
      total_cutting_time: total_cutting_time || 0,
      calculate_total_cutting_time: calculate_total_cutting_time || 0,
    });

    // Send an update to all connected clients
    wss.clients.forEach(async (client) => {
      if (client.readyState !== WebSocket.OPEN) return;

      // Check if the client has requested a timeline or percentage update
      const timelineMessage = messageTypeWebsocketClient
        .get(client)
        ?.has("timeline");
      const percentageMessage = messageTypeWebsocketClient
        .get(client)
        ?.has("percentage");

      // Check if the client has a custom date
      const lastRequestedDate = clientPreferences.get(client);
      if (lastRequestedDate) {
        // If the client has a custom date, skip the update
        console.log(
          `Skipping update for client with custom date: ${lastRequestedDate}`
        );
        return;
      }

      // Send the update to the client
      if (timelineMessage) {
        console.log("Sending live timeline update from MQTT");
        await MachineWebsocket.timelines(client);
      } else if (percentageMessage) {
        await MachineWebsocket.percentages(client);
      }
    });
  } catch (error) {
    console.log({ error, message: error.message });
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
 */
const createMachineAndLogFirstTime = async (parseMessage) => {
  try {
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

    const createMachine = await Machine.create({
      name,
      status,
      ip_address: ipAddress,
    });

    //  push to cache
    existMachinesCache.set(name, {
      id: createMachine.id,
      name,
      status,
    });

    const decryptGCodeName = await decryptFromNumber(g_code_name);
    const decryptKNum = await decryptFromNumber(k_num);
    const decryptOutputWp = await decryptFromNumber(output_wp);
    const decryptToolName = await decryptFromNumber(tool_name);

    // running_today default 0
    return await MachineLog.create({
      machine_id: createMachine.id,
      current_status: createMachine.status,
      user_id,
      g_code_name: decryptGCodeName,
      k_num: decryptKNum,
      output_wp: decryptOutputWp,
      tool_name: decryptToolName,
      total_cutting_time: total_cutting_time || 0,
      calculate_total_cutting_time: calculate_total_cutting_time || 0,
    });
  } catch (error) {
    console.log({ error, message: error.message });
  }
};

/**
 * Update the running time of the last machine log of a given machine.
 *
 * @param {number} machine_id - The ID of the machine to update.
 * @returns {Promise<void>}
 */
const updateLastMachineLog = async (machine_id) => {
  try {
    // get running time in now
    const dateRange = dateQuery();
    // console.log(dateRange);
    const logs = await MachineLog.findAll({
      where: {
        machine_id,
        createdAt: dateRange,
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
    await MachineLog.update(
      { running_today: totalRunningTime },
      {
        where: { id: logs[logs.length - 1].id },
      }
    );

    // console.log(update);
  } catch (error) {
    serverError(error);
    console.log("from updateLastMachineLog");
  }
};

module.exports = {
  createCuttingTime,
  handleChangeMachineStatus,
  createMachineAndLogFirstTime,
  updateLastMachineLog,
};
