import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Pagination
} from '@mui/material';
import {
  Event,
  AccessTime,
  LocationOn,
  Delete,
  Edit,
  SportsSoccer,
  Info,
  Check,
  Cancel,
  Receipt
} from '@mui/icons-material';
import { reservationAPI } from '../../services/api';
import { useAuth } from '../../contexts';

// Types
interface Reservation {
  id: string;
  field_id: string;
  field: {
    id: string;
    name: string;
    location: string;
    imageUrl?: string;
  };
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Composant pour les onglets
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reservations-tabpanel-${index}`}
      aria-labelledby={`reservations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const ReservationsList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Chargement des réservations
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Déterminer le statut à filtrer selon l'onglet actif
        let statusFilter = '';
        switch (tabValue) {
          case 0: // Upcoming
            statusFilter = 'upcoming';
            break;
          case 1: // Past
            statusFilter = 'past';
            break;
          case 2: // Cancelled
            statusFilter = 'cancelled';
            break;
          default:
            statusFilter = 'upcoming';
        }
        
        const response = await reservationAPI.getUserReservations({ status: statusFilter, page });
        setReservations(response.data.data);
        setTotalPages(Math.ceil(response.data.total / response.data.perPage));
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError(t('common.unexpectedError'));
        console.error('Error fetching reservations:', err);
      }
    };

    fetchReservations();
  }, [tabValue, page, t]);

  // Gestion du changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1); // Réinitialiser la pagination lors du changement d'onglet
  };

  // Ouverture de la boîte de dialogue d'annulation
  const handleCancelClick = (reservationId: string) => {
    setReservationToCancel(reservationId);
    setCancelDialogOpen(true);
  };

  // Annulation d'une réservation
  const confirmCancelReservation = async () => {
    if (!reservationToCancel) return;
    
    try {
      await reservationAPI.cancelReservation(reservationToCancel);
      // Mettre à jour la liste après l'annulation
      setReservations(prevReservations => 
        prevReservations.map(res => 
          res.id === reservationToCancel 
            ? { ...res, status: 'cancelled' } 
            : res
        )
      );
      setCancelDialogOpen(false);
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      setError(t('reservations.cancelError'));
    }
  };

  // Formater la date et l'heure
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Affichage du loader pendant le chargement
  if (loading && reservations.length === 0) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Obtention des réservations filtrées selon l'onglet actif
  const getFilteredReservations = () => {
    switch (tabValue) {
      case 0: // Upcoming
        return reservations.filter(res => res.status !== 'cancelled' && res.status !== 'completed');
      case 1: // Past
        return reservations.filter(res => res.status === 'completed');
      case 2: // Cancelled
        return reservations.filter(res => res.status === 'cancelled');
      default:
        return reservations;
    }
  };

  // Rendu des cartes de réservation
  const renderReservations = () => {
    const filteredReservations = getFilteredReservations();
    
    if (filteredReservations.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          {tabValue === 0 && t('reservations.noUpcoming')}
          {tabValue === 1 && t('reservations.noPast')}
          {tabValue === 2 && t('reservations.noCancelled')}
        </Alert>
      );
    }

    return filteredReservations.map(reservation => (
      <Card key={reservation.id} sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {/* Image du terrain */}
            <Box sx={{ flex: { xs: '0 0 100%', sm: '0 0 calc(25% - 8px)' } }}>
              <Box 
                component="img"
                src={reservation.field.imageUrl || '/images/field-placeholder.jpg'}
                alt={reservation.field.name}
                sx={{ 
                  width: '100%', 
                  height: 120, 
                  objectFit: 'cover',
                  borderRadius: 1
                }}
              />
            </Box>
            
            {/* Informations de réservation */}
            <Box sx={{ flex: { xs: '0 0 100%', sm: '0 0 calc(75% - 8px)' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" gutterBottom>
                  {reservation.field.name}
                </Typography>
                <Chip 
                  label={
                    reservation.status === 'confirmed' 
                      ? t('reservations.confirmed') 
                      : reservation.status === 'cancelled'
                        ? t('reservations.cancelled')
                        : reservation.status === 'completed'
                          ? t('reservations.completed')
                          : t('reservations.pending')
                  } 
                  color={
                    reservation.status === 'confirmed' 
                      ? 'success' 
                      : reservation.status === 'cancelled'
                        ? 'error'
                        : reservation.status === 'completed'
                          ? 'default'
                          : 'warning'
                  }
                  size="small"
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOn fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">{reservation.field.location}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {reservation.reservation_date ? new Date(reservation.reservation_date).toLocaleDateString('fr-FR') : 'Date non définie'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTime fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {reservation.start_time || 'N/A'} - {reservation.end_time || 'N/A'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="body1" fontWeight="bold">
                  {reservation.total_price ? Number(reservation.total_price).toLocaleString() : '0'} FCFA
                </Typography>
                <Chip 
                  label={
                    reservation.payment_status === 'paid' 
                      ? t('reservations.paid') 
                      : reservation.payment_status === 'refunded'
                        ? t('reservations.refunded')
                        : t('reservations.pendingPayment')
                  } 
                  color={
                    reservation.payment_status === 'paid' 
                      ? 'success' 
                      : reservation.payment_status === 'refunded'
                        ? 'info'
                        : 'warning'
                  }
                  size="small"
                  icon={
                    reservation.payment_status === 'paid' 
                      ? <Check fontSize="small" /> 
                      : reservation.payment_status === 'refunded'
                        ? <Receipt fontSize="small" />
                        : <Info fontSize="small" />
                  }
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
          {/* Options disponibles selon le statut */}
          {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
            <>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => handleCancelClick(reservation.id)}
              >
                {t('reservations.cancel')}
              </Button>
              
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<SportsSoccer />}
                onClick={() => navigate(`/fields/${reservation.field_id}`)}
              >
                {t('reservations.fieldDetails')}
              </Button>
            </>
          )}
          
          {(reservation.status === 'cancelled' || reservation.status === 'completed') && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<SportsSoccer />}
              onClick={() => navigate(`/fields/${reservation.field_id}`)}
            >
              {t('reservations.fieldDetails')}
            </Button>
          )}
        </CardActions>
      </Card>
    ));
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('reservations.title')}
        </Typography>
        
        {/* Affichage des erreurs */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Onglets pour filtrer les réservations */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="reservations tabs"
          >
            <Tab label={t('reservations.upcoming')} id="reservations-tab-0" />
            <Tab label={t('reservations.past')} id="reservations-tab-1" />
            <Tab label={t('reservations.cancelled')} id="reservations-tab-2" />
          </Tabs>
        </Box>
        
        {/* Contenu des onglets */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderReservations()
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderReservations()
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderReservations()
          )}
        </TabPanel>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
        
        {/* Appel à l'action pour explorer les terrains */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SportsSoccer />}
            onClick={() => navigate('/fields')}
          >
            {t('reservations.exploreFields')}
          </Button>
        </Box>
      </Box>
      
      {/* Boîte de dialogue de confirmation d'annulation */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>{t('reservations.confirmCancellation')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('reservations.cancellationWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            {t('common.no')}
          </Button>
          <Button onClick={confirmCancelReservation} color="error" autoFocus>
            {t('common.yes')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReservationsList;
