const { Machine, CuttingTime } = require('../models');
const cron = require('node-cron');
const { config } = require('../utils/dateQuery');
const { serverError } = require('../utils/serverError');
const dateCuttingTime = require('../utils/dateCuttingTime');

/**
 * Function to reset all machine status to null every day at 7:00 AM
 * 
 * @function handleChangeDate
 */
const handleChangeDate = () => {
    const { startHour, startMinute } = config
    cron.schedule(`${startMinute} ${startHour} * * *`, async () => {
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
    });
}

/**
 * Schedules a cron job to create cutting time at the start of each month.
 * The cron job runs on the first day of every month at 00:01.
 * If a cutting time entry for the current period does not exist, a new one is created.
 *
 * @function handleCreateCuttingTime
 */
const handleCreateCuttingTime = () => {
    cron.schedule(`1 0 1 * * *`, async () => {
        try {
            console.log('trigger create cutting time');
            const { date } = dateCuttingTime();
            const existCuttingTime = await CuttingTime.findOne({ where: { period: date }, attributes: ['period'] });
            if (existCuttingTime === null) {
                await CuttingTime.create({
                    period: date,
                });
            }
        } catch (error) {
            serverError(error);
        }
    });
}
module.exports = { handleChangeDate, handleCreateCuttingTime }