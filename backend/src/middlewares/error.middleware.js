/**
 * Middleware de gestion des erreurs
 * Centralise la gestion et le formatage des erreurs
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('Erreur serveur:', err);

  // Erreur de validation Sequelize
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Erreur de foreign key Sequelize
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de référence: l\'élément référencé n\'existe pas',
      error: err.parent ? err.parent.detail : 'Contrainte de clé étrangère non respectée'
    });
  }

  // Erreur de base de données Sequelize
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      message: 'Erreur de base de données',
      error: process.env.NODE_ENV === 'production' ? 'Une erreur est survenue lors de l\'opération' : err.message
    });
  }

  // Erreur 404 personnalisée
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      message: err.message || 'Ressource non trouvée'
    });
  }

  // Erreur d'autorisation personnalisée
  if (err.name === 'AuthorizationError') {
    return res.status(403).json({
      success: false,
      message: err.message || 'Accès refusé'
    });
  }

  // Erreur de validation personnalisée
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message || 'Données invalides',
      errors: err.errors
    });
  }

  // Erreur de paiement
  if (err.name === 'PaymentError') {
    return res.status(400).json({
      success: false,
      message: err.message || 'Erreur de paiement',
      error: err.details
    });
  }

  // Erreur générique
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur serveur interne';

  return res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode === 500 
      ? 'Une erreur est survenue. Veuillez réessayer plus tard.'
      : message,
    error: process.env.NODE_ENV === 'production' && statusCode === 500 
      ? undefined 
      : err.stack
  });
};

/**
 * Fonction de création d'erreurs personnalisées
 * @param {string} name - Nom de l'erreur
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code HTTP
 * @param {any} details - Détails supplémentaires
 */
exports.createError = (name, message, statusCode = 500, details = null) => {
  const error = new Error(message);
  error.name = name;
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
};

/**
 * Middleware pour capturer les erreurs asynchrones
 * Permet d'utiliser async/await dans les routes sans try/catch
 */
exports.asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
