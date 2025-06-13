const path = require("path");
const cron = require("node-cron");
const fs = require("fs");
const { Machine, CuttingTime, DailyConfig } = require("../models");
const dateCuttingTime = require("../utils/dateCuttingTime");
const { getAllMachine } = require("../utils/machineUtils");
const { machineLoggerError, machineLoggerInfo, machineLoggerWarn } = require("../utils/logger"); // Import helper functions

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
  const CONTEXT = "createCuttingTime";
  try {
    machineLoggerInfo("Trigger create cutting time", CONTEXT);
    const { date } = dateCuttingTime();

    await CuttingTime.create({
      period: date,
    });
    machineLoggerInfo(`Cutting time created for period: ${date}`, CONTEXT);
  } catch (error) {
    if (error.message === "Cutting time for this month already exists") {
      machineLoggerInfo("Cutting time for this month already exists, skipping creation", CONTEXT);
      return;
    }

    machineLoggerError(error, CONTEXT);
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
    machineLoggerInfo("Trigger create daily config");
    const date = new Date().toLocaleDateString("en-CA");
    /**
     * @example 02:04:00
     * @type {string | null} startSecondShift
     */

    const existDailyConfig = await DailyConfi.findOne({
      where: { date },
      attributes: ["date", "startFirstShift", "startSecondShift", "endFirstShift", "endSecondShift"],
      order: [['createdAt', "DESC"]],
      raw: true,
    });
    if (existDailyConfig) return;
    await DailyConfig.create({ ...existDailyConfig, date });
  } catch (error) {
    machineLoggerError(error, "createDailyConfig");
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
    machineLoggerInfo(`Successfully reset machine status, affected rows: ${updateMachine[0]}`);
  } catch (error) {
    machineLoggerError(error, "handleResetMachineStatus");
  }
};

const deleteCncFiles = async () => {
  const folderPath = path.join(__dirname, "..", "public", "cnc_files");
  try {
    await fs.promises.rm(folderPath, { recursive: true, force: true });
    machineLoggerInfo("Successfully deleted folder cnc_files");
  } catch (err) {
    machineLoggerError(err, "failed delete folder cnc_files");
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
 * Cleans up log files by recreating the logs directory
 * More efficient than deleting files individually
 * 
 * @async
 * @function cleanupLogFiles
 * @returns {Promise<void>} A promise that resolves when log cleanup is complete
 * @throws {Error} If file operations fail
 */
const cleanupLogFiles = async () => {
  const CONTEXT = "cleanupLogFiles";
  try {
    machineLoggerInfo("Starting weekly log files cleanup", CONTEXT);

    // Define the log directory path
    const logDir = path.join(__dirname, "..", "logs");

    // Ensure we don't remove logs in use
    machineLoggerInfo("Closing active log streams before cleanup", CONTEXT);

    // Remove and recreate logs directory
    await fs.promises.rm(logDir, { recursive: true, force: true });
    machineLoggerInfo("Log directory removed successfully", CONTEXT);

    // Create logs directory again
    await fs.promises.mkdir(logDir, { recursive: true });
    machineLoggerInfo("Log directory recreated successfully", CONTEXT);

    machineLoggerInfo("Log cleanup completed successfully", CONTEXT);
  } catch (error) {
    machineLoggerError(`Failed to clean up log files: ${error.message}`, CONTEXT);
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
  // Store active cron jobs to destroy them when updating
  let activeCronJobs = [];
  const setupShiftCronJobs = async () => {
    machineLoggerInfo("Setting up shift cron jobs...");

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
      machineLoggerWarn("No daily config found, skipping shift cron jobs");
      return;
    }

    const { startFirstShift, startSecondShift, endFirstShift, endSecondShift } = latestDailyConfig;
    const [startHour1, startMinute1] = startFirstShift.split(":").map(Number);
    const [startHour2, startMinute2] = startSecondShift.split(":").map(Number);
    const [endHour1, endMinute1] = endFirstShift.split(":").map(Number);
    const [endHour2, endMinute2] = endSecondShift.split(":").map(Number);

    // Create new cron jobs with latest config
    const job1 = cron.schedule(`${startMinute1} ${startHour1} * * *`, () => {
      machineLoggerInfo(`Executing scheduled job at ${startHour1}:${startMinute1} (first shift start)`);
      createDailyConfig();
      handleResetMachineStatus();
    });

    const job2 = cron.schedule(`${endMinute1} ${endHour1} * * *`, () => {
      machineLoggerInfo(`Executing scheduled job at ${endHour1}:${endMinute1} (first shift end)`);
      createDailyConfig();
      handleResetMachineStatus();
    });


    // Store jobs for future cleanup
    activeCronJobs = [job1, job2];

    machineLoggerInfo(`Cron jobs updated - Start1: ${startHour1}:${startMinute1}, End1: ${endHour1}:${endMinute1}, Start2: ${startHour2}:${startMinute2}, End2: ${endHour2}:${endMinute2}`);
  };

  // Initial setup saat startup
  await createDailyConfig();
  await createCuttingTime();
  await setupShiftCronJobs();
  // Daily cron job at midnight - update schedule dengan config terbaru
  cron.schedule(`0 0 * * *`, async () => {
    machineLoggerInfo("Executing daily midnight job for maintenance tasks");
    await deleteCncFiles();
    await createDailyConfig();
    await createCuttingTime();

    // Re-setup cron jobs dengan config terbaru
    await setupShiftCronJobs();
    machineLoggerInfo("Midnight maintenance job completed");
  });

  // Weekly log cleanup job - runs every Sunday at midnight (0 0 * * 0)
  cron.schedule(`0 0 * * 0`, async () => {
    machineLoggerInfo("Starting weekly log cleanup job");
    await cleanupLogFiles();
    machineLoggerInfo("Weekly log cleanup job completed");
  });

  machineLoggerInfo("Cronjob system finished initialization");
};

module.exports = handleCronJob;
