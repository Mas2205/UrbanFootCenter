const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/payment_method.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Routes pour la gestion des moyens de paiement (admin et super_admin)
router.get('/', 
  roleMiddleware(['admin', 'super_admin']), 
  paymentMethodController.getPaymentMethods
);

router.post('/', 
  roleMiddleware(['admin', 'super_admin']), 
  paymentMethodController.createPaymentMethod
);

router.get('/:id', 
  roleMiddleware(['admin', 'super_admin']), 
  paymentMethodController.getPaymentMethod
);

router.put('/:id', 
  roleMiddleware(['admin', 'super_admin']), 
  paymentMethodController.updatePaymentMethod
);

router.delete('/:id', 
  roleMiddleware(['admin', 'super_admin']), 
  paymentMethodController.deletePaymentMethod
);

module.exports = router;
