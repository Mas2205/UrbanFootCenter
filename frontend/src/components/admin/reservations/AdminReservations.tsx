import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../../config/constants';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  MonetizationOn as CashIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { reservationAPI, fieldAPI } from '../../../services/api';

// Types pour les composants
interface Reservation {
  id: string;
  userId: string;
  fieldId: string;
  startTime: string;
  endTime: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  rentEquipment: boolean;
  equipmentFee: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Field {
  id: string;
  name: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ReservationWithDetails extends Reservation {
  field: Field;
  user: User;
  reservationPaymentStatus: string; // Statut de paiement de la table reservations
  paymentsPaymentStatus: string | null; // Statut de paiement de la table payments
}

const AdminReservations: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();

  // États
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState<ReservationWithDetails | null>(null);
  
  // Filtres
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [fields, setFields] = useState<Field[]>([]);

  // Fonction pour transformer les données API en format compatible avec le composant
  const transformApiReservationToComponent = (apiReservation: any): ReservationWithDetails => {
    if (!apiReservation) {
      console.error('Tentative de transformer une réservation undefined');
      return {
        id: 'invalid-id',
        userId: '',
        fieldId: '',
        startTime: '',
        endTime: '',
        price: 0,
        status: 'pending',
        paymentMethod: '',
        paymentStatus: 'pending',
        reservationPaymentStatus: 'pending',
        paymentsPaymentStatus: null,
        rentEquipment: false,
        equipmentFee: 0,
        createdAt: '',
        updatedAt: '',
        field: { id: '', name: '' },
        user: { id: '', firstName: '', lastName: '', email: '', phone: '' }
      };
    }
    
    try {
      console.log('Transformation de la réservation API:', apiReservation);
      
      // Extraction des données de base
      const { 
        id, 
        user_id, 
        field_id, 
        reservation_date, 
        start_time, 
        end_time, 
        total_price, 
        status = 'pending', 
        payment_status = 'pending',
        createdAt = '', 
        updatedAt = '',
        notes = ''
      } = apiReservation;
      
      // Construction des dates/heures complètes au format ISO
      let startTimeISO = '';
      let endTimeISO = '';
      
      if (reservation_date && start_time) {
        // Combiner la date de réservation avec l'heure de début
        const dateStr = reservation_date.split('T')[0]; // Prendre seulement la partie date
        startTimeISO = `${dateStr}T${start_time}`;
        console.log('StartTime construit:', startTimeISO);
      }
      
      if (reservation_date && end_time) {
        // Combiner la date de réservation avec l'heure de fin
        const dateStr = reservation_date.split('T')[0]; // Prendre seulement la partie date
        endTimeISO = `${dateStr}T${end_time}`;
        console.log('EndTime construit:', endTimeISO);
      }
      
      // Extraction des données utilisateur
      const user = apiReservation.user || {};
      const userInfo = {
        id: user.id || user_id || '',
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        email: user.email || '',
        phone: user.phone_number || user.phone || ''
      };
      
      // Extraction des données de terrain
      const field = apiReservation.field || {};
      const fieldInfo = {
        id: field.id || field_id || '',
        name: field.name || t('common.unknownField')
      };
      
      // Extraction des données de paiement
      const payments = apiReservation.payments || [];
      let paymentMethod = '';
      let actualPaymentStatus = payment_status;
      let paymentsPaymentStatus = null;
      
      if (payments.length > 0) {
        const lastPayment = payments[payments.length - 1];
        paymentMethod = lastPayment.payment_method || '';
        paymentsPaymentStatus = lastPayment.payment_status;
        actualPaymentStatus = lastPayment.payment_status || payment_status;
      }
      
      // Construction de l'objet ReservationWithDetails
      const transformedReservation = {
        id: id || 'unknown-id',
        userId: user_id || '',
        fieldId: field_id || '',
        startTime: startTimeISO,
        endTime: endTimeISO,
        price: total_price || 0,
        status,
        paymentMethod,
        paymentStatus: actualPaymentStatus,
        reservationPaymentStatus: payment_status, // Statut de paiement de la table reservations
        paymentsPaymentStatus: paymentsPaymentStatus, // Statut de paiement de la table payments
        rentEquipment: false, // À adapter selon vos besoins
        equipmentFee: 0, // À adapter selon vos besoins
        createdAt,
        updatedAt,
        field: fieldInfo,
        user: userInfo
      };
      
      console.log('Réservation transformée:', transformedReservation);
      return transformedReservation;
      
    } catch (error) {
      console.error('Erreur lors de la transformation des données de réservation:', error, apiReservation);
      
      return {
        id: apiReservation.id || 'error-id',
        userId: '',
        fieldId: '',
        startTime: '',
        endTime: '',
        price: 0,
        status: 'pending',
        paymentMethod: '',
        paymentStatus: 'pending',
        reservationPaymentStatus: 'pending',
        paymentsPaymentStatus: null,
        rentEquipment: false,
        equipmentFee: 0,
        createdAt: '',
        updatedAt: '',
        field: { id: '', name: t('common.dataError') },
        user: { id: '', firstName: t('common.error'), lastName: '', email: '', phone: '' }
      };
    }
  };

  // Fonction pour calculer la durée en heures
  const calculateDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) {
      return t('common.notAvailable');
    }
    
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return t('common.notAvailable');
      }
      
      const durationMs = end.getTime() - start.getTime();
      const durationHours = Math.round(durationMs / (1000 * 60 * 60));
      
      if (durationHours <= 0) {
        return t('common.notAvailable');
      }
      
      return `${durationHours} ${t('common.hours')}`;
    } catch (error) {
      console.error('Erreur lors du calcul de la durée:', error);
      return t('common.notAvailable');
    }
  };

  // Fonction pour obtenir la traduction de la méthode de paiement
  const getPaymentMethodTranslation = (method: string): string => {
    if (!method) return '';
    
    const methodKey = `payment.methods.${method.toLowerCase()}`;
    const translation = t(methodKey);
    
    // Si la traduction n'existe pas, retourner une version formatée du nom technique
    if (translation === methodKey) {
      switch (method.toLowerCase()) {
        case 'card':
        case 'credit_card':
        case 'creditcard':
          return t('payments.creditCard');
        case 'wave':
          return t('payments.wave');
        case 'orange_money':
        case 'orangemoney':
          return t('payments.orangeMoney');
        case 'cash':
        case 'especes':
          return 'Espèces';
        default:
          return method.charAt(0).toUpperCase() + method.slice(1);
      }
    }
    
    return translation;
  };

  // Récupérer les réservations
  const fetchReservations = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('Token manquant pour récupérer les réservations');
      setError(t('common.authRequired'));
      setLoading(false);
      return;
    }
    
    try {
      console.log('Récupération des réservations...');
      const response = await reservationAPI.getAllReservations();
      console.log('Réponse API réservations:', response);
      
      // Vérifier que nous avons une réponse valide avec des données
      if (!response || !response.data) {
        console.error('Réponse API invalide', response);
        setError(t('admin.reservations.invalidResponse'));
        setLoading(false);
        return;
      }
      
      // Extraire les données de réservation, selon la structure
      let apiReservations = [];
      if (Array.isArray(response.data)) {
        apiReservations = response.data;
      } else if (Array.isArray(response.data.data)) {
        apiReservations = response.data.data;
      } else if (response.data.reservations && Array.isArray(response.data.reservations)) {
        apiReservations = response.data.reservations;
      } else {
        console.error('Format de données de réservation inattendu', response.data);
        setError(t('admin.reservations.unexpectedFormat'));
        setLoading(false);
        return;
      }
      
      // Transformer les données API en objets compatibles avec le composant
      const transformedReservations = apiReservations.map(transformApiReservationToComponent);
      console.log('Réservations transformées:', transformedReservations);
      
      let filtered = transformedReservations;
      
      // Filtrer par terrain pour les admins de terrain
      if (user?.role === 'admin' && user?.fieldId) {
        filtered = filtered.filter((res: ReservationWithDetails) => res.fieldId === user.fieldId);
      }
      
      // Appliquer les filtres
      if (startDate) {
        filtered = filtered.filter((res: ReservationWithDetails) => {
          try {
            return new Date(res.startTime) >= startDate;
          } catch (e) {
            return true; // Garder les réservations avec dates invalides pour affichage
          }
        });
      }
      
      if (endDate) {
        filtered = filtered.filter((res: ReservationWithDetails) => {
          try {
            return new Date(res.startTime) <= endDate;
          } catch (e) {
            return true; // Garder les réservations avec dates invalides pour affichage
          }
        });
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter((res: ReservationWithDetails) => res.status === statusFilter);
      }
      
      if (fieldFilter !== 'all') {
        filtered = filtered.filter((res: ReservationWithDetails) => res.fieldId === fieldFilter);
      }
      
      setReservations(filtered);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des réservations', err);
      setError(t('admin.reservations.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les terrains pour le filtre
  const fetchFields = async () => {
    try {
      console.log('Fetching fields...');
      const response = await fieldAPI.getAllFields();
      console.log('Fields API response:', response);
      
      // Handle different response structures
      let fieldArray = [];
      
      if (response && Array.isArray(response)) {
        console.log('Response is directly an array');
        fieldArray = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        console.log('Response has data property as array');
        fieldArray = response.data;
      } else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
        // Handle nested data structure if any
        console.log('Response has nested data.data as array');
        fieldArray = response.data.data;
      } else {
        // Debug what we received
        console.error('Unexpected fields data structure:', response);
        console.error('Type of response:', typeof response);
        if (response) {
          console.error('Type of response.data:', typeof response.data);
          if (response.data) {
            console.error('Keys in response.data:', Object.keys(response.data));
          }
        }
        fieldArray = [];
      }
      
      console.log('Final fields array:', fieldArray);
      setFields(fieldArray);
    } catch (err) {
      console.error('Erreur lors de la récupération des terrains', err);
      setFields([]);
    }
  };


  useEffect(() => {
    fetchReservations();
    fetchFields();
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [startDate, endDate, statusFilter, fieldFilter]);

  // Gestionnaires de pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestionnaires d'actions
  const handleViewReservation = (reservation: ReservationWithDetails) => {
    setReservationDetails(reservation);
    setDetailsDialogOpen(true);
  };

  const handleOpenActionDialog = (reservation: ReservationWithDetails, action: 'confirm' | 'cancel') => {
    setSelectedReservation(reservation);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const handleCloseActionDialog = () => {
    setActionDialogOpen(false);
    setSelectedReservation(null);
    setActionType(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedReservation || !actionType) return;

    try {
      if (actionType === 'confirm') {
        await reservationAPI.updateReservationStatus(selectedReservation.id, 'confirmed');
      } else if (actionType === 'cancel') {
        await reservationAPI.updateReservationStatus(selectedReservation.id, 'cancelled');
      }

      // Mettre à jour la liste des réservations
      fetchReservations();
      handleCloseActionDialog();
    } catch (err) {
      console.error(`Erreur lors de l'action ${actionType}`, err);
      setError(t(`admin.reservations.${actionType}Error`));
    }
  };

  // Fonction pour valider un paiement
  const handleValidatePayment = async (reservationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/validate/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la validation du paiement');
      }

      // Mettre à jour la liste des réservations
      fetchReservations();
    } catch (err) {
      console.error('Erreur lors de la validation du paiement:', err);
      setError('Erreur lors de la validation du paiement');
    }
  };

  // Fonction pour effectuer un paiement en espèces
  const handleCashPayment = async (reservationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/cash/${reservationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_method: 'cash',
          payment_status: 'paid'
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du paiement en espèces');
      }

      // Mettre à jour la liste des réservations
      fetchReservations();
    } catch (err) {
      console.error('Erreur lors du paiement en espèces:', err);
      setError('Erreur lors du paiement en espèces');
    }
  };

  // Fonction utilitaire pour formatter les dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      console.warn("Tentative de formatage d'une date nulle ou non définie");
      return t('common.notAvailable');
    }
    
    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn(`Date invalide: ${dateString}`);
        return t('common.invalidDate');
      }
      return format(date, 'dd MMM yyyy HH:mm', { locale: fr });
    } catch (err) {
      console.error(`Erreur lors du formatage de la date: ${dateString}`, err);
      return t('common.invalidDate');
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  // Fonction pour obtenir la traduction du statut
  const getStatusTranslation = (status: string) => {
    return t(`admin.reservations.status.${status}`);
  };

  // Fonction pour obtenir la traduction du statut de paiement
  const getPaymentStatusTranslation = (paymentStatus: string): string => {
    if (!paymentStatus) return t('common.notAvailable');
    
    switch (paymentStatus.toLowerCase()) {
      case 'pending':
        return t('reservations.paymentStatus.pending');
      case 'paid':
      case 'completed':
        return t('reservations.paymentStatus.completed');
      case 'failed':
        return t('reservations.paymentStatus.failed');
      case 'refunded':
        return t('reservations.paymentStatus.refunded');
      default:
        return paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);
    }
  };

  if (loading && reservations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {t('admin.reservations.title')}
      </Typography>

      {/* Section de filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, alignItems: 'center' }}>
          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label={t('admin.reservations.filters.startDate')}
                value={startDate}
                onChange={(newValue: Date | null) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label={t('admin.reservations.filters.endDate')}
                value={endDate}
                onChange={(newValue: Date | null) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('admin.reservations.filters.status')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('admin.reservations.filters.status')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">{t('admin.reservations.filters.allStatuses')}</MenuItem>
                <MenuItem value="pending">{t('admin.reservations.status.pending')}</MenuItem>
                <MenuItem value="confirmed">{t('admin.reservations.status.confirmed')}</MenuItem>
                <MenuItem value="cancelled">{t('admin.reservations.status.cancelled')}</MenuItem>
                <MenuItem value="completed">{t('admin.reservations.status.completed')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('admin.reservations.filters.field')}</InputLabel>
              <Select
                value={fieldFilter}
                label={t('admin.reservations.filters.field')}
                onChange={(e) => setFieldFilter(e.target.value)}
              >
                <MenuItem value="all">{t('admin.reservations.filters.allFields')}</MenuItem>
                {Array.isArray(fields) && fields.map((field) => (
                  <MenuItem key={field.id} value={field.id}>{field.name}</MenuItem>
                ))}
                {/* Render nothing if fields is not an array */}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>{t('admin.reservations.id')}</TableCell>
                <TableCell>{t('admin.reservations.client')}</TableCell>
                <TableCell>{t('admin.reservations.field')}</TableCell>
                <TableCell>{t('admin.reservations.date')}</TableCell>
                <TableCell>{t('admin.reservations.duration')}</TableCell>
                <TableCell>{t('admin.reservations.price')}</TableCell>
                <TableCell>{t('admin.reservations.statusLabel')}</TableCell>
                <TableCell>{t('admin.reservations.payment')}</TableCell>
                <TableCell align="center">{t('admin.common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((reservation) => {
                  const startTime = new Date(reservation.startTime);
                  const endTime = new Date(reservation.endTime);
                  const durationHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
                  
                  return (
                    <TableRow hover key={reservation.id}>
                      <TableCell>{reservation.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        {`${reservation.user.firstName} ${reservation.user.lastName}`}
                        <Typography variant="caption" display="block" color="textSecondary">
                          {reservation.user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{reservation.field.name}</TableCell>
                      <TableCell>{formatDate(reservation.startTime)}</TableCell>
                      <TableCell>{`${durationHours} ${t('common.hours')}`}</TableCell>
                      <TableCell>
                        {reservation.price !== undefined && reservation.price !== null
                          ? `${reservation.price.toLocaleString()} FCFA`
                          : t('common.notAvailable')
                        }
                        {reservation.rentEquipment && reservation.equipmentFee && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            {`+ ${(reservation.equipmentFee || 0).toLocaleString()} FCFA ${t('common.equipment')}`}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusTranslation(reservation.status)}
                          color={getStatusColor(reservation.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getPaymentStatusTranslation(reservation.paymentStatus)}
                          color={reservation.paymentStatus === 'paid' ? 'success' : 'warning'}
                          size="small"
                        />
                        {getPaymentMethodTranslation(reservation.paymentMethod) && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            {getPaymentMethodTranslation(reservation.paymentMethod)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewReservation(reservation)}
                            sx={{ color: theme.palette.info.main }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          
                          {reservation.status === 'pending' && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenActionDialog(reservation, 'confirm')}
                                sx={{ color: theme.palette.success.main }}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                              
                              <IconButton
                                size="small"
                                onClick={() => handleOpenActionDialog(reservation, 'cancel')}
                                sx={{ color: theme.palette.error.main }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          
                          {reservation.paymentStatus === 'pending' && user?.role === 'employee' && (
                            <IconButton
                              size="small"
                              onClick={() => handleCashPayment(reservation.id)}
                              sx={{ color: theme.palette.success.main }}
                              title="Paiement en espèces"
                            >
                              <CashIcon fontSize="small" />
                            </IconButton>
                          )}
                          
                          {/* Bouton de validation de paiement pour les admins quand le paiement est en attente */}
                          {reservation.paymentStatus === 'pending' && (user?.role === 'super_admin' || user?.role === 'admin') && (
                            <IconButton
                              size="small"
                              onClick={() => handleValidatePayment(reservation.id)}
                              sx={{ color: theme.palette.warning.main }}
                              title="Valider le paiement"
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {reservations.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    {t('admin.reservations.noReservations')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={reservations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('admin.common.rowsPerPage')}
        />
      </Paper>

      {/* Dialog de confirmation d'action */}
      <Dialog
        open={actionDialogOpen}
        onClose={handleCloseActionDialog}
      >
        <DialogTitle>
          {actionType === 'confirm' 
            ? t('admin.reservations.confirmTitle') 
            : t('admin.reservations.cancelTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === 'confirm' 
              ? t('admin.reservations.confirmMessage')
              : t('admin.reservations.cancelMessage')}
          </DialogContentText>
          {selectedReservation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                {t('admin.reservations.details')}:
              </Typography>
              <Typography variant="body2">
                {`${t('admin.reservations.client')}: ${selectedReservation.user.firstName} ${selectedReservation.user.lastName}`}
              </Typography>
              <Typography variant="body2">
                {`${t('admin.reservations.field')}: ${selectedReservation.field.name}`}
              </Typography>
              <Typography variant="body2">
                {`${t('admin.reservations.date')}: ${formatDate(selectedReservation.startTime)}`}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActionDialog} color="primary">
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            color={actionType === 'confirm' ? 'success' : 'error'} 
            variant="contained"
          >
            {actionType === 'confirm' ? t('common.confirm') : t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de détails de réservation */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
      >
        <DialogTitle>
          {t('admin.reservations.detailsTitle')}
        </DialogTitle>
        <DialogContent>
          {reservationDetails && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                {t('admin.reservations.details')}:
              </Typography>
              <Typography variant="body2">
                {`${t('admin.reservations.client')}: ${reservationDetails.user.firstName} ${reservationDetails.user.lastName}`}
              </Typography>
              <Typography variant="body2">
                {`${t('admin.reservations.field')}: ${reservationDetails.field.name}`}
              </Typography>
              <Typography variant="body2">
                {`${t('admin.reservations.date')}: ${formatDate(reservationDetails.startTime)}`}
              </Typography>
              <Typography variant="body2">
                {`${t('admin.reservations.duration')}: ${calculateDuration(reservationDetails.startTime, reservationDetails.endTime)}`}
              </Typography>
              <Typography variant="body2">
                {`${t('admin.reservations.price')}: ${reservationDetails.price.toLocaleString()} FCFA`}
              </Typography>
              <Typography variant="body2">
                {`${t('admin.reservations.statusLabel')}: ${getStatusTranslation(reservationDetails.status)}`}
              </Typography>
              <Typography variant="body2">
                {`${t('admin.reservations.payment')}: ${getPaymentMethodTranslation(reservationDetails.paymentMethod)}`}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)} color="primary">
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminReservations;
