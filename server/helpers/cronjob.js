const path = require("path");
const cron = require("node-cron");
const fs = require("fs");
const { Machine, CuttingTime, DailyConfig } = require("../models");
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
      attributes: ["date", "startFirstShift", "startSecondShift", "endFirstShift", "endSecondShift"],
      order: [['createdAt', "DESC"]],
      raw: true,
    });
    if (existDailyConfig) return;
    await DailyConfig.create({ ...existDailyConfig, date });
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
  const folderPath = path.join(__dirname, "..", "public", "cnc_files");
  try {
    await fs.promises.rm(folderPath, { recursive: true, force: true });
    console.log("successfully deleted folder cnc_files");
  } catch (err) {
    serverError(err, "failed delete folder cnc_files");
  }
};

const findLastDailyConfig = async () => {
  const findDailyConfig = await DailyConfig.findOne({
    attributes: ["startFirstShift", "startSecondShift", "endFirstShift", "endSecondShift"],
    order: [['createdAt', "DESC"]],
    raw: true,
  });
  if (!findDailyConfig) return null;
  return findDailyConfig;
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
  // Store active cron jobs to destroy them when updating
  let activeCronJobs = [];

  const setupShiftCronJobs = async () => {
    console.log("Setting up shift cron jobs...");

    // Destroy existing cron jobs
    activeCronJobs.forEach(job => {
      if (job && typeof job.destroy === 'function') {
        job.destroy();
      }
    });
    activeCronJobs = [];

    // Get latest daily config
    const latestDailyConfig = await findLastDailyConfig();
    if (!latestDailyConfig) {
      console.log("No daily config found, skipping shift cron jobs");
      return;
    }

    const { startFirstShift, startSecondShift, endFirstShift, endSecondShift } = latestDailyConfig;
    const [startHour1, startMinute1] = startFirstShift.split(":").map(Number);
    const [startHour2, startMinute2] = startSecondShift.split(":").map(Number);
    const [endHour1, endMinute1] = endFirstShift.split(":").map(Number);
    const [endHour2, endMinute2] = endSecondShift.split(":").map(Number);

    // Create new cron jobs with latest config
    const job1 = cron.schedule(`${startMinute1} ${startHour1} * * *`, () => {
      createDailyConfig();
      handleResetMachineStatus();
    });

    const job2 = cron.schedule(`${endMinute1} ${endHour1} * * *`, () => {
      createDailyConfig();
      handleResetMachineStatus();
    });

    const job3 = cron.schedule(`${startMinute2} ${startHour2} * * *`, () => {
      createDailyConfig();
      handleResetMachineStatus();
    });

    const job4 = cron.schedule(`${endMinute2} ${endHour2} * * *`, () => {
      createDailyConfig();
      handleResetMachineStatus();
    });

    // Store jobs for future cleanup
    activeCronJobs = [job1, job2, job3, job4];

    console.log(`Cron jobs updated - Start1: ${startHour1}:${startMinute1}, End1: ${endHour1}:${endMinute1}, Start2: ${startHour2}:${startMinute2}, End2: ${endHour2}:${endMinute2}`);
  };

  // Initial setup saat startup
  await createDailyConfig();
  await createCuttingTime();
  await setupShiftCronJobs();

  // Daily cron job at midnight - update schedule dengan config terbaru
  cron.schedule(`0 0 * * *`, async () => {
    await deleteCncFiles();
    await createDailyConfig();
    await createCuttingTime();

    // Re-setup cron jobs dengan config terbaru
    await setupShiftCronJobs();
  });

  console.log("cronjob finished initialization");
};
module.exports = handleCronJob;
