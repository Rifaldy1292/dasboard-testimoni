const { CuttingTime } = require('../models');

const createCuttingTime = async () => {
    try {
        const nowDate = new Date();
        const month = nowDate.getMonth() + 1;
        const year = nowDate.getFullYear();
        const date = new Date(year, month, 0);

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