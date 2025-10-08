import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Fonction pour obtenir les headers d'authentification
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

class TournoiAPI {
  // Lister les tournois avec pagination et filtres
  async getTournois(params = {}) {
    try {
      const { page = 1, limit = 10, terrain_id, statut, search } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(terrain_id && { terrain_id }),
        ...(statut && { statut }),
        ...(search && { search })
      });

      const response = await axios.get(`${API_BASE_URL}/tournois?${queryParams}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération tournois:', error);
      throw error;
    }
  }

  // Récupérer un tournoi par ID
  async getTournoiById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournois/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération tournoi:', error);
      throw error;
    }
  }

  // Créer un nouveau tournoi
  async createTournoi(tournoiData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/tournois`, tournoiData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur création tournoi:', error);
      throw error;
    }
  }

  // Mettre à jour le statut d'un tournoi
  async updateStatutTournoi(id, statut) {
    try {
      const response = await axios.put(`${API_BASE_URL}/tournois/${id}/statut`, { statut }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur mise à jour statut tournoi:', error);
      throw error;
    }
  }

  // Supprimer un tournoi
  async deleteTournoi(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/tournois/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur suppression tournoi:', error);
      throw error;
    }
  }

  // Demander participation à un tournoi (pour les capitaines)
  async demanderParticipation(tournoiId, equipeId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/tournois/${tournoiId}/participer`, {
        equipe_id: equipeId
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur demande participation:', error);
      throw error;
    }
  }

  // Valider ou refuser une participation (pour les admins)
  async validerParticipation(participationId, statut, motifRefus = null) {
    try {
      const response = await axios.put(`${API_BASE_URL}/tournois/participations/${participationId}/valider`, {
        statut,
        ...(motifRefus && { motif_refus: motifRefus })
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur validation participation:', error);
      throw error;
    }
  }

  // Récupérer les équipes disponibles pour inscription
  async getEquipesDisponibles(terrain_id = null) {
    try {
      const params = terrain_id ? `?terrain_id=${terrain_id}` : '';
      const response = await axios.get(`${API_BASE_URL}/equipes${params}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération équipes disponibles:', error);
      throw error;
    }
  }

  // Récupérer les participations en attente pour un admin
  async getParticipationsEnAttente(terrain_id = null) {
    try {
      const params = new URLSearchParams({
        statut: 'inscriptions_ouvertes',
        ...(terrain_id && { terrain_id })
      });
      
      const response = await axios.get(`${API_BASE_URL}/tournois?${params}`, {
        headers: getAuthHeader()
      });
      
      // Filtrer pour ne récupérer que les tournois avec des participations en attente
      const tournoisAvecAttente = response.data.data.filter(tournoi => 
        tournoi.participations && 
        tournoi.participations.some(p => p.statut === 'en_attente')
      );

      return {
        ...response.data,
        data: tournoisAvecAttente
      };
    } catch (error) {
      console.error('Erreur récupération participations en attente:', error);
      throw error;
    }
  }

  // Générer automatiquement les matchs de poule
  async genererMatchsPoule(tournoiId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/tournois/${tournoiId}/generer-matchs`, {}, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur génération matchs:', error);
      throw error;
    }
  }

  // Saisir le résultat d'un match de tournoi
  async saisirResultatMatch(matchId, resultData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/tournois/matchs/${matchId}/resultat`, resultData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur saisie résultat match:', error);
      throw error;
    }
  }

  // Effectuer le tirage au sort
  async effectuerTirageAuSort(tournoiId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/tournois/${tournoiId}/tirage-au-sort`, {}, {
        headers: getAuthHeader()
      });
      return response;
    } catch (error) {
      console.error('Erreur tirage au sort:', error);
      throw error;
    }
  }

  // Récupérer les détails complets d'un tournoi
  async getTournoiDetails(tournoiId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournois/${tournoiId}/details`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération détails tournoi:', error);
      throw error;
    }
  }
}

export default new TournoiAPI();
