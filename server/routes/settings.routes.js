const SettingsController = require("../controllers/SettingsController");
const authMiddleware = require("../middlewares/auth");

const settingsRoutes = require("express").Router();

settingsRoutes.get('/list', authMiddleware, SettingsController.getListDailyConfig)
settingsRoutes.get('/start-time', authMiddleware, SettingsController.getStartTime)
settingsRoutes.put('/start-time', authMiddleware, SettingsController.editStartTime)

module.exports = settingsRoutes;