// @ts-nocheck - Temporary fix for Material-UI Grid compatibility issues
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  EmojiEvents as TrophyIcon,
  SportsSoccer as SoccerIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import championnatAPI from '../../../services/api/championnatAPI';
import equipeAPI from '../../../services/api/equipeAPI';
import fieldAPI from '../../../services/api/fieldAPI';

interface ClassementEquipe {
  id: string;
  position: number;
  position_precedente?: number;
  points: number;
  matchs_joues: number;
  victoires: number;
  nuls: number;
  defaites: number;
  buts_marques: number;
  buts_encaisses: number;
  difference_buts: number;
  forme_recente: string;
  equipe: {
    id: string;
    nom: string;
    logo_url?: string;
    couleur_maillot: string;
    terrain: {
      id: string;
      name: string;
      location: string;
    };
    capitaine: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
}

interface Match {
  id: string;
  date_match: string;
  statut: 'a_venir' | 'en_cours' | 'termine' | 'reporte' | 'annule';
  score1: number;
  score2: number;
  journee?: number;
  arbitre?: string;
  equipe1: {
    id: string;
    nom: string;
    logo_url?: string;
    couleur_maillot: string;
  };
  equipe2: {
    id: string;
    nom: string;
    logo_url?: string;
    couleur_maillot: string;
  };
  terrain: {
    id: string;
    name: string;
    location: string;
  };
}

const ChampionnatsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [championnatActuel, setChampionnatActuel] = useState<any>(null);
  const [classement, setClassement] = useState<ClassementEquipe[]>([]);
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [terrains, setTerrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // États pour les modales
  const [openCreateMatchDialog, setOpenCreateMatchDialog] = useState(false);
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // États pour les formulaires
  const [matchFormData, setMatchFormData] = useState({
    equipe1_id: '',
    equipe2_id: '',
    terrain_id: '',
    date_match: null as Date | null,
    journee: 1,
    arbitre: ''
  });

  const [resultFormData, setResultFormData] = useState({
    score1: 0,
    score2: 0,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadChampionnatActuel(),
        loadMatchs(),
        loadEquipes(),
        loadTerrains()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadChampionnatActuel = async () => {
    try {
      const response = await championnatAPI.getChampionnatActuel();
      setChampionnatActuel(response.data);
      setClassement(response.data.classement || []);
    } catch (error) {
      console.error('Erreur chargement championnat:', error);
    }
  };

  const loadMatchs = async () => {
    try {
      const response = await championnatAPI.getMatchs({ limit: 50 });
      setMatchs(response.data);
    } catch (error) {
      console.error('Erreur chargement matchs:', error);
    }
  };

  const loadEquipes = async () => {
    try {
      const response = await equipeAPI.getEquipes({ limit: 100 });
      setEquipes(response.data);
    } catch (error) {
      console.error('Erreur chargement équipes:', error);
    }
  };

  const loadTerrains = async () => {
    try {
      const response = await fieldAPI.getAllFields();
      setTerrains(response.data || []);
    } catch (error) {
      console.error('Erreur chargement terrains:', error);
      setTerrains([]); // Définir un tableau vide en cas d'erreur
    }
  };

  const handleCreateMatch = async () => {
    try {
      setError(null);
      const matchData = {
        ...matchFormData,
        date_match: matchFormData.date_match?.toISOString()
      };

      await championnatAPI.createMatch(matchData);
      setSuccess('Match créé avec succès');
      setOpenCreateMatchDialog(false);
      resetMatchForm();
      loadMatchs();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la création du match');
    }
  };

  const handleSaisirResultat = async () => {
    if (!selectedMatch) return;

    try {
      setError(null);
      await championnatAPI.saisirResultat(selectedMatch.id, resultFormData);
      setSuccess('Résultat saisi avec succès');
      setOpenResultDialog(false);
      resetResultForm();
      loadData(); // Recharger tout pour mettre à jour le classement
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la saisie du résultat');
    }
  };

  const openResultModal = (match: Match) => {
    setSelectedMatch(match);
    setResultFormData({
      score1: match.score1,
      score2: match.score2,
      notes: ''
    });
    setOpenResultDialog(true);
  };

  const resetMatchForm = () => {
    setMatchFormData({
      equipe1_id: '',
      equipe2_id: '',
      terrain_id: '',
      date_match: null,
      journee: 1,
      arbitre: ''
    });
  };

  const resetResultForm = () => {
    setResultFormData({
      score1: 0,
      score2: 0,
      notes: ''
    });
    setSelectedMatch(null);
  };

  const getPositionIcon = (position: number, positionPrecedente?: number) => {
    if (!positionPrecedente || positionPrecedente === position) {
      return <RemoveIcon fontSize="small" color="disabled" />;
    }
    if (position < positionPrecedente) {
      return <TrendingUpIcon fontSize="small" color="success" />;
    }
    return <TrendingDownIcon fontSize="small" color="error" />;
  };

  const getFormeColor = (lettre: string) => {
    switch (lettre) {
      case 'V': return 'success';
      case 'N': return 'warning';
      case 'D': return 'error';
      default: return 'default';
    }
  };

  const renderClassement = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Pos</TableCell>
            <TableCell></TableCell>
            <TableCell>Équipe</TableCell>
            <TableCell align="center">MJ</TableCell>
            <TableCell align="center">V</TableCell>
            <TableCell align="center">N</TableCell>
            <TableCell align="center">D</TableCell>
            <TableCell align="center">BP</TableCell>
            <TableCell align="center">BC</TableCell>
            <TableCell align="center">Diff</TableCell>
            <TableCell align="center">Pts</TableCell>
            <TableCell align="center">Forme</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {classement.map((equipe, index) => (
            <TableRow key={equipe.id} sx={{ 
              bgcolor: index < 3 ? 'success.light' : 'inherit',
              '&:hover': { bgcolor: 'action.hover' }
            }}>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {equipe.position}
                  </Typography>
                  {getPositionIcon(equipe.position, equipe.position_precedente)}
                </Box>
              </TableCell>
              <TableCell>
                <Avatar
                  sx={{ 
                    bgcolor: equipe.equipe.couleur_maillot,
                    width: 32,
                    height: 32
                  }}
                >
                  {equipe.equipe.logo_url ? (
                    <img src={equipe.equipe.logo_url} alt={equipe.equipe.nom} width="100%" />
                  ) : (
                    <SoccerIcon fontSize="small" />
                  )}
                </Avatar>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {equipe.equipe.nom}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {equipe.equipe.terrain.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">{equipe.matchs_joues}</TableCell>
              <TableCell align="center">{equipe.victoires}</TableCell>
              <TableCell align="center">{equipe.nuls}</TableCell>
              <TableCell align="center">{equipe.defaites}</TableCell>
              <TableCell align="center">{equipe.buts_marques}</TableCell>
              <TableCell align="center">{equipe.buts_encaisses}</TableCell>
              <TableCell align="center">
                <Typography 
                  variant="body2" 
                  color={equipe.difference_buts > 0 ? 'success.main' : 
                         equipe.difference_buts < 0 ? 'error.main' : 'text.primary'}
                  fontWeight="medium"
                >
                  {equipe.difference_buts > 0 ? '+' : ''}{equipe.difference_buts}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {equipe.points}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box display="flex" gap={0.5}>
                  {equipe.forme_recente.split('').map((lettre, i) => (
                    <Chip
                      key={i}
                      label={lettre}
                      size="small"
                      color={getFormeColor(lettre) as any}
                      sx={{ minWidth: 24, height: 20, fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderMatchs = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Matchs du championnat</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateMatchDialog(true)}
          sx={{ bgcolor: '#D32F2F' }}
        >
          Nouveau Match
        </Button>
      </Box>

      <Grid container spacing={2}>
        {matchs.map((match) => (
          <Grid item xs={12} md={6} key={match.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(match.date_match).toLocaleDateString('fr-FR')} - {match.terrain.name}
                  </Typography>
                  <Chip 
                    label={match.statut === 'a_venir' ? 'À venir' : 
                           match.statut === 'termine' ? 'Terminé' : 
                           match.statut === 'en_cours' ? 'En cours' : match.statut}
                    color={match.statut === 'termine' ? 'success' : 
                           match.statut === 'en_cours' ? 'primary' : 'default'}
                    size="small"
                  />
                </Box>

                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1} flex={1}>
                    <Avatar
                      sx={{ 
                        bgcolor: match.equipe1.couleur_maillot,
                        width: 32,
                        height: 32
                      }}
                    >
                      <SoccerIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {match.equipe1.nom}
                    </Typography>
                  </Box>

                  <Box textAlign="center" mx={2}>
                    {match.statut === 'termine' ? (
                      <Typography variant="h6" fontWeight="bold">
                        {match.score1} - {match.score2}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {new Date(match.date_match).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    )}
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} flex={1} justifyContent="flex-end">
                    <Typography variant="body2" fontWeight="medium">
                      {match.equipe2.nom}
                    </Typography>
                    <Avatar
                      sx={{ 
                        bgcolor: match.equipe2.couleur_maillot,
                        width: 32,
                        height: 32
                      }}
                    >
                      <SoccerIcon fontSize="small" />
                    </Avatar>
                  </Box>
                </Box>

                {match.statut === 'a_venir' && (
                  <Box mt={2} textAlign="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => openResultModal(match)}
                    >
                      Saisir résultat
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  if (loading) {
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
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Championnat National
            </Typography>
            {championnatActuel && (
              <Typography variant="subtitle1" color="text.secondary">
                {championnatActuel.nom}
              </Typography>
            )}
          </Box>
          <TrophyIcon sx={{ fontSize: 48, color: '#D32F2F' }} />
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

        {/* Onglets */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Classement" />
            <Tab label="Matchs" />
          </Tabs>
        </Box>

        {/* Contenu des onglets */}
        {tabValue === 0 && renderClassement()}
        {tabValue === 1 && renderMatchs()}

        {/* Dialog Création Match */}
        <Dialog open={openCreateMatchDialog} onClose={() => setOpenCreateMatchDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Créer un nouveau match</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Équipe 1</InputLabel>
                    <Select
                      value={matchFormData.equipe1_id}
                      onChange={(e) => setMatchFormData({ ...matchFormData, equipe1_id: e.target.value })}
                      label="Équipe 1"
                    >
                      {equipes.filter(e => e.id !== matchFormData.equipe2_id).map((equipe) => (
                        <MenuItem key={equipe.id} value={equipe.id}>
                          {equipe.nom}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Équipe 2</InputLabel>
                    <Select
                      value={matchFormData.equipe2_id}
                      onChange={(e) => setMatchFormData({ ...matchFormData, equipe2_id: e.target.value })}
                      label="Équipe 2"
                    >
                      {equipes.filter(e => e.id !== matchFormData.equipe1_id).map((equipe) => (
                        <MenuItem key={equipe.id} value={equipe.id}>
                          {equipe.nom}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Terrain</InputLabel>
                    <Select
                      value={matchFormData.terrain_id}
                      onChange={(e) => setMatchFormData({ ...matchFormData, terrain_id: e.target.value })}
                      label="Terrain"
                    >
                      {terrains.map((terrain) => (
                        <MenuItem key={terrain.id} value={terrain.id}>
                          {terrain.name} - {terrain.location}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={8}>
                  <DateTimePicker
                    label="Date et heure du match"
                    value={matchFormData.date_match}
                    onChange={(date) => setMatchFormData({ ...matchFormData, date_match: date })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Journée"
                    type="number"
                    value={matchFormData.journee}
                    onChange={(e) => setMatchFormData({ ...matchFormData, journee: parseInt(e.target.value) || 1 })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Arbitre"
                    value={matchFormData.arbitre}
                    onChange={(e) => setMatchFormData({ ...matchFormData, arbitre: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateMatchDialog(false)}>Annuler</Button>
            <Button 
              onClick={handleCreateMatch} 
              variant="contained"
              disabled={!matchFormData.equipe1_id || !matchFormData.equipe2_id || !matchFormData.terrain_id || !matchFormData.date_match}
            >
              Créer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Saisie Résultat */}
        <Dialog open={openResultDialog} onClose={() => setOpenResultDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Saisir le résultat du match
          </DialogTitle>
          <DialogContent>
            {selectedMatch && (
              <Box sx={{ pt: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
                  <Typography variant="h6">
                    {selectedMatch.equipe1.nom} vs {selectedMatch.equipe2.nom}
                  </Typography>
                </Box>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      label={`Score ${selectedMatch.equipe1.nom}`}
                      type="number"
                      value={resultFormData.score1}
                      onChange={(e) => setResultFormData({ ...resultFormData, score1: parseInt(e.target.value) || 0 })}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={2} textAlign="center">
                    <Typography variant="h4">-</Typography>
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      label={`Score ${selectedMatch.equipe2.nom}`}
                      type="number"
                      value={resultFormData.score2}
                      onChange={(e) => setResultFormData({ ...resultFormData, score2: parseInt(e.target.value) || 0 })}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      value={resultFormData.notes}
                      onChange={(e) => setResultFormData({ ...resultFormData, notes: e.target.value })}
                      multiline
                      rows={3}
                      placeholder="Commentaires sur le match..."
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenResultDialog(false)}>Annuler</Button>
            <Button 
              onClick={handleSaisirResultat} 
              variant="contained"
              color="success"
            >
              Valider le résultat
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ChampionnatsPage;
