const { Op } = require("sequelize");

/**
 * Creates a date query object for the given date option.
 * If no date option is provided, the current date is used.
 * The date query object contains the start and end of day dates in the format 'YYYY-MM-DDTHH:mm:ss.sssZ'.
 * The start of day is set to 7:30 AM and the end of day is set to 7:29:59 PM of the next day.
 * @param {string|Date} [dateOption] - The date option in the format 'YYYY-MM-DD' or a Date object.
 * @returns {Object} The date query object with startInDay and endOfDay properties.
 */

const config = {
  startHour: 7,
  startMinute: 0,
};

// let endMinute = startMinute === 0 ? 59 : startMinute - 1

const dateQuery = (dateOption) => {
  const { startMinute, startHour } = config;
  const endMinute = startMinute === 0 ? 59 : startMinute - 1;

  // Create a new Date object from the provided dateOption to avoid mutation
  const nowDate = dateOption ? new Date(dateOption) : new Date();
  console.log("nowDate:", nowDate);

  // Convert nowDate to local time (we need to account for the local time zone offset)
  const localTime = new Date(
    nowDate.getTime() - nowDate.getTimezoneOffset() * 60000
  );
  console.log("localTime:", localTime); // Shows the date converted to local time

  // Start time at 7:00 AM on the given date
  const startInDay = new Date(localTime); // Make a copy of localTime for startInDay
  // startInDay.setHours(startHour, startMinute, 0, 0);
  startInDay.setHours(startHour, startMinute, 0, 0);
  console.log("startInDay:", startInDay);

  // End time at 6:59 AM on the next day
  const endOfDay = new Date(localTime); // Make a copy of localTime for endOfDay
  endOfDay.setDate(localTime.getDate() + 1); // Move to the next day
  endOfDay.setHours(startHour - 1, endMinute, 59, 999); // Set time to 6:59:59.999 AM
  console.log("endOfDay:", endOfDay);

  // Return the date range for the query
  return {
    [Op.between]: [startInDay.toString(), endOfDay.toString()],
  };
};

module.exports = { dateQuery, config };

// const test = new Date();
// test.setHours(7, 0, 0, 0);
// console.log(test.toISOString());
