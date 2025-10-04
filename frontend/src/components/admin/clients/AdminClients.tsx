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
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Alert,
  AlertColor,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';

// Configuration de l'API

// Interface pour les clients
interface Client {
  id?: string; // Optionnel pour la création, requis pour l'édition
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: number;
  sexe?: 'M' | 'F' | 'Autre';
  password?: string;
}

const AdminClients: React.FC = () => {
  const { t } = useTranslation();
  
  // États pour le formulaire d'ajout de client
  const [newClient, setNewClient] = useState<Client>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // État pour les notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');

  // Validation des données du formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!newClient.firstName?.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire';
    }
    
    if (!newClient.lastName?.trim()) {
      newErrors.lastName = 'Le nom de famille est obligatoire';
    }
    
    if (!newClient.email?.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email.trim())) {
      newErrors.email = 'Format d\'email invalide. Exemple: utilisateur@domaine.com';
    }
    
    if (!newClient.phone?.trim()) {
      newErrors.phone = 'Le numéro de téléphone est obligatoire';
    } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/.test(newClient.phone.trim())) {
      newErrors.phone = 'Format de téléphone invalide. Exemple: +221771234567';
    }
    
    if (!newClient.password?.trim()) {
      newErrors.password = 'Le mot de passe est obligatoire';
    } else if (newClient.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestionnaires pour l'ajout de client
  const handleAddClient = () => {
    setNewClient({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      age: undefined,
      sexe: undefined
    });
    setAddClientDialogOpen(true);
  };

  const handleCloseAddClientDialog = () => {
    setAddClientDialogOpen(false);
  };

  // Handler pour les champs texte
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler pour les champs select
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value;
    setNewClient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumission du formulaire
  const handleSubmitClient = async () => {
    try {
      // Validation du formulaire
      if (!validateForm()) {
        return;
      }

      setFormSubmitting(true);
      
      // Préparer les données à envoyer
      const userData: Record<string, any> = {
        first_name: newClient.firstName,
        last_name: newClient.lastName,
        email: newClient.email,
        phone_number: newClient.phone,
        role: 'client',
        is_active: true,
        age: newClient.age || null,
        sexe: newClient.sexe || null,
        password: newClient.password
      };
      
      console.log('Données client à envoyer:', userData);
      
      // Récupérer le token d'authentification du localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification non trouvé');
      }
      
      // Appel de l'API pour créer le client avec le token d'authentification
      const response = await axios.post(`${API_BASE_URL}/admin/users`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 201 || response.status === 200) {
        // Fermer le dialogue
        setAddClientDialogOpen(false);
        
        // Notification de succès
        setSnackbarSeverity('success');
        setSnackbarMessage(t('admin.clients.createSuccess'));
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      console.error('Erreur lors de la création du client:', error);
      
      let errorMessage = t('admin.clients.createError');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setSnackbarSeverity('error');
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Fermeture de la notification
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h1">
              {t('admin.clients.title')}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PersonAddIcon />}
              onClick={handleAddClient}
            >
              {t('admin.clients.addClient')}
            </Button>
          </Box>
          
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 3 }}>
            <Typography variant="body1">
              {t('admin.clients.description')}
            </Typography>
          </Box>

          {/* Liste des instructions pour la création de clients */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('admin.clients.instructions')}
            </Typography>
            <ul>
              <li>{t('admin.clients.instruction1')}</li>
              <li>{t('admin.clients.instruction2')}</li>
              <li>{t('admin.clients.instruction3')}</li>
            </ul>
          </Box>
        </Paper>
      </Box>

      {/* Dialog pour ajouter un client */}
      <Dialog
        open={addClientDialogOpen}
        onClose={handleCloseAddClientDialog}
        aria-labelledby="form-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="form-dialog-title">{t('admin.clients.addClientTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('admin.clients.addClientDescription')}
          </DialogContentText>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                autoFocus
                margin="dense"
                id="firstName"
                name="firstName"
                label={t('common.firstName')}
                type="text"
                fullWidth
                value={newClient.firstName}
                onChange={handleTextFieldChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                id="lastName"
                name="lastName"
                label={t('common.lastName')}
                type="text"
                fullWidth
                value={newClient.lastName}
                onChange={handleTextFieldChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                id="email"
                name="email"
                label={t('common.email')}
                type="email"
                fullWidth
                value={newClient.email}
                onChange={handleTextFieldChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                id="phone"
                name="phone"
                label={t('common.phone')}
                type="tel"
                fullWidth
                value={newClient.phone}
                onChange={handleTextFieldChange}
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                margin="dense"
                id="age"
                name="age"
                label={t('common.age')}
                type="number"
                fullWidth
                value={newClient.age || ''}
                onChange={handleTextFieldChange}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="sexe-label">{t('common.gender')}</InputLabel>
                <Select
                  labelId="sexe-label"
                  id="sexe"
                  name="sexe"
                  value={newClient.sexe || ''}
                  onChange={(e) => handleSelectChange(e as any)}
                  label={t('common.gender')}
                >
                  <MenuItem value="M">{t('common.male')}</MenuItem>
                  <MenuItem value="F">{t('common.female')}</MenuItem>
                  <MenuItem value="Autre">{t('common.other')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12' } }}>
              <TextField
                margin="dense"
                id="password"
                name="password"
                label={t('common.password')}
                type="password"
                fullWidth
                value={newClient.password || ''}
                onChange={handleTextFieldChange}
                error={!!errors.password}
                helperText={errors.password}
              />
              <FormHelperText>{t('admin.clients.passwordHelp')}</FormHelperText>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddClientDialog} color="primary">
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSubmitClient} 
            color="primary"
            disabled={formSubmitting}
            startIcon={formSubmitting ? <CircularProgress size={20} /> : null}
          >
            {formSubmitting ? t('common.creating') : t('common.create')}
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

export default AdminClients;
