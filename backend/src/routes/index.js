const express = require('express');
const router = express.Router();

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

// Routes principales
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/fields', require('./field.routes'));
router.use('/reservations', require('./reservation.routes'));
router.use('/reservations', require('./reservation_with_payment.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/stats', require('./stats.routes'));
router.use('/availability', require('./availability.routes'));

// Route temporaire pour setup production
router.use('/admin-setup', require('./admin-setup.routes'));

// Routes additionnelles (avec gestion d'erreur si fichiers manquants)
try {
  router.use('/admin', require('./admin.routes'));
} catch (e) {
  console.log('⚠️  admin.routes.js non trouvé, ignoré');
}

// Routes employés pour admins de terrain
try {
  router.use('/admin/employees', require('./employee.routes'));
} catch (e) {
  console.log('⚠️  employee.routes.js non trouvé, ignoré');
}

try {
  router.use('/regions', require('./region.routes'));
} catch (e) {
  console.log('⚠️  region.routes.js non trouvé, ignoré');
}

try {
  router.use('/payment-methods', require('./payment_method.routes'));
} catch (e) {
  console.log('⚠️  payment_method.routes.js non trouvé, ignoré');
}

// Réponse temporaire pour les routes non implémentées
const notImplemented = (req, res) => {
  res.status(501).json({ 
    success: false,
    message: 'Cette fonctionnalité n\'est pas encore implémentée' 
  });
};

// Routes temporaires non implémentées
router.get('/teams', notImplemented);
router.post('/teams', notImplemented);
router.get('/promos', notImplemented);
router.post('/promos', notImplemented);
router.get('/notifications', notImplemented);
router.post('/notifications', notImplemented);

module.exports = router;
