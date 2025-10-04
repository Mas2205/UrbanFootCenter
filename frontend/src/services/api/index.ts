/**
 * Export centralisé de tous les services API
 */
import userAPI from './userAPI';
import fieldAPI from './fieldAPI';
import reservationAPI from './reservationAPI';
import adminAPI from './adminAPI';
import settingsAPI from './settingsAPI';
import paymentAPI from './paymentAPI';
import { API } from './types';

// Alias pour la compatibilité avec le code existant
// Exporter directement pour permettre l'import nommé
const authAPI = userAPI;

// Exporter un objet global pour faciliter les imports
const api = {
  auth: authAPI,
  user: userAPI,
  field: fieldAPI,
  reservation: reservationAPI,
  admin: adminAPI,
  settings: settingsAPI,
  payment: paymentAPI
} as unknown as API;

// Exports individuels pour les imports nommés
export {
  userAPI,
  fieldAPI, 
  reservationAPI,
  adminAPI,
  settingsAPI,
  paymentAPI,
  authAPI // Pour le code qui utilise déjà authAPI
};

// Export par défaut pour l'import global
export default api;
