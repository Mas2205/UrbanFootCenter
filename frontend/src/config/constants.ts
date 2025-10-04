/**
 * Constantes globales pour l'application
 */

// URL de base de l'API
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

// Clés d'API pour services tiers
export const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY || '';
export const WAVE_API_KEY = process.env.REACT_APP_WAVE_API_KEY || '';
export const ORANGE_MONEY_API_KEY = process.env.REACT_APP_ORANGE_MONEY_API_KEY || '';
export const TWILIO_ACCOUNT_SID = process.env.REACT_APP_TWILIO_ACCOUNT_SID || '';

// Configuration des fonctionnalités
export const ENABLE_SMS_NOTIFICATIONS = process.env.REACT_APP_ENABLE_SMS_NOTIFICATIONS === 'true';
export const ENABLE_EMAIL_NOTIFICATIONS = process.env.REACT_APP_ENABLE_EMAIL_NOTIFICATIONS === 'true';
export const DEFAULT_LANGUAGE = process.env.REACT_APP_DEFAULT_LANGUAGE || 'fr';
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'wol']; // Français, Anglais, Wolof

// Configuration des réservations
export const MAX_BOOKING_DAYS_IN_ADVANCE = 30; // Nombre maximum de jours à l'avance pour réserver
export const MIN_HOURS_BEFORE_BOOKING = 2; // Nombre minimum d'heures avant de pouvoir réserver
export const MAX_BOOKING_DURATION = 3; // Durée maximale d'une réservation en heures
export const START_TIME_INCREMENT = 30; // Incrément des heures de début en minutes

// Types de terrains
export const FIELD_SURFACES = ['Gazon naturel', 'Gazon synthétique', 'Terre battue'];
export const FIELD_SIZES = ['5v5', '7v7', '11v11'];
export const FIELD_TYPES = ['indoor', 'outdoor'];

// Statuts de réservation
export const RESERVATION_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show'
};

// Méthodes de paiement
export const PAYMENT_METHODS = {
  CARD: 'card',
  WAVE: 'wave',
  ORANGE_MONEY: 'orange_money',
  CASH: 'cash'
};

// Statuts de paiement
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Rôles utilisateur
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Paramètres de pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

// Format de date par défaut
export const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';
export const DEFAULT_TIME_FORMAT = 'HH:mm';
export const DEFAULT_DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';

// Devises
export const CURRENCY = 'FCFA';
export const CURRENCY_SYMBOL = 'F';
