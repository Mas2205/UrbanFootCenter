import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Fonction pour obtenir les headers d'authentification
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

class EquipeAPI {
  // Lister les équipes avec pagination et filtres
  async getEquipes(params = {}) {
    try {
      const { page = 1, limit = 10, terrain_id, search } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(terrain_id && { terrain_id }),
        ...(search && { search })
      });

      const response = await axios.get(`${API_BASE_URL}/equipes?${queryParams}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération équipes:', error);
      throw error;
    }
  }

  // Récupérer une équipe par ID
  async getEquipeById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/equipes/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération équipe:', error);
      throw error;
    }
  }

  // Créer une nouvelle équipe
  async createEquipe(equipeData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/equipes`, equipeData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur création équipe:', error);
      throw error;
    }
  }

  // Mettre à jour une équipe
  async updateEquipe(id, equipeData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/equipes/${id}`, equipeData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur mise à jour équipe:', error);
      throw error;
    }
  }

  // Supprimer une équipe
  async deleteEquipe(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/equipes/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur suppression équipe:', error);
      throw error;
    }
  }

  // Ajouter un membre à une équipe
  async ajouterMembre(equipeId, membreData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/equipes/${equipeId}/membres`, membreData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur ajout membre:', error);
      throw error;
    }
  }

  // Supprimer un membre d'une équipe
  async supprimerMembre(equipeId, membreId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/equipes/${equipeId}/membres/${membreId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur suppression membre:', error);
      throw error;
    }
  }

  // Rechercher des utilisateurs pour ajouter comme membres
  async rechercherUtilisateurs(query) {
    try {
      const response = await axios.get(`${API_BASE_URL}/users?search=${encodeURIComponent(query)}&limit=10`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur recherche utilisateurs:', error);
      throw error;
    }
  }
}

export default new EquipeAPI();
