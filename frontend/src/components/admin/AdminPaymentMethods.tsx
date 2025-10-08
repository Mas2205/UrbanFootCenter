import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Button,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Payment,
  Api,
  Key,
  Security
} from '@mui/icons-material';

import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Types
interface PaymentMethod {
  id: string;
  field_id: string;
  payment_type: 'wave' | 'orange_money' | 'carte_bancaire' | 'especes' | 'marketplace_digital';
  api_url: string;
  api_key: string;
  api_secret?: string;
  merchant_id?: string;
  is_active: boolean;
  ignore_validation: boolean;
  configuration: any;
  created_at: string;
  updated_at: string;
  field?: {
    id: string;
    name: string;
  };
}

interface PaymentMethodForm {
  field_id: string;
  payment_type: 'wave' | 'orange_money' | 'carte_bancaire' | 'especes' | 'marketplace_digital' | '';
  api_url: string;
  api_key: string;
  api_secret: string;
  merchant_id: string;
  is_active: boolean;
  ignore_validation: boolean;
  configuration: string;
}

interface Field {
  id: string;
  name: string;
  city?: string;
}

function AdminPaymentMethods() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<PaymentMethodForm>({
    field_id: '',
    payment_type: '',
    api_url: '',
    api_key: '',
    api_secret: '',
    merchant_id: '',
    is_active: true,
    ignore_validation: false,
    configuration: '{}'
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchPaymentMethods();
    if (user?.role === 'super_admin') {
      fetchFields();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/payment-methods');
      if (response && response.data && response.data.success) {
        setPaymentMethods(response.data.data);
      } else {
        setSnackbarMessage('Erreur lors du chargement des moyens de paiement');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des moyens de paiement:', error);
      setSnackbarMessage('Erreur lors du chargement des moyens de paiement');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFields = async () => {
    try {
      const response = await api.get('/fields');
      if (response && response.data) {
        // Handle different response structures
        let fieldsData = [];
        if (Array.isArray(response.data)) {
          fieldsData = response.data;
        } else if (response.data.fields && Array.isArray(response.data.fields)) {
          fieldsData = response.data.fields;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          fieldsData = response.data.data;
        }
        setFields(fieldsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des terrains:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        field_id: method.field_id,
        payment_type: method.payment_type,
        api_url: method.api_url,
        api_key: method.api_key,
        api_secret: method.api_secret || '',
        merchant_id: method.merchant_id || '',
        is_active: method.is_active,
        ignore_validation: method.ignore_validation || false,
        configuration: JSON.stringify(method.configuration, null, 2)
      });
    } else {
      setEditingMethod(null);
      setFormData({
        field_id: '',
        payment_type: '',
        api_url: '',
        api_key: '',
        api_secret: '',
        merchant_id: '',
        is_active: true,
        ignore_validation: false,
        configuration: '{}'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMethod(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Valider la configuration JSON
      let configurationObj = {};
      try {
        configurationObj = JSON.parse(formData.configuration);
      } catch (error) {
        setSnackbarMessage('Configuration JSON invalide');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // Adapter les données selon le type de paiement
      const submitData = {
        field_id: formData.field_id || undefined,
        payment_type: formData.payment_type,
        api_url: formData.payment_type === 'especes' ? 'cash_payment' : 
                 formData.payment_type === 'marketplace_digital' ? 'marketplace://paydunya-wave' :
                 formData.api_url,
        api_key: formData.payment_type === 'wave' ? 'wave_redirect' : 
                 formData.payment_type === 'especes' ? 'cash_payment' :
                 formData.payment_type === 'marketplace_digital' ? 'marketplace_configured' :
                 formData.api_key,
        api_secret: (formData.payment_type === 'wave' || formData.payment_type === 'especes' || formData.payment_type === 'marketplace_digital') ? undefined : (formData.api_secret || undefined),
        merchant_id: (formData.payment_type === 'wave' || formData.payment_type === 'especes' || formData.payment_type === 'marketplace_digital') ? 'marketplace' : (formData.merchant_id || undefined),
        is_active: formData.is_active,
        ignore_validation: formData.ignore_validation,
        configuration: configurationObj,
        // Champs spécifiques marketplace
        mode: formData.payment_type === 'marketplace_digital' ? 'marketplace' : 'traditional'
      };

      let response;
      if (editingMethod) {
        response = await api.put(`/payment-methods/${editingMethod.id}`, submitData);
      } else {
        response = await api.post('/payment-methods', submitData);
      }

      if (response && response.data && response.data.success) {
        setSnackbarMessage(editingMethod ? 'Moyen de paiement mis à jour' : 'Moyen de paiement créé');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        handleCloseDialog();
        fetchPaymentMethods();
      } else {
        setSnackbarMessage(response.data?.message || 'Erreur lors de la sauvegarde');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSnackbarMessage(error.response?.data?.message || 'Erreur lors de la sauvegarde');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce moyen de paiement ?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.delete(`/payment-methods/${id}`);
      
      if (response && response.data && response.data.success) {
        setSnackbarMessage('Moyen de paiement supprimé');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchPaymentMethods();
      } else {
        setSnackbarMessage('Erreur lors de la suppression');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      setSnackbarMessage(error.response?.data?.message || 'Erreur lors de la suppression');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'wave': return 'Wave';
      case 'orange_money': return 'Orange Money';
      case 'carte_bancaire': return 'Carte Bancaire';
      case 'especes': return 'Espèces';
      case 'marketplace_digital': return '🚀 Marketplace Digital';
      default: return type;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'wave': return '#FF6B35';
      case 'orange_money': return '#FF8C00';
      case 'carte_bancaire': return '#1976D2';
      case 'especes': return '#4CAF50';
      case 'marketplace_digital': return '#9C27B0';
      default: return '#757575';
    }
  };

  if (isLoading && paymentMethods.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader 
          title="Moyens de paiement"
          subheader="Gérez les APIs de paiement pour votre terrain"
          action={
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              disabled={isLoading}
            >
              Ajouter un moyen de paiement
            </Button>
          }
        />
        <Divider />
        <CardContent>
          {paymentMethods.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Payment sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Aucun moyen de paiement configuré
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Ajoutez des moyens de paiement pour permettre aux clients de réserver votre terrain
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                Ajouter le premier moyen de paiement
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    {user?.role === 'super_admin' && <TableCell>Terrain</TableCell>}
                    <TableCell>Type</TableCell>
                    <TableCell>URL API</TableCell>
                    <TableCell>Merchant ID</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      {user?.role === 'super_admin' && (
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {method.field?.name || 'Terrain non trouvé'}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip
                          label={getPaymentTypeLabel(method.payment_type)}
                          sx={{
                            backgroundColor: getPaymentTypeColor(method.payment_type),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {method.api_url}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {method.merchant_id || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={method.is_active ? 'Actif' : 'Inactif'}
                          color={method.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={method.ignore_validation ? 'Simulation' : 'Production'}
                          color={method.ignore_validation ? 'warning' : 'info'}
                          size="small"
                          variant={method.ignore_validation ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleOpenDialog(method)}
                          color="primary"
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(method.id)}
                          color="error"
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour ajouter/modifier un moyen de paiement */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingMethod ? 'Modifier le moyen de paiement' : 'Ajouter un moyen de paiement'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              {/* Sélection du terrain pour super admin */}
              {user?.role === 'super_admin' && (
                <FormControl fullWidth>
                  <InputLabel>Terrain *</InputLabel>
                  <Select
                    name="field_id"
                    value={formData.field_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, field_id: e.target.value }))}
                    label="Terrain *"
                    required
                  >
                    <MenuItem value="">
                      <em>Sélectionnez un terrain</em>
                    </MenuItem>
                    {fields.map((field) => (
                      <MenuItem key={field.id} value={field.id}>
                        {field.name} {field.city && `(${field.city})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Type de paiement */}
              <FormControl fullWidth>
                <InputLabel>Type de paiement</InputLabel>
                <Select
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_type: e.target.value as any }))}
                  label="Type de paiement"
                  required
                >
                  <MenuItem value="wave">Wave</MenuItem>
                  <MenuItem value="orange_money">Orange Money</MenuItem>
                  <MenuItem value="carte_bancaire">Carte Bancaire</MenuItem>
                  <MenuItem value="especes">Espèces</MenuItem>
                  <MenuItem value="marketplace_digital">
                    🚀 Marketplace Digital (Multi-canaux + Commission auto)
                  </MenuItem>
                </Select>
              </FormControl>

              {/* URL API - Masqué pour les paiements en espèces et marketplace */}
              {formData.payment_type !== 'especes' && formData.payment_type !== 'marketplace_digital' && (
                <TextField
                  fullWidth
                  label={formData.payment_type === 'wave' ? 'URL de redirection Wave' : "URL de l'API"}
                  name="api_url"
                  value={formData.api_url}
                  onChange={handleInputChange}
                  required
                  placeholder={
                    formData.payment_type === 'wave' 
                      ? 'https://checkout.wave.com/checkout/...' 
                      : 'https://api.example.com/payment'
                  }
                  helperText={
                    formData.payment_type === 'wave'
                      ? 'URL de redirection vers Wave pour effectuer le paiement'
                      : 'URL de l\'API de paiement'
                  }
                  InputProps={{
                    startAdornment: <Api sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              )}

              {/* Clé API - Masqué pour Wave, Espèces et Marketplace */}
              {formData.payment_type !== 'wave' && formData.payment_type !== 'especes' && formData.payment_type !== 'marketplace_digital' && (
                <TextField
                  fullWidth
                  label="Clé API"
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleInputChange}
                  required
                  type="password"
                  InputProps={{
                    startAdornment: <Key sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              )}

              {/* Secret API - Masqué pour Wave, Espèces et Marketplace */}
              {formData.payment_type !== 'wave' && formData.payment_type !== 'especes' && formData.payment_type !== 'marketplace_digital' && (
                <TextField
                  fullWidth
                  label="Secret API (optionnel)"
                  name="api_secret"
                  value={formData.api_secret}
                  onChange={handleInputChange}
                  type="password"
                  InputProps={{
                    startAdornment: <Security sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              )}

              {/* Merchant ID - Masqué pour Wave, Espèces et Marketplace */}
              {formData.payment_type !== 'wave' && formData.payment_type !== 'especes' && formData.payment_type !== 'marketplace_digital' && (
                <TextField
                  fullWidth
                  label="Merchant ID (optionnel)"
                  name="merchant_id"
                  value={formData.merchant_id}
                  onChange={handleInputChange}
                  placeholder="merchant_12345"
                />
              )}

              {/* Champs spécifiques au Marketplace Digital */}
              {formData.payment_type === 'marketplace_digital' && (
                <Box sx={{ p: 3, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    🚀 Configuration Marketplace Digital
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                    Le marketplace digital permet d'accepter les paiements Wave, Orange Money et cartes bancaires 
                    avec commission automatique et versement instantané.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Chip label="Wave" color="primary" size="small" />
                    <Chip label="Orange Money" sx={{ bgcolor: '#FF8C00', color: 'white' }} size="small" />
                    <Chip label="Cartes" color="info" size="small" />
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Configuration automatique :</strong> Le marketplace digital utilise PayDunya et Wave 
                      pour gérer les paiements. La commission de 10% est prélevée automatiquement et 90% 
                      vous est versé instantanément.
                    </Typography>
                  </Alert>
                </Box>
              )}

              {/* Configuration JSON - Adaptée selon le type */}
              <TextField
                fullWidth
                label="Configuration (JSON)"
                name="configuration"
                value={formData.configuration}
                onChange={handleInputChange}
                multiline
                rows={4}
                placeholder={
                  formData.payment_type === 'wave'
                    ? '{"currency": "XOF", "callback_url": "https://votre-site.com/callback"}'
                    : formData.payment_type === 'especes'
                    ? '{"currency": "XOF", "description": "Paiement en espèces au terrain"}'
                    : formData.payment_type === 'marketplace_digital'
                    ? '{"commission_rate": 10, "payout_channel": "wave", "mobile": "+221771234567"}'
                    : '{"timeout": 30, "currency": "XOF"}'
                }
                helperText={
                  formData.payment_type === 'wave'
                    ? 'Configuration Wave : currency (devise) et callback_url (URL de retour après paiement)'
                    : formData.payment_type === 'especes'
                    ? 'Configuration pour les paiements en espèces : currency (devise) et description'
                    : formData.payment_type === 'marketplace_digital'
                    ? 'Configuration marketplace : commission_rate (%), payout_channel (wave/orange_money) et mobile (+221xxxxxxxxx)'
                    : 'Configuration supplémentaire au format JSON'
                }
              />

              {/* Statut actif */}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    name="is_active"
                    color="primary"
                  />
                }
                label="Moyen de paiement actif"
              />

              {/* Ignorer la validation */}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ignore_validation}
                    onChange={(e) => setFormData(prev => ({ ...prev, ignore_validation: e.target.checked }))}
                    name="ignore_validation"
                    color="warning"
                  />
                }
                label="Ignorer la validation (mode simulation)"
                sx={{ 
                  '& .MuiFormControlLabel-label': { 
                    fontSize: '0.875rem',
                    color: formData.ignore_validation ? 'warning.main' : 'text.secondary'
                  }
                }}
              />
              {formData.ignore_validation && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Mode simulation activé :</strong> Les paiements retourneront toujours un code 200 (succès) 
                    sans appeler l'API réelle. Les réservations seront automatiquement validées.
                  </Typography>
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
            >
              {editingMethod ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminPaymentMethods;
