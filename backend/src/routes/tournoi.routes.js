const express = require('express');
const router = express.Router();
const tournoiController = require('../controllers/tournoi.controller');
const { authMiddleware, sportsMiddleware } = require('../middlewares/auth.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Middleware simple pour vérifier les rôles admin
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }
  
  if (['admin', 'super_admin'].includes(req.user.role)) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Accès réservé aux administrateurs'
  });
};

// Routes publiques (tous les utilisateurs connectés)
/**
 * @route GET /api/tournois
 * @desc Lister les tournois avec pagination et filtres
 * @access Private (tous les utilisateurs connectés)
 */
router.get('/', sportsMiddleware('read'), tournoiController.getTournois);

/**
 * @route GET /api/tournois/:id
 * @desc Récupérer un tournoi par ID
 * @access Private (tous les utilisateurs connectés)
 */
router.get('/:id', sportsMiddleware('read'), tournoiController.getTournoiById);

// Routes pour Super Admin et Admin de terrain
/**
 * @route POST /api/tournois
 * @desc Créer un nouveau tournoi
 * @access Private (Super Admin, Admin)
 */
router.post('/', 
  sportsMiddleware('write'), 
  tournoiController.createTournoi
);

/**
 * @route PUT /api/tournois/:id/statut
 * @desc Mettre à jour le statut d'un tournoi
 * @access Private (Super Admin, Admin)
 */
router.put('/:id/statut', 
  adminMiddleware, 
  tournoiController.updateStatutTournoi
);

/**
 * @route DELETE /api/tournois/:id
 * @desc Supprimer un tournoi
 * @access Private (Super Admin, Admin)
 */
router.delete('/:id', 
  sportsMiddleware('write'), 
  tournoiController.deleteTournoi
);

/**
 * @route PUT /api/tournois/participations/:participation_id/valider
 * @desc Valider ou refuser une participation
 * @access Private (Super Admin, Admin)
 */
router.put('/participations/:participation_id/valider', 
  adminMiddleware, 
  tournoiController.validerParticipation
);

/**
 * @route POST /api/tournois/:tournoi_id/tirage-au-sort
 * @desc Effectuer le tirage au sort et générer les groupes/matchs
 * @access Private (Super Admin, Admin)
 */
router.post('/:tournoi_id/tirage-au-sort', 
  adminMiddleware, 
  tournoiController.effectuerTirageAuSort
);

/**
 * @route GET /api/tournois/:tournoi_id/details
 * @desc Récupérer les détails complets d'un tournoi (participations, matchs, classements)
 * @access Private (Super Admin, Admin)
 */
router.get('/:tournoi_id/details', 
  adminMiddleware, 
  tournoiController.getTournoiDetails
);

// Routes pour les capitaines d'équipe
/**
 * @route POST /api/tournois/:tournoi_id/participer
 * @desc Demander la participation d'une équipe à un tournoi
 * @access Private (Capitaines - utilisateurs avec une équipe)
 */
router.post('/:tournoi_id/participer', 
  sportsMiddleware('participate'),
  tournoiController.demanderParticipation
);

// Route temporaire urgente pour corriger le schéma
router.get('/fix-schema-urgent', (req, res, next) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Super admin uniquement.'
    });
  }
  next();
}, tournoiController.fixSchema);

module.exports = router;
