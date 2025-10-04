const express = require('express');
const router = express.Router();
const regionController = require('../controllers/region.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

// Routes publiques
router.get('/cities', regionController.getCities);
router.get('/regions', regionController.getRegions);
router.get('/regions/:regionName/cities', regionController.getCitiesByRegion);

module.exports = router;
