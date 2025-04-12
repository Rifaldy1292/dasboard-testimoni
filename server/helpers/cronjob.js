const { Machine, CuttingTime, DailyConfig } = require('../models');
const cron = require('node-cron');
const { config } = require('../utils/dateQuery');
const { serverError } = require('../utils/serverError');
const dateCuttingTime = require('../utils/dateCuttingTime');

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
        console.log('trigger create cutting time');
        const { date } = dateCuttingTime();
        const existCuttingTime = await CuttingTime.findOne({
            where: {
                period: date,
            },
            attributes: ['period']
        });
        if (existCuttingTime) return;

        await CuttingTime.create({
            period: date,
        });
    } catch (error) {
        serverError(error);
    }
}

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
        console.log('trigger create daily config');
        const date = new Date().toLocaleDateString('en-CA')
        /** 
         * @example 02:04:00
         * @type {string | null} startSecondShift
         */
        const findDailyConfig = await DailyConfig.findOne({
            where: {
                date,
            },
            attributes: ['startFirstShift', 'id']
        });


        if (findDailyConfig) {
            const { startFirstShift, id } = findDailyConfig.dataValues
            config.startHour = startFirstShift.split(':')[0];
            config.startMinute = startFirstShift.toString().split(':')[1];
            config.id = id
            return
        }


        let secondShiftHour = config.startHour + 12;
        if (secondShiftHour >= 24) secondShiftHour -= 24;

        const defaultValueDailyConfig = {
            startFirstShift: `${config.startHour}:${config.startMinute}`,
            startSecondShift: `${secondShiftHour}:${config.startMinute}`,
        }
        await DailyConfig.create({
            date,
            ...defaultValueDailyConfig,
        });
    } catch (error) {
        serverError(error);
    }
}

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
        const updateMachine = await Machine.update({
            status: null
        }, {
            where: {}
        })
        console.log(updateMachine, 'reset status machine null')
    } catch (error) {
        serverError(error)
    }
}

const deleteCncFiles = async () => {
    const folderPath = path.join(__dirname, 'public', 'cnc_files');
    try {
        await fs.promises.rm(folderPath, { recursive: true, force: true });
        console.log('successfully deletted folder cnc_files')
    } catch (err) {
        serverError(err, 'failed delete folder cnc_files')
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
    await createCuttingTime();
    await createDailyConfig();

    const { startHour, startMinute } = config
    cron.schedule(`${startMinute} ${startHour} * * *`, async () => {
        await createCuttingTime();
        await createDailyConfig();
        await handleResetMachineStatus();
        await deleteCncFiles()
    });

    console.log('cronjob finished')
}
module.exports = handleCronJob

