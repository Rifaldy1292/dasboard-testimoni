const SettingsController = require("../controllers/SettingsController");
const authMiddleware = require("../middlewares/auth");

const settingsRoutes = require("express").Router();

settingsRoutes.get('/daily-config', authMiddleware, SettingsController.getListDailyConfig)
settingsRoutes.patch('/daily-config', authMiddleware, SettingsController.editDailyConfig)
settingsRoutes.get('/cutting-times', authMiddleware, SettingsController.getListCuttingTime)

module.exports = settingsRoutes;