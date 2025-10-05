const rateLimit = require('express-rate-limit');

/**
 * Rate limiting pour l'API générale
 */
exports.generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite par IP
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true, // Retourne les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  // trustProxy hérite de app.set('trust proxy') - pas besoin de le redéfinir
});

/**
 * Rate limiting strict pour l'authentification
 */
exports.authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  // trustProxy hérite de app.set('trust proxy') - pas besoin de le redéfinir
  skipSuccessfulRequests: true, // Ne compte que les échecs
});

/**
 * Rate limiting pour les paiements
 */
exports.paymentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 tentatives par minute
  message: {
    success: false,
    message: 'Trop de tentatives de paiement. Veuillez patienter une minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // trustProxy hérite de app.set('trust proxy') - pas besoin de le redéfinir
});

/**
 * Rate limiting pour les uploads
 */
exports.uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads par minute
  message: {
    success: false,
    message: 'Trop d\'uploads. Veuillez patienter 1 minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // trustProxy hérite de app.set('trust proxy') - pas besoin de le redéfinir
});

/**
 * Middleware de sécurité HTTPS
 */
exports.httpsRedirect = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Vérifier si la requête est en HTTPS
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    
    // Ajouter des headers de sécurité HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
};

/**
 * Middleware de validation des origines CORS
 */
exports.corsValidation = (req, res, next) => {
  const allowedOrigins = process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
    ['http://localhost:3000', 'http://localhost:3001'];
  
  const origin = req.headers.origin;
  
  if (process.env.NODE_ENV === 'production' && origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Origine non autorisée'
    });
  }
  
  next();
};

/**
 * Middleware de validation des tokens JWT
 */
exports.jwtValidation = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    // Vérifier la longueur minimale du token
    if (token.length < 20) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
  }
  
  next();
};

/**
 * Middleware de protection contre les injections
 */
exports.inputSanitization = (req, res, next) => {
  // Nettoyer les entrées pour éviter les injections
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Supprimer les caractères dangereux
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        obj[key] = obj[key].replace(/javascript:/gi, '');
        obj[key] = obj[key].replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };
  
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  if (req.query) {
    sanitizeObject(req.query);
  }
  
  next();
};
