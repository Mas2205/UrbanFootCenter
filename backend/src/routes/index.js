const express = require('express');
const router = express.Router();

// Importer toutes les routes
const authRoutes = require('./auth.routes');
const fieldRoutes = require('./field.routes');
const reservationRoutes = require('./reservation.routes');
const paymentRoutes = require('./payment.routes');
const employeeRoutes = require('./employee.routes');
const reportsRoutes = require('./reports.routes');
const statsRoutes = require('./stats.routes');
const adminRoutes = require('./admin.routes');
const availabilityRoutes = require('./availability.routes');
const regionRoutes = require('./region.routes');

// Routes manquantes avec structure minimale
const userRoutes = require('./user.routes');
const teamRoutes = express.Router();
const promoRoutes = express.Router();
const notificationRoutes = express.Router();

// Réponse temporaire pour les routes non implémentées
const notImplemented = (req, res) => {
  res.status(501).json({ message: 'Cette fonctionnalité n\'est pas encore implémentée' });
};

teamRoutes.get('/', notImplemented);
teamRoutes.post('/', notImplemented);

promoRoutes.get('/', notImplemented);
promoRoutes.post('/', notImplemented);

notificationRoutes.get('/', notImplemented);
notificationRoutes.post('/', notImplemented);

/**
 * @route GET /api
 * @desc Route de test pour l'API
 * @access Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Urban Foot Center fonctionnelle',
    version: '1.0.0'
  });
});

// Monter les routes
router.use('/auth', authRoutes);
router.use('/fields', fieldRoutes);

// Routes de réservation (inclut maintenant les routes avec paiement)
router.use('/reservations', reservationRoutes);

router.use('/payments', paymentRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/employees', employeeRoutes);
router.use('/reports', reportsRoutes);
router.use('/stats', statsRoutes);

// Routes pour la gestion des disponibilités (admin de terrain)
router.use('/availability', require('./availability.routes'));

// Routes pour la gestion des moyens de paiement (admin de terrain)
router.use('/payment-methods', require('./payment_method.routes'));

// Routes pour les régions et villes
router.use('/regions', regionRoutes);

module.exports = router;
