const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const cashPaymentController = require('../controllers/cashPayment.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Routes utilisateur standard
 */

/**
 * @route POST /api/payments/initiate
 * @desc Initier un paiement pour une réservation
 * @access Private
 */
router.post('/initiate', authMiddleware, asyncHandler(paymentController.initiatePayment));

/**
 * @route GET /api/payments/confirm
 * @desc Confirmer un paiement après redirection
 * @access Private
 */
router.get('/confirm', authMiddleware, asyncHandler(paymentController.confirmPayment));

/**
 * @route GET /api/payments/history
 * @desc Récupérer l'historique des paiements d'un utilisateur
 * @access Private
 */
router.get('/history', authMiddleware, asyncHandler(paymentController.getUserPayments));

/**
 * @route PUT /api/payments/validate/:reservationId
 * @desc Valider un paiement pour une réservation (Admin)
 * @access Private (Admin)
 */
router.put('/validate/:reservationId', authMiddleware, adminMiddleware, asyncHandler(paymentController.validatePayment));

/**
 * @route POST /api/payments/cash/:reservationId
 * @desc Effectuer un paiement en espèces (Employé/Admin)
 * @access Private (Employee/Admin)
 */
router.post('/cash/:reservationId', authMiddleware, adminMiddleware, asyncHandler(cashPaymentController.createCashPayment));

/**
 * @route GET /api/payments/:id
 * @desc Récupérer les détails d'un paiement
 * @access Private
 */
router.get('/:id', authMiddleware, asyncHandler(paymentController.getPaymentDetails));

/**
 * Routes webhook pour les services de paiement (pas d'authentification requise)
 */

/**
 * @route POST /api/payments/webhook/stripe
 * @desc Webhook pour les notifications Stripe
 * @access Public
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), asyncHandler(paymentController.stripeWebhook));

/**
 * @route POST /api/payments/webhook/wave
 * @desc Webhook pour les notifications WAVE
 * @access Public
 */
router.post('/webhook/wave', asyncHandler(paymentController.waveWebhook));

/**
 * @route POST /api/payments/webhook/orange-money
 * @desc Webhook pour les notifications Orange Money
 * @access Public
 */
router.post('/webhook/orange-money', asyncHandler(paymentController.orangeMoneyWebhook));

/**
 * Routes administrateur
 */

/**
 * @route GET /api/payments
 * @desc Récupérer tous les paiements (admin)
 * @access Private (Admin)
 */
router.get('/', authMiddleware, adminMiddleware, asyncHandler(paymentController.getAllPayments));

/**
 * @route GET /api/payments/admin/all
 * @desc Récupérer tous les paiements (admin) - route alternative
 * @access Private (Admin)
 */
// Route admin avec authentification normale
router.get('/admin/all', authMiddleware, adminMiddleware, asyncHandler(paymentController.getAllPayments));

// Route publique temporaire pour tester (À SUPPRIMER EN PRODUCTION)
router.get('/admin/test', asyncHandler(paymentController.getAllPayments));

module.exports = router;
