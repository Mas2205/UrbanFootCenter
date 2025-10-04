/**
 * Classe d'erreur personnalisée pour l'application
 * Permet de standardiser la gestion des erreurs
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Erreur opérationnelle, peut être gérée par notre middleware
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
