const { Op } = require('sequelize');
const { Machine, MachineLog } = require('../models');
const testDate = () => {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    const totalDayInMonth = new Date(year, month + 1, 0).getDate(); // Get number of days 
    return { month, year, totalDayInMonth }
}

class MachineController {
    static async getCuttingTime() {
        const { month, year, totalDayInMonth } = testDate();
    }
}

module.exports = MachineController;