/**
 * Configuration de Socket.IO pour les communications en temps réel
 * Principalement utilisé pour les notifications et la gestion des réservations en temps réel
 */

let io;

/**
 * Initialiser Socket.IO avec l'instance du serveur HTTP
 * @param {Object} httpServer - Instance du serveur HTTP
 * @returns {Object} Instance Socket.IO
 */
exports.initialize = (httpServer) => {
  io = require('socket.io')(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Frontend URL
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  // Middleware d'authentification pour Socket.IO
  io.use(async (socket, next) => {
    try {
      // Récupération du token depuis les query parameters
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication error. Token required.'));
      }

      const jwt = require('jsonwebtoken');
      const { User } = require('../models');
      const JWT_SECRET = process.env.JWT_SECRET || (() => {
        console.error('❌ JWT_SECRET non défini ! Utilisez une clé sécurisée en production.');
        return 'INSECURE_DEFAULT_KEY_CHANGE_ME';
      })();

      // Vérification du token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Récupération de l'utilisateur
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return next(new Error('Authentication error. User not found.'));
      }

      // Ajouter l'utilisateur à l'objet socket
      socket.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Gestion des connexions
  io.on('connection', (socket) => {
    console.log(`User ${socket.user.id} connected via Socket.IO`);

    // Joindre l'utilisateur à sa salle personnelle pour les notifications privées
    socket.join(`user_${socket.user.id}`);

    // Si l'utilisateur est un admin, le faire rejoindre la salle des admins
    if (socket.user.role === 'admin' || socket.user.role === 'super_admin') {
      socket.join('admins');
    }

    // Gestion des événements liés aux réservations
    socket.on('join_field', (fieldId) => {
      // Rejoindre une salle spécifique à un terrain pour recevoir les mises à jour en temps réel
      socket.join(`field_${fieldId}`);
    });

    socket.on('leave_field', (fieldId) => {
      socket.leave(`field_${fieldId}`);
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.id} disconnected`);
    });
  });

  console.log('Socket.IO initialized');
  return io;
};

/**
 * Récupérer l'instance Socket.IO
 * @returns {Object} Instance Socket.IO
 */
exports.getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initialize() first.');
  }
  return io;
};

/**
 * Émettre un événement à tous les utilisateurs
 * @param {string} event - Nom de l'événement
 * @param {Object} data - Données à envoyer
 */
exports.emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

/**
 * Émettre un événement à un utilisateur spécifique
 * @param {string} userId - ID de l'utilisateur
 * @param {string} event - Nom de l'événement
 * @param {Object} data - Données à envoyer
 */
exports.emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
};

/**
 * Émettre un événement à tous les administrateurs
 * @param {string} event - Nom de l'événement
 * @param {Object} data - Données à envoyer
 */
exports.emitToAdmins = (event, data) => {
  if (!io) return;
  io.to('admins').emit(event, data);
};

/**
 * Émettre un événement à tous les utilisateurs qui suivent un terrain spécifique
 * @param {string} fieldId - ID du terrain
 * @param {string} event - Nom de l'événement
 * @param {Object} data - Données à envoyer
 */
exports.emitToField = (fieldId, event, data) => {
  if (!io) return;
  io.to(`field_${fieldId}`).emit(event, data);
};
