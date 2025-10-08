import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  SportsSoccer as SoccerIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import fieldAPI from '../../services/api/fieldAPI';
import demandeEquipeAPI from '../../services/api/demandeEquipeAPI';

interface Field {
  id: string;
  name: string;
  location: string;
  city?: string;
}

interface DemandeEquipe {
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
  created_at: string;
  validated_at?: string;
}

const DemandeEquipePage: React.FC = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [demande, setDemande] = useState<DemandeEquipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  // États pour le formulaire
  const [formData, setFormData] = useState({
    nom_equipe: '',
    description: '',
    terrain_id: '',
    couleur_maillot: '#FF6B35'
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadFields(),
        loadDemande()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFields = async () => {
    try {
      const response = await fieldAPI.getAllFields();
      // Transformer les données pour correspondre à notre interface
      const transformedFields = (response.data || []).map((field: any) => ({
        id: field.id,
        name: field.name,
        location: typeof field.location === 'string' ? field.location : field.location?.address || field.city || 'Non spécifié',
        city: field.city
      }));
      setFields(transformedFields);
    } catch (error) {
      console.error('Erreur chargement terrains:', error);
      setFields([]);
    }
  };

  const loadDemande = async () => {
    try {
      const response = await demandeEquipeAPI.getMaDemande();
      setDemande(response.data);
    } catch (error) {
      console.error('Erreur chargement demande:', error);
      // Si pas de demande trouvée, c'est normal
      setDemande(null);
    }
  };

  const handleCreateDemande = async () => {
    try {
      setError(null);
      await demandeEquipeAPI.createDemande(formData);
      setSuccess('Demande d\'équipe soumise avec succès ! Elle sera examinée par l\'administrateur du terrain.');
      setOpenCreateDialog(false);
      resetForm();
      loadDemande();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la soumission de la demande');
    }
  };

  const resetForm = () => {
    setFormData({
      nom_equipe: '',
      description: '',
      terrain_id: '',
      couleur_maillot: '#FF6B35'
    });
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'warning';
      case 'validee': return 'success';
      case 'refusee': return 'error';
      default: return 'default';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en_attente': return <PendingIcon />;
      case 'validee': return <CheckIcon />;
      case 'refusee': return <CancelIcon />;
      default: return <PendingIcon />;
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'validee': return 'Validée';
      case 'refusee': return 'Refusée';
      default: return statut;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* En-tête */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Mon Équipe
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Créez votre équipe et participez aux tournois
          </Typography>
        </Box>
        {!demande && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ bgcolor: '#FF6B35' }}
          >
            Demander une équipe
          </Button>
        )}
      </Box>

      {/* Alertes */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Contenu principal */}
      {demande ? (
        // Afficher la demande existante
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {demande.nom_equipe}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Terrain: {demande.terrain.name} - {demande.terrain.location}
                </Typography>
                {demande.description && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {demande.description}
                  </Typography>
                )}
              </Box>
              <Chip
                icon={getStatutIcon(demande.statut)}
                label={getStatutLabel(demande.statut)}
                color={getStatutColor(demande.statut) as any}
              />
            </Box>

            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="body2">Couleur du maillot:</Typography>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: demande.couleur_maillot,
                  borderRadius: '50%',
                  border: '2px solid #ddd'
                }}
              />
            </Box>

            <Typography variant="caption" color="text.secondary">
              Demande soumise le {new Date(demande.created_at).toLocaleDateString('fr-FR')}
            </Typography>

            {demande.statut === 'refusee' && demande.motif_refus && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="medium">Motif du refus:</Typography>
                <Typography variant="body2">{demande.motif_refus}</Typography>
              </Alert>
            )}

            {demande.statut === 'validee' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  🎉 Félicitations ! Votre équipe a été créée. Vous pouvez maintenant participer aux tournois.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        // Aucune demande - Encourager à créer
        <Box textAlign="center" py={8}>
          <SoccerIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Vous n'avez pas encore d'équipe
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Créez votre équipe pour participer aux tournois et championnats
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ bgcolor: '#FF6B35' }}
          >
            Demander une équipe
          </Button>
        </Box>
      )}

      {/* Dialog Création de demande */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Demander la création d'une équipe</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Votre demande sera examinée par l'administrateur du terrain sélectionné.
            </Alert>
            
            <TextField
              fullWidth
              label="Nom de l'équipe"
              value={formData.nom_equipe}
              onChange={(e) => setFormData({ ...formData, nom_equipe: e.target.value })}
              margin="normal"
              required
              placeholder="Ex: Les Lions de Dakar"
            />
            
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              placeholder="Décrivez votre équipe, vos objectifs..."
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Terrain de rattachement</InputLabel>
              <Select
                value={formData.terrain_id}
                onChange={(e) => setFormData({ ...formData, terrain_id: e.target.value })}
                label="Terrain de rattachement"
              >
                {fields.map((field) => (
                  <MenuItem key={field.id} value={field.id}>
                    {field.name} - {field.location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Couleur du maillot"
              type="color"
              value={formData.couleur_maillot}
              onChange={(e) => setFormData({ ...formData, couleur_maillot: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Annuler</Button>
          <Button 
            onClick={handleCreateDemande} 
            variant="contained"
            disabled={!formData.nom_equipe || !formData.terrain_id}
            sx={{ bgcolor: '#FF6B35' }}
          >
            Soumettre la demande
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DemandeEquipePage;
