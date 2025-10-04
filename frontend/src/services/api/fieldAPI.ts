import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Importation directe de la fonction auth pour éviter les problèmes de résolution de module
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};


// Types
export interface Field {
  id: string; // UUID v4
  name: string;
  description: string;
  location: {
    address: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  pricePerHour: number;
  size: string; // ex: "5v5", "7v7", "11v11"
  surface: string; // ex: "gazon synthétique", "gazon naturel", etc.
  indoor: boolean;
  features: string[]; // ex: ["éclairage", "vestiaires", "douches", etc.]
  images: string[]; // URLs des images
  availabilityHours: {
    monday: { open: string; close: string } | null;
    tuesday: { open: string; close: string } | null;
    wednesday: { open: string; close: string } | null;
    thursday: { open: string; close: string } | null;
    friday: { open: string; close: string } | null;
    saturday: { open: string; close: string } | null;
    sunday: { open: string; close: string } | null;
  };
  maxPlayers: number;
  status: 'active' | 'maintenance' | 'inactive';
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FieldFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  surface?: string[];
  indoor?: boolean;
  size?: string[];
  features?: string[];
  availableDate?: string; // Format: YYYY-MM-DD
  availableTime?: string; // Format: HH:MM
  availableDuration?: number; // Durée en heures
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'popularity_desc';
}

export interface FieldAvailability {
  date: string; // Format: YYYY-MM-DD
  slots: {
    startTime: string; // Format: HH:MM
    endTime: string; // Format: HH:MM
    available: boolean;
  }[];
}

export interface FieldCreateData {
  name: string;
  description: string;
  location: {
    address: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  pricePerHour: number;
  size: string;
  surface: string;
  indoor: boolean;
  features: string[];
  images?: File[];
  availabilityHours: {
    monday: { open: string; close: string } | null;
    tuesday: { open: string; close: string } | null;
    wednesday: { open: string; close: string } | null;
    thursday: { open: string; close: string } | null;
    friday: { open: string; close: string } | null;
    saturday: { open: string; close: string } | null;
    sunday: { open: string; close: string } | null;
  };
  maxPlayers: number;
  status: 'active' | 'maintenance' | 'inactive';
}

// Field API service
const fieldAPI = {
  // API publiques pour les utilisateurs
  getFields: async (
    page = 1,
    limit = 10,
    filters: FieldFilters = {}
  ): Promise<{ fields: Field[]; total: number; pages: number }> => {
    const response = await axios.get(`${API_BASE_URL}/fields`, {
      params: {
        page,
        limit,
        ...filters,
      },
    });
    return response.data;
  },

  getFieldById: async (fieldId: string): Promise<{success: boolean, data: any}> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/fields/${fieldId}`, {
        headers: {
          ...getAuthHeader()
        }
      });
      console.log('Backend response for field:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching field by ID:', error);
      throw error;
    }
  },
  
  getFeaturedFields: async (limit = 3): Promise<{ data: Field[] }> => {
    return axios.get(`${API_BASE_URL}/fields/featured`, { params: { limit } })
      .then(response => response.data);
  },

  getFieldAvailability: async (
    fieldId: string,
    date: string
  ): Promise<FieldAvailability> => {
    const response = await axios.get(
      `${API_BASE_URL}/fields/${fieldId}/availability`,
      {
        params: { date },
      }
    );
    return response.data;
  },

  getFieldAvailabilityRange: async (
    fieldId: string,
    startDate: string,
    endDate: string
  ): Promise<FieldAvailability[]> => {
    const response = await axios.get(
      `${API_BASE_URL}/fields/${fieldId}/availability-range`,
      {
        params: {
          startDate,
          endDate,
        },
      }
    );
    return response.data;
  },

  // Recherche de terrains disponibles
  findAvailableFields: async (
    date: string,
    startTime: string,
    duration: number,
    filters: FieldFilters = {}
  ): Promise<{ fields: Field[]; total: number }> => {
    const response = await axios.get(`${API_BASE_URL}/fields/available`, {
      params: {
        date,
        startTime,
        duration,
        ...filters,
      },
    });
    return response.data;
  },

  // API pour les administrateurs
  getAllFields: async (): Promise<{data: Field[]}> => {
    try {
      console.log('Récupération de tous les terrains (admin)');
      const response = await axios.get(`${API_BASE_URL}/fields`, {
        headers: getAuthHeader(),
      });
      console.log('Réponse de l\'API getAllFields:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des terrains:', error);
      throw error;
    }
  },

  createField: async (fieldData: any): Promise<Field> => {
    try {
      console.log('API service - Envoi des données:', fieldData);
      console.log('URL API:', `${API_BASE_URL}/fields`);
      
      // Vérifier l'authentification
      const authHeader = getAuthHeader();
      console.log('En-tête d\'authentification présent:', !!authHeader.Authorization);
      
      // Envoyer directement les données au format JSON sans conversion en FormData
      console.log('Envoi de la requête POST...');
      const response = await axios.post(`${API_BASE_URL}/fields`, fieldData, {
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Réponse reçue du serveur:', response.status, response.statusText);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la création du terrain:', error.message);
      console.error('Détails de l\'erreur:', error.response?.data || 'Pas de données de réponse');
      console.error('Code HTTP:', error.response?.status || 'Pas de code HTTP');
      throw error;
    }
  },

  updateField: async (fieldId: string, fieldData: any): Promise<Field> => {
    try {
      console.log('API service - Mise à jour des données:', fieldData);
      console.log('URL API:', `${API_BASE_URL}/fields/${fieldId}`);
      
      // Vérifier l'authentification
      const authHeader = getAuthHeader();
      console.log('En-tête d\'authentification présent:', !!authHeader.Authorization);
      
      // Utiliser FormData si une image est présente
      if (fieldData.image && fieldData.image instanceof File) {
        const formData = new FormData();
        
        // Ajouter tous les champs sauf l'image
        Object.entries(fieldData).forEach(([key, value]) => {
          if (key !== 'image' && value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });
        
        // Ajouter l'image
        formData.append('image', fieldData.image);
        
        console.log('Envoi de la requête PUT avec FormData...');
        const response = await axios.put(`${API_BASE_URL}/fields/${fieldId}`, formData, {
          headers: {
            ...authHeader,
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log('Réponse reçue du serveur:', response.status, response.statusText);
        return response.data;
      } else {
        // Envoyer directement les données au format JSON si pas d'image
        console.log('Envoi de la requête PUT avec JSON...');
        const response = await axios.put(`${API_BASE_URL}/fields/${fieldId}`, fieldData, {
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Réponse reçue du serveur:', response.status, response.statusText);
        return response.data;
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du terrain:', error.message);
      console.error('Détails de l\'erreur:', error.response?.data || 'Pas de données de réponse');
      console.error('Code HTTP:', error.response?.status || 'Pas de code HTTP');
      throw error;
    }
  },

  deleteField: async (fieldId: string): Promise<{ message: string }> => {
    const response = await axios.delete(
      `${API_BASE_URL}/admin/fields/${fieldId}`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  // Gestion des images
  deleteFieldImage: async (fieldId: string, imageUrl: string): Promise<Field> => {
    const response = await axios.delete(
      `${API_BASE_URL}/admin/fields/${fieldId}/images`,
      {
        headers: getAuthHeader(),
        data: { imageUrl },
      }
    );
    return response.data;
  },

  // Récupérer les villes uniques depuis la base de données
  getCities: async (): Promise<{ data: string[] }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/fields/cities`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des villes:', error);
      throw error;
    }
  },

  // Recherche de terrains pour autocomplétion
  searchFields: async (query: string, limit = 5): Promise<{ success: boolean; data: Field[] }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/fields/search`, {
        params: {
          q: query,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching fields:', error);
      throw error;
    }
  },

  // Statistiques pour le tableau de bord admin
  getFieldStats: async (): Promise<{
    totalFields: number;
    activeFields: number;
    maintenanceFields: number;
    inactiveFields: number;
    averageRating: number;
    mostPopularFields: { id: string; name: string; bookingCount: number }[];
  }> => {
    const response = await axios.get(`${API_BASE_URL}/admin/fields/stats`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export default fieldAPI;
