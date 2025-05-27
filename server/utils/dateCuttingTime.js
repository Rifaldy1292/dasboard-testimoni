/**
 * Get the last date of the month
 * @param {Date} [dateParam] - If not provided, use current date
 * @returns { {date: Date} }
 */
const dateCuttingTime = (dateParam) => {
    const nowDate = dateParam ? new Date(dateParam) : new Date();
    const month = nowDate.getMonth() + 1;
    const year = nowDate.getFullYear();
    const date = new Date(year, month, 0);
    return { date };
}

module.exports = dateCuttingTime;

