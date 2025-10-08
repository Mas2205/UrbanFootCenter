import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Fonction pour obtenir les headers d'authentification
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

class ChampionnatAPI {
  // Récupérer le championnat actuel avec classement
  async getChampionnatActuel() {
    try {
      const response = await axios.get(`${API_BASE_URL}/championnats/actuel`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération championnat actuel:', error);
      throw error;
    }
  }

  // Lister tous les championnats (historique)
  async getChampionnats(params = {}) {
    try {
      const { page = 1, limit = 10, annee, trimestre } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(annee && { annee }),
        ...(trimestre && { trimestre })
      });

      const response = await axios.get(`${API_BASE_URL}/championnats?${queryParams}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération championnats:', error);
      throw error;
    }
  }

  // Lister les matchs du championnat
  async getMatchs(params = {}) {
    try {
      const { page = 1, limit = 10, championnat_id, statut, equipe_id } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(championnat_id && { championnat_id }),
        ...(statut && { statut }),
        ...(equipe_id && { equipe_id })
      });

      const response = await axios.get(`${API_BASE_URL}/championnats/matchs?${queryParams}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération matchs:', error);
      throw error;
    }
  }

  // Créer un nouveau match de championnat
  async createMatch(matchData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/championnats/matchs`, matchData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur création match:', error);
      throw error;
    }
  }

  // Saisir le résultat d'un match
  async saisirResultat(matchId, resultData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/championnats/matchs/${matchId}/resultat`, resultData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur saisie résultat:', error);
      throw error;
    }
  }

  // Obtenir les statistiques du championnat
  async getStatistiques(championnatId = null) {
    try {
      const url = championnatId 
        ? `/championnats/${championnatId}/statistiques`
        : '/championnats/statistiques';
      
      const response = await axios.get(`${API_BASE_URL}${url}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      throw error;
    }
  }

  // Récupérer le classement détaillé
  async getClassement(championnatId = null) {
    try {
      const championnat = championnatId 
        ? await axios.get(`${API_BASE_URL}/championnats/${championnatId}`, {
            headers: getAuthHeader()
          })
        : await this.getChampionnatActuel();
      
      return {
        success: true,
        data: championnat.data.classement || []
      };
    } catch (error) {
      console.error('Erreur récupération classement:', error);
      throw error;
    }
  }

  // Récupérer les équipes disponibles pour créer un match
  async getEquipesDisponibles() {
    try {
      const response = await axios.get(`${API_BASE_URL}/equipes`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération équipes:', error);
      throw error;
    }
  }

  // Récupérer l'historique des confrontations entre deux équipes
  async getHistoriqueConfrontations(equipe1Id, equipe2Id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/championnats/matchs?limit=100`, {
        headers: getAuthHeader()
      });

      // Filtrer les matchs entre ces deux équipes
      const matchsHistorique = response.data.data.filter(match => 
        (match.equipe1_id === equipe1Id && match.equipe2_id === equipe2Id) ||
        (match.equipe1_id === equipe2Id && match.equipe2_id === equipe1Id)
      );

      return {
        success: true,
        data: matchsHistorique
      };
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      throw error;
    }
  }

  // Récupérer les prochains matchs
  async getProchainMatchs(limit = 5) {
    try {
      const response = await axios.get(`${API_BASE_URL}/championnats/matchs?statut=a_venir&limit=${limit}`, {
        headers: getAuthHeader()
      });

      return response.data;
    } catch (error) {
      console.error('Erreur récupération prochains matchs:', error);
      throw error;
    }
  }

  // Récupérer les derniers résultats
  async getDerniersResultats(limit = 5) {
    try {
      const response = await axios.get(`${API_BASE_URL}/championnats/matchs?statut=termine&limit=${limit}`, {
        headers: getAuthHeader()
      });

      return response.data;
    } catch (error) {
      console.error('Erreur récupération derniers résultats:', error);
      throw error;
    }
  }
}

export default new ChampionnatAPI();
