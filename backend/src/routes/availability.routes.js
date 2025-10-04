const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availability.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/fields/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'field-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * @route GET /api/availability/field
 * @desc Récupérer les informations du terrain assigné à l'admin
 * @access Private (Admin de terrain uniquement)
 */
router.get('/field', authMiddleware, roleMiddleware(['admin']), availabilityController.getMyField);

/**
 * @route PUT /api/availability/field
 * @desc Mettre à jour les informations du terrain assigné à l'admin
 * @access Private (Admin de terrain uniquement)
 */
router.put('/field', authMiddleware, roleMiddleware(['admin']), upload.single('image'), availabilityController.updateMyField);

/**
 * @route GET /api/availability
 * @desc Récupérer les créneaux horaires du terrain assigné à l'admin
 * @access Private (Admin de terrain uniquement)
 */
router.get('/', authMiddleware, roleMiddleware(['admin']), availabilityController.getFieldAvailability);

/**
 * @route POST /api/availability
 * @desc Créer un nouveau créneau horaire pour le terrain assigné
 * @access Private (Admin de terrain uniquement)
 */
router.post('/', authMiddleware, roleMiddleware(['admin']), availabilityController.createFieldAvailability);

/**
 * @route PUT /api/availability/:id
 * @desc Mettre à jour un créneau horaire du terrain assigné
 * @access Private (Admin de terrain uniquement)
 */
router.put('/:id', authMiddleware, roleMiddleware(['admin']), availabilityController.updateFieldAvailability);

/**
 * @route DELETE /api/availability/:id
 * @desc Supprimer un créneau horaire du terrain assigné
 * @access Private (Admin de terrain uniquement)
 */
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), availabilityController.deleteFieldAvailability);

module.exports = router;
