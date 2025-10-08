const express = require('express');
const router = express.Router();
const demandeEquipeController = require('../controllers/demandeEquipe.controller');
const { authMiddleware, sportsMiddleware } = require('../middlewares/auth.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Middleware simple pour vérifier les rôles
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }
    
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Permissions insuffisantes.'
    });
  };
};

// Routes pour les clients
router.post('/', 
  checkRole(['client']), 
  demandeEquipeController.createDemande
);

router.get('/ma-demande', 
  checkRole(['client']), 
  demandeEquipeController.getMaDemande
);

// Routes pour les admins
router.get('/', 
  checkRole(['admin', 'super_admin']), 
  demandeEquipeController.getDemandes
);

router.put('/:id/valider', 
  checkRole(['admin', 'super_admin']), 
  demandeEquipeController.validerDemande
);

router.put('/:id/refuser', 
  checkRole(['admin', 'super_admin']), 
  demandeEquipeController.refuserDemande
);

module.exports = router;
