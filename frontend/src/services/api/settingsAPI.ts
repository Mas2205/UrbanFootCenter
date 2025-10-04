import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Types
interface GeneralSettings {
  siteName: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  openingHours: string;
  defaultLanguage: string;
  currencySymbol: string;
}

interface BookingSettings {
  maxDaysInAdvance: number;
  minHoursBeforeBooking: number;
  maxBookingDuration: number;
  startTimeIncrement: number;
  allowEquipmentRental: boolean;
  enableSmsNotifications: boolean;
  enableEmailNotifications: boolean;
}

interface PaymentSettings {
  stripeEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  waveEnabled: boolean;
  waveApiKey: string;
  orangeMoneyEnabled: boolean;
  orangeMoneyApiKey: string;
}

/**
 * Service API pour la gestion des paramètres du système
 */
const settingsAPI = {
  /**
   * Obtenir les paramètres généraux
   */
  getGeneralSettings: async (): Promise<{ data: GeneralSettings }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/settings/general`);
      return response;
    } catch (error) {
      console.error('Error fetching general settings:', error);
      
      // Données simulées pour le développement
      return {
        data: {
          siteName: 'Urban Foot Center',
          contactEmail: 'contact@urbanfootcenter.com',
          phoneNumber: '+221 78 123 45 67',
          address: 'Route des Almadies, Dakar, Sénégal',
          openingHours: '8h00 - 23h00, 7j/7',
          defaultLanguage: 'fr',
          currencySymbol: 'FCFA'
        }
      };
    }
  },
  
  /**
   * Mettre à jour les paramètres généraux
   */
  updateGeneralSettings: async (settings: GeneralSettings): Promise<any> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/settings/general`, settings);
      return response;
    } catch (error) {
      console.error('Error updating general settings:', error);
      // Simuler une réponse réussie pour le développement
      return { data: { success: true } };
    }
  },
  
  /**
   * Obtenir les paramètres de réservation
   */
  getBookingSettings: async (): Promise<{ data: BookingSettings }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/settings/booking`);
      return response;
    } catch (error) {
      console.error('Error fetching booking settings:', error);
      
      // Données simulées pour le développement
      return {
        data: {
          maxDaysInAdvance: 30,
          minHoursBeforeBooking: 2,
          maxBookingDuration: 3,
          startTimeIncrement: 30,
          allowEquipmentRental: true,
          enableSmsNotifications: true,
          enableEmailNotifications: true
        }
      };
    }
  },
  
  /**
   * Mettre à jour les paramètres de réservation
   */
  updateBookingSettings: async (settings: BookingSettings): Promise<any> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/settings/booking`, settings);
      return response;
    } catch (error) {
      console.error('Error updating booking settings:', error);
      // Simuler une réponse réussie pour le développement
      return { data: { success: true } };
    }
  },
  
  /**
   * Obtenir les paramètres de paiement
   */
  getPaymentSettings: async (): Promise<{ data: PaymentSettings }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/settings/payment`);
      return response;
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      
      // Données simulées pour le développement
      return {
        data: {
          stripeEnabled: true,
          stripePublicKey: 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX',
          stripeSecretKey: 'sk_test_XXXXXXXXXXXXXXXXXXXXXXXX',
          waveEnabled: true,
          waveApiKey: 'wave_api_key_XXXXXXXXXXXXXXXX',
          orangeMoneyEnabled: true,
          orangeMoneyApiKey: 'om_api_key_XXXXXXXXXXXXXXXX'
        }
      };
    }
  },
  
  /**
   * Mettre à jour les paramètres de paiement
   */
  updatePaymentSettings: async (settings: PaymentSettings): Promise<any> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/settings/payment`, settings);
      return response;
    } catch (error) {
      console.error('Error updating payment settings:', error);
      // Simuler une réponse réussie pour le développement
      return { data: { success: true } };
    }
  }
};

export default settingsAPI;
