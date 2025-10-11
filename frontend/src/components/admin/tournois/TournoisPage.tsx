// @ts-nocheck - Temporary fix for Material-UI Grid compatibility issues
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
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
  Tooltip,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../../contexts/AuthContext';
import tournoiAPI from '../../../services/api/tournoiAPI';
import fieldAPI from '../../../services/api/fieldAPI';

interface Tournoi {
  id: string;
  nom: string;
  description?: string;
  terrain: {
    id: string;
    name: string;
    location: string;
  };
  date_debut: string;
  date_fin: string;
  date_limite_inscription: string;
  frais_inscription: number;
  recompense?: string;
  prix_total: number;
  format: 'poules_elimination' | 'elimination_directe' | 'championnat';
  nombre_max_equipes: number;
  statut: 'en_preparation' | 'inscriptions_ouvertes' | 'inscriptions_fermees' | 'en_cours' | 'termine' | 'annule';
  participations: Array<{
    id: string;
    statut: 'en_attente' | 'valide' | 'refuse';
    equipe: {
      id: string;
      nom: string;
      logo_url?: string;
    };
  }>;
  stats: {
    equipes_inscrites: number;
    equipes_en_attente: number;
    places_restantes: number;
  };
  created_at: string;
}

interface Field {
  id: string;
  name: string;
  location: string;
}

const TournoisPage: React.FC = () => {
  const { user } = useAuth();
  const [tournois, setTournois] = useState<Tournoi[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');

  // États pour les modales
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openParticipationsDialog, setOpenParticipationsDialog] = useState(false);
  const [openClassementDialog, setOpenClassementDialog] = useState(false);
  const [openMatchsDialog, setOpenMatchsDialog] = useState(false);
  const [selectedTournoi, setSelectedTournoi] = useState<Tournoi | null>(null);
  const [tournoiDetails, setTournoiDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [openRetirageDialog, setOpenRetirageDialog] = useState(false);
  const [tournoiToRetirage, setTournoiToRetirage] = useState<string | null>(null);

  // États pour le formulaire
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    terrain_id: '',
    date_debut: null as Date | null,
    date_fin: null as Date | null,
    date_limite_inscription: null as Date | null,
    frais_inscription: 0,
    recompense: '',
    prix_total: 0,
    format: 'poules_elimination' as const,
    nombre_max_equipes: 16
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger les données initiales
  useEffect(() => {
    loadTournois();
    loadFields();
  }, [page, searchTerm, selectedField, selectedStatut]);

  const loadTournois = async () => {
    try {
      setLoading(true);
      const response = await tournoiAPI.getTournois({
        page,
        limit: 10,
        search: searchTerm,
        terrain_id: selectedField,
        statut: selectedStatut
      });

      setTournois(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Erreur chargement tournois:', error);
      setError('Erreur lors du chargement des tournois');
    } finally {
      setLoading(false);
    }
  };

  const loadFields = async () => {
    try {
      const response = await fieldAPI.getAllFields();
      setFields(response.data || []);
    } catch (error) {
      console.error('Erreur chargement terrains:', error);
      setFields([]); // Définir un tableau vide en cas d'erreur
    }
  };

  const handleCreateTournoi = async () => {
    try {
      setError(null);
      const tournoiData = {
        ...formData,
        date_debut: formData.date_debut?.toISOString().split('T')[0],
        date_fin: formData.date_fin?.toISOString().split('T')[0],
        date_limite_inscription: formData.date_limite_inscription?.toISOString().split('T')[0]
      };

      await tournoiAPI.createTournoi(tournoiData);
      setSuccess('Tournoi créé avec succès');
      setOpenCreateDialog(false);
      resetForm();
      loadTournois();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDeleteTournoi = async () => {
    if (!selectedTournoi) return;

    try {
      setError(null);
      await tournoiAPI.deleteTournoi(selectedTournoi.id);
      setSuccess('Tournoi supprimé avec succès');
      setOpenDeleteDialog(false);
      setSelectedTournoi(null);
      loadTournois();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleUpdateStatut = async (tournoiId: string, nouveauStatut: string) => {
    try {
      setError(null);
      await tournoiAPI.updateStatutTournoi(tournoiId, nouveauStatut);
      setSuccess('Statut mis à jour avec succès');
      loadTournois();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleGererInscriptions = async (tournoiId: string) => {
    try {
      console.log('🔍 Gestion inscriptions - Tournoi ID:', tournoiId);
      setError(null);
      
      // Charger les détails du tournoi avec les participations
      console.log('📡 Chargement des détails du tournoi...');
      const response = await tournoiAPI.getTournoiById(tournoiId);
      
      console.log('📊 Réponse API complète:', response);
      console.log('📊 Status:', response.status);
      console.log('📊 Data:', response.data);
      
      if (response.data && response.data.success) {
        const tournoi = response.data.data;
        console.log('🏆 Tournoi chargé:', tournoi.nom);
        console.log('👥 Participations:', tournoi.participations?.length || 0);
        
        setSelectedTournoi(tournoi);
        setOpenParticipationsDialog(true);
        console.log('✅ Dialog ouvert');
      } else {
        console.error('❌ Erreur API:', response.data.message);
        setError(response.data.message || 'Erreur lors du chargement');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des participations:', error);
      setError(error.response?.data?.message || 'Erreur lors du chargement des participations');
    }
  };

  const handleTirageAuSort = async (tournoiId: string) => {
    const tournoi = tournois.find(t => t.id === tournoiId);
    
    // Si le tournoi est en cours, demander confirmation pour le re-tirage
    if (tournoi?.statut === 'en_cours') {
      setTournoiToRetirage(tournoiId);
      setOpenRetirageDialog(true);
    } else {
      // Premier tirage, pas besoin de confirmation
      await executerTirageAuSort(tournoiId);
    }
  };

  const executerTirageAuSort = async (tournoiId: string) => {
    try {
      setError(null);
      const response = await tournoiAPI.effectuerTirageAuSort(tournoiId);
      
      if (response.data.success) {
        const nbMatchs = response.data.data.matchs?.length || 0;
        setSuccess(`Tirage au sort effectué ! ${nbMatchs} match(s) généré(s)`);
        loadTournois();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors du tirage au sort');
    }
  };

  const handleConfirmerRetirage = async () => {
    if (tournoiToRetirage) {
      await executerTirageAuSort(tournoiToRetirage);
      setOpenRetirageDialog(false);
      setTournoiToRetirage(null);
    }
  };

  const loadTournoiDetails = async (tournoiId: string) => {
    try {
      setLoadingDetails(true);
      const response = await tournoiAPI.getTournoiDetails(tournoiId);
      setTournoiDetails(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleVoirClassement = async (tournoiId: string) => {
    const tournoi = tournois.find(t => t.id === tournoiId);
    setSelectedTournoi(tournoi || null);
    await loadTournoiDetails(tournoiId);
    setOpenClassementDialog(true);
  };

  const handleGererMatchs = async (tournoiId: string) => {
    const tournoi = tournois.find(t => t.id === tournoiId);
    setSelectedTournoi(tournoi || null);
    await loadTournoiDetails(tournoiId);
    setOpenMatchsDialog(true);
  };

  const handleValiderParticipation = async (participationId: string, statut: 'valide' | 'refuse', motif?: string) => {
    try {
      setError(null);
      await tournoiAPI.validerParticipation(participationId, statut, motif);
      setSuccess(`Participation ${statut === 'valide' ? 'validée' : 'refusée'} avec succès`);
      loadTournois();
      setOpenParticipationsDialog(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const openDeleteModal = (tournoi: Tournoi) => {
    setSelectedTournoi(tournoi);
    setOpenDeleteDialog(true);
  };

  const openParticipationsModal = (tournoi: Tournoi) => {
    setSelectedTournoi(tournoi);
    setOpenParticipationsDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      terrain_id: '',
      date_debut: null,
      date_fin: null,
      date_limite_inscription: null,
      frais_inscription: 0,
      recompense: '',
      prix_total: 0,
      format: 'poules_elimination',
      nombre_max_equipes: 16
    });
    setSelectedTournoi(null);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_preparation': return 'default';
      case 'inscriptions_ouvertes': return 'info';
      case 'inscriptions_fermees': return 'warning';
      case 'en_cours': return 'primary';
      case 'termine': return 'success';
      case 'annule': return 'error';
      default: return 'default';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en_preparation': return 'En préparation';
      case 'inscriptions_ouvertes': return 'Inscriptions ouvertes';
      case 'inscriptions_fermees': return 'Inscriptions fermées';
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'poules_elimination': return 'Poules + Élimination';
      case 'elimination_directe': return 'Élimination directe';
      case 'championnat': return 'Championnat';
      default: return format;
    }
  };

  const getProgressValue = (tournoi: Tournoi) => {
    return ((tournoi.stats?.equipes_inscrites || 0) / tournoi.nombre_max_equipes) * 100;
  };

  if (loading && tournois.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box p={3}>
        {/* En-tête */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Gestion des Tournois
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ bgcolor: '#FFC107' }}
          >
            Nouveau Tournoi
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
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Rechercher un tournoi"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom du tournoi..."
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Terrain</InputLabel>
                  <Select
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value)}
                    label="Terrain"
                  >
                    <MenuItem value="">Tous les terrains</MenuItem>
                    {fields.map((field) => (
                      <MenuItem key={field.id} value={field.id}>
                        {field.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={selectedStatut}
                    onChange={(e) => setSelectedStatut(e.target.value)}
                    label="Statut"
                  >
                    <MenuItem value="">Tous les statuts</MenuItem>
                    <MenuItem value="en_preparation">En préparation</MenuItem>
                    <MenuItem value="inscriptions_ouvertes">Inscriptions ouvertes</MenuItem>
                    <MenuItem value="inscriptions_fermees">Inscriptions fermées</MenuItem>
                    <MenuItem value="en_cours">En cours</MenuItem>
                    <MenuItem value="termine">Terminé</MenuItem>
                    <MenuItem value="annule">Annulé</MenuItem>
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
                    setSelectedStatut('');
                    setPage(1);
                  }}
                >
                  Réinitialiser
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Liste des tournois */}
        <Grid container spacing={3}>
          {tournois.map((tournoi) => (
            <Grid item xs={12} lg={6} key={tournoi.id}>
              <Card 
                sx={{ 
                  height: '100%',
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
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {tournoi.nom}
                      </Typography>
                      <Box display="flex" gap={1} mb={1}>
                        <Chip 
                          label={getStatutLabel(tournoi.statut)}
                          color={getStatutColor(tournoi.statut) as any}
                          size="small"
                        />
                        <Chip 
                          label={getFormatLabel(tournoi.format)}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Tooltip title="Gérer les participations">
                        <IconButton 
                          size="small" 
                          onClick={() => openParticipationsModal(tournoi)}
                          color="primary"
                        >
                          <Badge badgeContent={tournoi.stats?.equipes_en_attente || 0} color="error">
                            <PeopleIcon />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton 
                          size="small" 
                          onClick={() => openDeleteModal(tournoi)}
                          color="error"
                          disabled={['en_cours', 'termine'].includes(tournoi.statut)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Informations */}
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Terrain:</strong> {tournoi.terrain?.name || 'Terrain non défini'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Dates:</strong> {new Date(tournoi.date_debut).toLocaleDateString('fr-FR')} - {new Date(tournoi.date_fin).toLocaleDateString('fr-FR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Limite inscription:</strong> {new Date(tournoi.date_limite_inscription).toLocaleDateString('fr-FR')}
                    </Typography>
                    {tournoi.frais_inscription > 0 && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Frais:</strong> {tournoi.frais_inscription.toLocaleString()} FCFA
                      </Typography>
                    )}
                    {tournoi.prix_total > 0 && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Prix total:</strong> {tournoi.prix_total.toLocaleString()} FCFA
                      </Typography>
                    )}
                  </Box>

                  {/* Progression des inscriptions */}
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="medium">
                        Inscriptions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tournoi.stats?.equipes_inscrites || 0}/{tournoi.nombre_max_equipes}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={getProgressValue(tournoi)}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getProgressValue(tournoi) === 100 ? 'success.main' : 'primary.main'
                        }
                      }}
                    />
                  </Box>

                  {/* Statistiques */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckIcon fontSize="small" color="success" />
                      <Typography variant="body2">
                        {tournoi.stats?.equipes_inscrites || 0} validées
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PendingIcon fontSize="small" color="warning" />
                      <Typography variant="body2">
                        {tournoi.stats?.equipes_en_attente || 0} en attente
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {tournoi.stats?.places_restantes || 0} places
                      </Typography>
                    </Box>
                  </Box>

                  {/* Actions de statut */}
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {tournoi.statut === 'en_preparation' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleUpdateStatut(tournoi.id, 'inscriptions_ouvertes')}
                      >
                        Ouvrir inscriptions
                      </Button>
                    )}
                    {tournoi.statut === 'inscriptions_ouvertes' && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleUpdateStatut(tournoi.id, 'inscriptions_fermees')}
                        >
                          Fermer inscriptions
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="info"
                          startIcon={<PeopleIcon />}
                          onClick={() => handleGererInscriptions(tournoi.id)}
                          sx={{ ml: 1 }}
                        >
                          Gérer les inscriptions
                          {tournoi.stats?.equipes_en_attente > 0 && (
                            <Badge
                              badgeContent={tournoi.stats?.equipes_en_attente || 0}
                              color="error"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Button>
                      </>
                    )}
                    {tournoi.statut === 'inscriptions_fermees' && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          startIcon={<PeopleIcon />}
                          onClick={() => handleGererInscriptions(tournoi.id)}
                          sx={{ mr: 1 }}
                        >
                          Voir les inscriptions
                        </Button>
                        {tournoi.stats?.equipes_inscrites === tournoi.nombre_max_equipes ? (
                          <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            startIcon={<TrophyIcon />}
                            onClick={() => handleTirageAuSort(tournoi.id)}
                            sx={{ mr: 1 }}
                          >
                            🎲 Tirage au sort
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PlayIcon />}
                            onClick={() => handleUpdateStatut(tournoi.id, 'en_cours')}
                            color="success"
                          >
                            Démarrer
                          </Button>
                        )}
                      </>
                    )}
                    {tournoi.statut === 'en_cours' && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={<TrophyIcon />}
                          onClick={() => handleTirageAuSort(tournoi.id)}
                          sx={{ mr: 1 }}
                        >
                          🎲 Re-tirage
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          startIcon={<TrophyIcon />}
                          onClick={() => handleVoirClassement(tournoi.id)}
                          sx={{ mr: 1 }}
                        >
                          📊 Classement
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<ScheduleIcon />}
                          onClick={() => handleGererMatchs(tournoi.id)}
                          sx={{ mr: 1 }}
                        >
                          ⚽ Matchs
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleUpdateStatut(tournoi.id, 'termine')}
                          color="primary"
                        >
                          Terminer
                        </Button>
                      </>
                    )}
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

        {/* Message si aucun tournoi */}
        {tournois.length === 0 && !loading && (
          <Box textAlign="center" py={8}>
            <TrophyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun tournoi trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Commencez par créer votre premier tournoi
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
              sx={{ bgcolor: '#FFC107' }}
            >
              Créer un tournoi
            </Button>
          </Box>
        )}

        {/* Dialog Création */}
        <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Créer un nouveau tournoi</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nom du tournoi"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Terrain</InputLabel>
                    <Select
                      value={formData.terrain_id}
                      onChange={(e) => setFormData({ ...formData, terrain_id: e.target.value })}
                      label="Terrain"
                    >
                      {fields.map((field) => (
                        <MenuItem key={field.id} value={field.id}>
                          {field.name} - {field.location}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={formData.format}
                      onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                      label="Format"
                    >
                      <MenuItem value="poules_elimination">Poules + Élimination</MenuItem>
                      <MenuItem value="elimination_directe">Élimination directe</MenuItem>
                      <MenuItem value="championnat">Championnat</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Date de début"
                    value={formData.date_debut}
                    onChange={(date) => setFormData({ ...formData, date_debut: date })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Date de fin"
                    value={formData.date_fin}
                    onChange={(date) => setFormData({ ...formData, date_fin: date })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Limite inscription"
                    value={formData.date_limite_inscription}
                    onChange={(date) => setFormData({ ...formData, date_limite_inscription: date })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Frais d'inscription (FCFA)"
                    type="number"
                    value={formData.frais_inscription}
                    onChange={(e) => setFormData({ ...formData, frais_inscription: parseInt(e.target.value) || 0 })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Prix total (FCFA)"
                    type="number"
                    value={formData.prix_total}
                    onChange={(e) => setFormData({ ...formData, prix_total: parseInt(e.target.value) || 0 })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Nombre max d'équipes"
                    type="number"
                    value={formData.nombre_max_equipes}
                    onChange={(e) => setFormData({ ...formData, nombre_max_equipes: parseInt(e.target.value) || 16 })}
                    inputProps={{ min: 4, max: 64 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Récompense"
                    value={formData.recompense}
                    onChange={(e) => setFormData({ ...formData, recompense: e.target.value })}
                    placeholder="Trophée, médailles, prix en espèces..."
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateDialog(false)}>Annuler</Button>
            <Button 
              onClick={handleCreateTournoi} 
              variant="contained"
              disabled={!formData.nom || !formData.terrain_id || !formData.date_debut || !formData.date_fin || !formData.date_limite_inscription}
            >
              Créer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Suppression */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir supprimer le tournoi "{selectedTournoi?.nom}" ?
              Cette action est irréversible et supprimera également toutes les participations et matchs associés.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
            <Button onClick={handleDeleteTournoi} color="error" variant="contained">
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Gestion des participations */}
        <Dialog open={openParticipationsDialog} onClose={() => setOpenParticipationsDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Gestion des participations - {selectedTournoi?.nom}
          </DialogTitle>
          <DialogContent>
            {(() => {
              console.log('🎭 Rendu dialog - selectedTournoi:', selectedTournoi?.nom);
              console.log('🎭 Participations:', selectedTournoi?.participations);
              return null;
            })()}
            {!selectedTournoi?.participations || selectedTournoi.participations.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Aucune participation pour ce tournoi
                {selectedTournoi && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Tournoi: {selectedTournoi.nom} - Participations: {selectedTournoi.participations?.length || 0}
                  </Typography>
                )}
              </Typography>
            ) : (
              <Box sx={{ pt: 1 }}>
                {selectedTournoi.participations?.map((participation) => (
                  <Card key={participation.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="h6">
                            {participation.equipe?.nom || 'Équipe inconnue'}
                          </Typography>
                          <Chip 
                            label={participation.statut === 'en_attente' ? 'En attente' : 
                                   participation.statut === 'valide' ? 'Validée' : 'Refusée'}
                            color={participation.statut === 'en_attente' ? 'warning' : 
                                   participation.statut === 'valide' ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                        {participation.statut === 'en_attente' && (
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckIcon />}
                              onClick={() => handleValiderParticipation(participation.id, 'valide')}
                            >
                              Valider
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<CancelIcon />}
                              onClick={() => handleValiderParticipation(participation.id, 'refuse')}
                            >
                              Refuser
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenParticipationsDialog(false)}>Fermer</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Classement */}
        <Dialog open={openClassementDialog} onClose={() => setOpenClassementDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            📊 Classement - {selectedTournoi?.nom} ({selectedTournoi?.format})
          </DialogTitle>
          <DialogContent>
            {loadingDetails ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : tournoiDetails ? (
              <Box sx={{ pt: 1 }}>
                {selectedTournoi?.format === 'poules_elimination' && (
                  <Box>
                    <Typography variant="h6" gutterBottom>🏆 Phase de Poules</Typography>
                    {Object.entries(tournoiDetails.groupes).map(([poule, equipes]: [string, any[]]) => (
                      <Card key={poule} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Poule {poule}</Typography>
                          <Box sx={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Équipe</th>
                                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Pts</th>
                                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>V</th>
                                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>N</th>
                                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>D</th>
                                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>BP</th>
                                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>BC</th>
                                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Diff</th>
                                </tr>
                              </thead>
                              <tbody>
                                {equipes.map((equipe, index) => (
                                  <tr key={equipe.id} style={{ backgroundColor: index < 2 ? '#e8f5e8' : 'white' }}>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{equipe.equipe.nom}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>{equipe.points}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{equipe.victoires}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{equipe.nuls}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{equipe.defaites}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{equipe.buts_marques}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{equipe.buts_encaisses}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
                                      {equipe.buts_marques - equipe.buts_encaisses > 0 ? '+' : ''}{equipe.buts_marques - equipe.buts_encaisses}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </Box>
                          {equipes.length > 2 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              🟢 Les 2 premiers se qualifient pour les phases finales
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
                
                {selectedTournoi?.format === 'elimination_directe' && (
                  <Box>
                    <Typography variant="h6" gutterBottom>⚡ Équipes qualifiées</Typography>
                    <Grid container spacing={2}>
                      {tournoiDetails.groupes.GENERAL?.map((equipe: any, index: number) => (
                        <Grid item xs={12} sm={6} md={4} key={equipe.id}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6">{index + 1}. {equipe.equipe.nom}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Prêt pour l'élimination directe
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                
                {selectedTournoi?.format === 'championnat' && (
                  <Box>
                    <Typography variant="h6" gutterBottom>🏅 Classement général</Typography>
                    <Card>
                      <CardContent>
                        <Box sx={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Pos</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Équipe</th>
                                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Pts</th>
                                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>V</th>
                                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>N</th>
                                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>D</th>
                                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>BP</th>
                                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>BC</th>
                                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Diff</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tournoiDetails.groupes.GENERAL?.map((equipe: any, index: number) => (
                                <tr key={equipe.id} style={{ backgroundColor: index === 0 ? '#ffd700' : index < 3 ? '#e8f5e8' : 'white' }}>
                                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                  </td>
                                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{equipe.equipe.nom}</td>
                                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>{equipe.points}</td>
                                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{equipe.victoires}</td>
                                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{equipe.nuls}</td>
                                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{equipe.defaites}</td>
                                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{equipe.buts_marques}</td>
                                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{equipe.buts_encaisses}</td>
                                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
                                    {equipe.buts_marques - equipe.buts_encaisses > 0 ? '+' : ''}{equipe.buts_marques - equipe.buts_encaisses}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </Box>
            ) : (
              <Alert severity="warning">Aucune donnée disponible</Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenClassementDialog(false)}>Fermer</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Gestion des Matchs */}
        <Dialog open={openMatchsDialog} onClose={() => setOpenMatchsDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            ⚽ Gestion des Matchs - {selectedTournoi?.nom}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                Saisie des résultats - Format: {selectedTournoi?.format}
              </Typography>
              
              {selectedTournoi?.format === 'poules_elimination' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Phase de poules: Saisir les résultats des matchs de chaque poule
                </Alert>
              )}
              
              {selectedTournoi?.format === 'elimination_directe' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Élimination directe: Saisir les résultats des matchs d'élimination
                </Alert>
              )}
              
              {selectedTournoi?.format === 'championnat' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Championnat: Saisir les résultats de tous les matchs
                </Alert>
              )}

              {/* Ici on affichera la liste des matchs avec formulaires de saisie */}
              <Card>
                <CardContent>
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    Interface de saisie des matchs à implémenter
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMatchsDialog(false)}>Fermer</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Confirmation Re-tirage */}
        <Dialog open={openRetirageDialog} onClose={() => setOpenRetirageDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            ⚠️ Confirmer le re-tirage au sort
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Attention ! Cette action est irréversible
              </Typography>
            </Alert>
            
            <Typography variant="body1" paragraph>
              Le re-tirage au sort va :
            </Typography>
            
            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
              <li>🗑️ <strong>Supprimer tous les matchs existants</strong></li>
              <li>📊 <strong>Effacer tous les scores saisis</strong></li>
              <li>🎲 <strong>Remélanger aléatoirement les équipes</strong></li>
              <li>⚽ <strong>Générer de nouveaux matchs</strong></li>
              <li>🔄 <strong>Remettre à zéro les statistiques</strong></li>
            </Box>
            
            <Alert severity="error">
              <Typography variant="body2">
                <strong>Tous les résultats précédents seront perdus définitivement !</strong>
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenRetirageDialog(false)}
              color="primary"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmerRetirage}
              color="error"
              variant="contained"
              startIcon={<CancelIcon />}
            >
              Confirmer le re-tirage
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TournoisPage;
