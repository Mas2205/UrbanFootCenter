// Configuration de l'application
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Autres configurations globales
export const APP_NAME = 'Urban Foot Center';

// Configuration de pagination par défaut
export const DEFAULT_PAGE_SIZE = 10;

// Configuration des tokens JWT
export const TOKEN_EXPIRY_DAYS = 7;

// Configuration de l'upload d'images
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
