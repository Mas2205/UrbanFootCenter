const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fieldController = require('../controllers/field.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/fields/');
  },
  filename: function (req, file, cb) {
    // Générer un nom unique pour le fichier
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'field-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accepter seulement les images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers image sont autorisés!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

/**
 * @route GET /api/fields
 * @desc Récupérer tous les terrains
 * @access Public
 */
router.get('/', asyncHandler(fieldController.getAllFields));

/**
 * @route GET /api/fields/cities
 * @desc Récupérer la liste des villes uniques depuis la base de données
 * @access Public
 */
router.get('/cities', asyncHandler(fieldController.getCities));

/**
 * @route GET /api/fields/search
 * @desc Rechercher des terrains pour l'autocomplétion
 * @access Public
 */
router.get('/search', asyncHandler(fieldController.searchFields));

/**
 * @route GET /api/fields/featured
 * @desc Récupérer les terrains mis en avant (featured)
 * @access Public
 */
router.get('/featured', asyncHandler(fieldController.getFeaturedFields));

/**
 * @route GET /api/fields/search/available
 * @desc Rechercher des créneaux disponibles
 * @access Public
 */
router.get('/search/available', asyncHandler(fieldController.searchAvailableSlots));

/**
 * @route GET /api/fields/:id
 * @desc Récupérer un terrain par son ID
 * @access Public
 */
router.get('/:id', asyncHandler(fieldController.getFieldById));

/**
 * @route GET /api/fields/:id/availability
 * @desc Récupérer les créneaux disponibles d'un terrain
 * @access Public
 */
router.get('/:id/availability', asyncHandler(fieldController.getFieldAvailability));

/**
 * Routes nécessitant des privilèges administrateur
 */

/**
 * @route POST /api/fields
 * @desc Créer un nouveau terrain
 * @access Private (Admin)
 */
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), asyncHandler(fieldController.createField));

/**
 * @route PUT /api/fields/:id
 * @desc Mettre à jour un terrain
 * @access Private (Admin)
 */
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), asyncHandler(fieldController.updateField));

/**
 * @route DELETE /api/fields/:id
 * @desc Supprimer un terrain (désactivation)
 * @access Private (Admin)
 */
router.delete('/:id', authMiddleware, adminMiddleware, asyncHandler(fieldController.deleteField));

/**
 * @route POST /api/fields/:field_id/time-slots
 * @desc Ajouter un créneau horaire à un terrain
 * @access Private (Admin)
 */
router.post('/:field_id/time-slots', authMiddleware, adminMiddleware, asyncHandler(fieldController.addTimeSlot));

/**
 * @route PUT /api/fields/time-slots/:id
 * @desc Mettre à jour un créneau horaire
 * @access Private (Admin)
 */
router.put('/time-slots/:id', authMiddleware, adminMiddleware, asyncHandler(fieldController.updateTimeSlot));

/**
 * @route POST /api/fields/closures
 * @desc Ajouter une fermeture ou jour férié
 * @access Private (Admin)
 */
router.post('/closures', authMiddleware, adminMiddleware, asyncHandler(fieldController.addClosure));

module.exports = router;
