import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface DashboardStats {
  totalUsers: number;
  totalFields: number;
  totalReservations: number;
  totalRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
  reservationGrowth: number;
  reservationsThisWeek: number;
  activeFields: number;
  completionRate: number;
}

// Team Management Types
export interface Team {
  id: string;
  name: string;
  logo?: string;
  captainId?: string;
  captainName?: string;
  playerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamDetails extends Team {
  players: TeamPlayer[];
}

interface TeamPlayer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isCaptain: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface TeamCreateRequest {
  name: string;
  captainId?: string;
  logo?: string;
  playerIds?: string[];
}

// Payment Management Types
export interface Payment {
  id: string;
  userId: string;
  userName: string;
  reservationId: string;
  fieldName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  transactionId: string;
}

export interface PaymentResponse {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  reservationId: string;
  fieldId: string;
  fieldName: string;
  startTime: string;
  endTime: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  transactionId: string;
  paymentProvider?: string;
  refundStatus?: string;
}

interface PaymentFilter {
  status?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
  paymentMethod?: string;
}

// Reports Types
interface RevenueReportData {
  totalRevenue: number;
  labels: string[];
  data: number[];
  total: number;
  periods: {
    period: string;
    amount: number;
  }[];
  paymentMethods: {
    method: string;
    amount: number;
  }[];
}

interface OccupancyReportData {
  overallOccupancyRate: number;
  labels: string[];
  data: number[];
  averageRate: number;
  fields: {
    name: string;
    occupancyRate: number;
    totalHours: number;
    bookedHours: number;
  }[];
  peakHours: {
    hour: number;
    occupancyRate: number;
  }[];
}

interface TimeDistributionData {
  weekdayDistribution: {
    day: string;
    count: number;
  }[];
  hourlyDistribution: {
    hour: number;
    count: number;
  }[];
  durationDistribution: {
    duration: string;
    count: number;
  }[];
  labels: string[];
  data: number[];
}

interface PaymentMethodData {
  methods: {
    method: string;
    count: number;
    amount: number;
  }[];
  trends: {
    period: string;
    methods: {
      method: string;
      percentage: number;
    }[];
  }[];
  labels: string[];
  data: number[];
}

interface ReportFilter {
  startDate?: string;
  endDate?: string;
  periodType?: 'daily' | 'monthly';
}

interface ReportSummary {
  totalRevenue: number;
  totalReservations: number;
  totalClients: number;
  occupancyRate: number;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: 'read' | 'unread' | 'sent' | 'pending' | 'failed';
  createdAt: string;
  targetAudience: 'all' | 'user' | 'admin' | 'super_admin';
  targetUserIds?: string[];
}

interface NotificationFilter {
  status?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
}

interface NotificationResponse {
  notifications?: Notification[];
  total?: number;
  id?: string;
  title?: string;
  content?: string;
  message?: string;
  type?: string;
  status?: string;
  recipients?: number | Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    sent: boolean;
  }>;
  createdAt?: string;
  sentAt?: string | null;
  recipientCount?: number;
  deliveredCount?: number;
  template?: string;
  channels?: string[];
}

export interface NotificationCreateRequest {
  title: string;
  message: string;
  type: string;
  targetAudience: 'all' | 'user' | 'admin' | 'super_admin';
  targetUserIds?: string[];
  content?: string;
  recipientIds?: string[];
  templateId?: string;
  channels?: string[];
  startDate?: string;
  endDate?: string;
}

interface RecentReservation {
  id: string;
  fieldName: string;
  userName: string;
  date: string;
  status: string;
  amount: number;
}

interface DashboardResponse {
  stats: DashboardStats;
}

interface RecentReservationsResponse {
  reservations: RecentReservation[];
}

/**
 * Service API pour les fonctionnalités d'administration
 */
// Interface pour TimeSlot
export interface TimeSlot {
  id: string;
  // Propriétés camelCase
  startTime: string;
  endTime: string;
  availableDays: string[];
  price: number;
  currency: string;
  status: 'active' | 'inactive';
  fieldId?: string;
  fieldName?: string;
  description?: string;
  
  // Propriétés snake_case pour compatibilité avec l'API
  field_id?: string;
  start_time?: string;
  end_time?: string;
  datefrom?: Date | string;
  dateto?: Date | string;
  is_available?: boolean;
}

// Interface pour Promotion
export interface Promotion {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  usageLimit?: number;
  timesUsed?: number;
  description?: string;
}

const adminAPI = {  
  /**
   * ===== TEAM MANAGEMENT =====
   */
  
  /**
   * Récupérer toutes les équipes
   */
  getTeams: async (page: number = 1, limit: number = 10): Promise<{ data: { teams: Team[]; total: number } }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/teams`, {
        params: { page, limit }
      });
      return response;
    } catch (error) {
      console.error('Error fetching teams:', error);
      
      // Données simulées pour le développement
      const mockTeams: Team[] = Array.from({ length: 15 }, (_, i) => ({
        id: uuidv4(),
        name: `Équipe ${i + 1}`,
        logo: i % 3 === 0 ? `https://via.placeholder.com/50` : undefined,
        captainId: uuidv4(),
        captainName: `Capitaine ${i + 1}`,
        playerCount: 5 + Math.floor(Math.random() * 10),
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
      }));
      
      return {
        data: {
          teams: mockTeams.slice((page - 1) * limit, page * limit),
          total: mockTeams.length
        }
      };
    }
  },
  
  /**
   * Récupérer une équipe par son ID
   */
  getTeamById: async (id: string): Promise<{ data: TeamDetails }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/teams/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching team with ID ${id}:`, error);
      
      // Données simulées pour le développement
      const mockPlayers: TeamPlayer[] = Array.from({ length: 8 }, (_, i) => ({
        id: uuidv4(),
        name: `Joueur ${i + 1}`,
        email: `joueur${i + 1}@example.com`,
        phone: i % 3 === 0 ? `+221 ${70 + i}${100 + i}${1000 + i}` : undefined,
        isCaptain: i === 0
      }));
      
      return {
        data: {
          id,
          name: `Équipe ${Math.floor(Math.random() * 100)}`,
          logo: Math.random() > 0.5 ? `https://via.placeholder.com/50` : undefined,
          captainId: mockPlayers[0].id,
          captainName: mockPlayers[0].name,
          playerCount: mockPlayers.length,
          createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          updatedAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
          players: mockPlayers
        }
      };
    }
  },
  
  /**
   * Créer une nouvelle équipe
   */
  createTeam: async (teamData: TeamCreateRequest): Promise<{ data: Team }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/teams`, teamData);
      return response;
    } catch (error) {
      console.error('Error creating team:', error);
      
      // Données simulées pour le développement
      return {
        data: {
          id: uuidv4(),
          name: teamData.name,
          logo: teamData.logo,
          captainId: teamData.captainId,
          captainName: teamData.captainId ? `User ${teamData.captainId.substring(0, 5)}` : undefined,
          playerCount: teamData.playerIds?.length || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };
    }
  },
  
  /**
   * Mettre à jour une équipe existante
   */
  updateTeam: async (id: string, teamData: TeamCreateRequest): Promise<{ data: Team }> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/teams/${id}`, teamData);
      return response;
    } catch (error) {
      console.error(`Error updating team with ID ${id}:`, error);
      
      // Données simulées pour le développement
      return {
        data: {
          id,
          name: teamData.name,
          logo: teamData.logo,
          captainId: teamData.captainId,
          captainName: teamData.captainId ? `User ${teamData.captainId.substring(0, 5)}` : undefined,
          playerCount: teamData.playerIds?.length || 0,
          createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };
    }
  },
  
  /**
   * Supprimer une équipe
   */
  deleteTeam: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/teams/${id}`);
    } catch (error) {
      console.error(`Error deleting team with ID ${id}:`, error);
      // Ne rien retourner pour les données simulées
    }
  },
  
  /**
   * Ajouter un joueur à une équipe
   */
  addPlayerToTeam: async (teamId: string, playerId: string): Promise<{ data: TeamDetails }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/teams/${teamId}/players`, { playerId });
      return response;
    } catch (error) {
      console.error(`Error adding player to team ${teamId}:`, error);
      
      // Retourner l'équipe mise à jour avec le joueur ajouté (simulé)
      return await adminAPI.getTeamById(teamId);
    }
  },
  
  /**
   * Supprimer un joueur d'une équipe
   */
  removePlayerFromTeam: async (teamId: string, playerId: string): Promise<{ data: TeamDetails }> => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/admin/teams/${teamId}/players/${playerId}`);
      return response;
    } catch (error) {
      console.error(`Error removing player from team ${teamId}:`, error);
      
      // Retourner l'équipe mise à jour sans le joueur (simulé)
      return await adminAPI.getTeamById(teamId);
    }
  },
  
  /**
   * Définir un joueur comme capitaine de l'équipe
   */
  setTeamCaptain: async (teamId: string, playerId: string): Promise<{ data: TeamDetails }> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/teams/${teamId}/captain`, { playerId });
      return response;
    } catch (error) {
      console.error(`Error setting captain for team ${teamId}:`, error);
      
      // Retourner l'équipe mise à jour avec le nouveau capitaine (simulé)
      return await adminAPI.getTeamById(teamId);
    }
  },
  
  /**
   * Récupérer les utilisateurs qui peuvent être ajoutés à une équipe
   */
  getEligiblePlayers: async (): Promise<{ data: { users: User[] } }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users/players`);
      return response;
    } catch (error) {
      console.error('Error fetching eligible players:', error);
      
      // Données simulées pour le développement
      const mockUsers: User[] = Array.from({ length: 20 }, (_, i) => ({
        id: uuidv4(),
        name: `Utilisateur ${i + 1}`,
        email: `utilisateur${i + 1}@example.com`,
        role: 'user',
        phone: i % 2 === 0 ? `+221 7${i}${100 + i}${1000 + i}` : undefined
      }));
      
      return {
        data: {
          users: mockUsers
        }
      };
    }
  },
  
  /**
   * ===== PAYMENTS MANAGEMENT =====
   */
  
  /**
   * Récupérer tous les paiements avec filtres optionnels
   */
  getPayments: async (filters?: PaymentFilter): Promise<{ data: { payments: Payment[]; total: number } }> => {
    try {
      // Vérifier si le token est présent dans localStorage
      const token = localStorage.getItem('token');
      console.log('DEBUG AUTH: Token présent dans localStorage:', !!token);
      
      // Ajouter explicitement le header d'autorisation
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      console.log('DEBUG AUTH: Headers configurés:', headers);
      console.log('DEBUG AUTH: URL API utilisée:', `${API_BASE_URL}/payments/admin/all`);
      
      const response = await axios.get(`${API_BASE_URL}/payments/admin/all`, {
        params: filters,
        headers
      });
      
      console.log('DEBUG AUTH: Réponse API reçue:', response.status);
      return response;
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Vérifier si l'erreur est une erreur Axios
      if (axios.isAxiosError(error)) {
        console.error('DEBUG AUTH: Détails de l\'erreur:', error.response?.status, error.response?.data);
      }
      
      // Données simulées pour le développement
      const paymentMethods = ['Card', 'Cash', 'Wave', 'Orange Money'];
      const paymentStatuses = ['completed', 'pending', 'failed'];
      
      const mockPayments: Payment[] = Array.from({ length: 30 }, (_, i) => {
        const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        
        return {
          id: uuidv4(),
          userId: uuidv4(),
          userName: `Client ${i + 1}`,
          reservationId: uuidv4(),
          fieldName: `Terrain ${Math.floor(Math.random() * 5) + 1}`,
          amount: Math.round((20 + Math.random() * 50) * 100) / 100,
          currency: 'XOF',
          paymentMethod,
          status,
          createdAt: createdAt.toISOString(),
          transactionId: `TRX${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        };
      });
      
      // Appliquer les filtres si présents
      let filteredPayments = [...mockPayments];
      
      if (filters) {
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          filteredPayments = filteredPayments.filter(payment => 
            new Date(payment.createdAt) >= startDate
          );
        }
        
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          filteredPayments = filteredPayments.filter(payment => 
            new Date(payment.createdAt) <= endDate
          );
        }
        
        if (filters.paymentMethod) {
          filteredPayments = filteredPayments.filter(payment => 
            payment.paymentMethod === filters.paymentMethod
          );
        }
        
        if (filters.status) {
          filteredPayments = filteredPayments.filter(payment => 
            payment.status === filters.status
          );
        }
      }
      
      // Trier par date de création décroissante
      filteredPayments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Pagination (si demandée)
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const paginatedPayments = filteredPayments.slice((page - 1) * limit, page * limit);
      
      return {
        data: {
          payments: paginatedPayments,
          total: filteredPayments.length
        }
      };
    }
  },
  
  /**
   * Récupérer un paiement par son ID
   */
  getPaymentById: async (id: string): Promise<{ data: PaymentResponse }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/payments/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching payment with ID ${id}:`, error);
      
      // Données simulées pour le développement
      const paymentMethods = ['Card', 'Cash', 'Wave', 'Orange Money'];
      const paymentStatuses = ['completed', 'pending', 'failed'];
      
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      
      const mockPayment: PaymentResponse = {
        id,
        userId: uuidv4(),
        userName: `Client ${Math.floor(Math.random() * 100) + 1}`,
        userEmail: `client${Math.floor(Math.random() * 100) + 1}@example.com`,
        reservationId: uuidv4(),
        fieldId: uuidv4(),
        fieldName: `Terrain ${Math.floor(Math.random() * 5) + 1}`,
        startTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        amount: Math.round((20 + Math.random() * 50) * 100) / 100,
        currency: 'XOF',
        paymentMethod,
        status,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        transactionId: `TRX${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        paymentProvider: paymentMethod === 'Card' ? 'Stripe' : paymentMethod,
        refundStatus: Math.random() > 0.9 ? 'refunded' : undefined,
      };
      
      return {
        data: mockPayment
      };
    }
  },
  
  /**
   * Mettre à jour le statut d'un paiement
   */
  updatePaymentStatus: async (id: string, status: string): Promise<{ data: PaymentResponse }> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/payments/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error(`Error updating payment status for ID ${id}:`, error);
      // Retourner le paiement mis à jour (simulé)
      return await adminAPI.getPaymentById(id);
    }
  },
  
  /**
   * Rembourser un paiement
   */
  refundPayment: async (id: string, amount?: number): Promise<{ data: PaymentResponse }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/payments/${id}/refund`, { amount });
      return response;
    } catch (error) {
      console.error(`Error refunding payment with ID ${id}:`, error);
      // Retourner le paiement mis à jour (simulé)
      return await adminAPI.getPaymentById(id);
    }
  },
  
  /**
   * Récupérer les statistiques des paiements
   */
  getPaymentStats: async (startDate?: string, endDate?: string): Promise<{
    data: {
      totalRevenue: number;
      paymentCounts: { method: string; count: number }[];
      dailyRevenue: { date: string; amount: number }[];
    }
  }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/payments/statistics`, {
        params: { startDate, endDate }
      });
      return response;
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      
      // Données simulées pour le développement
      const paymentMethods = ['Card', 'Cash', 'Wave', 'Orange Money'];
      const mockPaymentCounts = paymentMethods.map(method => ({
        method,
        count: Math.floor(Math.random() * 100) + 10
      }));
      
      // Générer des revenus quotidiens sur 30 jours
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);
      
      const dailyRevenue = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dailyRevenue.push({
          date: currentDate.toISOString().split('T')[0],
          amount: Math.round((100 + Math.random() * 1000) * 100) / 100
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const totalRevenue = dailyRevenue.reduce((total, day) => total + day.amount, 0);
      
      return {
        data: {
          totalRevenue,
          paymentCounts: mockPaymentCounts,
          dailyRevenue
        }
      };
    }
  },
  
  /**
   * ===== REPORTS MANAGEMENT =====
   */
  
  /**
   * Récupérer les données pour les rapports de revenus
   */
  getRevenueReport: async (filter?: ReportFilter): Promise<{ data: RevenueReportData }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/revenue`, {
        params: filter
      });
      return response;
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      
      // Données simulées pour le développement
      const periodCount = filter?.periodType === 'monthly' ? 12 : 30;
      // Générer les périodes de temps pour l'analyse des revenus
      const periods = Array.from({ length: periodCount }, (_, i) => ({
        period: filter?.periodType === 'monthly' 
          ? `${i + 1}/2023` 
          : new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: Math.round((500 + Math.random() * 2000) * 100) / 100
      }));
      
      // Données sur les méthodes de paiement
      const paymentMethods = [
        { method: 'Card', amount: Math.round((3000 + Math.random() * 5000) * 100) / 100 },
        { method: 'Cash', amount: Math.round((2000 + Math.random() * 3000) * 100) / 100 },
        { method: 'Wave', amount: Math.round((1500 + Math.random() * 3000) * 100) / 100 },
        { method: 'Orange Money', amount: Math.round((1000 + Math.random() * 2000) * 100) / 100 }
      ];
      
      // Calcul du revenu total
      const totalRevenue = Math.round((10000 + Math.random() * 50000) * 100) / 100;
      
      // Créer les labels et les données pour les graphiques
      const labels = periods.map(p => p.period);
      const data = periods.map(p => p.amount);
      const total = periods.reduce((sum, period) => sum + period.amount, 0);
      
      const mockData: RevenueReportData = {
        totalRevenue,
        periods,
        paymentMethods,
        labels,
        data,
        total
      };
      
      return { data: mockData };
    }
  },
  
  /**
   * Récupérer les données pour les rapports d'occupation
   */
  getOccupancyReport: async (filter?: ReportFilter): Promise<{ data: OccupancyReportData }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/occupancy`, {
        params: filter
      });
      return response;
    } catch (error) {
      console.error('Error fetching occupancy report:', error);
      
      // Données simulées pour le développement
      const fields = ['Terrain 1', 'Terrain 2', 'Terrain 3', 'Terrain 4', 'Terrain 5'];
      
      // Générer les données d'occupation pour chaque terrain
      const fieldData = fields.map(field => ({
        name: field,
        occupancyRate: Math.round((30 + Math.random() * 60) * 10) / 10,
        totalHours: Math.round((80 + Math.random() * 120) * 10) / 10,
        bookedHours: Math.round((30 + Math.random() * 80) * 10) / 10
      }));
      
      // Heures de pointe d'occupation
      const peakHours = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        occupancyRate: Math.round((i >= 17 && i <= 22 ? 50 : 20) + Math.random() * 50)
      }));
      
      // Calcul du taux d'occupation global
      const overallOccupancyRate = Math.round((40 + Math.random() * 40) * 10) / 10;
      
      // Générer les labels et données pour les graphiques
      const labels = fields;
      const data = fieldData.map(f => f.occupancyRate);
      const averageRate = Number((data.reduce((sum, rate) => sum + rate, 0) / data.length).toFixed(1));
      
      const mockData: OccupancyReportData = {
        overallOccupancyRate,
        fields: fieldData,
        peakHours,
        labels,
        data,
        averageRate
      };
      
      return { data: mockData };
    }
  },
  
  /**
   * Récupérer les données pour la distribution du temps
   */
  getTimeDistribution: async (filter?: ReportFilter): Promise<{ data: TimeDistributionData }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/time-distribution`, {
        params: filter
      });
      return response;
    } catch (error) {
      console.error('Error fetching time distribution report:', error);
      
      // Données simulées pour le développement
      // Générer les données de distribution du temps
      const weekdayDistribution = [
        { day: 'Lundi', count: Math.floor(50 + Math.random() * 50) },
        { day: 'Mardi', count: Math.floor(40 + Math.random() * 60) },
        { day: 'Mercredi', count: Math.floor(60 + Math.random() * 40) },
        { day: 'Jeudi', count: Math.floor(45 + Math.random() * 55) },
        { day: 'Vendredi', count: Math.floor(70 + Math.random() * 30) },
        { day: 'Samedi', count: Math.floor(80 + Math.random() * 40) },
        { day: 'Dimanche', count: Math.floor(60 + Math.random() * 50) },
      ];

      const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor((i >= 17 && i <= 22 ? 70 : 20) + Math.random() * 40)
      }));

      const durationDistribution = [
        { duration: '1h', count: Math.floor(30 + Math.random() * 40) },
        { duration: '2h', count: Math.floor(80 + Math.random() * 40) },
        { duration: '3h', count: Math.floor(40 + Math.random() * 30) },
        { duration: '4h+', count: Math.floor(10 + Math.random() * 20) },
      ];
      
      // Générer les labels et données pour les graphiques
      const labels = weekdayDistribution.map(d => d.day);
      const data = weekdayDistribution.map(d => d.count);
      
      const mockData: TimeDistributionData = {
        weekdayDistribution,
        hourlyDistribution,
        durationDistribution,
        labels,
        data
      };
      
      return { data: mockData };
    }
  },
  
  /**
   * Récupérer les données pour la distribution des méthodes de paiement
   */
  getPaymentMethodsData: async (filter?: ReportFilter): Promise<{ data: PaymentMethodData }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/payment-methods`, {
        params: filter
      });
      return response;
    } catch (error) {
      console.error('Error fetching payment methods report:', error);
      
      // Données simulées pour le développement
      const methods = [
        { method: 'Card', count: Math.floor(100 + Math.random() * 100), amount: Math.round((3000 + Math.random() * 5000) * 100) / 100 },
        { method: 'Cash', count: Math.floor(60 + Math.random() * 80), amount: Math.round((2000 + Math.random() * 3000) * 100) / 100 },
        { method: 'Wave', count: Math.floor(40 + Math.random() * 70), amount: Math.round((1500 + Math.random() * 3000) * 100) / 100 },
        { method: 'Orange Money', count: Math.floor(30 + Math.random() * 60), amount: Math.round((1000 + Math.random() * 2000) * 100) / 100 }
      ];

      const trends = Array.from({ length: 12 }, (_, i) => ({
        period: `${i + 1}/2023`,
        methods: [
          { method: 'Card', percentage: Math.round((30 + Math.random() * 20) * 10) / 10 },
          { method: 'Cash', percentage: Math.round((20 + Math.random() * 15) * 10) / 10 },
          { method: 'Wave', percentage: Math.round((15 + Math.random() * 15) * 10) / 10 },
          { method: 'Orange Money', percentage: Math.round((10 + Math.random() * 10) * 10) / 10 }
        ]
      }));

      // Générer les labels et données pour les graphiques
      const labels = methods.map(m => m.method);
      const data = methods.map(m => m.amount);
      
      const mockData: PaymentMethodData = {
        methods,
        trends,
        labels,
        data
      };
      
      return { data: mockData };
    }
  },
  
  /**
   * Récupérer un résumé des rapports pour le tableau de bord
   */
  getReportsSummary: async (): Promise<{ data: ReportSummary }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/summary`);
      return response;
    } catch (error) {
      console.error('Error fetching reports summary:', error);
      
      // Données simulées pour le développement
      const mockData: ReportSummary = {
        totalRevenue: Math.round((5000 + Math.random() * 10000) * 100) / 100,
        totalReservations: Math.floor(200 + Math.random() * 300),
        totalClients: Math.floor(100 + Math.random() * 200),
        occupancyRate: Math.round((40 + Math.random() * 30) * 10) / 10
      };
      
      return { data: mockData };
    }
  },
  
  /**
   * ===== NOTIFICATIONS MANAGEMENT =====
   */
  
  /**
   * Récupérer toutes les notifications avec filtres optionnels
   */
  getNotifications: async (filters?: NotificationFilter): Promise<{ data: { notifications: Notification[]; total: number } }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/notifications`, {
        params: filters
      });
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      // Données simulées pour le développement
      const notificationTypes = ['system', 'reservation', 'payment', 'maintenance'];
      const notificationStatuses: Array<'read' | 'unread' | 'sent' | 'pending' | 'failed'> = ['read', 'unread', 'sent'];
      
      const mockNotifications: Notification[] = Array.from({ length: 30 }, (_, i) => {
        const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        const status = notificationStatuses[Math.floor(Math.random() * notificationStatuses.length)] as 'read' | 'unread' | 'sent' | 'pending' | 'failed';
        
        return {
          id: uuidv4(),
          title: `Notification ${i + 1}`,
          content: `Contenu de la notification ${i + 1}. Ceci est un exemple.`,
          message: `Message de la notification ${i + 1}. Ceci est un exemple de message.`,
          type,
          status,
          targetAudience: (['all', 'user', 'admin', 'super_admin'] as const)[Math.floor(Math.random() * 4)],
          recipients: Math.floor(Math.random() * 100) + 1,
          createdAt: createdAt.toISOString(),
          sentAt: status === 'sent' ? new Date(createdAt.getTime() + 1000 * 60).toISOString() : null
        };
      });
      
      // Appliquer les filtres si présents
      let filteredNotifications = [...mockNotifications];
      
      if (filters) {
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          filteredNotifications = filteredNotifications.filter(notification => 
            new Date(notification.createdAt) >= startDate
          );
        }
        
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          filteredNotifications = filteredNotifications.filter(notification => 
            new Date(notification.createdAt) <= endDate
          );
        }
        
        if (filters.type) {
          filteredNotifications = filteredNotifications.filter(notification => 
            notification.type === filters.type
          );
        }
        
        if (filters.status) {
          filteredNotifications = filteredNotifications.filter(notification => 
            notification.status === filters.status
          );
        }
      }
      
      // Trier par date de création décroissante
      filteredNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Pagination (si demandée)
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const paginatedNotifications = filteredNotifications.slice((page - 1) * limit, page * limit);
      
      return {
        data: {
          notifications: paginatedNotifications,
          total: filteredNotifications.length
        }
      };
    }
  },
  
  /**
   * Récupérer une notification par son ID
   */
  getNotificationById: async (id: string): Promise<{ data: NotificationResponse }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/notifications/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching notification with ID ${id}:`, error);
      
      // Données simulées pour le développement
      const notificationTypes = ['system', 'reservation', 'payment', 'maintenance'];
      const notificationStatuses = ['sent', 'pending', 'failed'];
      
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const status = notificationStatuses[Math.floor(Math.random() * notificationStatuses.length)];
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      const mockNotification: NotificationResponse = {
        id,
        title: `Notification ${Math.floor(Math.random() * 100) + 1}`,
        content: `Contenu détaillé de la notification. Ceci est un exemple de notification de type ${type}.`,
        message: `Contenu détaillé de la notification. Ceci est un exemple de notification de type ${type}.`,
        type,
        status,
        recipients: [
          { id: uuidv4(), name: 'Utilisateur 1', email: 'user1@example.com', phone: '+221701234567', sent: true },
          { id: uuidv4(), name: 'Utilisateur 2', email: 'user2@example.com', sent: status === 'sent' },
          { id: uuidv4(), name: 'Utilisateur 3', email: 'user3@example.com', phone: '+221701234568', sent: status === 'sent' }
        ],
        recipientCount: 3,
        deliveredCount: status === 'sent' ? 3 : 0,
        createdAt: createdAt.toISOString(),
        sentAt: status === 'sent' ? new Date(createdAt.getTime() + 1000 * 60).toISOString() : null,
        template: type === 'system' ? 'system-alert' : type === 'reservation' ? 'reservation-confirmation' : 'payment-receipt',
        channels: ['email', 'sms']
      };
      
      return {
        data: mockNotification
      };
    }
  },
  
  /**
   * Créer une nouvelle notification
   */
  createNotification: async (data: NotificationCreateRequest): Promise<{ data: NotificationResponse }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/notifications`, data);
      return response;
    } catch (error) {
      console.error('Error creating notification:', error);
      
      // Données simulées pour le développement
      // Utilisation de récipients par défaut si aucun n'est fourni
      const recipientIds = data.recipientIds || [uuidv4(), uuidv4(), uuidv4()]; // Utilisation d'UUIDs v4 sécurisés
      
      const mockNotification: NotificationResponse = {
        id: uuidv4(), // UUID v4 pour garantir la sécurité des clés primaires
        title: data.title,
        content: data.content,
        message: data.message,
        type: data.type,
        status: 'pending',
        recipients: recipientIds.map((id, index) => ({
          id, // ID d'origine ou UUID généré
          name: `Utilisateur ${index + 1}`,
          email: `user${index + 1}@example.com`,
          phone: index % 2 === 0 ? `+221701234${index}` : undefined,
          sent: false
        })),
        recipientCount: recipientIds.length,
        deliveredCount: 0,
        createdAt: new Date().toISOString(),
        sentAt: null,
        template: data.templateId,
        channels: data.channels
      };
      
      return {
        data: mockNotification
      };
    }
  },
  
  /**
   * Renvoyer une notification
   */
  resendNotification: async (id: string): Promise<{ data: NotificationResponse }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/notifications/${id}/resend`);
      return response;
    } catch (error) {
      console.error(`Error resending notification with ID ${id}:`, error);
      
      // Retourner la notification mise à jour (simulé)
      return await adminAPI.getNotificationById(id);
    }
  },
  
  /**
   * Annuler une notification en attente
   */
  cancelNotification: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/notifications/${id}`);
    } catch (error) {
      console.error(`Error canceling notification with ID ${id}:`, error);
      // Ne rien retourner pour les données simulées
    }
  },
  
  /**
   * Récupérer les modèles de notification disponibles
   */
  getNotificationTemplates: async (): Promise<{ data: { templates: { id: string; name: string; description: string; type: string }[] } }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/notifications/templates`);
      return response;
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      
      // Données simulées pour le développement
      const mockTemplates = [
        { id: 'reservation-confirmation', name: 'Confirmation de réservation', description: 'Envoyé lors de la confirmation d\'une réservation', type: 'reservation' },
        { id: 'reservation-reminder', name: 'Rappel de réservation', description: 'Envoyé 24h avant une réservation', type: 'reservation' },
        { id: 'payment-receipt', name: 'Reçu de paiement', description: 'Envoyé après un paiement réussi', type: 'payment' },
        { id: 'payment-reminder', name: 'Rappel de paiement', description: 'Envoyé pour les paiements en attente', type: 'payment' },
        { id: 'system-alert', name: 'Alerte système', description: 'Notifications importantes du système', type: 'system' },
        { id: 'maintenance-notice', name: 'Avis de maintenance', description: 'Informations sur la maintenance des terrains', type: 'maintenance' },
      ];
      
      return {
        data: {
          templates: mockTemplates
        }
      };
    }
  },
  /**
   * Obtenir les statistiques du tableau de bord
   */
  getDashboardStats: async (): Promise<{ data: DashboardResponse }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard/stats`);
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Données simulées pour le développement
      return {
        data: {
          stats: {
            totalUsers: 245,
            totalFields: 18,
            totalReservations: 876,
            totalRevenue: 15720000,
            revenueGrowth: 12.5,
            userGrowth: 8.3,
            reservationGrowth: 15.7,
            reservationsThisWeek: 47,
            activeFields: 15,
            completionRate: 92.4
          }
        }
      };
    }
  },
  
  /**
   * Obtenir les réservations récentes pour le tableau de bord
   */
  getRecentReservations: async (): Promise<{ data: RecentReservationsResponse }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard/recent-reservations`);
      return response;
    } catch (error) {
      console.error('Error fetching recent reservations:', error);
      
      // Données simulées pour le développement
      return {
        data: {
          reservations: [
            { 
              id: uuidv4(), 
              fieldName: 'Terrain Premium A', 
              userName: 'Amadou Diallo', 
              date: new Date().toISOString(), 
              status: 'confirmed', 
              amount: 25000 
            },
            { 
              id: uuidv4(), 
              fieldName: 'Terrain Classic B', 
              userName: 'Fatou Ndiaye', 
              date: new Date().toISOString(), 
              status: 'pending', 
              amount: 15000 
            },
            { 
              id: uuidv4(), 
              fieldName: 'Terrain Indoor C', 
              userName: 'Moussa Sall', 
              date: new Date(Date.now() + 86400000).toISOString(), 
              status: 'confirmed', 
              amount: 35000 
            },
            { 
              id: uuidv4(), 
              fieldName: 'Terrain Premium A', 
              userName: 'Aicha Ba', 
              date: new Date(Date.now() + 86400000).toISOString(), 
              status: 'completed', 
              amount: 25000 
            },
            { 
              id: uuidv4(), 
              fieldName: 'Terrain Classic B', 
              userName: 'Omar Mbaye', 
              date: new Date(Date.now() + 86400000 * 2).toISOString(), 
              status: 'cancelled', 
              amount: 15000 
            }
          ]
        }
      };
    }
  },
  
  /**
   * Obtenir les revenus mensuels pour les graphiques
   */
  getMonthlyRevenue: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/monthly-revenue`);
      return response;
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      
      // Données simulées pour le développement
      return {
        data: {
          months: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'],
          revenue: [1250000, 1890000, 1456000, 1789000, 2150000, 1980000, 2340000, 1572000],
        }
      };
    }
  },
  
  /**
   * Obtenir les réservations quotidiennes pour les graphiques
   */
  getDailyReservations: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/daily-reservations`);
      return response;
    } catch (error) {
      console.error('Error fetching daily reservations:', error);
      
      // Données simulées pour le développement
      return {
        data: {
          days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          reservations: [5, 8, 12, 9, 15, 25, 20],
        }
      };
    }
  },
  
  /**
   * Obtenir la répartition des terrains (intérieur/extérieur) pour les graphiques
   */
  getFieldsDistribution: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/fields-distribution`);
      return response;
    } catch (error) {
      console.error('Error fetching fields distribution:', error);
      
      // Données simulées pour le développement
      return {
        data: {
          indoor: 6,
          outdoor: 12,
        }
      };
    }
  },
  
  /**
   * Obtenir les méthodes de paiement utilisées pour les graphiques
   */
  getPaymentMethodsDistribution: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/payment-methods`);
      return response;
    } catch (error) {
      console.error('Error fetching payment methods distribution:', error);
      
      // Données simulées pour le développement
      return {
        data: {
          methods: ['Stripe', 'Wave', 'Orange Money', 'Cash'],
          counts: [45, 65, 85, 30],
        }
      };
    }
  },
  /**
   * ===== TIME SLOTS MANAGEMENT =====
   */
  
  /**
   * Récupérer tous les créneaux horaires
   */
  getTimeSlots: async (): Promise<{ data: TimeSlot[] }> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/timeslots`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error;
    }
  },
  
  /**
   * Créer un nouveau créneau horaire
   */
  createTimeSlot: async (data: Omit<TimeSlot, 'id'>): Promise<{ data: TimeSlot }> => {
    try {
      // Utiliser la route correcte avec le field_id dans l'URL
      const fieldId = data.field_id || data.fieldId;
      
      if (!fieldId) {
        throw new Error('field_id is required');
      }
      
      // Adapter les données pour la compatibilité avec le backend
      const requestData = {
        start_time: data.start_time || data.startTime,
        end_time: data.end_time || data.endTime,
        datefrom: data.datefrom,
        dateto: data.dateto,
        is_available: data.is_available !== undefined ? data.is_available : true
      };
      
      console.log('Sending time slot data to backend:', requestData);
      
      // Appel à l'API avec la nouvelle route
      const response = await axios.post(
        `${API_BASE_URL}/fields/${fieldId}/time-slots`, 
        requestData
      );
      
      return response;
    } catch (error) {
      console.error('Error creating time slot:', error);
      
      // Données simulées en cas d'erreur
      const mockTimeSlot: TimeSlot = {
        id: uuidv4(),
        ...data,
        status: data.status || 'active'
      };
      
      return {
        data: mockTimeSlot
      };
    }
  },
  
  /**
   * Mettre à jour un créneau horaire existant
   */
  updateTimeSlot: async (id: string, data: Partial<TimeSlot>): Promise<{ data: TimeSlot }> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/timeslots/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating time slot:', error);
      
      // Données simulées
      const mockTimeSlot: TimeSlot = {
        id,
        startTime: data.startTime || '08:00',
        endTime: data.endTime || '09:00',
        availableDays: data.availableDays || ['monday', 'wednesday', 'friday'],
        price: data.price || 5000,
        currency: data.currency || 'XOF',
        status: data.status || 'active',
        fieldId: data.fieldId,
        fieldName: data.fieldName,
        description: data.description
      };
      
      return {
        data: mockTimeSlot
      };
    }
  },
  
  /**
   * Supprimer un créneau horaire
   */
  deleteTimeSlot: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/timeslots/${id}`);
    } catch (error) {
      console.error('Error deleting time slot:', error);
      // Simulation de la suppression sans retour de données
      return Promise.resolve();
    }
  },
  
  /**
   * ===== PROMOTIONS MANAGEMENT =====
   */
  
  /**
   * Récupérer toutes les promotions
   */
  getPromotions: async (): Promise<{ data: Promotion[] }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/promotions`);
      return response;
    } catch (error) {
      console.error('Error fetching promotions:', error);
      
      // Données simulées pour le développement
      const mockPromotions: Promotion[] = Array.from({ length: 8 }, (_, i) => ({
        id: uuidv4(),
        code: `PROMO${i+1}`,
        discountType: i % 2 === 0 ? 'percentage' : 'fixed',
        discountValue: i % 2 === 0 ? (5 + i * 5) : (1000 + i * 500),
        startDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        endDate: new Date(Date.now() + ((30 - i) * 24 * 60 * 60 * 1000)).toISOString(),
        status: i < 6 ? 'active' : 'inactive',
        usageLimit: 100,
        timesUsed: i * 5,
        description: `Promotion ${i+1} description`
      }));
      
      return {
        data: mockPromotions
      };
    }
  },
  
  /**
   * Créer une nouvelle promotion
   */
  createPromotion: async (data: Omit<Promotion, 'id' | 'timesUsed'>): Promise<{ data: Promotion }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/promotions`, data);
      return response;
    } catch (error) {
      console.error('Error creating promotion:', error);
      
      // Données simulées
      const mockPromotion: Promotion = {
        id: uuidv4(),
        ...data,
        timesUsed: 0,
        status: data.status || 'active'
      };
      
      return {
        data: mockPromotion
      };
    }
  },
  
  /**
   * Mettre à jour une promotion existante
   */
  updatePromotion: async (id: string, data: Partial<Promotion>): Promise<{ data: Promotion }> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/promotions/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating promotion:', error);
      
      // Données simulées
      const mockPromotion: Promotion = {
        id,
        code: data.code || 'PROMO',
        discountType: data.discountType || 'percentage',
        discountValue: data.discountValue || 10,
        startDate: data.startDate || new Date().toISOString(),
        endDate: data.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: data.status || 'active',
        usageLimit: data.usageLimit,
        timesUsed: data.timesUsed || 0,
        description: data.description
      };
      
      return {
        data: mockPromotion
      };
    }
  },
  
  /**
   * Supprimer une promotion
   */
  deletePromotion: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/promotions/${id}`);
    } catch (error) {
      console.error('Error deleting promotion:', error);
      // Simulation de la suppression sans retour de données
      return Promise.resolve();
    }
  },
  
  /**
   * ===== USER MANAGEMENT =====
   */
  
  /**
   * Récupérer tous les utilisateurs
   */
  getUsers: async (): Promise<{ data: User[] }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`);
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Données simulées pour le développement
      const mockUsers: User[] = Array.from({ length: 20 }, (_, i) => ({
        id: uuidv4(),
        name: `Utilisateur ${i + 1}`,
        email: `user${i+1}@example.com`,
        role: i < 2 ? 'admin' : (i < 5 ? 'super_admin' : 'user'),
        phone: `+2216${Math.floor(10000000 + Math.random() * 90000000)}` 
      }));
      
      return {
        data: mockUsers
      };
    }
  },
  
  /**
   * ===== PAYMENT DETAIL =====
   */
  
  /**
   * Récupérer les détails d'un paiement
   */
  getPaymentDetail: async (id: string): Promise<{ data: PaymentResponse }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/payments/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      
      // Données simulées pour le développement
      const mockPaymentDetail: PaymentResponse = {
        id,
        userId: uuidv4(),
        userName: 'Client Example',
        userEmail: 'client@example.com',
        reservationId: uuidv4(),
        fieldId: uuidv4(),
        fieldName: 'Terrain Principal',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        amount: 15000,
        currency: 'XOF',
        paymentMethod: 'Wave',
        status: 'completed',
        createdAt: new Date().toISOString(),
        transactionId: `TRX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        paymentProvider: 'Wave',
        refundStatus: undefined
      };
      
      return {
        data: mockPaymentDetail
      };
    }
  },
  
  /**
   * Générer une facture pour un paiement
   */
  generateInvoice: async (id: string): Promise<{ data: Blob }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/payments/${id}/invoice`, { responseType: 'blob' });
      return response;
    } catch (error) {
      console.error('Error generating invoice:', error);
      
      // Simulation d'un PDF vide
      const mockPdfBlob = new Blob(['PDF contenu factice'], { type: 'application/pdf' });
      return { data: mockPdfBlob };
    }
  },
  
  /**
   * ===== TEAM DETAILS =====
   */
  
  /**
   * Récupérer les détails d'une équipe
   */
  getTeamDetail: async (id: string): Promise<{ data: TeamDetails }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/teams/${id}/details`);
      return response;
    } catch (error) {
      console.error('Error fetching team details:', error);
      
      // Données simulées pour le développement
      const captainId = uuidv4();
      const mockTeamDetail: TeamDetails = {
        id,
        name: 'Équipe Example',
        logo: 'https://example.com/logo.png',
        captainId,
        captainName: 'Capitaine Example',
        playerCount: 8,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        players: Array.from({ length: 8 }, (_, i) => ({
          id: i === 0 ? captainId : uuidv4(),
          name: i === 0 ? 'Capitaine Example' : `Joueur ${i}`,
          email: i === 0 ? 'capitaine@example.com' : `joueur${i}@example.com`,
          phone: `+2216${Math.floor(10000000 + Math.random() * 90000000)}`,
          isCaptain: i === 0
        }))
      };
      
      return {
        data: mockTeamDetail
      };
    }
  },
  
  /**
   * ===== NOTIFICATION MANAGEMENT =====
   */
   
  /**
   * Marquer une notification comme lue
   */
  markNotificationAsRead: async (id: string): Promise<{ data: Notification }> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/notifications/${id}/read`);
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Données simulées
      return {
        data: {
          id,
          title: 'Notification test',
          message: 'Contenu de la notification',
          type: 'info',
          status: 'read',
          createdAt: new Date().toISOString(),
          targetAudience: 'admin'
        }
      };
    }
  },
  
  /**
   * Supprimer une notification
   */
  deleteNotification: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/notifications/${id}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Simulation de la suppression sans retour de données
      return Promise.resolve();
    }
  },
  
  /**
   * ===== REPORTS ADVANCED =====
   */
  
  /**
   * Récupérer le résumé des rapports
   */
  getReportSummary: async (startDate: string, endDate: string): Promise<{ data: ReportSummary }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/summary`, {
        params: { startDate, endDate }
      });
      return response;
    } catch (error) {
      console.error('Error fetching report summary:', error);
      
      // Données simulées
      return {
        data: {
          totalRevenue: 1250000,
          totalReservations: 320,
          totalClients: 180,
          occupancyRate: 68.5
        }
      };
    }
  },
  
  /**
   * Récupérer les revenus par période
   */
  getRevenueByPeriod: async (startDate: string, endDate: string, periodType: 'daily' | 'monthly'): Promise<{ data: RevenueReportData }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/revenue`, {
        params: { startDate, endDate, periodType }
      });
      return response;
    } catch (error) {
      console.error('Error fetching revenue by period:', error);
      
      // Données simulées
      const isDaily = periodType === 'daily';
      const periods = isDaily ? 30 : 12;
      const mockData = {
        totalRevenue: 1250000,
        total: 1250000, // Ajout de la propriété total requise par l'interface RevenueReportData
        labels: Array.from({ length: periods }, (_, i) => isDaily ? `Jour ${i+1}` : `Mois ${i+1}`),
        data: Array.from({ length: periods }, () => Math.floor(10000 + Math.random() * 90000)),
        periods: Array.from({ length: periods }, (_, i) => ({
          period: isDaily ? `2023-07-${String(i+1).padStart(2, '0')}` : `2023-${String(i+1).padStart(2, '0')}`,
          amount: Math.floor(10000 + Math.random() * 90000)
        })),
        paymentMethods: [
          { method: 'Carte bancaire', amount: 500000 },
          { method: 'Wave', amount: 350000 },
          { method: 'Orange Money', amount: 250000 },
          { method: 'Espèces', amount: 150000 }
        ]
      };
      
      return { data: mockData };
    }
  },
  
  /**
   * Récupérer l'occupation des terrains
   */
  getFieldOccupancy: async (startDate: string, endDate: string): Promise<{ data: OccupancyReportData }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/occupancy`, {
        params: { startDate, endDate }
      });
      return response;
    } catch (error) {
      console.error('Error fetching field occupancy:', error);
      
      // Données simulées
      const mockData = {
        overallOccupancyRate: 68.5,
        labels: ['Terrain 1', 'Terrain 2', 'Terrain 3', 'Terrain 4', 'Terrain 5'],
        data: [75, 82, 65, 58, 62],
        averageRate: 68.5,
        fields: Array.from({ length: 5 }, (_, i) => {
          const occupancyRate = 50 + Math.floor(Math.random() * 40);
          const totalHours = 200;
          const bookedHours = Math.floor(totalHours * occupancyRate / 100);
          return {
            name: `Terrain ${i+1}`,
            occupancyRate,
            totalHours,
            bookedHours
          };
        }),
        peakHours: Array.from({ length: 12 }, (_, i) => ({
          hour: 8 + i,
          occupancyRate: 40 + Math.floor(Math.random() * 60)
        }))
      };
      
      return { data: mockData };
    }
  },
  
  /**
   * Récupérer les réservations par jour
   */
  getReservationsByDay: async (startDate: string, endDate: string): Promise<{ data: TimeDistributionData }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/reservations/days`, {
        params: { startDate, endDate }
      });
      return response;
    } catch (error) {
      console.error('Error fetching reservations by day:', error);
      
      // Données simulées
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      const mockData = {
        weekdayDistribution: days.map((day, i) => ({
          day,
          count: 20 + Math.floor(Math.random() * 60)
        })),
        hourlyDistribution: Array.from({ length: 14 }, (_, i) => ({
          hour: 8 + i,
          count: 5 + Math.floor(Math.random() * 25)
        })),
        durationDistribution: [
          { duration: '1h', count: 120 },
          { duration: '1h30', count: 80 },
          { duration: '2h', count: 100 },
          { duration: '2h+', count: 20 }
        ],
        labels: days,
        data: days.map(() => 20 + Math.floor(Math.random() * 60))
      };
      
      return { data: mockData };
    }
  },
  
  /**
   * Récupérer les réservations par créneau horaire
   */
  getReservationsByTimeSlot: async (startDate: string, endDate: string): Promise<{ data: TimeDistributionData }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/reservations/timeslots`, {
        params: { startDate, endDate }
      });
      return response;
    } catch (error) {
      console.error('Error fetching reservations by time slot:', error);
      
      // Données simulées identiques à getReservationsByDay pour simplifier
      const timeSlots = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);
      const mockData = {
        weekdayDistribution: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => ({
          day,
          count: 20 + Math.floor(Math.random() * 60)
        })),
        hourlyDistribution: timeSlots.map((_, i) => ({
          hour: 8 + i,
          count: 5 + Math.floor(Math.random() * 25)
        })),
        durationDistribution: [
          { duration: '1h', count: 120 },
          { duration: '1h30', count: 80 },
          { duration: '2h', count: 100 },
          { duration: '2h+', count: 20 }
        ],
        labels: timeSlots,
        data: timeSlots.map(() => 5 + Math.floor(Math.random() * 25))
      };
      
      return { data: mockData };
    }
  },
  
  /**
   * Exporter les rapports en PDF
   */
  exportReport: async (startDate: string, endDate: string): Promise<{ data: Blob }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/reports/export`, {
        params: { startDate, endDate },
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error exporting report:', error);
      
      // Simulation d'un PDF vide
      const mockPdfBlob = new Blob(['PDF contenu factice pour rapport'], { type: 'application/pdf' });
      return { data: mockPdfBlob };
    }
  }
};

export default adminAPI;
