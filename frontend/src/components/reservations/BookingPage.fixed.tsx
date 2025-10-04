import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Container,
  Alert,
  CardMedia,
  Divider,
  InputAdornment,
  Tooltip,
  IconButton,
  FormHelperText,
  Paper,
  Radio,
  RadioGroup,
  FormLabel,
  SelectChangeEvent
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import PaymentMethodSelection from '../payments/PaymentMethodSelection';
import { fieldAPI, reservationAPI, paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts';
import { SnackbarProvider, useSnackbar } from 'notistack';

// Types pour le composant
interface Field {
  id: string; // UUID v4
  name: string;
  location: string;
  size: string;
  indoor: boolean;
  surface: string;
  pricePerHour: number;
  equipmentFee: number;
  imageUrl: string | null; // Ajout de la possibilité de null
  description: string;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

interface PaymentMethod {
  id: string; // UUID v4
  name: string;
  logoUrl: string;
}

interface BookingFormValues {
  date: Date | null;
  startTime: string | null;
  duration: number;
  numberOfPeople: number;
  equipmentRental: boolean;
  paymentMethod: string;
  termsAccepted: boolean;
}

// Composant pour afficher un champ avec erreur
const ErrorField: React.FC<{
  children: React.ReactNode;
  error?: boolean;
  helperText?: string | null;
}> = ({ children, error, helperText }) => {
  if (!error) return null;
  return (
    <Typography variant="caption" color="error">
      {helperText}
    </Typography>
  );
};

const BookingPageContent = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth && auth.user; // Récupérer l'utilisateur actuel
  const { enqueueSnackbar } = useSnackbar(); // Hook de notification

  // États pour gérer les données et le chargement
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Validation schema avec Yup
  const validationSchema = Yup.object({
    date: Yup.date().nullable().required(t('booking.dateRequired')),
    startTime: Yup.string().when('date', {
      is: (date: Date | null) => !!date,
      then: () => Yup.string().required(t('booking.startTimeRequired')),
      otherwise: () => Yup.string().nullable()
    }),
    duration: Yup.number()
      .required(t('booking.durationRequired'))
      .min(1, t('booking.durationMin'))
      .max(3, t('booking.durationMax')),
    numberOfPeople: Yup.number()
      .required(t('booking.peopleRequired'))
      .min(2, t('booking.peopleMin'))
      .max(22, t('booking.peopleMax')),
    equipmentRental: Yup.boolean().default(false),
    paymentMethod: Yup.string()
      .required(t('booking.paymentMethodRequired')),
    termsAccepted: Yup.boolean().oneOf([true], t('booking.termsRequired')),
  });

  // Étapes de réservation
  const steps = [
    t('booking.selectDateTime'),
    t('booking.paymentDetails'),
    t('booking.confirmation')
  ];

  // Initialiser le formulaire avec Formik
  const formik = useFormik<BookingFormValues>({
    initialValues: {
      date: null,
      startTime: '',
      duration: 1,
      numberOfPeople: 2,
      equipmentRental: false,
      paymentMethod: 'card',
      termsAccepted: false,
    },
    validationSchema,
    onSubmit: async (values: BookingFormValues) => {
      if (activeStep === 1) {
        setPaymentDialogOpen(true);
      }
    },
  });

  // Simuler la fonction getAvailableSlots qui sera à terme implémentée côté backend
  const getAvailableSlots = async (fieldId: string, date: string): Promise<TimeSlot[]> => {
    try {
      // Ceci est un contournement temporaire en attendant l'implémentation de l'API
      // Pour le moment, nous simulons les créneaux disponibles avec des ids UUID
      console.log(`Récupération des créneaux pour ${fieldId} le ${date}`);

      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));

      // Générer des créneaux fictifs avec UUID v4 pour la démonstration
      return [
        { id: '123e4567-e89b-12d3-a456-426614174000', startTime: '08:00', endTime: '09:00', available: true },
        { id: '123e4567-e89b-12d3-a456-426614174001', startTime: '09:00', endTime: '10:00', available: true },
        { id: '123e4567-e89b-12d3-a456-426614174002', startTime: '10:00', endTime: '11:00', available: true },
        { id: '123e4567-e89b-12d3-a456-426614174003', startTime: '11:00', endTime: '12:00', available: false },
        { id: '123e4567-e89b-12d3-a456-426614174004', startTime: '12:00', endTime: '13:00', available: true },
        { id: '123e4567-e89b-12d3-a456-426614174005', startTime: '13:00', endTime: '14:00', available: true },
        { id: '123e4567-e89b-12d3-a456-426614174006', startTime: '14:00', endTime: '15:00', available: false },
        { id: '123e4567-e89b-12d3-a456-426614174007', startTime: '15:00', endTime: '16:00', available: true },
        { id: '123e4567-e89b-12d3-a456-426614174008', startTime: '16:00', endTime: '17:00', available: true },
        { id: '123e4567-e89b-12d3-a456-426614174009', startTime: '17:00', endTime: '18:00', available: true },
        { id: '123e4567-e89b-12d3-a456-426614174010', startTime: '18:00', endTime: '19:00', available: true },
        { id: '123e4567-e89b-12d3-a456-426614174011', startTime: '19:00', endTime: '20:00', available: false },
        { id: '123e4567-e89b-12d3-a456-426614174012', startTime: '20:00', endTime: '21:00', available: true },
        { id: '123e4567-e89b-12d3-a456-426614174013', startTime: '21:00', endTime: '22:00', available: true },
      ];
    } catch (error: unknown) {
      console.error("Erreur lors de la récupération des créneaux disponibles", error);
      return [];
    }
  };

  // Chargement des terrains et créneaux disponibles
  useEffect(() => {
    const loadField = async () => {
      if (!id) {
        setError(t('booking.errorNoField'));
        setLoading(false);
        return;
      }

      try {
        const response = await fieldAPI.getFieldById(id);
        setField(response.data);
      } catch (error: unknown) {
        setLoading(false);
        setError(error instanceof Error ? error.message : "Erreur lors du chargement des données du terrain");
        console.error("Erreur lors du chargement des données du terrain", error);
      }
    };

    loadField();
  }, [id, t]);

  // Chargement des créneaux disponibles lorsqu'une date est sélectionnée
  useEffect(() => {
    const fetchSlots = async () => {
      if (!id || !formik.values.date) return;

      try {
        setLoadingSlots(true);
        const formattedDate = formik.values.date.toISOString().split('T')[0]; // Format YYYY-MM-DD
        const slotsData = await getAvailableSlots(id, formattedDate);
        setTimeSlots(slotsData);
      } catch (error: unknown) {
        console.error("Erreur lors du chargement des créneaux", error);
        enqueueSnackbar(
          error instanceof Error ? error.message : t('booking.errorLoadingSlots'), 
          { variant: 'error' }
        );
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [id, formik.values.date, enqueueSnackbar, t]);

  // Gestion de la navigation entre les étapes
  const handlePreviousStep = (): void => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleNextStep = (): void => {
    if (activeStep === 0 && formik.values.date && formik.values.startTime) {
      setActiveStep(1);
    } else if (activeStep === 1 && formik.values.paymentMethod) {
      setPaymentDialogOpen(true);
    }
  };

  // Retour à l'étape précédente
  // Le handleBack est remplacé par handlePreviousStep plus haut

  // Validation de la première étape
  const validateFirstStep = () => {
    // Valider la première étape avant de passer à la suivante
    const errors: Record<string, boolean> = {};
    ['date', 'startTime', 'duration', 'numberOfPeople'].forEach(field => {
      try {
        validationSchema.validateSyncAt(field, formik.values);
      } catch (error) {
        errors[field] = true;
      }
    });

    if (Object.keys(errors).length === 0) {
      setActiveStep(prevStep => prevStep + 1);
    } else {
      formik.validateForm();
    }
  };

  // Gérer le changement de créneau horaire
  const handleTimeSlotChange = (event: SelectChangeEvent) => {
    formik.setFieldValue('startTime', event.target.value);
  };

  // Gérer le changement de nombre de participants
  const handlePeopleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    formik.setFieldValue('numberOfPeople', parseInt(e.target.value, 10));
  };

  // Gérer le changement de durée
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    formik.setFieldValue('duration', parseInt(e.target.value, 10));
  };

  // Gérer le changement de réservation
  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    formik.setFieldValue(name, value);
  };

  // Handler pour le changement de méthode de paiement
  const handlePaymentMethodChange = (method: string): void => {
    formik.setFieldValue('paymentMethod', method);
    console.log(`Méthode de paiement sélectionnée: ${method}`);
  };

  // Gérer le changement d'équipement
  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const isChecked = e.target.checked;
    formik.setFieldValue('equipmentRental', isChecked);
    // Recalcule le prix total après avoir modifié l'équipement
    if (field) {
      const newTotal = calculateTotalPrice();
      console.log(`Nouveau prix total après changement d'équipement: ${newTotal}`);
    }
  };

  // Gérer le changement de date
  const handleDateChange = (date: Date | null): void => {
    formik.setFieldValue('date', date);
  };

  // Fonction pour calculer l'heure de fin
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    if (!startTime) return '00:00';

    const [hours, minutes] = startTime.split(':').map(Number);

    let totalMinutes = hours * 60 + minutes + (durationMinutes * 60); // Conversion en minutes
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  // Gestion de l'envoi du formulaire
  const handleSubmit = async (values: BookingFormValues) => {
    if (activeStep === 1) {
      setPaymentDialogOpen(true);
    }
  };

  // Confirmation de réservation
  const handleConfirmBooking = async () => {
    if (!id || !formik.values.date || !formik.values.startTime) return;

    try {
      setPaymentDialogOpen(false);
      setLoading(true);
      setBookingError(null);

      // Préparer les données de réservation
      const startDateTime = new Date(`${formik.values.date.toISOString().split('T')[0]}T${formik.values.startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + formik.values.duration * 60 * 60 * 1000);

      const response = await reservationAPI.createReservation({
        fieldId: id,
        date: formik.values.date?.toISOString().split('T')[0] || '',
        startTime: formik.values.startTime || '',
        duration: formik.values.duration,
        numberOfPeople: formik.values.numberOfPeople,
        equipmentRental: formik.values.equipmentRental,
        paymentMethod: formik.values.paymentMethod,
        total: calculateTotalPrice(),
        userId: user?.id || ''
      });
      setBookingId(response.data.data.id);
      setBookingSuccess(true);
      setActiveStep(2);
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      setBookingSuccess(false);
      setBookingError(error instanceof Error ? error.message : t('booking.bookingError'));
      console.error('Error creating reservation:', error);
    }
  };

  // Traitement du paiement après validation
  const handlePayment = async (): Promise<void> => {
    try {
      // Utiliser initiatePayment au lieu de processPayment qui n'existe pas
      const paymentResult = await paymentAPI.initiatePayment({
        amount: calculateTotalPrice(),
        method: formik.values.paymentMethod,
        reservationId: bookingId,
      });
      console.log('Paiement initié avec succès:', paymentResult);
    } catch (error: unknown) {
      console.error('Erreur lors du paiement:', error);
      setPaymentError(error instanceof Error ? error.message : t('booking.paymentError'));
    }
  };

  // Calculer le prix total de la réservation
  const calculateTotalPrice = (): number => {
    if (!field || !formik.values.duration) return 0;
    let total = field.pricePerHour * formik.values.duration;
    if (formik.values.equipmentRental && field.equipmentFee !== undefined) {
      total += field.equipmentFee;
    }
    return total;
  };

  // Contenu des étapes
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('booking.selectDateTimeTitle')}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: { xs: '0 0 100%', md: '0 0 calc(50% - 12px)' } }}>
                <TextField
                  type="date"
                  name="date"
                  label={t('booking.date')}
                  fullWidth
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    handleDateChange(date);
                  }}
                  value={formik.values.date ? formik.values.date.toISOString().split('T')[0] : ''}
                  error={formik.touched.date && Boolean(formik.errors.date)}
                  helperText={formik.touched.date && formik.errors.date ? String(formik.errors.date) : undefined}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
              </Box>

              <Box sx={{ flex: { xs: '0 0 100%', md: '0 0 calc(50% - 12px)' } }}>
                <FormControl fullWidth error={formik.touched.startTime && Boolean(formik.errors.startTime)}>
                  <InputLabel id="time-slot-label">{t('booking.startTime')}</InputLabel>
                  <Select
                    labelId="time-slot-label"
                    id="time-slot"
                    value={formik.values.startTime || ''}
                    label={t('booking.startTime')}
                    onChange={handleTimeSlotChange}
                    disabled={!formik.values.date || timeSlots.length === 0 || loadingSlots}
                  >
                    {timeSlots.map((slot) => (
                      <MenuItem
                        key={slot.id}
                        value={slot.startTime}
                        disabled={!slot.available}
                      >
                        {slot.startTime} - {slot.endTime}
                        {!slot.available && ` (${t('booking.notAvailable')})`}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.startTime && formik.errors.startTime && (
                    <FormHelperText>{String(formik.errors.startTime)}</FormHelperText>
                  )}
                </FormControl>
              </Box>

              <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: '48%' }, mt: 3 }}>
                <TextField
                  label={t('booking.duration')}
                  type="number"
                  fullWidth
                  value={formik.values.duration}
                  onChange={handleDurationChange}
                  name="duration"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{t('booking.hours')}</InputAdornment>,
                  }}
                  inputProps={{ min: 1, max: 5 }}
                  error={formik.touched.duration && Boolean(formik.errors.duration)}
                  helperText={formik.touched.duration && formik.errors.duration ? String(formik.errors.duration) : undefined}
                />
              </Box>

              <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: '48%' }, mt: 3 }}>
                <TextField
                  label={t('booking.numberOfPlayers')}
                  type="number"
                  fullWidth
                  value={formik.values.numberOfPeople}
                  onChange={handlePeopleChange}
                  name="numberOfPeople"
                  inputProps={{ min: 2, max: 22 }}
                  error={formik.touched.numberOfPeople && Boolean(formik.errors.numberOfPeople)}
                  helperText={formik.touched.numberOfPeople && formik.errors.numberOfPeople ? String(formik.errors.numberOfPeople) : undefined}
                />
              </Box>

              <Box sx={{ width: '100%', mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.equipmentRental}
                      onChange={formik.handleChange}
                      name="equipmentRental"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ mr: 1 }}>
                        {t('booking.equipmentRental')}
                        {field ? ` (${field.equipmentFee} FCFA ${t('booking.perPerson')})` : ''}
                      </Typography>
                      <Tooltip title={t('booking.equipmentRentalInfo')}>
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
              </Box>
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('booking.paymentDetailsTitle')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ width: '100%' }}>
                <PaymentMethodSelection
                  value={formik.values.paymentMethod}
                  onChange={(method: string) => formik.setFieldValue('paymentMethod', method)}
                  error={formik.touched.paymentMethod && Boolean(formik.errors.paymentMethod)}
                  helperText={formik.touched.paymentMethod && formik.errors.paymentMethod ? String(formik.errors.paymentMethod) : undefined}
                />
              </Box>

              <Box sx={{ width: '100%' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.termsAccepted}
                      onChange={formik.handleChange}
                      name="termsAccepted"
                    />
                  }
                  label={t('booking.termsAccept')}
                />
                <FormHelperText error={formik.touched.termsAccepted && Boolean(formik.errors.termsAccepted)}>
                  {formik.touched.termsAccepted && formik.errors.termsAccepted}
                </FormHelperText>
              </Box>
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            {bookingSuccess ? (
              <>
                <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  {t('booking.bookingConfirmed')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {t('booking.confirmationNumber')}: {bookingId}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {t('booking.confirmationEmail')}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/reservations')}
                >
                  {t('booking.viewReservations')}
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h5" color="error" gutterBottom>
                  {t('booking.bookingError')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {bookingError || t('common.unexpectedError')}
                </Typography>
                <Button
                  variant="contained"
                  onClick={handlePreviousStep}
                >
                  {t('common.tryAgain')}
                </Button>
              </>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  // Affichage du loader pendant le chargement
  if (loading && !bookingSuccess) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Affichage du message d'erreur
  if (error || !field) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || t('common.unexpectedError')}
          </Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/fields/${id}`)}
          >
            {t('common.back')}
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Bouton retour */}
        {activeStep < 2 && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/fields/${id}`)}
            sx={{ mb: 2 }}
          >
            {t('common.back')}
          </Button>
        )}

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {/* Formulaire */}
          <Box sx={{ flex: { xs: '0 0 100%', md: '0 0 calc(58.333% - 16px)' } }}>
            <Paper sx={{ p: 3, mb: { xs: 3, md: 0 } }}>
              {renderStepContent(activeStep)}

              {activeStep < 2 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    onClick={handlePreviousStep}
                    disabled={activeStep === 0}
                    startIcon={<ArrowBackIcon />}
                  >
                    {t('common.back')}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNextStep}
                    disabled={
                      (activeStep === 0 && (!formik.values.date || !formik.values.startTime)) ||
                      (activeStep === 1 && !formik.values.termsAccepted)
                    }
                  >
                    {activeStep === steps.length - 1 ? t('common.submit') : t('common.next')}
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>

          
          {/* Résumé de réservation */}
          {activeStep < 2 && (
            <Box sx={{ flex: { xs: '0 0 100%', md: '0 0 calc(41.667% - 16px)' } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('booking.summary')}
                </Typography>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <CardMedia
                    component="img"
                    sx={{ width: 120, height: 80, borderRadius: 1 }}
                    image={field?.imageUrl || '/images/field-placeholder.jpg'}
                    alt={field?.name}
                  />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="subtitle1">
                      {field?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {field?.location}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {formik.values.date ? formik.values.date.toLocaleDateString() : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {formik.values.startTime || '-'} - {formik.values.startTime && formik.values.duration ? 
                        calculateEndTime(formik.values.startTime, formik.values.duration * 60) : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {formik.values.numberOfPeople} {t('booking.players')}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">
                    {t('booking.pricingDetails')}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {t('booking.fieldRental')}: {field?.pricePerHour.toLocaleString()} FCFA x {formik.values.duration} {formik.values.duration === 1 ? t('booking.hour') : t('booking.hours')}
                    </Typography>
                    <Typography variant="body2">
                      {(field?.pricePerHour * formik.values.duration).toLocaleString()} FCFA
                    </Typography>
                  </Box>
                  
                  {formik.values.equipmentRental && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {t('booking.equipmentRental')}
                      </Typography>
                      <Typography variant="body2">
                        {field?.equipmentFee * formik.values.numberOfPeople} FCFA
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {t('booking.totalPrice')}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {calculateTotalPrice().toLocaleString()} FCFA
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Boîte de dialogue de confirmation */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
      >
        <DialogTitle>{t('booking.confirmReservation')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('booking.confirmationMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirmBooking} variant="contained" autoFocus>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Fonction utilitaire pour calculer l'heure de fin en fonction de l'heure de début et de la durée
const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  // Parse the time string HH:MM
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Calculate end time
  let endHours = hours;
  let endMinutes = minutes + durationMinutes;
  
  // Adjust for overflow
  if (endMinutes >= 60) {
    endHours += Math.floor(endMinutes / 60);
    endMinutes = endMinutes % 60;
  }
  
  // Format as HH:MM
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

// Wrapper avec SnackbarProvider pour assurer que les notifications fonctionnent
const BookingPage: React.FC = () => {
  return (
    <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
      <BookingPageContent />
    </SnackbarProvider>
  );
};

export default BookingPage;
