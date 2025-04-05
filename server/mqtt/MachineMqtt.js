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
 * Determines if a machine operation should be considered manual based on the time elapsed since the last log.
 * 
 * @async
 * @param {{createdAt: Date}|null} lastMachineLog - The last machine log entry or null if no previous logs exist
 * @returns {boolean} Returns true if the operation is considered manual (within 15 minutes of last log),
 *                            false if it's not manual or if an error occurs
 * @description
 * This function checks if the time difference between now and the last machine log
 * is less than or equal to 15 minutes (900,000 milliseconds). If so, the operation
 * is considered manual. This helps distinguish between automated and manual machine operations.
 */
const checkIsManualLog = (lastMachineLog) => {
  if (!lastMachineLog || typeof lastMachineLog !== 'object') return false;
  const differenceTime = new Date() - new Date(lastMachineLog?.createdAt);
  const fiveTenMinutes = 15 * 60 * 1000;
  const isManual = differenceTime <= fiveTenMinutes;
  return isManual;
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

    const { totalRunningTime, lastLog } = await getRunningTimeMachineLog(existMachine.id);
    const isManual = checkIsManualLog(lastLog);
    const newStatus = isManual ? "Running" : status
    const running_today = totalRunningTime || 0;

    // console.log({ isManual }, 333)

    // update machine status
    await Machine.update({ status: newStatus }, { where: { id: existMachine.id } });
    // update exist machines cache
    existMachinesCache.set(existMachine.name, { ...existMachine, status: newStatus });

    const decryptGCodeName = await decryptFromNumber(g_code_name);
    const decryptKNum = await decryptFromNumber(k_num);
    const decryptOutputWp = await decryptFromNumber(output_wp);
    const decryptToolName = await decryptFromNumber(tool_name);

    // console.log({ decryptGCodeName, decryptKNum, decryptToolName, decryptOutputWp, decryptTotalCuttingTime }, 124)

    // Create a new log with the updated status
    await MachineLog.create({
      user_id,
      machine_id: existMachine.id,
      running_today,
      previous_status: existMachine.status,
      current_status: newStatus,
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
 * Calculates the total running time of a machine based on today's machine logs
 * 
 * @async
 * @param {number|string} machine_id - ID of the machine to calculate running time for
 * @returns {Promise<{totalRunningTime: number, lastLog: {id: number, createdAt: Date} }|undefined>} Object containing totalRunningTime and lastMachineLog, or undefined if no logs exist
 * @throws {Error} If an error occurs during the calculation process
 */
const getRunningTimeMachineLog = async (machine_id) => {
  try {
    // Get date range for today
    const dateRange = dateQuery();

    // Fetch all machine logs for today, ordered by creation time
    const logs = await MachineLog.findAll({
      where: {
        machine_id,
        createdAt: dateRange,
      },
      order: [["createdAt", "ASC"]],
      attributes: ["id", "createdAt", "current_status", "running_today"],
    });

    // If no logs found, return undefined
    if (!logs.length) {
      return undefined;
    }

    // Calculate total running time
    let totalRunningTime = 0; // In milliseconds
    let lastRunningTimestamp = null;

    // Iterate through each log to calculate running duration
    logs.forEach((log) => {
      const { current_status, createdAt } = log;

      if (current_status === "Running") {
        // Record the start time of running status
        lastRunningTimestamp = createdAt;
      } else if (lastRunningTimestamp) {
        // Calculate duration from last running timestamp to current log
        const duration = new Date(createdAt) - new Date(lastRunningTimestamp);
        totalRunningTime += duration;
        lastRunningTimestamp = null;
      }
    });

    // If the last status is still running, calculate duration until now
    if (lastRunningTimestamp) {
      const currentTime = new Date();
      totalRunningTime += currentTime - new Date(lastRunningTimestamp);
    }

    // Return calculation results and the ID of the last log
    return {
      totalRunningTime,
      lastLog: logs[logs.length - 1],
    };
  } catch (error) {
    // Log error and propagate it to the caller
    serverError(error, "getRunningTimeMachineLog");
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
    const { totalRunningTime, lastLog } = await getRunningTimeMachineLog(machine_id);

    // update running today in last log
    await MachineLog.update(
      { running_today: totalRunningTime },
      {
        where: { id: lastLog.id },
      }
    );
  } catch (error) {
    serverError(error, "updateLastMachineLog");
  }
};

module.exports = {
  createCuttingTime,
  handleChangeMachineStatus,
  createMachineAndLogFirstTime,
  updateLastMachineLog,
};
