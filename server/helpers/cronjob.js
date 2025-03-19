const { Machine , CuttingTime } = require('../models');
const cron = require('node-cron');
const { config } = require('../utils/dateQuery');
const { serverError } = require('../utils/serverError');
const dateCuttingTime = require('../utils/dateCuttingTime');

/**
 * Function to reset all machine status to null every day at 00:00
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

const handleCreateCuttingTime = () => {
    const { startHour, startMinute } = config
    cron.schedule(`${startMinute} ${startHour} * * *`, async () => {
        try {
            const { date } = dateCuttingTime()
            const existCuttingTime = await CuttingTime.findOne({ where: { period: date }, attributes: ['period'] });
            if (existCuttingTime === null) {
                return await CuttingTime.create({
                    period: date,
                });
            }
        } catch (error) {
            serverError(error)
        }
    });
}

module.exports = {handleChangeDate}