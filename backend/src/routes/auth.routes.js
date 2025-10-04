const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un nouvel utilisateur
 * @access Public
 */
router.post('/register', asyncHandler(authController.register));

/**
 * @route POST /api/auth/login
 * @desc Connexion d'un utilisateur
 * @access Public
 */
router.post('/login', asyncHandler(authController.login));

/**
 * @route GET /api/auth/verify/:token
 * @desc Vérification de l'email d'un utilisateur
 * @access Public
 */
router.get('/verify/:token', asyncHandler(authController.verifyEmail));

/**
 * @route POST /api/auth/reset-password
 * @desc Demande de réinitialisation de mot de passe
 * @access Public
 */
router.post('/reset-password', asyncHandler(authController.requestPasswordReset));

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Réinitialisation de mot de passe avec token
 * @access Public
 */
router.post('/reset-password/:token', asyncHandler(authController.resetPassword));

/**
 * @route GET /api/auth/profile
 * @desc Récupération du profil utilisateur
 * @access Private
 */
router.get('/profile', authMiddleware, asyncHandler(authController.getProfile));

/**
 * @route PUT /api/auth/profile
 * @desc Mise à jour du profil utilisateur
 * @access Private
 */
router.put('/profile', authMiddleware, asyncHandler(authController.updateProfile));

/**
 * @route PUT /api/auth/change-password
 * @desc Changement de mot de passe
 * @access Private
 */
router.put('/change-password', authMiddleware, asyncHandler(authController.changePassword));

module.exports = router;
