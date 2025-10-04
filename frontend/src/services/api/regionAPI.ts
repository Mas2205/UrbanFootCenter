import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

// Fonction pour obtenir les en-têtes d'authentification
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface City {
  city_name: string;
}

export interface Region {
  id: string;
  region_name: string;
  department_name: string;
  city_name: string;
  region_code?: string;
  department_code?: string;
  population?: number;
  area_km2?: number;
  latitude?: number;
  longitude?: number;
}

const regionAPI = {
  // Récupérer toutes les villes
  getCities: async (): Promise<string[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/regions/cities`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des villes:', error);
      throw error;
    }
  },

  // Récupérer toutes les régions
  getRegions: async (): Promise<Region[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/regions/regions`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des régions:', error);
      throw error;
    }
  },

  // Récupérer les villes par région
  getCitiesByRegion: async (regionName: string): Promise<string[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/regions/regions/${regionName}/cities`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des villes par région:', error);
      throw error;
    }
  }
};

export default regionAPI;
