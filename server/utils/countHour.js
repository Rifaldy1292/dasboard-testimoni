class countHour {
    static totalHour(runningHour) {
        const hour = Math.round(runningHour / (1000 * 60 * 60));
        const minute = Math.round((runningHour / (1000 * 60)) % 60);
        // return runningHour
        const totalHour = Number(`${hour}.${minute}`)
        return totalHour
    }
    static percentage(runningHour, perfectTime) {
        const hour = Math.round(runningHour / (1000 * 60 * 60));
        const minute = Math.round((runningHour / (1000 * 60)) % 60);
        // return runningHour
        const totalHour = Number(`${hour}.${minute}`)
        // return totalHour / 10
        const percentage = Math.round((totalHour / perfectTime) * 100)
        return percentage
    }


}

module.exports = countHour