import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '../config/constants';

// Définition de l'URL de base de l'API
const API_URL = API_BASE_URL;

// Création de l'instance axios avec l'URL de base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Créer un événement personnalisé pour la déconnexion
const logoutEvent = new Event('logout');

// Fonction de déconnexion sécurisée
const safeLogout = () => {
  console.log('Effectue une déconnexion sécurisée...');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Émettre un événement pour informer les composants
  window.dispatchEvent(logoutEvent);

  // Rediriger avec un délai pour permettre aux listeners de réagir
  setTimeout(() => {
    // Vérifier si l'URL actuelle n'est pas déjà /login pour éviter les boucles
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?expired=true';
    }
  }, 100);
};

// Intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Si l'erreur est 401 (non autorisé) et que ce n'est pas déjà une tentative de rafraîchissement
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si vous avez un mécanisme de rafraîchissement de token, vous pouvez l'implémenter ici
      
      // Déconnexion sécurisée
      safeLogout();
    }
    
    // Ajouter des informations de débogage pour les erreurs
    console.error(`Erreur API [${error.response?.status || 'Network'}]: `, 
                  error.response?.data || error.message);
    
    return Promise.reject(error);
  }
);

// Fonctions d'API Auth
export const authAPI = {
  register: (userData: any): Promise<AxiosResponse> => {
    // Mapper les champs frontend vers backend
    const mappedData = {
      ...userData,
      phone_number: userData.phone, // Mapper phone vers phone_number
      first_name: userData.firstName, // Mapper firstName vers first_name
      last_name: userData.lastName    // Mapper lastName vers last_name
    };
    
    // Supprimer les anciens champs
    delete mappedData.phone;
    delete mappedData.firstName;
    delete mappedData.lastName;
    
    return api.post('/auth/register', mappedData);
  },
  login: (credentials: any): Promise<AxiosResponse> => api.post('/auth/login', credentials),
  verifyEmail: (token: string): Promise<AxiosResponse> => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email: string): Promise<AxiosResponse> => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string): Promise<AxiosResponse> => 
    api.post(`/auth/reset-password/${token}`, { password }),
  getProfile: (): Promise<AxiosResponse> => api.get('/auth/profile'),
  updateProfile: (userData: any): Promise<AxiosResponse> => api.put('/auth/profile', userData),
  changePassword: (passwordData: any): Promise<AxiosResponse> => api.post('/auth/change-password', passwordData),
};

// Fonctions d'API Field (Terrain)
export const fieldAPI = {
  getAllFields: (params?: any): Promise<AxiosResponse> => api.get('/fields', { params }),
  getFieldById: (fieldId: string): Promise<AxiosResponse> => api.get(`/fields/${fieldId}`),
  searchAvailableSlots: (params: any): Promise<AxiosResponse> => api.get('/fields/available-slots', { params }),
  // Routes admin
  createField: (fieldData: any): Promise<AxiosResponse> => api.post('/fields', fieldData),
  updateField: (fieldId: string, fieldData: any): Promise<AxiosResponse> => api.put(`/fields/${fieldId}`, fieldData),
  deleteField: (fieldId: string): Promise<AxiosResponse> => api.delete(`/fields/${fieldId}`),
  addTimeSlot: (fieldId: string, slotData: any): Promise<AxiosResponse> => api.post(`/fields/${fieldId}/time-slots`, slotData),
  updateTimeSlot: (fieldId: string, slotId: string, slotData: any): Promise<AxiosResponse> => 
    api.put(`/fields/${fieldId}/time-slots/${slotId}`, slotData),
  deleteTimeSlot: (fieldId: string, slotId: string): Promise<AxiosResponse> => 
    api.delete(`/fields/${fieldId}/time-slots/${slotId}`),
  addClosure: (closureData: any): Promise<AxiosResponse> => api.post('/fields/closures', closureData),
  deleteClosure: (closureId: string): Promise<AxiosResponse> => api.delete(`/fields/closures/${closureId}`),
};

// Fonctions d'API Reservation
export const reservationAPI = {
  createReservation: (reservationData: any): Promise<AxiosResponse> => api.post('/reservations', reservationData),
  getUserReservations: (params?: any): Promise<AxiosResponse> => api.get('/reservations', { params }),
  getReservationById: (reservationId: string): Promise<AxiosResponse> => api.get(`/reservations/${reservationId}`),
  cancelReservation: (reservationId: string, reason?: string): Promise<AxiosResponse> => 
    api.post(`/reservations/${reservationId}/cancel`, { reason }),
  // Routes admin
  getAllReservations: (params?: any): Promise<AxiosResponse> => api.get('/reservations/admin/all', { params }),
  getAllReservationsWithDetails: (params?: any): Promise<AxiosResponse> => api.get('/reservations/admin/all/details', { params }),
  updateReservationStatus: (reservationId: string, status: string): Promise<AxiosResponse> => 
    api.put(`/reservations/admin/${reservationId}/status`, { status }),
};

// Fonctions d'API Payment (Paiement)
export const paymentAPI = {
  initiatePayment: (paymentData: any): Promise<AxiosResponse> => api.post('/payments/initiate', paymentData),
  confirmPayment: (params: any): Promise<AxiosResponse> => api.get('/payments/confirm', { params }),
  getUserPayments: (params?: any): Promise<AxiosResponse> => api.get('/payments/history', { params }),
  getPaymentDetails: (paymentId: string): Promise<AxiosResponse> => api.get(`/payments/${paymentId}`),
  // Routes admin
  getAllPayments: (params?: any): Promise<AxiosResponse> => api.get('/payments/admin/all', { params }),
};

// Fonctions d'API User (Utilisateur)
export const userAPI = {
  getAllUsers: (params?: any): Promise<AxiosResponse> => api.get('/users', { params }),
  getUserById: (userId: string): Promise<AxiosResponse> => api.get(`/users/${userId}`),
  createUser: (userData: any): Promise<AxiosResponse> => api.post('/users', userData),
  updateUser: (userId: string, userData: any): Promise<AxiosResponse> => api.put(`/users/${userId}`, userData),
  deleteUser: (userId: string): Promise<AxiosResponse> => api.delete(`/users/${userId}`),
  changeUserRole: (userId: string, role: string): Promise<AxiosResponse> => api.put(`/users/${userId}/role`, { role }),
  updateUserStatus: (userId: string, status: string): Promise<AxiosResponse> => api.put(`/users/${userId}/status`, { status }),
};

// Fonctions d'API Admin (Tableau de bord)
export const adminAPI = {
  getDashboardStats: (): Promise<AxiosResponse> => api.get('/admin/dashboard/stats'),
  getRevenueStats: (period?: string): Promise<AxiosResponse> => api.get('/admin/dashboard/revenue', { params: { period } }),
  getReservationStats: (period?: string): Promise<AxiosResponse> => api.get('/admin/dashboard/reservations', { params: { period } }),
  getFieldStats: (): Promise<AxiosResponse> => api.get('/admin/dashboard/fields'),
  getRecentReservations: (limit?: number): Promise<AxiosResponse> => api.get('/admin/dashboard/recent-reservations', { params: { limit } }),
};

// Fonctions d'API Settings (Paramètres)
export const settingsAPI = {
  getGeneralSettings: (): Promise<AxiosResponse> => api.get('/settings/general'),
  updateGeneralSettings: (settingsData: any): Promise<AxiosResponse> => api.put('/settings/general', settingsData),
  getPaymentSettings: (): Promise<AxiosResponse> => api.get('/settings/payment'),
  updatePaymentSettings: (settingsData: any): Promise<AxiosResponse> => api.put('/settings/payment', settingsData),
  getNotificationSettings: (): Promise<AxiosResponse> => api.get('/settings/notifications'),
  updateNotificationSettings: (settingsData: any): Promise<AxiosResponse> => api.put('/settings/notifications', settingsData),
  getBookingSettings: (): Promise<AxiosResponse> => api.get('/settings/booking'),
  updateBookingSettings: (settingsData: any): Promise<AxiosResponse> => api.put('/settings/booking', settingsData),
};

// Alias fieldsAPI vers fieldAPI pour compatibilité
export const fieldsAPI = fieldAPI;

export default api;
