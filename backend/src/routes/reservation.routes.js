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
 * @route POST /api/reservations/with-payment
 * @desc Créer une réservation avec paiement intégré
 * @access Private
 */
router.post('/with-payment', 
  (req, res, next) => {
    console.log('🔍 Middleware debug - Route /with-payment atteinte');
    console.log('🔍 Body reçu:', req.body);
    console.log('🔍 Headers auth:', req.headers.authorization ? 'Présent' : 'Absent');
    next();
  },
  authMiddleware, 
  (req, res, next) => {
    console.log('🔍 Après authMiddleware - User:', req.user ? `${req.user.email} (${req.user.role})` : 'Aucun');
    next();
  },
  roleMiddleware(['client', 'user', 'admin', 'super_admin']), 
  (req, res, next) => {
    console.log('🔍 Après roleMiddleware - Accès autorisé');
    next();
  },
  async (req, res) => {
    try {
      console.log('🔍 Entrée dans le contrôleur');
      console.log('🔍 Body:', JSON.stringify(req.body, null, 2));
      
      const { field_id, payment_method } = req.body;
      
      // Si c'est Wave, récupérer l'URL configurée
      if (payment_method === 'wave') {
        const { PaymentMethod } = require('../models');
        
        const paymentConfig = await PaymentMethod.findOne({
          where: {
            field_id: field_id,
            payment_type: 'wave',
            is_active: true
          }
        });
        
        if (!paymentConfig) {
          return res.status(404).json({
            success: false,
            message: 'Aucun moyen de paiement Wave configuré pour ce terrain'
          });
        }
        
        // Retourner l'URL Wave directement
        return res.status(200).json({
          success: true,
          message: 'URL de paiement Wave récupérée',
          payment_url: paymentConfig.api_url,
          data: {
            field_id,
            payment_method,
            wave_url: paymentConfig.api_url
          }
        });
      }
      
      // Pour les autres moyens de paiement (espèces, etc.)
      return res.status(200).json({
        success: true,
        message: 'Réservation créée (paiement sur place)',
        data: {
          field_id,
          payment_method
        }
      });
      
    } catch (error) {
      console.error('🔥 Erreur dans le contrôleur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  }
);

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
