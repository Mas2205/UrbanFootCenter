import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/constants';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  TextField,
  Typography,
  Alert,
  AlertColor,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon
} from '@mui/icons-material';

// Interface pour les régions
interface Region {
  id?: string;
  region_name: string;
  department_name: string;
  city_name: string;
  region_code?: string;
  department_code?: string;
  population?: number;
  area_km2?: number;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
}

const AdminRegions: React.FC = () => {
  const { t } = useTranslation();
  
  // États pour la gestion des régions
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // État pour le formulaire
  const [formData, setFormData] = useState<Region>({
    region_name: '',
    department_name: '',
    city_name: '',
    region_code: '',
    department_code: '',
    population: undefined,
    area_km2: undefined,
    latitude: undefined,
    longitude: undefined
  });
  
  // État pour les erreurs et notifications
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');

  // Charger les régions au montage du composant
  useEffect(() => {
    loadRegions();
  }, []);

  // Fonction pour charger toutes les régions
  const loadRegions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/regions`);
      
      if (response.data.success) {
        setRegions(response.data.data);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des régions:', error);
      showSnackbar('Erreur lors du chargement des régions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour exporter les données en Excel
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/regions/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `regions_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSnackbar('Export réussi', 'success');
    } catch (error: any) {
      console.error('Erreur lors de l\'export:', error);
      showSnackbar('Erreur lors de l\'export', 'error');
    }
  };

  // Fonction pour ouvrir le dialog d'import
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = handleImport;
    input.click();
  };

  // Fonction pour importer les données depuis Excel
  const handleImport = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/admin/regions/import`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showSnackbar(`Import réussi: ${response.data.message}`, 'success');
        loadRegions(); // Recharger les données
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'import:', error);
      const message = error.response?.data?.message || 'Erreur lors de l\'import';
      showSnackbar(message, 'error');
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.region_name?.trim()) {
      newErrors.region_name = 'Le nom de la région est obligatoire';
    }
    
    if (!formData.department_name?.trim()) {
      newErrors.department_name = 'Le nom du département est obligatoire';
    }
    
    if (!formData.city_name?.trim()) {
      newErrors.city_name = 'Le nom de la ville est obligatoire';
    }
    
    if (formData.population && formData.population < 0) {
      newErrors.population = 'La population ne peut pas être négative';
    }
    
    if (formData.area_km2 && formData.area_km2 < 0) {
      newErrors.area_km2 = 'La superficie ne peut pas être négative';
    }
    
    if (formData.latitude && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'La latitude doit être entre -90 et 90';
    }
    
    if (formData.longitude && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'La longitude doit être entre -180 et 180';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestionnaires pour les dialogs
  const handleOpenDialog = (region?: Region) => {
    if (region) {
      setEditMode(true);
      setSelectedRegion(region);
      setFormData({ ...region });
    } else {
      setEditMode(false);
      setSelectedRegion(null);
      setFormData({
        region_name: '',
        department_name: '',
        city_name: '',
        region_code: '',
        department_code: '',
        population: undefined,
        area_km2: undefined,
        latitude: undefined,
        longitude: undefined
      });
    }
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setSelectedRegion(null);
    setErrors({});
  };

  const handleOpenDeleteDialog = (region: Region) => {
    setSelectedRegion(region);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedRegion(null);
  };

  // Gestionnaires pour les champs du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'population' || name === 'area_km2' || name === 'latitude' || name === 'longitude'
        ? value === '' ? undefined : Number(value)
        : value
    }));
  };

  // Fonction pour afficher les notifications
  const showSnackbar = (message: string, severity: AlertColor) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Fonction pour créer ou modifier une région
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setFormSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token d\'authentification non trouvé');
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      let response;
      if (editMode && selectedRegion) {
        response = await axios.put(
          `${API_BASE_URL}/admin/regions/${selectedRegion.id}`,
          formData,
          config
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/admin/regions`,
          formData,
          config
        );
      }

      if (response.data.success) {
        handleCloseDialog();
        loadRegions();
        showSnackbar(
          editMode ? 'Région modifiée avec succès' : 'Région créée avec succès',
          'success'
        );
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage = error.response?.data?.message || 
        (editMode ? 'Erreur lors de la modification' : 'Erreur lors de la création');
      showSnackbar(errorMessage, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Fonction pour supprimer une région
  const handleDelete = async () => {
    if (!selectedRegion) return;

    try {
      setFormSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token d\'authentification non trouvé');
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await axios.delete(
        `${API_BASE_URL}/admin/regions/${selectedRegion.id}`,
        config
      );

      if (response.data.success) {
        handleCloseDeleteDialog();
        loadRegions();
        showSnackbar('Région supprimée avec succès', 'success');
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression';
      showSnackbar(errorMessage, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h1">
              <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Gestion des Régions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                sx={{ color: '#1d693b', borderColor: '#1d693b', '&:hover': { borderColor: '#155a2e', bgcolor: '#f5f5f5' } }}
              >
                Exporter Excel
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<UploadIcon />}
                onClick={handleImportClick}
                sx={{ color: '#1d693b', borderColor: '#1d693b', '&:hover': { borderColor: '#155a2e', bgcolor: '#f5f5f5' } }}
              >
                Importer Excel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Ajouter une région
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 3 }}>
            <Typography variant="body1">
              Gérez les régions, départements et villes du système. Vous pouvez ajouter, modifier ou supprimer des régions.
            </Typography>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Région</strong></TableCell>
                    <TableCell><strong>Département</strong></TableCell>
                    <TableCell><strong>Ville</strong></TableCell>
                    <TableCell><strong>Code Région</strong></TableCell>
                    <TableCell><strong>Population</strong></TableCell>
                    <TableCell><strong>Superficie (km²)</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {regions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="textSecondary">
                          Aucune région trouvée
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    regions.map((region) => (
                      <TableRow key={region.id} hover>
                        <TableCell>
                          <Chip 
                            label={region.region_name} 
                            color="primary" 
                            variant="outlined" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{region.department_name}</TableCell>
                        <TableCell>{region.city_name}</TableCell>
                        <TableCell>
                          {region.region_code ? (
                            <Chip label={region.region_code} size="small" />
                          ) : (
                            <Typography variant="body2" color="textSecondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {region.population ? region.population.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {region.area_km2 ? `${region.area_km2} km²` : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(region)}
                            title="Modifier"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteDialog(region)}
                            title="Supprimer"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Dialog pour ajouter/modifier une région */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Modifier la région' : 'Ajouter une région'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {editMode 
              ? 'Modifiez les informations de la région ci-dessous.'
              : 'Remplissez les informations de la nouvelle région ci-dessous.'
            }
          </DialogContentText>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                autoFocus
                margin="dense"
                name="region_name"
                label="Nom de la région *"
                type="text"
                fullWidth
                value={formData.region_name}
                onChange={handleInputChange}
                error={!!errors.region_name}
                helperText={errors.region_name}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                name="department_name"
                label="Nom du département *"
                type="text"
                fullWidth
                value={formData.department_name}
                onChange={handleInputChange}
                error={!!errors.department_name}
                helperText={errors.department_name}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                name="city_name"
                label="Nom de la ville *"
                type="text"
                fullWidth
                value={formData.city_name}
                onChange={handleInputChange}
                error={!!errors.city_name}
                helperText={errors.city_name}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                name="region_code"
                label="Code région"
                type="text"
                fullWidth
                value={formData.region_code || ''}
                onChange={handleInputChange}
                error={!!errors.region_code}
                helperText={errors.region_code}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                name="department_code"
                label="Code département"
                type="text"
                fullWidth
                value={formData.department_code || ''}
                onChange={handleInputChange}
                error={!!errors.department_code}
                helperText={errors.department_code}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                name="population"
                label="Population"
                type="number"
                fullWidth
                value={formData.population || ''}
                onChange={handleInputChange}
                error={!!errors.population}
                helperText={errors.population}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                name="area_km2"
                label="Superficie (km²)"
                type="number"
                fullWidth
                value={formData.area_km2 || ''}
                onChange={handleInputChange}
                error={!!errors.area_km2}
                helperText={errors.area_km2}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                name="latitude"
                label="Latitude"
                type="number"
                fullWidth
                value={formData.latitude || ''}
                onChange={handleInputChange}
                error={!!errors.latitude}
                helperText={errors.latitude || 'Entre -90 et 90'}
                inputProps={{ step: 'any' }}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                name="longitude"
                label="Longitude"
                type="number"
                fullWidth
                value={formData.longitude || ''}
                onChange={handleInputChange}
                error={!!errors.longitude}
                helperText={errors.longitude || 'Entre -180 et 180'}
                inputProps={{ step: 'any' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary"
            variant="contained"
            disabled={formSubmitting}
            startIcon={formSubmitting ? <CircularProgress size={20} /> : null}
          >
            {formSubmitting 
              ? (editMode ? 'Modification...' : 'Création...') 
              : (editMode ? 'Modifier' : 'Créer')
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer la région "{selectedRegion?.region_name}" 
            du département "{selectedRegion?.department_name}" ?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Annuler
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            variant="contained"
            disabled={formSubmitting}
            startIcon={formSubmitting ? <CircularProgress size={20} /> : null}
          >
            {formSubmitting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminRegions;
