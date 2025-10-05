const express = require('express');
const router = express.Router();
const reservationWithPaymentController = require('../controllers/reservation_with_payment.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Route pour créer une réservation avec paiement intégré
router.post('/with-payment', 
  roleMiddleware(['client', 'user', 'employee', 'admin', 'super_admin']), 
  reservationWithPaymentController.createReservationWithPayment
);

// Route pour le callback de paiement (webhook)
router.post('/payment-callback', 
  reservationWithPaymentController.paymentCallback
);

// Route pour obtenir les moyens de paiement disponibles pour un terrain
router.get('/payment-methods/:field_id', 
  reservationWithPaymentController.getAvailablePaymentMethods
);

module.exports = router;
