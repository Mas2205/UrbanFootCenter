import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Utilisation de l'URL de base cohérente avec api.ts

// Importation directe de la fonction auth pour éviter les problèmes de résolution de module
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Types
export interface User {
  id: string; // UUID v4
  // Propriétés camelCase
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'client' | 'admin' | 'super_admin' | 'user'; // Ajout de 'user'
  isActive: boolean; // Toujours défini, jamais undefined
  createdAt: string;
  updatedAt: string;
  age?: number;
  sexe?: 'M' | 'F' | 'Autre';
  field_id?: string;
  
  // Propriétés snake_case (pour compatibilité avec le backend)
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// User API service
const userAPI = {
  // Authentification
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    return response.data;
  },
  
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
  },
  
  validateToken: async (token: string): Promise<{ valid: boolean; user?: User }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/validate-token`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { valid: true, user: response.data.user };
    } catch (error) {
      return { valid: false };
    }
  },
  
  refreshToken: async (): Promise<{ token: string }> => {
    const response = await axios.get(`${API_BASE_URL}/auth/refresh-token`, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: getAuthHeader()
    });
  },
  
  // Gestion du profil
  getProfile: async (): Promise<User> => {
    const response = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  
  updateProfile: async (profileData: ProfileUpdateData): Promise<User> => {
    const response = await axios.put(`${API_BASE_URL}/users/profile`, profileData, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  
  changePassword: async (passwordData: PasswordChangeData): Promise<{ message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/users/change-password`, passwordData, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
    return response.data;
  },
  
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
      token,
      newPassword
    });
    return response.data;
  },
  
  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await axios.delete(`${API_BASE_URL}/users/profile`, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  
  // Pour l'administration
  getAllUsers: async (page = 1, limit = 10, search = ''): Promise<{ users: User[]; total: number }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        params: { page, limit, search },
        headers: getAuthHeader()
      });
      
      // Adapter la réponse au format attendu par le composant
      if (response.data && response.data.success) {
        return {
          users: response.data.data || [], // Les utilisateurs sont dans la propriété 'data'
          total: response.data.total || 0
        };
      } else {
        console.error('Erreur lors de la récupération des utilisateurs:', response.data);
        return { users: [], total: 0 };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  },
  
  getUserById: async (userId: string): Promise<User> => {
    const response = await axios.get(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  
  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    // URL complète pour éviter toute confusion
    const fullUrl = `${API_BASE_URL}/admin/users/${userId}`;
    console.log(`Envoi de mise à jour utilisateur à: ${fullUrl}`, userData);
    try {
      // Utilisation de l'URL absolue complète pour éviter les erreurs de chemin
      const response = await axios.put(fullUrl, userData, {
        headers: getAuthHeader()
      });
      console.log('Réponse de mise à jour utilisateur:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour utilisateur:', error);
      console.error('URL utilisée:', fullUrl);
      throw error;
    }
  },
  
  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  
  changeUserRole: async (userId: string, role: 'user' | 'admin'): Promise<User> => {
    const response = await axios.patch(
      `${API_BASE_URL}/admin/users/${userId}/role`,
      { role },
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  
  updateUserStatus: async (userId: string, status: string | boolean): Promise<User> => {
    // Conversion du statut en booléen si c'est une chaîne
    const isActive = typeof status === 'string' ? status === 'active' : status;
    
    const response = await axios.patch(
      `${API_BASE_URL}/admin/users/${userId}/status`,
      { isActive },
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  
  // Méthodes de vérification d'email et réinitialisation
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/auth/verify-email`, { token });
    return response.data;
  },
  
  resendVerificationEmail: async (email: string): Promise<{ message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/auth/resend-verification`, { email });
    return response.data;
  },
  
  verifyResetToken: async (token: string): Promise<{ valid: boolean }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify-reset-token/${token}`);
      return { valid: true };
    } catch (error) {
      return { valid: false };
    }
  }
};

export default userAPI;
