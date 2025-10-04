import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Container,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Event from '@mui/icons-material/Event';
import AccessTime from '@mui/icons-material/AccessTime';
import Person from '@mui/icons-material/Person';
import Payments from '@mui/icons-material/Payments';
import { useAuth } from '../../contexts';
import { SnackbarProvider, useSnackbar } from 'notistack';
import api from '../../services/api';

// Types
interface Field {
  id: string;
  name: string;
  location: string;
  size: string;
  indoor: boolean;
  surface: string;
  pricePerHour: number;
  equipmentFee: number;
  imageUrl: string | null;
  description: string;
}

interface TimeSlot {
  id: string;
  field_id: string;
  datefrom: string;
  dateto: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  timeSlots: TimeSlot[];
}

interface BookingData {
  timeSlotId: string;
  numberOfPeople: number;
  equipmentRental: boolean;
  paymentMethod: string;
}

const CalendarBookingPageContent = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth && auth.user;
  const { enqueueSnackbar } = useSnackbar();

  // États
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // États du calendrier
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // États de réservation
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reservedHours, setReservedHours] = useState<string[]>([]);
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wave');
  const [equipmentRental, setEquipmentRental] = useState(false);

  // Générer les années (année actuelle + 1 an)
  const years = Array.from({ length: 2 }, (_, i) => new Date().getFullYear() + i);
  
  // Mois
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Charger les données du terrain
  useEffect(() => {
    const loadField = async () => {
      if (!id) {
        setError('ID du terrain manquant');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/fields/${id}`);
        const fieldData = response.data;
        setField({
          id: fieldData.id,
          name: fieldData.name,
          location: fieldData.location,
          size: fieldData.size,
          indoor: fieldData.indoor,
          surface: fieldData.surface_type,
          pricePerHour: fieldData.price_per_hour,
          equipmentFee: fieldData.equipment_fee,
          imageUrl: fieldData.image_url,
          description: fieldData.description
        });
        setLoading(false);
      } catch (error: unknown) {
        setLoading(false);
        setError(error instanceof Error ? error.message : "Erreur lors du chargement des données du terrain");
        console.error("Erreur lors du chargement des données du terrain", error);
      }
    };

    loadField();
  }, [id]);

  // Charger les créneaux disponibles
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!id) return;

      try {
        setLoadingSlots(true);
        const response = await api.get(`/fields/${id}/availability`);
        if (response.data.success) {
          setTimeSlots(response.data.data);
          
          // Mettre à jour les informations du terrain depuis l'API availability
          if (response.data.field) {
            setField({
              id: response.data.field.id,
              name: response.data.field.name,
              location: field?.location || '',
              size: field?.size || '',
              indoor: field?.indoor || false,
              surface: field?.surface || '',
              pricePerHour: response.data.field.price_per_hour,
              equipmentFee: field?.equipmentFee || 0,
              imageUrl: field?.imageUrl || '',
              description: field?.description || ''
            });
          }
        }
      } catch (error: unknown) {
        console.error("Erreur lors du chargement des créneaux", error);
        enqueueSnackbar('Erreur lors du chargement des créneaux', { variant: 'error' });
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchTimeSlots();
  }, [id, enqueueSnackbar]);

  // Générer le calendrier avec les créneaux disponibles
  const generateCalendar = () => {
    const year = selectedYear;
    const month = selectedMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      // Éviter le décalage UTC en formatant manuellement la date
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const isCurrentMonth = currentDate.getMonth() === month;
      
      // Vérifier si la date est passée
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const isPastDate = dateStr < todayStr;
      
      // Filtrer les créneaux pour cette date
      const matchingSlots = timeSlots.filter(slot => {
        const slotFromDate = slot.datefrom.split('T')[0];
        const slotToDate = slot.dateto.split('T')[0];
        return dateStr >= slotFromDate && dateStr <= slotToDate;
      });

      // Trier par updated_at décroissant et prendre le plus récent pour chaque date
      const sortedSlots = matchingSlots.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      // Prendre seulement le créneau le plus récent s'il y a des chevauchements
      const dayTimeSlots = sortedSlots.length > 0 ? [sortedSlots[0]] : [];
      
      calendar.push({
        date: new Date(currentDate),
        dateStr,
        isCurrentMonth,
        isPastDate,
        timeSlots: dayTimeSlots
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return calendar;
  };

  // Navigation du calendrier
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // Gérer la sélection d'un créneau
  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setSelectedHour(''); // Reset hour selection
    setBookingDialogOpen(true);
  };

  // Ouvrir le résumé de réservation
  const handleBookingConfirm = () => {
    if (!selectedTimeSlot || !selectedHour || !user) return;
    setBookingDialogOpen(false);
    setSummaryDialogOpen(true);
  };

  // Confirmer le paiement et créer la réservation
  const handlePaymentConfirm = async () => {
    if (!selectedTimeSlot || !selectedHour || !user || !selectedDate) return;

    try {
      // Utiliser la date sélectionnée par l'utilisateur (format local pour éviter décalage UTC)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const reservationDate = `${year}-${month}-${day}`;
      
      // Utiliser l'API de réservation avec paiement
      const reservationData = {
        field_id: id,
        time_slot_id: selectedTimeSlot.id,
        reservation_date: reservationDate,
        start_time: selectedHour,
        equipment_rental: equipmentRental,
        payment_method: paymentMethod,
        promo_code: null
      };

      const response = await api.post('/reservations/with-payment', reservationData);

      if (response.data && response.data.success) {
        // Si c'est Wave et qu'on a une URL de paiement, ouvrir l'URL
        if (paymentMethod === 'wave' && response.data.payment_url) {
          enqueueSnackbar('Redirection vers Wave pour le paiement...', { variant: 'info' });
          // Ouvrir l'URL Wave dans un nouvel onglet
          window.open(response.data.payment_url, '_blank');
        } else if (paymentMethod === 'cash') {
          enqueueSnackbar('Réservation confirmée! Paiement en espèces à effectuer sur place.', { variant: 'success' });
        } else {
          enqueueSnackbar('Réservation confirmée avec succès!', { variant: 'success' });
        }
        
        setSummaryDialogOpen(false);
        navigate('/reservations');
      } else {
        enqueueSnackbar(response.data?.message || 'Erreur lors de la réservation', { variant: 'error' });
      }
    } catch (error: any) {
      console.error('Erreur lors de la réservation:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la réservation';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  // Vérifier les créneaux réservés pour une date spécifique
  const checkReservedHours = async (date: Date) => {
    if (!id || !date) return;
    
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      console.log('Vérification des créneaux réservés pour:', dateStr);
      
      // Appel direct à l'API des réservations pour ce terrain et cette date
      const response = await api.get(`/reservations/field/${id}/date/${dateStr}`);
      
      if (response.data.success) {
        const reserved = response.data.data.map((reservation: any) => {
          const startTime = reservation.start_time.substring(0, 5); // "14:00:00" -> "14:00"
          console.log('Créneau réservé trouvé:', startTime);
          return startTime;
        });
        
        console.log('Créneaux réservés pour', dateStr, ':', reserved);
        setReservedHours(reserved);
      } else {
        console.log('Aucune réservation trouvée pour cette date');
        setReservedHours([]);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des créneaux réservés:', error);
      // Fallback: essayer avec l'ancienne API
      try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const fallbackDateStr = `${year}-${month}-${day}`;
        
        const fallbackResponse = await api.get(`/fields/${id}/availability?date=${fallbackDateStr}`);
        if (fallbackResponse.data.success) {
          const reserved = fallbackResponse.data.data
            .filter((slot: any) => slot.isReserved)
            .map((slot: any) => slot.start_time.substring(0, 5));
          setReservedHours(reserved);
        }
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
        setReservedHours([]);
      }
    }
  };

  // Générer les créneaux horaires disponibles pour un jour donné
  const generateAvailableHours = (timeSlot: any) => {
    if (!timeSlot) return [];
    
    const startTime = timeSlot.start_time; // ex: "10:00:00"
    const endTime = timeSlot.end_time;     // ex: "15:00:00"
    
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    
    const availableHours = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const hourStr = `${hour.toString().padStart(2, '0')}:00`;
      const nextHourStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const isReserved = reservedHours.includes(hourStr);
      
      availableHours.push({
        value: `${hourStr}-${nextHourStr}`,
        label: `${hourStr} - ${nextHourStr}`,
        isReserved: isReserved
      });
    }
    
    return availableHours;
  };

  // Calculer le prix total (1 heure de réservation)
  const calculateTotalPrice = (): number => {
    console.log('calculateTotalPrice called:', { field, selectedHour, selectedTimeSlot });
    
    if (!field) {
      console.log('No field found');
      return 0;
    }
    
    // Pour la popup de résumé, on affiche le prix même sans selectedHour
    if (!selectedTimeSlot && !summaryDialogOpen) {
      console.log('No timeSlot selected');
      return 0;
    }
    
    // Prix pour 1 heure de réservation depuis la table fields
    const pricePerHour = field.pricePerHour || 0;
    console.log('Price per hour:', pricePerHour);
    
    let total = pricePerHour;
    if (equipmentRental) {
      const equipmentFee = field.equipmentFee || (field as any).equipment_fee || 0;
      total += equipmentFee;
      console.log('Equipment fee added:', equipmentFee);
    }
    
    console.log('Total calculated:', total);
    return total;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !field) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Erreur lors du chargement'}
          </Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/fields/${id}`)}
          >
            Retour
          </Button>
        </Box>
      </Container>
    );
  }

  const calendar = generateCalendar();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* En-tête */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/fields/${id}`)}
            sx={{ mr: 2 }}
          >
            Retour
          </Button>
          <Typography variant="h4" component="h1">
            Réserver {field.name}
          </Typography>
        </Box>

        {/* Informations du terrain */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#4caf50', color: 'white' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            {field.name}
          </Typography>
          <Typography variant="h6">
            Prix: {field.pricePerHour?.toLocaleString()} FCFA / heure
          </Typography>
        </Paper>

        {/* Filtres */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtres de date
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Année</InputLabel>
              <Select
                value={selectedYear}
                label="Année"
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Mois</InputLabel>
              <Select
                value={selectedMonth}
                label="Mois"
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {months.map((month, index) => (
                  <MenuItem key={index} value={index}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => navigateMonth('prev')}>
                <ChevronLeft />
              </IconButton>
              <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                {months[selectedMonth]} {selectedYear}
              </Typography>
              <IconButton onClick={() => navigateMonth('next')}>
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* Calendrier */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Disponibilités
          </Typography>
          
          {loadingSlots ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* En-têtes des jours */}
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                  <Box key={day} sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" align="center" sx={{ fontWeight: 'bold', p: 1 }}>
                      {day}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Grille du calendrier */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {calendar.map((day, index) => (
                  <Box key={index} sx={{ width: 'calc(14.28% - 6px)' }}>
                    <Card 
                      sx={{ 
                        minHeight: 100,
                        opacity: day.isCurrentMonth ? 1 : 0.5,
                        backgroundColor: day.isPastDate 
                          ? 'grey.300' 
                          : day.timeSlots.length > 0 
                            ? 'success.light' 
                            : 'grey.100',
                        cursor: day.isPastDate 
                          ? 'not-allowed' 
                          : day.timeSlots.length > 0 
                            ? 'pointer' 
                            : 'default',
                        filter: day.isPastDate ? 'grayscale(100%)' : 'none',
                        pointerEvents: day.isPastDate ? 'none' : 'auto'
                      }}
                      onClick={async () => {
                        if (!day.isPastDate && day.timeSlots.length > 0) {
                          setSelectedDate(day.date);
                          setSelectedTimeSlot(day.timeSlots[0]);
                          await checkReservedHours(day.date);
                          setBookingDialogOpen(true);
                        }
                      }}
                    >
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="body2" align="center" sx={{ fontWeight: 'bold' }}>
                          {day.date.getDate()}
                        </Typography>
                        
                        {day.timeSlots.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {day.timeSlots.slice(0, 2).map(slot => (
                              <Chip
                                key={slot.id}
                                label={`${slot.start_time}-${slot.end_time}`}
                                size="small"
                                color="primary"
                                sx={{ 
                                  fontSize: '0.7rem', 
                                  height: 20, 
                                  mb: 0.5,
                                  display: 'block'
                                }}
                                onClick={() => handleTimeSlotSelect(slot)}
                              />
                            ))}
                            {day.timeSlots.length > 2 && (
                              <Typography variant="caption" align="center" display="block">
                                +{day.timeSlots.length - 2} autres
                              </Typography>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Paper>

        {/* Dialog de réservation */}
        <Dialog 
          open={bookingDialogOpen} 
          onClose={() => setBookingDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Confirmer la réservation
          </DialogTitle>
          <DialogContent>
            {selectedTimeSlot && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Détails du créneau
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Event sx={{ mr: 1 }} />
                  <Typography>
                    {new Date(selectedTimeSlot.datefrom).toLocaleDateString()} - {new Date(selectedTimeSlot.dateto).toLocaleDateString()}
                  </Typography>
                </Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Créneau horaire</InputLabel>
                  <Select
                    value={selectedHour}
                    label="Créneau horaire"
                    onChange={(e) => setSelectedHour(e.target.value)}
                  >
                    {generateAvailableHours(selectedTimeSlot).map((hour) => (
                      <MenuItem 
                        key={hour.value} 
                        value={hour.value}
                        disabled={hour.isReserved}
                        sx={{
                          color: hour.isReserved ? 'text.disabled' : 'text.primary',
                          backgroundColor: hour.isReserved ? 'action.disabledBackground' : 'transparent',
                          '&:hover': {
                            backgroundColor: hour.isReserved ? 'action.disabledBackground' : 'action.hover'
                          }
                        }}
                      >
                        {hour.label} {hour.isReserved ? '(Réservé)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Informations du client */}
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Informations du client
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1 }} />
                  <Typography>
                    {(user as any)?.first_name} {(user as any)?.last_name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Téléphone: {(user as any)?.phone_number || 'Non renseigné'}
                  </Typography>
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Méthode de paiement</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Méthode de paiement"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="card">Carte bancaire</MenuItem>
                    <MenuItem value="wave">Wave</MenuItem>
                    <MenuItem value="orange_money">Orange Money</MenuItem>
                    <MenuItem value="cash">Espèces</MenuItem>
                  </Select>
                </FormControl>

                {calculateTotalPrice() > 0 && (
                  <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="h6">
                      Prix total: {calculateTotalPrice().toLocaleString()} FCFA
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBookingDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleBookingConfirm}
              variant="contained"
              disabled={!selectedTimeSlot}
            >
              Confirmer la réservation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de résumé de réservation */}
        <Dialog open={summaryDialogOpen} onClose={() => setSummaryDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Résumé de votre réservation
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              {/* Informations du terrain */}
              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', mb: 3 }}>
                {field?.name || 'Terrain sélectionné'}
              </Typography>
              
              {/* Date et heure */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Event sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  {selectedDate && selectedDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  {selectedHour}
                </Typography>
              </Box>
              
              {/* Client */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  {(user as any)?.first_name} {(user as any)?.last_name}
                </Typography>
              </Box>
              
              {/* Méthode de paiement */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Payments sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  {paymentMethod === 'wave' ? 'Wave' : 
                   paymentMethod === 'orange_money' ? 'Orange Money' :
                   paymentMethod === 'card' ? 'Carte bancaire' : 'Espèces'}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Prix total */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Total à payer:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {calculateTotalPrice().toLocaleString()} FCFA
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setSummaryDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handlePaymentConfirm}
              variant="contained"
              size="large"
              sx={{ minWidth: 120 }}
            >
              Payer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

// Wrapper avec SnackbarProvider
const CalendarBookingPage: React.FC = () => {
  return (
    <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
      <CalendarBookingPageContent />
    </SnackbarProvider>
  );
};

export default CalendarBookingPage;
