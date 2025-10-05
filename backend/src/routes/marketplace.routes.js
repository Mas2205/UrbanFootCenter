const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * @route POST /api/marketplace/checkout
 * @desc Créer une session de checkout marketplace
 * @access Private (Client, Employee, Admin)
 */
router.post('/checkout', 
  authMiddleware, 
  roleMiddleware(['client', 'user', 'employee', 'admin', 'super_admin']),
  asyncHandler(marketplaceController.createCheckout)
);

/**
 * @route GET /api/marketplace/payment/:payment_id/status
 * @desc Vérifier le statut d'un paiement
 * @access Private (Owner du paiement)
 */
router.get('/payment/:payment_id/status',
  authMiddleware,
  asyncHandler(marketplaceController.getPaymentStatus)
);

/**
 * @route POST /api/marketplace/webhook/paydunya
 * @desc Webhook PayDunya pour confirmation paiements
 * @access Public (PayDunya servers)
 */
router.post('/webhook/paydunya',
  asyncHandler(marketplaceController.webhookPaydunya)
);

/**
 * @route GET /api/marketplace/payments
 * @desc Lister les paiements marketplace (admin)
 * @access Private (Admin, Super Admin)
 */
router.get('/payments',
  authMiddleware,
  roleMiddleware(['admin', 'super_admin']),
  asyncHandler(marketplaceController.listPayments)
);

/**
 * @route GET /api/marketplace/health
 * @desc Health check pour les services marketplace
 * @access Private (Admin)
 */
router.get('/health',
  authMiddleware,
  roleMiddleware(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const paydunyaService = require('../services/paydunya.service');
      const waveService = require('../services/wave.service');

      const health = {
        marketplace: 'ok',
        paydunya: {
          configured: !!(process.env.PAYDUNYA_MASTER_KEY && process.env.PAYDUNYA_PRIVATE_KEY),
          environment: process.env.PAYMENTS_ENV || 'sandbox'
        },
        wave: {
          configured: !!process.env.WAVE_API_KEY,
          environment: process.env.PAYMENTS_ENV || 'sandbox'
        },
        commission_rate: `${(parseInt(process.env.PLATFORM_FEE_BPS || '1000') / 100)}%`
      };

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur health check',
        error: error.message
      });
    }
  }
);

module.exports = router;
