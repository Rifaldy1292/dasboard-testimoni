const { CuttingTime } = require('../models');
const dateCuttingTime = require('../utils/dateCuttingTime');

const createCuttingTime = async () => {
    try {
        const { date } = dateCuttingTime();
        const existCuttingTime = await CuttingTime.findOne({ where: { period: date } });
        if (existCuttingTime === null) {
            return await CuttingTime.create({
                period: date,
            });
        }
    } catch (error) {
        console.error({ error, message: error.message });
    }
}

module.exports = {
    createCuttingTime
}