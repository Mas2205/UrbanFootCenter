const express = require('express');
const router = express.Router();
const equipeController = require('../controllers/equipe.controller');
const { authMiddleware, sportsMiddleware } = require('../middlewares/auth.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);
/**
 * @route GET /api/equipes
 * @desc Lister les équipes avec pagination et filtres
 * @access Private (tous les utilisateurs connectés)
 */
router.get('/', sportsMiddleware('read'), equipeController.getEquipes);

/**
 * @route GET /api/equipes/:id
 * @desc Récupérer une équipe par ID
 * @access Private (tous les utilisateurs connectés)
 */
router.get('/:id', sportsMiddleware('read'), equipeController.getEquipeById);

// Routes pour Super Admin et Admin de terrain
/**
 * @route POST /api/equipes
 * @desc Créer une nouvelle équipe
 * @access Private (Super Admin, Admin)
 */
router.post('/', 
  sportsMiddleware('write'), 
  equipeController.createEquipe
);

/**
 * @route PUT /api/equipes/:id
 * @desc Mettre à jour une équipe
 * @access Private (Super Admin, Admin)
 */
router.put('/:id', 
  sportsMiddleware('write'), 
  equipeController.updateEquipe
);

/**
 * @route DELETE /api/equipes/:id
 * @desc Supprimer une équipe
 * @access Private (Super Admin, Admin)
 */
router.delete('/:id', 
  sportsMiddleware('write'), 
  equipeController.deleteEquipe
);

/**
 * @route POST /api/equipes/:equipe_id/membres
 * @desc Ajouter un membre à une équipe
 * @access Private (Super Admin, Admin)
 */
router.post('/:equipe_id/membres', 
  sportsMiddleware('write'), 
  equipeController.ajouterMembre
);

/**
 * @route DELETE /api/equipes/:equipe_id/membres/:membre_id
 * @desc Supprimer un membre d'une équipe
 * @access Private (Super Admin, Admin)
 */
router.delete('/:equipe_id/membres/:membre_id', 
  sportsMiddleware('write'), 
  equipeController.supprimerMembre
);

module.exports = router;
