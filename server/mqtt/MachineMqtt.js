const { MachineLog, Machine } = require("../models");
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
const RemainingController = require("../controllers/RemainingController");
const { getShiftDateRange } = require("../utils/machineUtils");
const { Op } = require("sequelize");

/**
 *
 * @param {string} createdAt
 * @returns {boolean}
 */
const isManualLog = (createdAt) => {
  if (!createdAt) return false;
  const timeDifference = new Date() - new Date(createdAt);
  const sixMinutees = 6 * 60 * 1000;
  return timeDifference < sixMinutees;
};

// trigger when create log
const checkIsManualLog = async (machine_id) => {
  try {
    const { dateFrom, dateTo } = await getShiftDateRange(new Date(), 0);
    const lastMachineLog = await MachineLog.findOne({
      where: { machine_id, createdAt: { [Op.between]: [dateFrom, dateTo] } },
      attributes: ["createdAt"],
      order: [["createdAt", "DESC"]],
    });
    if (!lastMachineLog) {
      return false;
    }

    return isManualLog(lastMachineLog.createdAt);
  } catch (error) {
    if (error.message.includes("No daily config")) return;
    serverError(error, "checkIsManualLog");
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

    const isManual = await checkIsManualLog(existMachine.id);
    const newStatus = isManual ? "Running" : status;
    // const newStatus = status;

    // console.log(
    //   { isManual, isSameStatus: newStatus === existMachine.status },
    //   333
    // );
    // not update if status is same
    if (newStatus === existMachine.status) return;
    // update machine status
    await Machine.update(
      { status: newStatus },
      { where: { id: existMachine.id } }
    );
    // update exist machines cache
    existMachinesCache.set(existMachine.name, {
      ...existMachine,
      status: newStatus,
    });

    const decryptGCodeName = await decryptFromNumber(g_code_name);
    const decryptKNum = await decryptFromNumber(k_num);
    const decryptOutputWp = await decryptFromNumber(output_wp);
    const decryptToolName = await decryptFromNumber(tool_name);

    await updateRunningTodayLastMachineLog(existMachine.id, true);
    // Create a new log with the updated status
    await MachineLog.create({
      user_id,
      machine_id: existMachine.id,
      current_status: newStatus,
      previous_status: existMachine.status,
      g_code_name: decryptGCodeName,
      k_num: decryptKNum,
      output_wp: decryptOutputWp,
      tool_name: decryptToolName,
      total_cutting_time: total_cutting_time || 0,
      calculate_total_cutting_time: calculate_total_cutting_time || null,
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
      const remainingMessage = messageTypeWebsocketClient.get(client)?.has("remaining");

      // Check if the client has a custom date && custom date is now date
      const lastRequestedDate = clientPreferences.get(client);
      // If the client has a custom date, skip the update
      if (new Date(lastRequestedDate).toLocaleDateString('en-CA') !== new Date().toLocaleDateString("en-CA")) return;
      // Send the update to the client
      switch (true) {
        case timelineMessage:
          console.log("Sending live timeline update from MQTT");
          await MachineWebsocket.timelines(client, lastRequestedDate);
          break;
        case percentageMessage:
          await MachineWebsocket.percentages(client, { date: lastRequestedDate, shift: 0 });
          break;
        case remainingMessage:
          await RemainingController.getRemaining(client);
          break;
      }
    });
  } catch (error) {
    serverError(error, "handleChangeMachineStatus");
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

    console.log(parseMessage, 888)

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

    return await MachineLog.create({
      user_id,
      machine_id: createMachine.id,
      current_status: createMachine.status,
      previous_status: null,
      g_code_name: decryptGCodeName,
      k_num: decryptKNum,
      output_wp: decryptOutputWp,
      tool_name: decryptToolName,
      total_cutting_time: total_cutting_time || 0,
      calculate_total_cutting_time: calculate_total_cutting_time || null,
    });
  } catch (error) {
    serverError(error, "createMachineAndLogFirstTime");
  }
};

/**
 * Update the running time of the last machine log of a given machine.
 *
 * @param {number} machine_id - The ID of the machine to update.
 * @param {boolean} withDescription - Whether to include the description in the update.
 * @returns {Promise<void>}
 */
const updateRunningTodayLastMachineLog = async (
  machine_id,
  withDescription = false
) => {
  try {
    const { dateFrom, dateTo } = await getShiftDateRange(new Date(), 0);
    const lastLog = await MachineLog.findOne({
      where: { machine_id, createdAt: { [Op.between]: [dateFrom, dateTo] } },
      attributes: ["id", "createdAt", "current_status"],
      order: [["createdAt", "DESC"]],
    });
    if (!withDescription || !lastLog) {
      return;
    }

    const isManual =
      isManualLog(lastLog.createdAt) && lastLog.current_status !== "Running";
    if (!isManual) return;

    await MachineLog.update(
      {
        description: "Manual Operation",
        // current_status: isManual ? "Running" : lastLog.current_status,
      },
      {
        where: { id: lastLog.id },
      }
    );
  } catch (error) {
    if (error.message.includes("No daily config")) return console.log(error.message);
    serverError(error, "updateRunningTodayLastMachineLog");
  }
};

module.exports = {
  handleChangeMachineStatus,
  createMachineAndLogFirstTime,
};
