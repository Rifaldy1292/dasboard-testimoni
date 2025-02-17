/**
 * Utility class for calculating total hours and percentages.
 */
class countHour {
    /**
     * Calculates the total hours and minutes from milliseconds.
     * 
     * @param {number} runningHour - The running hours in milliseconds.
     * @returns {string} The total hours and minutes as a string in 'hour.minute' format.
     */
    static totalHour(runningHour) {
        const hour = Math.floor(runningHour / (1000 * 60 * 60));
        const minute = Math.round((runningHour / (1000 * 60)) % 60);
        const totalHour = `${hour}.${minute}`;
        return totalHour;
    }

    /**
     * Calculates the percentage of running hours compared to perfect time.
     * 
     * @param {number} runningHour - The running hours in milliseconds.
     * @param {number} perfectTime - The perfect running time in hours.
     * @returns {number} The percentage of running hours.
     */
    static percentage(runningHour, perfectTime) {
        const hour = Math.floor(runningHour / (1000 * 60 * 60));
        const minute = Math.round((runningHour / (1000 * 60)) % 60);
        const totalHour = Number(`${hour}.${minute}`);
        const percentage = Math.round((totalHour / perfectTime) * 100);
        return percentage;
    }

    /**
     * Converts milliseconds to hours and returns it as a string with one decimal place.
     * @param {number} milliseconds - The time in milliseconds.
     * @returns {string} The time in hours with one decimal place.
     */
    static convertMilisecondToHour(milliseconds) {
        const seconds = milliseconds / 1000;
        const minute = seconds / 60;
        const hours = minute / 60;
        return Number(hours.toFixed(1));
    }
}

module.exports = countHour;
