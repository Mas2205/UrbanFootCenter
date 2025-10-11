const express = require('express');
const router = express.Router();
const regionController = require('../controllers/region.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Routes publiques
router.get('/cities', regionController.getCities);
router.get('/', regionController.getRegions);
router.get('/:regionName/cities', regionController.getCitiesByRegion);

// Routes admin (nécessitent authentification et rôle super_admin)
// Ces routes seront accessibles via /api/admin/regions/* grâce au montage dans index.js

module.exports = router;
