const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');
const reservationWithPaymentController = require('../controllers/reservation_with_payment.controller');
const { authMiddleware, adminMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Routes utilisateur standard
 */

/**
 * @route POST /api/reservations
 * @desc Créer une nouvelle réservation
 * @access Private
 */
router.post('/', authMiddleware, asyncHandler(reservationController.createReservation));

/**
 * @route GET /api/reservations
 * @desc Récupérer les réservations de l'utilisateur connecté avec filtrage (status) et pagination
 * @access Private
 */
router.get('/', authMiddleware, asyncHandler(reservationController.getUserReservations));

/**
 * @route GET /api/reservations/me
 * @desc Récupérer toutes les réservations de l'utilisateur connecté (ancienne route gardée pour compatibilité)
 * @access Private
 */
router.get('/me', authMiddleware, asyncHandler(reservationController.getUserReservations));

/**
 * @route GET /api/reservations/field/:fieldId/date/:date
 * @desc Récupérer les réservations d'un terrain pour une date spécifique
 * @access Public
 */
router.get('/field/:fieldId/date/:date', asyncHandler(reservationController.getReservationsByFieldAndDate));

/**
 * @route GET /api/reservations/:id
 * @desc Récupérer une réservation par son ID
 * @access Private
 */
router.get('/:id', authMiddleware, asyncHandler(reservationController.getReservationById));

/**
 * @route POST /api/reservations/:id/cancel
 * @desc Annuler une réservation
 * @access Private
 */
router.post('/:id/cancel', authMiddleware, asyncHandler(reservationController.cancelReservation));

/**
 * @route POST /api/reservations/:id/pay
 * @desc Payer une réservation
 * @access Private
 */
router.post('/:id/pay', authMiddleware, asyncHandler(reservationController.payReservation));

/**
 * @route POST /api/reservations/payment-callback
 * @desc Callback pour les notifications de paiement (webhook)
 * @access Public
 */
router.post('/payment-callback', 
  asyncHandler(reservationWithPaymentController.paymentCallback)
);

/**
 * @route GET /api/reservations/payment-methods/:field_id
 * @desc Obtenir les moyens de paiement disponibles pour un terrain
 * @access Private
 */
router.get('/payment-methods/:field_id', 
  authMiddleware,
  asyncHandler(reservationWithPaymentController.getAvailablePaymentMethods)
);

/**
 * Routes administrateur
 */

/**
 * @route GET /api/reservations/admin/all
 * @desc Récupérer toutes les réservations (admin)
 * @access Private (Admin)
 */
router.get('/admin/all', authMiddleware, adminMiddleware, asyncHandler(reservationController.getAllReservations));

/**
 * @route PUT /api/reservations/admin/:id/status
 * @desc Mettre à jour le statut d'une réservation (admin)
 * @access Private (Admin)
 */
router.put('/admin/:id/status', authMiddleware, adminMiddleware, asyncHandler(reservationController.updateReservationStatus));

module.exports = router;
