const { Machine, CuttingTime, DailyConfig } = require("../models");
const cron = require("node-cron");
const { serverError } = require("../utils/serverError");
const dateCuttingTime = require("../utils/dateCuttingTime");
const { getAllMachine } = require("../utils/machineUtils");

/**
 * Creates a new cutting time entry for the current period if one doesn't exist.
 * Uses dateCuttingTime utility to determine the current period.
 *
 * @async
 * @function createCuttingTime
 * @returns {Promise<void>} A promise that resolves when the cutting time entry is created
 * @throws {Error} If database operation fails
 */
const createCuttingTime = async () => {
  try {
    console.log("trigger create cutting time");
    const { date } = dateCuttingTime();

    await CuttingTime.create({
      period: date,
    });
  } catch (error) {
    if (error.message === "Cutting time for this month already exists") return;
    serverError(error, "from createCuttingTime cronjob");
  }
};

/**
 * Creates a new daily configuration entry for the current date if one doesn't exist.
 * Sets default values for first and second shift start times based on config.
 *
 * @async
 * @function createDailyConfig
 * @returns {Promise<void>} A promise that resolves when the daily config is created
 * @throws {Error} If database operation fails
 * @see config For start time configuration values
 */
const createDailyConfig = async () => {
  try {
    console.log("trigger create daily config");
    const date = new Date().toLocaleDateString("en-CA");
    /**
     * @example 02:04:00
     * @type {string | null} startSecondShift
     */

    const existDailyConfig = await DailyConfig.findOne({
      where: { date },
      attributes: ['id']
    });
    if (existDailyConfig) return;
    const findLastDailyConfig = await DailyConfig.findOne({
      attributes: ["date", "startFirstShift", "startSecondShift", "endFirstShift", "endSecondShift"],
      order: [['createdAt', "DESC"]],
      raw: true,
    });
    await DailyConfig.create({ ...findLastDailyConfig, date });
  } catch (error) {
    serverError(error);
  }
};

/**
 * Resets the status of all machines to null.
 *
 * @async
 * @function handleResetMachineStatus
 * @returns {Promise<void>} A promise that resolves when all machine statuses are reset
 * @throws {Error} If database operation fails
 */
const handleResetMachineStatus = async () => {
  try {
    // update all status machine false
    const updateMachine = await Machine.update(
      {
        status: null,
      },
      {
        where: {},
      }
    );
    await getAllMachine();
    console.log(updateMachine, "reset status machine null");
  } catch (error) {
    serverError(error);
  }
};

const deleteCncFiles = async () => {
  const folderPath = path.join(__dirname, "public", "cnc_files");
  try {
    await fs.promises.rm(folderPath, { recursive: true, force: true });
    console.log("successfully deletted folder cnc_files");
  } catch (err) {
    serverError(err, "failed delete folder cnc_files");
  }
};

/**
 * Initializes and schedules all cron jobs for the application.
 * Sets up jobs for machine status reset, cutting time creation, and daily configuration creation.
 * All jobs execute at the configured start time specified in config.
 * Also performs initial creation of cutting time and daily config entries.
 *
 * @async
 * @function handleCronJob
 * @returns {Promise<void>} A promise that resolves when initial setup is complete
 * @see config For start time configuration
 * @see createCuttingTime
 * @see createDailyConfig
 * @see handleResetMachineStatus
 */
const handleCronJob = async () => {
  await createDailyConfig();
  // handleResetMachineStatus();

  // jam 12 malam pergantian hari
  cron.schedule(`0 0 * * *`, async () => {
    await createDailyConfig();
    createCuttingTime();
    deleteCncFiles();
  });

  // find last daily config
  const findDailyConfig = await DailyConfig.findOne({
    attributes: ["startFirstShift"],
    order: [['createdAt', "DESC"]]
  });

  if (!findDailyConfig) return;
  const { startFirstShift } = findDailyConfig;
  const [startHour, startMinute] = startFirstShift.split(":").map(Number);
  cron.schedule(`${startMinute} ${startHour} * * *`, async () => {
    await createDailyConfig();
    await handleResetMachineStatus();
    createCuttingTime();
  });

  console.log("cronjob finished");
};
module.exports = handleCronJob;
