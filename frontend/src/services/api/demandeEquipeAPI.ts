import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface DemandeEquipe {
  id: string;
  nom_equipe: string;
  description?: string;
  couleur_maillot: string;
  statut: 'en_attente' | 'validee' | 'refusee';
  motif_refus?: string;
  terrain: {
    id: string;
    name: string;
    location: string;
  };
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  validated_at?: string;
}

export interface CreateDemandeData {
  nom_equipe: string;
  description?: string;
  terrain_id: string;
  couleur_maillot?: string;
}

class DemandeEquipeAPI {
  // Créer une demande d'équipe (client)
  async createDemande(data: CreateDemandeData) {
    const response = await axios.post(`${API_BASE_URL}/demandes-equipes`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  }

  // Récupérer ma demande (client)
  async getMaDemande() {
    const response = await axios.get(`${API_BASE_URL}/demandes-equipes/ma-demande`, {
      headers: getAuthHeader()
    });
    return response.data;
  }

  // Lister les demandes (admin)
  async getDemandes(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    terrain_id?: string;
  }) {
    const response = await axios.get(`${API_BASE_URL}/demandes-equipes`, { 
      params,
      headers: getAuthHeader()
    });
    return response.data;
  }

  // Valider une demande (admin)
  async validerDemande(id: string) {
    const response = await axios.put(`${API_BASE_URL}/demandes-equipes/${id}/valider`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  }

  // Refuser une demande (admin)
  async refuserDemande(id: string, motif_refus: string) {
    const response = await axios.put(`${API_BASE_URL}/demandes-equipes/${id}/refuser`, {
      motif_refus
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  }
}

export default new DemandeEquipeAPI();
