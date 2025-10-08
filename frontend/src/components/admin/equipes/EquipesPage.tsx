// @ts-nocheck - Temporary fix for Material-UI Grid compatibility issues
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Pagination,
  CircularProgress,
  IconButton,
  Tooltip,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  SportsSoccer as SoccerIcon,
  EmojiEvents as TrophyIcon,
  PersonAdd as PersonAddIcon,
  Pending as PendingIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import equipeAPI from '../../../services/api/equipeAPI';
import fieldAPI from '../../../services/api/fieldAPI';
import { userAPI } from '../../../services/api';
import demandeEquipeAPI from '../../../services/api/demandeEquipeAPI';

interface Equipe {
  id: string;
  nom: string;
  description?: string;
  logo_url?: string;
  couleur_maillot: string;
  statut: 'active' | 'inactive' | 'suspendue';
  terrain: {
    id: string;
    name: string;
    location: string;
  };
  capitaine: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  membres: Array<{
    id: string;
    role: string;
    numero_maillot?: number;
    poste?: string;
    joueur: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
  created_at: string;
}

interface Field {
  id: string;
  name: string;
  location: string;
}

const EquipesPage: React.FC = () => {
  const { user } = useAuth();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedCaptain, setSelectedCaptain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('');

  // États pour les modales
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDemandesDialog, setOpenDemandesDialog] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState<Equipe | null>(null);
  const [demandes, setDemandes] = useState<any[]>([]);

  // États pour le formulaire
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    terrain_id: '',
    capitaine_id: '',
    couleur_maillot: '#1B5E20'
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger les données initiales
  useEffect(() => {
    loadEquipes();
    loadFields();
    loadUsers();
  }, [page, searchTerm, selectedField]);

  const loadEquipes = async () => {
    try {
      setLoading(true);
      const response = await equipeAPI.getEquipes({
        page,
        limit: 10,
        search: searchTerm,
        terrain_id: selectedField
      });

      setEquipes(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Erreur chargement équipes:', error);
      setError('Erreur lors du chargement des équipes');
    } finally {
      setLoading(false);
    }
  };

  const loadFields = async () => {
    try {
      const response = await fieldAPI.getAllFields();
      setFields(response.data || []); // S'assurer que fields reste un tableau même en cas d'erreur
    } catch (error) {
      console.error('Erreur chargement terrains:', error);
      setFields([]); // Définir un tableau vide en cas d'erreur
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAllUsers({ role: 'user', limit: 100 });
      setUsers(response.data?.data || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setUsers([]);
    }
  };

  const loadDemandes = async () => {
    try {
      const response = await demandeEquipeAPI.getDemandes({ 
        statut: 'en_attente',
        limit: 50 
      });
      setDemandes(response.data || []);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      setDemandes([]);
    }
  };

  const handleValiderDemande = async (demandeId: string) => {
    try {
      setError(null);
      await demandeEquipeAPI.validerDemande(demandeId);
      setSuccess('Demande validée et équipe créée avec succès !');
      loadDemandes(); // Recharger les demandes
      loadEquipes(); // Recharger les équipes
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleRefuserDemande = async (demandeId: string) => {
    const motif = prompt('Motif du refus (optionnel):');
    if (motif === null) return; // Annulé
    
    try {
      setError(null);
      await demandeEquipeAPI.refuserDemande(demandeId, motif || 'Aucun motif spécifié');
      setSuccess('Demande refusée avec succès');
      loadDemandes(); // Recharger les demandes
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors du refus');
    }
  };

  const handleCreateEquipe = async () => {
    try {
      setError(null);
      await equipeAPI.createEquipe(formData);
      setSuccess('Équipe créée avec succès');
      setOpenCreateDialog(false);
      resetForm();
      loadEquipes();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleEditEquipe = async () => {
    if (!selectedEquipe) return;

    try {
      setError(null);
      await equipeAPI.updateEquipe(selectedEquipe.id, formData);
      setSuccess('Équipe mise à jour avec succès');
      setOpenEditDialog(false);
      resetForm();
      loadEquipes();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteEquipe = async () => {
    if (!selectedEquipe) return;

    try {
      setError(null);
      await equipeAPI.deleteEquipe(selectedEquipe.id);
      setSuccess('Équipe supprimée avec succès');
      setOpenDeleteDialog(false);
      setSelectedEquipe(null);
      loadEquipes();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (equipe: Equipe) => {
    setSelectedEquipe(equipe);
    setFormData({
      nom: equipe.nom,
      description: equipe.description || '',
      terrain_id: equipe.terrain.id,
      capitaine_id: equipe.capitaine.id,
      couleur_maillot: equipe.couleur_maillot
    });
    // Trouver et définir le capitaine sélectionné pour l'Autocomplete
    const captain = users.find(user => user.id === equipe.capitaine.id);
    setSelectedCaptain(captain || null);
    setOpenEditDialog(true);
  };

  const openDeleteModal = (equipe: Equipe) => {
    setSelectedEquipe(equipe);
    setOpenDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      terrain_id: '',
      capitaine_id: '',
      couleur_maillot: '#1B5E20'
    });
    setSelectedEquipe(null);
    setSelectedCaptain(null);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspendue': return 'error';
      default: return 'default';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'suspendue': return 'Suspendue';
      default: return statut;
    }
  };

  if (loading && equipes.length === 0) {
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
        <Typography variant="h4" component="h1" fontWeight="bold">
          Gestion des Équipes
        </Typography>
        <Button
          variant="contained"
          startIcon={<PendingIcon />}
          onClick={() => {
            setOpenDemandesDialog(true);
            loadDemandes();
          }}
          sx={{ bgcolor: '#FF9800' }}
        >
          Gérer les demandes
        </Button>
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

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rechercher une équipe"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom de l'équipe..."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Terrain</InputLabel>
                <Select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  label="Terrain"
                >
                  <MenuItem value="">Tous les terrains</MenuItem>
                  {fields && fields.map((field) => (
                    <MenuItem key={field.id} value={field.id}>
                      {field.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedField('');
                  setPage(1);
                }}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Liste des équipes */}
      <Grid container spacing={3}>
        {equipes.map((equipe) => (
          <Grid item xs={12} md={6} lg={4} key={equipe.id}>
            <Card 
              sx={{ 
                height: '100%',
                border: `2px solid ${equipe.couleur_maillot}`,
                '&:hover': { 
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <CardContent>
                {/* En-tête de la carte */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      sx={{ 
                        bgcolor: equipe.couleur_maillot,
                        width: 50,
                        height: 50
                      }}
                    >
                      {equipe.logo_url ? (
                        <img src={equipe.logo_url} alt={equipe.nom} width="100%" />
                      ) : (
                        <SoccerIcon />
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {equipe.nom}
                      </Typography>
                      <Chip 
                        label={getStatutLabel(equipe.statut)}
                        color={getStatutColor(equipe.statut) as any}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Tooltip title="Modifier">
                      <IconButton 
                        size="small" 
                        onClick={() => openEditModal(equipe)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton 
                        size="small" 
                        onClick={() => openDeleteModal(equipe)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Informations */}
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Terrain:</strong> {equipe.terrain.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Capitaine:</strong> {equipe.capitaine.first_name} {equipe.capitaine.last_name}
                  </Typography>
                  {equipe.description && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {equipe.description}
                    </Typography>
                  )}
                </Box>

                {/* Statistiques */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {equipe.membres.length} membre{equipe.membres.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TrophyIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      0 trophée{/* TODO: Ajouter les trophées */}
                    </Typography>
                  </Box>
                </Box>

                {/* Actions */}
                <Box mt={2} display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    onClick={() => {/* TODO: Ouvrir modal ajout membre */}}
                    fullWidth
                  >
                    Ajouter Membre
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* Message si aucune équipe */}
      {equipes.length === 0 && !loading && (
        <Box textAlign="center" py={8}>
          <SoccerIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune équipe trouvée
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Les équipes sont créées par les clients. Validez leurs demandes pour créer les équipes.
          </Typography>
          <Button
            variant="contained"
            startIcon={<PendingIcon />}
            onClick={() => setOpenDemandesDialog(true)}
            sx={{ bgcolor: '#FF9800' }}
          >
            Voir les demandes
          </Button>
        </Box>
      )}


      {/* Dialog Modification */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l'équipe</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nom de l'équipe"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Terrain</InputLabel>
              <Select
                value={formData.terrain_id}
                onChange={(e) => setFormData({ ...formData, terrain_id: e.target.value })}
                label="Terrain"
              >
                {fields && fields.map((field) => (
                  <MenuItem key={field.id} value={field.id}>
                    {field.name} - {field.location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Capitaine</InputLabel>
              <Select
                value={formData.capitaine_id}
                onChange={(e) => setFormData({ ...formData, capitaine_id: e.target.value })}
                label="Capitaine"
              >
                {users && users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email})
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
          <Button onClick={() => setOpenEditDialog(false)}>Annuler</Button>
          <Button 
            onClick={handleEditEquipe} 
            variant="contained"
            disabled={!formData.nom || !formData.terrain_id || !formData.capitaine_id}
          >
            Modifier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Suppression */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'équipe "{selectedEquipe?.nom}" ?
            Cette action est irréversible et supprimera également tous les membres.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDeleteEquipe} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Gestion des demandes */}
      <Dialog open={openDemandesDialog} onClose={() => setOpenDemandesDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Demandes d'équipes en attente
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Validez ou refusez les demandes de création d'équipes des clients.
          </Alert>
          
          {demandes.length === 0 ? (
            <Box textAlign="center" py={4}>
              <PendingIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucune demande en attente
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Les nouvelles demandes d'équipes apparaîtront ici
              </Typography>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              {demandes.map((demande) => (
                <Card key={demande.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {demande.nom_equipe}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Demandeur:</strong> {demande.user.first_name} {demande.user.last_name} ({demande.user.email})
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Terrain:</strong> {demande.terrain.name} - {demande.terrain.location}
                        </Typography>
                        {demande.description && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Description:</strong> {demande.description}
                          </Typography>
                        )}
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <Typography variant="body2">Couleur:</Typography>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              backgroundColor: demande.couleur_maillot,
                              borderRadius: '50%',
                              border: '1px solid #ddd'
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                          Demande soumise le {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                      <Box display="flex" flexDirection="column" gap={1} ml={2}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleValiderDemande(demande.id)}
                        >
                          Valider
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleRefuserDemande(demande.id)}
                        >
                          Refuser
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDemandesDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EquipesPage;
