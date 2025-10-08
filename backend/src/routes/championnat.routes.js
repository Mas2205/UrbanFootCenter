const express = require('express');
const router = express.Router();
const championnatController = require('../controllers/championnat.controller');
const { authMiddleware, sportsMiddleware } = require('../middlewares/auth.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Routes publiques (tous les utilisateurs connectés)
/**
 * @route GET /api/championnats/actuel
 * @desc Récupérer le championnat actuel avec classement
 * @access Private (tous les utilisateurs connectés)
 */
router.get('/actuel', sportsMiddleware('read'), championnatController.getChampionnatActuel);

/**
 * @route GET /api/championnats
 * @desc Lister tous les championnats (historique)
 * @access Private (tous les utilisateurs connectés)
 */
router.get('/', sportsMiddleware('read'), championnatController.getChampionnats);

/**
 * @route GET /api/championnats/matchs
 * @desc Lister les matchs du championnat
 * @access Private (tous les utilisateurs connectés)
 */
router.get('/matchs', sportsMiddleware('read'), championnatController.getMatchs);

/**
 * @route GET /api/championnats/:championnat_id/statistiques
 * @desc Obtenir les statistiques d'un championnat
 * @access Private (tous les utilisateurs connectés)
 */
router.get('/:championnat_id/statistiques', sportsMiddleware('read'), championnatController.getStatistiques);

/**
 * @route GET /api/championnats/statistiques
 * @desc Obtenir les statistiques du championnat actuel
 * @access Private (tous les utilisateurs connectés)
 */
router.get('/statistiques', sportsMiddleware('read'), championnatController.getStatistiques);

// Routes pour Super Admin et Admin de terrain
/**
 * @route POST /api/championnats/matchs
 * @desc Créer un nouveau match de championnat
 * @access Private (Super Admin, Admin)
 */
router.post('/matchs', 
  sportsMiddleware('write'), 
  championnatController.createMatch
);

/**
 * @route PUT /api/championnats/matchs/:match_id/resultat
 * @desc Saisir le résultat d'un match
 * @access Private (Super Admin, Admin)
 */
router.put('/matchs/:match_id/resultat', 
  sportsMiddleware('write'), 
  championnatController.saisirResultat
);

module.exports = router;
