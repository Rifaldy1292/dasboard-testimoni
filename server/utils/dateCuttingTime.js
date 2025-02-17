/**
 * Generates date object for cutting time based on given date or current date.
 * 
 * @param {Date} [dateParam] - Date object to generate date for cutting time. If not provided, current date will be used.
 * @returns {{ date: Date }} - Object with date property.
 */
const dateCuttingTime = (dateParam) => {
    const nowDate = dateParam || new Date();
    const month = nowDate.getMonth() + 1;
    const year = nowDate.getFullYear();
    const date = new Date(year, month, 0);
    return { date, month, year };
}

module.exports =
    dateCuttingTime
