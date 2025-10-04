import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardHeader,
  Container,
  Divider,
  CardContent,
  Button,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Typography,
  Avatar,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import { PhotoCamera, Save, LocationOn, Description, MonetizationOn, SportsSoccer, Category, AttachMoney } from '@mui/icons-material';

import api from '../../services/api';

// Types
interface Field {
  id: string;
  name: string;
  description: string;
  size: string;
  surface_type: string;
  price_per_hour: number;
  equipment_fee: number | null;
  indoor: boolean;
  is_active: boolean;
  location: string;
  image_url: string | null;
}

function AdminFieldManagement() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [field, setField] = useState<Field | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    size: '',
    surface_type: '',
    price_per_hour: '',
    location: '',
    equipment_fee: '',
    indoor: false
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchFieldData();
  }, []);

  const fetchFieldData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/availability/field');
      if (response && response.data && response.data.success) {
        const fieldData = response.data.data;
        setField(fieldData);
        setFormData({
          name: fieldData.name || '',
          description: fieldData.description || '',
          size: fieldData.size || '',
          surface_type: fieldData.surface_type || '',
          price_per_hour: fieldData.price_per_hour ? fieldData.price_per_hour.toString() : '',
          location: fieldData.location || '',
          equipment_fee: fieldData.equipment_fee ? fieldData.equipment_fee.toString() : '',
          indoor: fieldData.indoor || false
        });
        if (fieldData.image_url) {
          setImagePreview(`${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001'}${fieldData.image_url}`);
        }
      } else {
        setSnackbarMessage('Erreur lors du chargement des informations du terrain');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Erreur lors du chargement des informations du terrain');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('size', formData.size);
      formDataToSend.append('surface_type', formData.surface_type);
      formDataToSend.append('price_per_hour', formData.price_per_hour);
      formDataToSend.append('location', formData.location);
      if (formData.equipment_fee) {
        formDataToSend.append('equipment_fee', formData.equipment_fee);
      }
      formDataToSend.append('indoor', formData.indoor.toString());
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      const response = await api.put('/availability/field', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response && response.data && response.data.success) {
        setSnackbarMessage('Terrain mis à jour avec succès');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchFieldData(); // Recharger les données
        setSelectedImage(null);
      } else {
        setSnackbarMessage('Erreur lors de la mise à jour');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Erreur lors de la mise à jour');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !field) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!field) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          Aucun terrain assigné trouvé. Contactez l'administrateur système.
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardHeader 
              title="Gestion de mon terrain"
              subheader={`Terrain: ${field.name}`}
            />
            <Divider />
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Layout en deux colonnes */}
                  {/* Image du terrain */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6">Image du terrain</Typography>
                      <Avatar
                        src={imagePreview || undefined}
                        sx={{ 
                          width: 200, 
                          height: 150, 
                          borderRadius: 2,
                          bgcolor: 'grey.200'
                        }}
                        variant="rounded"
                      >
                        <PhotoCamera sx={{ fontSize: 40 }} />
                      </Avatar>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<PhotoCamera />}
                      >
                        Changer l'image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </Button>
                    </Box>
                  </Box>

                  {/* Informations du terrain */}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Informations du terrain
                    </Typography>
                  </Box>

                  {/* Nom et Taille */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <TextField
                        fullWidth
                        label="Nom du terrain"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SportsSoccer />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Taille</InputLabel>
                        <Select
                          name="size"
                          value={formData.size}
                          onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                          label="Taille"
                        >
                          <MenuItem value="5v5">5v5</MenuItem>
                          <MenuItem value="7v7">7v7</MenuItem>
                          <MenuItem value="11v11">11v11</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  {/* Surface et Prix */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Type de surface</InputLabel>
                        <Select
                          name="surface_type"
                          value={formData.surface_type}
                          onChange={(e) => setFormData(prev => ({ ...prev, surface_type: e.target.value }))}
                          label="Type de surface"
                        >
                          <MenuItem value="gazon_naturel">Gazon naturel</MenuItem>
                          <MenuItem value="gazon_synthetique">Gazon synthétique</MenuItem>
                          <MenuItem value="beton">Béton</MenuItem>
                          <MenuItem value="terre_battue">Terre battue</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel htmlFor="price_per_hour">Prix par heure</InputLabel>
                        <OutlinedInput
                          id="price_per_hour"
                          name="price_per_hour"
                          value={formData.price_per_hour}
                          onChange={handleInputChange}
                          startAdornment={<InputAdornment position="start"><AttachMoney /></InputAdornment>}
                          endAdornment={<InputAdornment position="end">FCFA</InputAdornment>}
                          label="Prix par heure"
                          type="number"
                        />
                      </FormControl>
                    </Box>
                  </Box>

                  {/* Type et Frais d'équipement */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.indoor}
                            onChange={(e) => setFormData(prev => ({ ...prev, indoor: e.target.checked }))}
                            name="indoor"
                            color="primary"
                          />
                        }
                        label={formData.indoor ? 'Terrain couvert' : 'Terrain extérieur'}
                      />
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel htmlFor="equipment_fee">Frais d'équipement</InputLabel>
                        <OutlinedInput
                          id="equipment_fee"
                          name="equipment_fee"
                          value={formData.equipment_fee}
                          onChange={handleInputChange}
                          startAdornment={<InputAdornment position="start"><MonetizationOn /></InputAdornment>}
                          endAdornment={<InputAdornment position="end">FCFA</InputAdornment>}
                          label="Frais d'équipement"
                          type="number"
                        />
                      </FormControl>
                    </Box>
                  </Box>

                  {/* Description et Localisation */}
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Description />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Box>
                    <TextField
                      fullWidth
                      label="Localisation"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                      >
                        {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Box>
      </Container>
      
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
    </>
  );
}

export default AdminFieldManagement;
