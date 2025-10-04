const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, roleMiddleware, userManagementMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * @route GET /api/admin/users
 * @desc Récupère la liste des utilisateurs (pagination, recherche)
 * @access Private (Super Admin only)
 */
router.get('/users', authMiddleware, roleMiddleware(['admin', 'super_admin']), userManagementMiddleware, asyncHandler(adminController.getAllUsers));

/**
 * @route GET /api/admin/users/:id
 * @desc Récupère les détails d'un utilisateur par ID
 * @access Private (Super Admin only)
 */
router.get('/users/:id', authMiddleware, roleMiddleware(['admin', 'super_admin']), userManagementMiddleware, asyncHandler(adminController.getUserById));

/**
 * @route POST /api/admin/users
 * @desc Crée un nouvel utilisateur (admin peut créer d'autres utilisateurs)
 * @access Private (Super Admin only)
 */
router.post('/users', authMiddleware, roleMiddleware(['admin', 'super_admin']), userManagementMiddleware, asyncHandler(adminController.createUser));

/**
 * @route PUT /api/admin/users/:id
 * @desc Met à jour un utilisateur existant
 * @access Private (Super Admin only)
 */
router.put('/users/:id', authMiddleware, roleMiddleware(['admin', 'super_admin']), userManagementMiddleware, asyncHandler(adminController.updateUser));

/**
 * @route DELETE /api/admin/users/:id
 * @desc Supprime un utilisateur
 * @access Private (Super Admin only)
 */
router.delete('/users/:id', authMiddleware, roleMiddleware(['admin', 'super_admin']), userManagementMiddleware, asyncHandler(adminController.deleteUser));

/**
 * @route PATCH /api/admin/users/:id/status
 * @desc Change le statut d'un utilisateur (actif/inactif)
 * @access Private (Super Admin only)
 */
router.patch('/users/:id/status', authMiddleware, roleMiddleware(['admin', 'super_admin']), userManagementMiddleware, asyncHandler(adminController.updateUserStatus));

/**
 * @route PATCH /api/admin/users/:id/reset-password
 * @desc Réinitialise le mot de passe d'un utilisateur
 * @access Private (Super Admin only)
 */
router.patch('/users/:id/reset-password', authMiddleware, roleMiddleware(['admin', 'super_admin']), userManagementMiddleware, asyncHandler(adminController.resetUserPassword));

/**
 * @route GET /api/admin/timeslots
 * @desc Récupère tous les créneaux horaires pour l'administration
 * @access Private (Admin et Super Admin)
 */
router.get('/timeslots', authMiddleware, roleMiddleware(['admin', 'super_admin']), asyncHandler(adminController.getAllTimeSlots));

module.exports = router;
