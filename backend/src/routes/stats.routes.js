const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { 
  getFieldStats, 
  getFieldStatsByDate, 
  getFieldStatsByHour,
  getStatsByDate 
} = require('../controllers/stats.controller');

/**
 * @route GET /api/stats/field
 * @desc Récupérer les statistiques globales d'un terrain
 * @access Private (Admin/Super Admin)
 */
router.get('/field', authMiddleware, adminMiddleware, getFieldStats);

/**
 * @route GET /api/stats/field/by-date
 * @desc Récupérer les statistiques d'un terrain par date
 * @access Private (Admin/Super Admin)
 */
router.get('/field/by-date', authMiddleware, adminMiddleware, getFieldStatsByDate);

/**
 * @route GET /api/stats/field/by-hour
 * @desc Récupérer les statistiques d'un terrain par heure pour une date donnée
 * @access Private (Admin/Super Admin)
 */
router.get('/field/by-hour', authMiddleware, adminMiddleware, getFieldStatsByHour);

/**
 * @route GET /api/stats/by-date
 * @desc Récupérer les statistiques globales par date (tous terrains)
 * @access Private (Admin/Super Admin)
 */
router.get('/by-date', authMiddleware, adminMiddleware, getStatsByDate);

module.exports = router;
