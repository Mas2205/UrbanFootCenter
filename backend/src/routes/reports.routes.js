const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');

// Toutes les routes nécessitent une authentification admin
router.use(authMiddleware);
router.use(adminMiddleware);

// KPIs principaux du tableau de bord
router.get('/kpis', reportsController.getDashboardKPIs);

// Statistiques des paiements
router.get('/payments', reportsController.getPaymentStatistics);

// Statistiques des terrains
router.get('/fields', reportsController.getFieldStatistics);

// Statistiques des réservations
router.get('/reservations', reportsController.getReservationStatistics);

// Statistiques des utilisateurs
router.get('/users', reportsController.getUserStatistics);

// Heatmap horaire
router.get('/heatmap', reportsController.getHourlyHeatmap);

// Tendance des revenus
router.get('/revenue-trend', reportsController.getRevenueTrend);

// Export des statistiques
router.get('/export', reportsController.exportStatistics);

module.exports = router;
