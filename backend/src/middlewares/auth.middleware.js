const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'urban-foot-center-secret-key';

/**
 * Middleware de vérification des rôles
 * Vérifie que l'utilisateur a un des rôles autorisés
 */
exports.roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // L'utilisateur doit être authentifié (middleware authMiddleware appelé avant)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Authentification requise.'
      });
    }

    // Vérifier si l'utilisateur a un des rôles autorisés
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Privilèges insuffisants.'
      });
    }

    // Utilisateur a le bon rôle, continuer
    next();
  };
};

/**
 * Middleware d'authentification
 * Vérifie que le token JWT est valide et ajoute l'utilisateur à la requête
 */
exports.authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token manquant.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Récupérer l'utilisateur
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_password_token', 'reset_token_expires_at'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Utilisateur non trouvé.'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token expiré.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token invalide.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de l\'authentification.'
    });
  }
};

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param {string[]} roles - Les rôles autorisés
 */
exports.roleMiddleware = (roles) => {
  return (req, res, next) => {
    // Vérifier que le middleware d'authentification a bien été exécuté
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: 'Configuration incorrecte. Le middleware d\'authentification doit être exécuté avant le middleware de rôle.'
      });
    }

    // Vérifier le rôle de l'utilisateur
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'avez pas les privilèges nécessaires.'
      });
    }

    next();
  };
};

/**
 * Middleware admin
 * Vérifie que l'utilisateur est un administrateur
 */
exports.adminMiddleware = (req, res, next) => {
  // Vérifier que le middleware d'authentification a bien été exécuté
  if (!req.user) {
    return res.status(500).json({
      success: false,
      message: 'Configuration incorrecte. Le middleware d\'authentification doit être exécuté avant le middleware admin.'
    });
  }

  // Vérifier que l'utilisateur est un admin ou employé
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'employee') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Privilèges d\'administrateur ou d\'employé requis.'
    });
  }

  next();
};

/**
 * Middleware super admin
 * Vérifie que l'utilisateur est un super administrateur
 */
exports.superAdminMiddleware = (req, res, next) => {
  // Vérifier que le middleware d'authentification a bien été exécuté
  if (!req.user) {
    return res.status(500).json({
      success: false,
      message: 'Configuration incorrecte. Le middleware d\'authentification doit être exécuté avant le middleware super admin.'
    });
  }

  // Vérifier que l'utilisateur est un super admin
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Privilèges de super administrateur requis.'
    });
  }

  next();
};

/**
 * Middleware pour la gestion des utilisateurs
 * Vérifie que l'utilisateur a les droits pour gérer les utilisateurs (uniquement super_admin)
 */
exports.userManagementMiddleware = (req, res, next) => {
  // Vérifier que le middleware d'authentification a bien été exécuté
  if (!req.user) {
    return res.status(500).json({
      success: false,
      message: 'Configuration incorrecte. Le middleware d\'authentification doit être exécuté avant.'
    });
  }

  // Seul super_admin peut gérer les utilisateurs
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Seuls les super administrateurs peuvent gérer les utilisateurs.'
    });
  }

  next();
};
