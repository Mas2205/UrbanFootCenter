require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');

// Import du router centralisé
const apiRoutes = require('./routes/index');

// Import des middlewares
const { errorHandler } = require('./middlewares/error.middleware');
const { authMiddleware } = require('./middlewares/auth.middleware');
const { demoMode } = require('./middlewares/demo-mode.middleware');
const { 
  generalRateLimit, 
  authRateLimit, 
  paymentRateLimit, 
  uploadRateLimit,
  httpsRedirect,
  corsValidation,
  jwtValidation,
  inputSanitization
} = require('./middlewares/security.middleware');

// Import de la configuration de base de données
const { sequelize } = require('./config/database');

// Configuration du serveur
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Configuration sécurisée de CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : 
      ['http://localhost:3000', 'http://localhost:3001'];
    
    // Permettre les requêtes sans origine (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares de sécurité
app.use(httpsRedirect); // Redirection HTTPS en production
app.use(corsValidation); // Validation des origines
app.use(cors(corsOptions));

// Configuration Helmet sécurisée
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(inputSanitization); // Nettoyage des entrées
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(jwtValidation); // Validation basique des tokens

// Debug: Log des requêtes vers /uploads
app.use('/uploads', (req, res, next) => {
  console.log('Requête fichier statique:', req.url);
  next();
});

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static('uploads'));

// Rate limiting par type de route
app.use('/api/auth/login', authRateLimit);
app.use('/api/auth/register', authRateLimit);
app.use('/api/auth/forgot-password', authRateLimit);
app.use('/api/payments', paymentRateLimit);
app.use('/uploads', uploadRateLimit);
app.use('/api', generalRateLimit);

// Configuration globale pour le mode démo
global.DB_MODE = 'normal'; // Par défaut, mode normal

// Middleware pour le mode démo (si PostgreSQL n'est pas disponible)
app.use('/api', demoMode);

// Configuration des routes (toutes regroupées dans le routeur principal)
app.use('/api', apiRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Configuration de Socket.IO pour les notifications en temps réel
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);
  
  // Authentification du socket
  socket.on('authenticate', (token) => {
    try {
      // Vérification du token JWT
      // Si valide, attribuer l'utilisateur à ce socket pour les notifications personnalisées
    } catch (error) {
      socket.emit('auth_error', { message: 'Échec de l\'authentification' });
    }
  });

  // Gestion des événements de réservation en temps réel
  socket.on('join_field', (fieldId) => {
    socket.join(`field:${fieldId}`);
  });

  socket.on('leave_field', (fieldId) => {
    socket.leave(`field:${fieldId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Export des instances pour les tests
module.exports = { app, server, io };

// Démarrage du serveur
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  
    // Démarrer le serveur avec gestion des erreurs de port
  const startServer = (port) => {
    // S'assurer que le port est un nombre
    const portNumber = parseInt(port, 10);
    
    server.listen(portNumber, '0.0.0.0')
      .on('listening', () => {
        console.log(`Serveur en cours d'exécution sur le port ${portNumber} (accessible depuis le réseau)`);
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          const nextPort = portNumber + 1;
          console.warn(`Le port ${portNumber} est déjà utilisé, tentative avec le port ${nextPort}`);
          startServer(nextPort);
        } else {
          console.error('Erreur lors du démarrage du serveur:', err);
        }
      });
  };
  
  // Démarrer le serveur sur le port spécifié
  startServer(PORT);
  
  // Tentative de connexion à la base de données (non bloquante)
  sequelize.authenticate()
    .then(() => {
      console.log('Connexion à la base de données établie avec succès');
      global.DB_MODE = 'normal';
      
      // Synchronisation du modèle avec la base de données si demandé
      if (process.env.DB_SYNC === 'true') {
        console.log('Synchronisation des modèles avec la base de données...');
        return sequelize.sync({ alter: true }).then(() => {
          console.log('Synchronisation terminée avec succès');
        }).catch(err => {
          console.error('Erreur lors de la synchronisation:', err);
        });
      }
    })
    .catch(err => {
      // Activer le mode démo quand PostgreSQL n'est pas disponible
      global.DB_MODE = 'demo';
      
      console.warn('\x1b[33m=================================================\x1b[0m');
      console.warn('\x1b[33m    ATTENTION: Base de données PostgreSQL non disponible    \x1b[0m');
      console.warn('\x1b[33m    L\'API fonctionne en MODE DÉMO avec des données statiques    \x1b[0m');
      console.warn('\x1b[33m    Pour une expérience complète avec UUID v4 sécurisés:    \x1b[0m');
      console.warn('\x1b[33m    1. Installez PostgreSQL    \x1b[0m');
      console.warn('\x1b[33m    2. Créez un utilisateur et une base "urban_foot_center"    \x1b[0m'); 
      console.warn('\x1b[33m    3. Ajustez DB_USER et DB_PASSWORD dans .env    \x1b[0m');
      console.warn('\x1b[33m=================================================\x1b[0m');
      console.error('Détail de l\'erreur:', err.message);
    });
}
