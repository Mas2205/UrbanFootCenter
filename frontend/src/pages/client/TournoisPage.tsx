import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip, 
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  MenuItem,
  Paper
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  EmojiEvents as TrophyIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

interface Tournoi {
  id: string;
  nom: string;
  description: string;
  terrain: {
    id: string;
    name: string;
    location: string;
  };
  date_debut: string;
  date_fin: string;
  date_limite_inscription: string;
  frais_inscription: number;
  recompense: string;
  prix_total: number;
  format: string;
  nombre_max_equipes: number;
  statut: string;
  stats: {
    equipes_inscrites: number;
    equipes_en_attente: number;
    places_restantes: number;
  };
  participation_status?: 'en_attente' | 'valide' | 'refuse' | null;
}

const TournoisPage: React.FC = () => {
  const [tournois, setTournois] = useState<Tournoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTournoi, setSelectedTournoi] = useState<Tournoi | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [inscriptionLoading, setInscriptionLoading] = useState(false);
  
  // États pour les filtres
  const [terrains, setTerrains] = useState<{id: string, name: string, location: string}[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [villes, setVilles] = useState<string[]>([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadTournois = async () => {
    try {
      setLoading(true);
      const params: any = { 
        statut: 'inscriptions_ouvertes',
        limit: 50 
      };
      
      // Ajouter les filtres s'ils sont sélectionnés
      if (selectedTerrain) {
        params.terrain_id = selectedTerrain;
      }
      
      if (selectedVille) {
        params.ville = selectedVille;
      }
      
      const response = await axios.get(`${API_BASE_URL}/tournois`, {
        params,
        headers: getAuthHeader()
      });
      
      if (response.data.success) {
        setTournois(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Erreur chargement tournois:', error);
      setError('Erreur lors du chargement des tournois');
    } finally {
      setLoading(false);
    }
  };

  const loadTerrains = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/fields`, {
        headers: getAuthHeader()
      });
      
      if (response.data.success) {
        const terrainsData = response.data.data || [];
        setTerrains(terrainsData);
        
        // Extraire les villes uniques
        const locations = terrainsData.map((t: any) => t.location).filter(Boolean) as string[];
        const villesUniques = Array.from(new Set(locations));
        setVilles(villesUniques);
      }
    } catch (error: any) {
      console.error('Erreur chargement terrains:', error);
    }
  };

  const handleInscription = async () => {
    if (!selectedTournoi) return;

    try {
      setInscriptionLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${API_BASE_URL}/tournois/${selectedTournoi.id}/participer`,
        {},
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        setSuccess('Demande d\'inscription envoyée avec succès ! Elle sera examinée par l\'administrateur du tournoi.');
        setOpenDialog(false);
        loadTournois(); // Recharger la liste
      }
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setInscriptionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  // Fonction pour obtenir le statut du bouton selon l'état de participation
  const getButtonConfig = (tournoi: Tournoi) => {
    if (tournoi.stats.places_restantes <= 0) {
      return {
        text: 'Complet',
        color: 'inherit' as const,
        disabled: true,
        variant: 'outlined' as const
      };
    }

    switch (tournoi.participation_status) {
      case 'en_attente':
        return {
          text: 'En cours de validation',
          color: 'warning' as const,
          disabled: true,
          variant: 'contained' as const
        };
      case 'valide':
        return {
          text: 'Validé',
          color: 'success' as const,
          disabled: true,
          variant: 'contained' as const
        };
      case 'refuse':
        return {
          text: 'Refusé',
          color: 'error' as const,
          disabled: true,
          variant: 'contained' as const
        };
      default:
        return {
          text: 'S\'inscrire',
          color: 'primary' as const,
          disabled: false,
          variant: 'contained' as const
        };
    }
  };

  useEffect(() => {
    loadTerrains();
  }, []);

  useEffect(() => {
    loadTournois();
  }, [selectedTerrain, selectedVille]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Chargement des tournois...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          <TrophyIcon sx={{ fontSize: 'inherit', mr: 2, color: 'primary.main' }} />
          Tournois Disponibles
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Inscrivez votre équipe aux tournois ouverts
        </Typography>
      </Box>

      {/* Filtres */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filtrer les tournois
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2 
        }}>
          <TextField
            select
            label="Terrain"
            value={selectedTerrain}
            onChange={(e) => setSelectedTerrain(e.target.value)}
            fullWidth
          >
            <MenuItem value="">Tous les terrains</MenuItem>
            {terrains.map((terrain) => (
              <MenuItem key={terrain.id} value={terrain.id}>
                {terrain.name} - {terrain.location}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Ville"
            value={selectedVille}
            onChange={(e) => {
              setSelectedVille(e.target.value);
              // Filtrer les terrains par ville
              if (e.target.value) {
                const terrainsVille = terrains.filter(t => t.location === e.target.value);
                if (terrainsVille.length > 0 && !terrainsVille.find(t => t.id === selectedTerrain)) {
                  setSelectedTerrain('');
                }
              }
            }}
            fullWidth
          >
            <MenuItem value="">Toutes les villes</MenuItem>
            {villes.map((ville) => (
              <MenuItem key={ville} value={ville}>
                {ville}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            onClick={() => {
              setSelectedTerrain('');
              setSelectedVille('');
            }}
            sx={{ height: 'fit-content', alignSelf: 'center' }}
          >
            Réinitialiser
          </Button>
        </Box>
      </Paper>

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Liste des tournois */}
      {tournois.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <TrophyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Aucun tournoi ouvert
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Il n'y a actuellement aucun tournoi avec les inscriptions ouvertes.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 3 
        }}>
          {tournois.map((tournoi) => (
            <Box key={tournoi.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Titre et statut */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {tournoi.nom}
                    </Typography>
                    <Chip 
                      label="Inscriptions ouvertes" 
                      color="success" 
                      size="small"
                    />
                  </Box>

                  {/* Description */}
                  {tournoi.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {tournoi.description}
                    </Typography>
                  )}

                  {/* Informations */}
                  <Box sx={{ space: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {tournoi.terrain.name} - {tournoi.terrain.location}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {formatDate(tournoi.date_debut)} - {formatDate(tournoi.date_fin)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PeopleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {tournoi.stats.equipes_inscrites}/{tournoi.nombre_max_equipes} équipes
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MoneyIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Frais: {formatPrice(tournoi.frais_inscription)}
                      </Typography>
                    </Box>

                    {tournoi.recompense && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          🏆 Récompense: {tournoi.recompense}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  {(() => {
                    const buttonConfig = getButtonConfig(tournoi);
                    return (
                      <Button
                        variant={buttonConfig.variant}
                        color={buttonConfig.color}
                        fullWidth
                        onClick={() => {
                          if (!buttonConfig.disabled) {
                            setSelectedTournoi(tournoi);
                            setOpenDialog(true);
                          }
                        }}
                        disabled={buttonConfig.disabled}
                      >
                        {buttonConfig.text}
                      </Button>
                    );
                  })()}
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Dialog de confirmation d'inscription */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirmer l'inscription au tournoi
        </DialogTitle>
        <DialogContent>
          {selectedTournoi && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedTournoi.nom}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Vous êtes sur le point d'inscrire votre équipe à ce tournoi.
              </Typography>
              
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Terrain:</strong> {selectedTournoi.terrain.name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Dates:</strong> {formatDate(selectedTournoi.date_debut)} - {formatDate(selectedTournoi.date_fin)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Frais d'inscription:</strong> {formatPrice(selectedTournoi.frais_inscription)}
                </Typography>
                <Typography variant="body2">
                  <strong>Places restantes:</strong> {selectedTournoi.stats.places_restantes}
                </Typography>
              </Box>

              <Alert severity="info">
                Votre demande d'inscription sera examinée par l'administrateur du tournoi.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={inscriptionLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleInscription} 
            variant="contained" 
            disabled={inscriptionLoading}
          >
            {inscriptionLoading ? <CircularProgress size={20} /> : 'Confirmer l\'inscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TournoisPage;
