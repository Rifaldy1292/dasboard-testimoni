const { Op } = require("sequelize");
const { DailyConfig } = require('../models')


const config = {
  startHour: 7,
  startMinute: 30,
  id: null,
};


/**
 * Creates a date query object for the given date option.
 * If no date option is provided, the current date is used.
 * The date query object contains the start and end of day dates in the format 'YYYY-MM-DDTHH:mm:ss.sssZ'.
 * The start of day is set to 7:30 AM and the end of day is set to 7:29:59 PM of the next day.
 * @param {Date| undefined} [dateOption] - The date option to create the date query for.
 * @returns {Object} The date query object with startInDay and endOfDay properties.
 */

const dateQuery = async (dateOption) => {
  let startMinute = config.startMinute;
  let startHour = config.startHour;
  // example: 2025-04-09
  let nowDate = dateOption
    ? new Date(dateOption).toLocaleDateString('en-CA')
    : new Date().toLocaleDateString('en-CA');

  if (dateOption) {
    const findDailyConfig = await DailyConfig.findOne({
      where: {
        date: new Date(dateOption.toLocaleDateString('en-CA')),
      },
      attributes: ['startFirstShift', 'date'],
    });
    if (findDailyConfig) {
      const { startFirstShift, date } = findDailyConfig.dataValues;
      const [hour, minute] = startFirstShift.split(':').map(Number);
      nowDate = new Date(date).toLocaleDateString('en-CA');
      startHour = hour;
      startMinute = minute;
    }
  }

  const endMinute = startMinute === 0 ? 59 : startMinute - 1;

  // Start time at 7:00 AM on the given date
  const startInDay = new Date(nowDate);
  startInDay.setHours(startHour, startMinute, 0, 0);

  // End time at 6:59 AM on the next day
  const endOfDay = new Date(nowDate);
  endOfDay.setDate(endOfDay.getDate() + 1);
  // console.log(endOfDay.getDate());

  endOfDay.setHours(startHour, endMinute, 59, 999); // Set time to 6:59:59.999 AM

  // Return the date range for the query
  return {
    [Op.between]: [startInDay, endOfDay],
  };
};

module.exports = { dateQuery, config };