const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availability.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const { upload } = require('../config/storage');

/**
 * @route GET /api/availability/field
 * @desc Récupérer les informations du terrain assigné à l'admin
 * @access Private (Admin de terrain uniquement)
 */
router.get('/field', authMiddleware, roleMiddleware(['admin', 'employee']), availabilityController.getMyField);

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
router.get('/', authMiddleware, roleMiddleware(['admin', 'employee']), availabilityController.getFieldAvailability);

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
