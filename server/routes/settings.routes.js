const SettingsController = require("../controllers/SettingsController");
const authMiddleware = require("../middlewares/auth");

const settingsRoutes = require("express").Router();

settingsRoutes.get('/daily-config', authMiddleware, SettingsController.getListDailyConfig)
settingsRoutes.patch('/daily-config', authMiddleware, SettingsController.editDailyConfig)
settingsRoutes.delete('/daily-config/:id', authMiddleware, SettingsController.deleteDailyConfig)
settingsRoutes.get('/cutting-times', authMiddleware, SettingsController.getListCuttingTime)
settingsRoutes.post('/daily-config', authMiddleware, SettingsController.createDailyConfig)
settingsRoutes.patch(
    "/cutting-time/:id",
    authMiddleware,
    SettingsController.editCuttingTime
)

module.exports = settingsRoutes;