import axios from 'axios';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE_URL } from '../../config/constants';

// Types
export interface Reservation {
  id: string; // UUID v4
  userId: string;
  fieldId: string;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:MM
  endTime: string; // Format: HH:MM
  duration: number; // Durée en heures
  totalPlayers: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'card' | 'wave' | 'orange_money' | 'cash';
  transactionId?: string;
  additionalServices?: {
    equipmentRental?: boolean;
    coaching?: boolean;
    recording?: boolean;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Données jointes pour l'affichage
  field?: {
    id: string;
    name: string;
    image: string;
    location: {
      address: string;
      city: string;
    };
    pricePerHour: number;
    indoor: boolean;
    surface: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface ReservationCreateData {
  fieldId: string;
  date: string;
  startTime: string;
  duration: number;
  totalPlayers: number;
  additionalServices?: {
    equipmentRental?: boolean;
    coaching?: boolean;
    recording?: boolean;
  };
  paymentMethod: 'card' | 'wave' | 'orange_money' | 'cash';
  notes?: string;
}

export interface ReservationFilters {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  fieldId?: string;
  userId?: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
}

// Reservation API service
const reservationAPI = {
  // API pour les utilisateurs
  getUserReservations: async (
    page = 1,
    limit = 10,
    filters: ReservationFilters = {}
  ): Promise<{ reservations: Reservation[]; total: number; pages: number }> => {
    const response = await axios.get(`${API_BASE_URL}/reservations/user`, {
      params: {
        page,
        limit,
        ...filters,
      },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  getReservationById: async (reservationId: string): Promise<Reservation> => {
    const response = await axios.get(
      `${API_BASE_URL}/reservations/${reservationId}`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  createReservation: async (
    reservationData: ReservationCreateData
  ): Promise<Reservation> => {
    const response = await axios.post(
      `${API_BASE_URL}/reservations`,
      reservationData,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  cancelReservation: async (
    reservationId: string
  ): Promise<{ message: string }> => {
    const response = await axios.post(
      `${API_BASE_URL}/reservations/${reservationId}/cancel`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  // Paiement de réservation
  processPayment: async (
    reservationId: string,
    paymentData: {
      method: 'card' | 'wave' | 'orange_money' | 'cash';
      token?: string;
      phoneNumber?: string;
    }
  ): Promise<{ transactionId: string; status: string }> => {
    const response = await axios.post(
      `${API_BASE_URL}/reservations/${reservationId}/payment`,
      paymentData,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  // Vérification du statut de paiement
  checkPaymentStatus: async (
    reservationId: string
  ): Promise<{ status: string; paid: boolean; transactionId?: string }> => {
    const response = await axios.get(
      `${API_BASE_URL}/reservations/${reservationId}/payment-status`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  // API pour les administrateurs
  getAllReservations: async (
    page = 1,
    limit = 10,
    filters: ReservationFilters = {}
  ): Promise<{ reservations: Reservation[]; total: number; pages: number }> => {
    const response = await axios.get(`${API_BASE_URL}/admin/reservations`, {
      params: {
        page,
        limit,
        ...filters,
      },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  updateReservationStatus: async (
    reservationId: string,
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ): Promise<Reservation> => {
    const response = await axios.patch(
      `${API_BASE_URL}/admin/reservations/${reservationId}/status`,
      { status },
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  updateReservationPaymentStatus: async (
    reservationId: string,
    paymentStatus: 'pending' | 'paid' | 'refunded'
  ): Promise<Reservation> => {
    const response = await axios.patch(
      `${API_BASE_URL}/admin/reservations/${reservationId}/payment-status`,
      { paymentStatus },
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  deleteReservation: async (
    reservationId: string
  ): Promise<{ message: string }> => {
    const response = await axios.delete(
      `${API_BASE_URL}/admin/reservations/${reservationId}`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  // Statistiques pour le tableau de bord admin
  getReservationStats: async (): Promise<{
    totalReservations: number;
    confirmedReservations: number;
    pendingReservations: number;
    cancelledReservations: number;
    completedReservations: number;
    totalRevenue: number;
    revenueByMonth: { month: string; revenue: number }[];
    reservationsByStatus: { status: string; count: number }[];
    reservationsByDay: { day: string; count: number }[];
    mostBookedFields: { id: string; name: string; count: number }[];
  }> => {
    const response = await axios.get(
      `${API_BASE_URL}/admin/reservations/stats`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },
};

export default reservationAPI;
