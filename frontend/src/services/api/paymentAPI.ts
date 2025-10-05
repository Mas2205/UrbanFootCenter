import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { v4 as uuidv4 } from 'uuid';

// Fonction de récupération du header d'authentification
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Types
interface PaymentMethod {
  id: string;
  name: string;
  logoUrl: string;
  isActive: boolean;
}

interface PaymentRequest {
  reservation_id: string;
  amount: number;
  payment_method: string;
  user_id: string;
}

interface PaymentConfirmation {
  paymentId: string;
  transactionId?: string;
  status: string;
}

/**
 * Service API pour les fonctionnalités de paiement
 */
const paymentAPI = {
  /**
   * Initier un paiement
   */
  initiatePayment: async (paymentData: PaymentRequest) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/initiate`, paymentData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  },

  /**
   * Confirmer un paiement
   */
  confirmPayment: async (params: PaymentConfirmation) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/confirm`, params, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  /**
   * Obtenir les paiements d'un utilisateur
   */
  getUserPayments: async (params?: { userId?: string, page?: number, limit?: number }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/user`, { 
        params,
        headers: getAuthHeader()
      });
      return response;
    } catch (error) {
      console.error('Error fetching user payments:', error);
      throw error;
    }
  },

  /**
   * Obtenir les détails d'un paiement
   */
  getPaymentDetails: async (paymentId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/${paymentId}`, {
        headers: getAuthHeader()
      });
      return response;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  },

  /**
   * Obtenir tous les paiements (admin)
   */
  getAllPayments: async (params?: { page?: number, limit?: number, status?: string }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/admin/all`, { 
        params,
        headers: getAuthHeader()
      });
      return response;
    } catch (error) {
      console.error('Error fetching all payments:', error);
      throw error;
    }
  },

  /**
   * Traiter un paiement réel
   */
  processPayment: async (paymentData: { 
    reservationId: string, 
    amount: number, 
    paymentMethod: string,
    userId: string
  }) => {
    try {
      console.log('Processing real payment:', paymentData);
      
      // Appel à l'API réelle de paiement
      const response = await axios.post(`${API_BASE_URL}/payments/initiate`, {
        reservation_id: paymentData.reservationId,
        payment_method: paymentData.paymentMethod,
        amount: paymentData.amount
      }, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },
  /**
   * Obtenir les méthodes de paiement disponibles
   */
  getPaymentMethods: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/methods`, {
        headers: getAuthHeader()
      });
      return response;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      
      // Données simulées pour le développement
      return {
        data: [
          {
            id: 'card',
            name: 'Carte de crédit',
            logoUrl: '/assets/payment/card.svg',
            isActive: true
          },
          {
            id: 'wave',
            name: 'Wave',
            logoUrl: '/assets/payment/wave.svg',
            isActive: true
          },
          {
            id: 'orange-money',
            name: 'Orange Money',
            logoUrl: '/assets/payment/orange-money.svg',
            isActive: true
          },
          {
            id: 'cash',
            name: 'Espèces',
            logoUrl: '/assets/payment/cash.svg',
            isActive: true
          }
        ]
      };
    }
  }
};

export default paymentAPI;
