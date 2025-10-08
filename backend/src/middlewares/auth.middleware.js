const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.error('❌ JWT_SECRET non défini ! Utilisez une clé sécurisée en production.');
  return 'INSECURE_DEFAULT_KEY_CHANGE_ME';
})();

/**
 * Middleware spécifique pour les équipes/tournois/championnats
 * Gère les permissions selon les rôles et les terrains
 */
exports.sportsMiddleware = (action = 'read') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise.'
        });
      }

      const { role } = req.user;

      // Super Admin : accès total
      if (role === 'super_admin') {
        return next();
      }

      // Admin Terrain : gestion de son terrain uniquement
      if (role === 'admin') {
        if (action === 'read') {
          return next(); // Peut consulter
        }
        
        // Pour les actions de modification, vérifier le terrain
        const terrainId = req.body.terrain_id || req.params.terrain_id;
        if (terrainId && req.user.field_id && terrainId === req.user.field_id) {
          return next();
        }
        
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez gérer que les éléments de votre terrain.'
        });
      }

      // Capitaine : inscription tournois et consultation
      if (role === 'client') {
        if (action === 'read' || action === 'participate') {
          return next();
        }
        
        return res.status(403).json({
          success: false,
          message: 'Accès limité à la consultation et participation.'
        });
      }

      // Employé : consultation uniquement
      if (role === 'employee') {
        if (action === 'read') {
          return next();
        }
        
        return res.status(403).json({
          success: false,
          message: 'Accès en lecture seule.'
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Accès refusé.'
      });

    } catch (error) {
      console.error('Erreur middleware sports:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur.'
      });
    }
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
