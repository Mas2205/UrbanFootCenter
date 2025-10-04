import axios from 'axios';

// URL de base de l'API - Utiliser le même port que pour userAPI
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

// Fonction de récupération du header d'authentification
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Type pour les données de réservation
export interface BookingData {
  fieldId: string;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  userId?: string | null;
  status: string;
  // ID du créneau horaire (obligatoire pour le backend)
  timeSlotId?: string;
  // Champs additionnels potentiellement requis par le backend
  field_id?: string; // Version snake_case de fieldId
  user_id?: string | null; // Version snake_case de userId
  first_name?: string; // Version snake_case de firstName
  last_name?: string; // Version snake_case de lastName
  phone_number?: string; // Version alternative pour phone
  time_slot_id?: string; // Version snake_case de timeSlotId
}

// Service API pour les réservations
const bookingsApi = {
  // Créer une nouvelle réservation
  createBooking: async (bookingData: BookingData) => {
    try {
      // Transformation des données pour correspondre au format attendu par le backend
      const apiReadyData = {
        // Champs requis par le backend reservation.controller.js
        field_id: bookingData.fieldId || bookingData.field_id,
        reservation_date: bookingData.date,
        
        // OBLIGATOIRE: time_slot_id est requis par le backend
        time_slot_id: bookingData.timeSlotId || bookingData.time_slot_id,
        
        // On garde ces champs pour la compatibilité
        start_time: bookingData.time,
        time: bookingData.time,
        
        // Informations client pour le debug
        first_name: bookingData.firstName || bookingData.first_name,
        last_name: bookingData.lastName || bookingData.last_name,
        phone_number: bookingData.phone || bookingData.phone_number,
        email: bookingData.email,
        notes: bookingData.notes,
        
        // Ajout explicite du statut
        status: 'pending'
      };
      
      // Log détaillé pour débogage
      console.log(`Envoi de réservation à: ${API_BASE_URL}/reservations`, JSON.stringify(apiReadyData, null, 2));
      
      // Ajout de champs supplémentaires pour compatibilité avec le backend obsolète
      // Type assertion pour éviter les erreurs TypeScript
      const extendedData = apiReadyData as any;
      
      // S'assurer que le user_id est bien transmis
      if (bookingData.userId) {
        extendedData.user_id = bookingData.userId;
        console.log(`User ID transmis: ${extendedData.user_id}`);
      }
      if (!extendedData.day_of_week && extendedData.time_slot_id) {
        // Pour contourner la vérification obsolète du day_of_week, on ajoute tous les jours possibles
        const date = new Date(extendedData.reservation_date);
        extendedData.day_of_week = date.getDay();
        console.log(`Date de réservation: ${extendedData.reservation_date}, jour de la semaine: ${extendedData.day_of_week}`);
      }
      
      // Utiliser les mêmes headers que pour les utilisateurs (avec token)
      const response = await axios.post(`${API_BASE_URL}/reservations`, extendedData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Réponse création réservation:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur création réservation:', error);
      console.error('Détail de l\'erreur:', error.response?.data);
      throw error;
    }
  },

  // Récupérer les réservations d'un utilisateur
  getUserBookings: async (userId: string) => {
    try {
      // CORRECTION: Le backend utilise /api/reservations et non /api/bookings
      const response = await axios.get(`${API_BASE_URL}/reservations`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  },

  // Récupérer les réservations d'un terrain
  getFieldBookings: async (fieldId: string, date?: string) => {
    try {
      // CORRECTION: Adapter au format des routes backend
      const url = date 
        ? `${API_BASE_URL}/reservations/field/${fieldId}?date=${date}` 
        : `${API_BASE_URL}/reservations/field/${fieldId}`;
      
      console.log(`Récupération des réservations du terrain à: ${url}`);
      const response = await axios.get(url, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching field bookings:', error);
      throw error;
    }
  },
  
  // Vérifier la disponibilité d'un créneau
  checkAvailability: async (fieldId: string, date: string, time: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/bookings/availability/${fieldId}?date=${date}&time=${time}`, 
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }
};

export default bookingsApi;
