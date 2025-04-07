const { Op } = require("sequelize");

/**
 * Creates a date query object for the given date option.
 * If no date option is provided, the current date is used.
 * The date query object contains the start and end of day dates in the format 'YYYY-MM-DDTHH:mm:ss.sssZ'.
 * The start of day is set to 7:30 AM and the end of day is set to 7:29:59 PM of the next day.
 * @param {string|Date} [dateOption] - The date option in the format 'YYYY-MM-DD' or a Date object.
 * @returns {Object} The date query object with startInDay and endOfDay properties.
 */

// TODO: besok cek datequery ketika get cutting time

const config = {
  startHour: 7,
  startMinute: 30,
};

// let endMinute = startMinute === 0 ? 59 : startMinute - 1

const dateQuery = (dateOption) => {
  const { startMinute, startHour } = config;
  const endMinute = startMinute === 0 ? 59 : startMinute - 1;
  const timezoneOffset = 7;

  // Create a new Date object from the provided dateOption to avoid mutation
  const nowDate = dateOption
    ? new Date(dateOption).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  // const fixDate = new Date(nowDate.toISOString().split("T")[0]);

  // Start time at 7:00 AM on the given date
  const startInDay = new Date(nowDate);
  startInDay.setHours(startHour, startMinute, 0, 0);

  // End time at 6:59 AM on the next day
  const endOfDay = new Date(nowDate);
  endOfDay.setDate(endOfDay.getDate() + 1);
  // console.log(endOfDay.getDate());

  endOfDay.setHours(startHour - 1, endMinute, 59, 999); // Set time to 6:59:59.999 AM

  // Return the date range for the query
  return {
    [Op.between]: [startInDay, endOfDay],
  };
};

module.exports = { dateQuery, config };
// jakarta timezone
// const test = new Date("2025-02-22 14:20");
// const test2 = new Date(test);
// // test2.setUTCHours(7, 0, 0, 0);
// console.log(test2, 8);
