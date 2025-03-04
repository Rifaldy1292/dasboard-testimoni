const { Op } = require("sequelize");

/**
 * Creates a date query object for the given date option.
 * If no date option is provided, the current date is used.
 * The date query object contains the start and end of day dates in the format 'YYYY-MM-DDTHH:mm:ss.sssZ'.
 * The start of day is set to 7:30 AM and the end of day is set to 7:29:59 PM of the next day.
 * @param {string|Date} [dateOption] - The date option in the format 'YYYY-MM-DD' or a Date object.
 * @returns {Object} The date query object with startInDay and endOfDay properties.
 */
const dateQuery = (dateOption) => {
    const nowDate = dateOption ? new Date(dateOption) : new Date();

    // 7:00 - 6:59
    const startInDay = new Date(nowDate.setHours(7, 0, 0, 0));

    const endOfDay = new Date(nowDate.setDate(nowDate.getDate() + 1));
    endOfDay.setHours(6, 59, 59, 999);

    return {
        [Op.between]: [startInDay, endOfDay]
    }
}

module.exports = dateQuery
