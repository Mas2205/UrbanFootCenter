import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Tabs,
  Tab,
  Divider,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { settingsAPI } from '../../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Types pour les paramètres
interface GeneralSettings {
  siteName: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  openingHours: string;
  defaultLanguage: string;
  currencySymbol: string;
}

interface BookingSettings {
  maxDaysInAdvance: number;
  minHoursBeforeBooking: number;
  maxBookingDuration: number;
  startTimeIncrement: number;
  allowEquipmentRental: boolean;
  enableSmsNotifications: boolean;
  enableEmailNotifications: boolean;
}

interface PaymentSettings {
  stripeEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  waveEnabled: boolean;
  waveApiKey: string;
  orangeMoneyEnabled: boolean;
  orangeMoneyApiKey: string;
}

const AdminSettings: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  // États
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Changer d'onglet
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Formulaire des paramètres généraux
  const generalFormik = useFormik<GeneralSettings>({
    initialValues: {
      siteName: '',
      contactEmail: '',
      phoneNumber: '',
      address: '',
      openingHours: '',
      defaultLanguage: 'fr',
      currencySymbol: 'FCFA',
    },
    validationSchema: Yup.object({
      siteName: Yup.string().required(t('validation.required')),
      contactEmail: Yup.string().email(t('validation.invalidEmail')).required(t('validation.required')),
      phoneNumber: Yup.string().required(t('validation.required')),
      address: Yup.string().required(t('validation.required')),
      openingHours: Yup.string(),
      defaultLanguage: Yup.string().required(t('validation.required')),
      currencySymbol: Yup.string().required(t('validation.required')),
    }),
    onSubmit: async (values) => {
      // Vérifier l'authentification
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Erreur d'authentification: Token manquant");
        enqueueSnackbar(t('common.authError'), { variant: 'error' });
        return;
      }
      
      setIsSaving(true);
      setError(null); // Effacer les erreurs précédentes
      
      try {
        console.log(`Sauvegarde des paramètres généraux avec auth: JWT ${token.substring(0, 15)}...`, values);
        
        const response = await settingsAPI.updateGeneralSettings(values)
          .catch(error => {
            console.error("Erreur API lors de la sauvegarde des paramètres généraux:", error);
            throw error;
          });
          
        if (!response || response.status >= 400) {
          throw new Error(`Erreur lors de la sauvegarde: ${response?.statusText || 'Réponse API invalide'}`);
        }
        
        console.log("Paramètres généraux sauvegardés avec succès");
        enqueueSnackbar(t('admin.settings.saveSuccess'), { variant: 'success' });
      } catch (err) {
        console.error('Erreur lors de la sauvegarde des paramètres généraux', err);
        setError(t('admin.settings.saveError'));
        enqueueSnackbar(t('admin.settings.saveError'), { variant: 'error' });
      } finally {
        setIsSaving(false);
      }
    },
  });

  // Formulaire des paramètres de réservation
  const bookingFormik = useFormik<BookingSettings>({
    initialValues: {
      maxDaysInAdvance: 30,
      minHoursBeforeBooking: 2,
      maxBookingDuration: 3,
      startTimeIncrement: 30,
      allowEquipmentRental: true,
      enableSmsNotifications: true,
      enableEmailNotifications: true,
    },
    validationSchema: Yup.object({
      maxDaysInAdvance: Yup.number().required(t('validation.required')).positive(t('validation.mustBePositive')),
      minHoursBeforeBooking: Yup.number().required(t('validation.required')).min(0, t('validation.mustBePositiveOrZero')),
      maxBookingDuration: Yup.number().required(t('validation.required')).positive(t('validation.mustBePositive')),
      startTimeIncrement: Yup.number().required(t('validation.required')).oneOf([15, 30, 60], t('validation.invalidIncrement')),
      allowEquipmentRental: Yup.boolean(),
      enableSmsNotifications: Yup.boolean(),
      enableEmailNotifications: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      // Vérifier l'authentification
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Erreur d'authentification: Token manquant");
        enqueueSnackbar(t('common.authError'), { variant: 'error' });
        return;
      }
      
      setIsSaving(true);
      setError(null); // Effacer les erreurs précédentes
      
      try {
        console.log(`Sauvegarde des paramètres de réservation avec auth: JWT ${token.substring(0, 15)}...`, values);
        
        const response = await settingsAPI.updateBookingSettings(values)
          .catch(error => {
            console.error("Erreur API lors de la sauvegarde des paramètres de réservation:", error);
            throw error;
          });
          
        if (!response || response.status >= 400) {
          throw new Error(`Erreur lors de la sauvegarde: ${response?.statusText || 'Réponse API invalide'}`);
        }
        
        console.log("Paramètres de réservation sauvegardés avec succès");
        enqueueSnackbar(t('admin.settings.saveSuccess'), { variant: 'success' });
      } catch (err) {
        console.error('Erreur lors de la sauvegarde des paramètres de réservation', err);
        setError(t('admin.settings.saveError'));
        enqueueSnackbar(t('admin.settings.saveError'), { variant: 'error' });
      } finally {
        setIsSaving(false);
      }
    },
  });

  // Formulaire des paramètres de paiement
  const paymentFormik = useFormik<PaymentSettings>({
    initialValues: {
      stripeEnabled: true,
      stripePublicKey: '',
      stripeSecretKey: '',
      waveEnabled: true,
      waveApiKey: '',
      orangeMoneyEnabled: true,
      orangeMoneyApiKey: '',
    },
    validationSchema: Yup.object({
      stripeEnabled: Yup.boolean(),
      stripePublicKey: Yup.string().when({
        is: (value: any, schema: any) => schema.parent.stripeEnabled === true,
        then: (schema: any) => schema.required(t('validation.required')),
        otherwise: (schema: any) => schema.notRequired(),
      }),
      stripeSecretKey: Yup.string().when({
        is: (value: any, schema: any) => schema.parent.stripeEnabled === true,
        then: (schema: any) => schema.required(t('validation.required')),
        otherwise: (schema: any) => schema.notRequired(),
      }),
      waveEnabled: Yup.boolean(),
      waveApiKey: Yup.string().when({
        is: (value: any, schema: any) => schema.parent.waveEnabled === true,
        then: (schema: any) => schema.required(t('validation.required')),
        otherwise: (schema: any) => schema.notRequired(),
      }),
      orangeMoneyEnabled: Yup.boolean(),
      orangeMoneyApiKey: Yup.string().when({
        is: (value: any, schema: any) => schema.parent.orangeMoneyEnabled === true,
        then: (schema: any) => schema.required(t('validation.required')),
        otherwise: (schema: any) => schema.notRequired(),
      }),
    }),
    onSubmit: async (values) => {
      // Vérifier l'authentification
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Erreur d'authentification: Token manquant");
        enqueueSnackbar(t('common.authError'), { variant: 'error' });
        return;
      }
      
      setIsSaving(true);
      setError(null); // Effacer les erreurs précédentes
      
      try {
        console.log(`Sauvegarde des paramètres de paiement avec auth: JWT ${token.substring(0, 15)}...`, {
          stripeEnabled: values.stripeEnabled,
          waveEnabled: values.waveEnabled,
          orangeMoneyEnabled: values.orangeMoneyEnabled
          // Ne pas logger les clés API par sécurité
        });
        
        const response = await settingsAPI.updatePaymentSettings(values)
          .catch(error => {
            console.error("Erreur API lors de la sauvegarde des paramètres de paiement:", error);
            throw error;
          });
          
        if (!response || response.status >= 400) {
          throw new Error(`Erreur lors de la sauvegarde: ${response?.statusText || 'Réponse API invalide'}`);
        }
        
        console.log("Paramètres de paiement sauvegardés avec succès");
        enqueueSnackbar(t('admin.settings.saveSuccess'), { variant: 'success' });
      } catch (err) {
        console.error('Erreur lors de la sauvegarde des paramètres de paiement', err);
        setError(t('admin.settings.saveError'));
        enqueueSnackbar(t('admin.settings.saveError'), { variant: 'error' });
      } finally {
        setIsSaving(false);
      }
    },
  });

  // Charger les paramètres
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      
      // Vérifier l'authentification
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Erreur d'authentification: Token manquant");
        setError(t('common.authError'));
        setIsLoading(false);
        return;
      }
      
      try {
        console.log(`Chargement des paramètres avec auth: JWT ${token.substring(0, 15)}...`);
        
        // Charger les paramètres généraux
        try {
          const generalResponse = await settingsAPI.getGeneralSettings()
            .catch(error => {
              console.error("Erreur lors du chargement des paramètres généraux:", error);
              throw error;
            });
          
          if (!generalResponse || !generalResponse.data) {
            throw new Error("Réponse API des paramètres généraux invalide ou vide");
          }
          
          console.log("Paramètres généraux chargés avec succès");
          generalFormik.setValues(generalResponse.data);
        } catch (generalError) {
          console.error("Échec du chargement des paramètres généraux:", generalError);
          // Continuer à charger les autres paramètres malgré l'erreur
        }
        
        // Charger les paramètres de réservation
        try {
          const bookingResponse = await settingsAPI.getBookingSettings()
            .catch(error => {
              console.error("Erreur lors du chargement des paramètres de réservation:", error);
              throw error;
            });
          
          if (!bookingResponse || !bookingResponse.data) {
            throw new Error("Réponse API des paramètres de réservation invalide ou vide");
          }
          
          console.log("Paramètres de réservation chargés avec succès");
          bookingFormik.setValues(bookingResponse.data);
        } catch (bookingError) {
          console.error("Échec du chargement des paramètres de réservation:", bookingError);
          // Continuer à charger les autres paramètres malgré l'erreur
        }
        
        // Charger les paramètres de paiement
        try {
          const paymentResponse = await settingsAPI.getPaymentSettings()
            .catch(error => {
              console.error("Erreur lors du chargement des paramètres de paiement:", error);
              throw error;
            });
          
          if (!paymentResponse || !paymentResponse.data) {
            throw new Error("Réponse API des paramètres de paiement invalide ou vide");
          }
          
          console.log("Paramètres de paiement chargés avec succès");
          paymentFormik.setValues(paymentResponse.data);
        } catch (paymentError) {
          console.error("Échec du chargement des paramètres de paiement:", paymentError);
          // Continuer malgré l'erreur
        }
        
        // Vérifier si tous les paramètres ont échoué
        if (generalFormik.initialValues.siteName === '' && 
            bookingFormik.initialValues.maxDaysInAdvance === 30 && 
            paymentFormik.initialValues.stripePublicKey === '') {
          throw new Error("Aucun paramètre n'a pu être chargé");
        }
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres', err);
        setError(t('admin.settings.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {t('admin.settings.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label={t('admin.settings.tabs.general')} />
          <Tab label={t('admin.settings.tabs.booking')} />
          <Tab label={t('admin.settings.tabs.payment')} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <form onSubmit={generalFormik.handleSubmit}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
              <Box sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  id="siteName"
                  name="siteName"
                  label={t('admin.settings.general.siteName')}
                  value={generalFormik.values.siteName}
                  onChange={generalFormik.handleChange}
                  error={generalFormik.touched.siteName && Boolean(generalFormik.errors.siteName)}
                  helperText={generalFormik.touched.siteName && generalFormik.errors.siteName}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <TextField
                  fullWidth
                  id="contactEmail"
                  name="contactEmail"
                  label={t('admin.settings.general.contactEmail')}
                  value={generalFormik.values.contactEmail}
                  onChange={generalFormik.handleChange}
                  error={generalFormik.touched.contactEmail && Boolean(generalFormik.errors.contactEmail)}
                  helperText={generalFormik.touched.contactEmail && generalFormik.errors.contactEmail}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <TextField
                  fullWidth
                  id="phoneNumber"
                  name="phoneNumber"
                  label={t('admin.settings.general.phoneNumber')}
                  value={generalFormik.values.phoneNumber}
                  onChange={generalFormik.handleChange}
                  error={generalFormik.touched.phoneNumber && Boolean(generalFormik.errors.phoneNumber)}
                  helperText={generalFormik.touched.phoneNumber && generalFormik.errors.phoneNumber}
                />
              </Box>
              <Box sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  id="address"
                  name="address"
                  label={t('admin.settings.general.address')}
                  value={generalFormik.values.address}
                  onChange={generalFormik.handleChange}
                  error={generalFormik.touched.address && Boolean(generalFormik.errors.address)}
                  helperText={generalFormik.touched.address && generalFormik.errors.address}
                />
              </Box>
              <Box sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  id="openingHours"
                  name="openingHours"
                  label={t('admin.settings.general.openingHours')}
                  value={generalFormik.values.openingHours}
                  onChange={generalFormik.handleChange}
                  error={generalFormik.touched.openingHours && Boolean(generalFormik.errors.openingHours)}
                  helperText={generalFormik.touched.openingHours && generalFormik.errors.openingHours}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <FormControl fullWidth>
                  <InputLabel>{t('admin.settings.general.defaultLanguage')}</InputLabel>
                  <Select
                    id="defaultLanguage"
                    name="defaultLanguage"
                    value={generalFormik.values.defaultLanguage}
                    onChange={generalFormik.handleChange}
                    label={t('admin.settings.general.defaultLanguage')}
                  >
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="wo">Wolof</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <TextField
                  fullWidth
                  id="currencySymbol"
                  name="currencySymbol"
                  label={t('admin.settings.general.currencySymbol')}
                  value={generalFormik.values.currencySymbol}
                  onChange={generalFormik.handleChange}
                  error={generalFormik.touched.currencySymbol && Boolean(generalFormik.errors.currencySymbol)}
                  helperText={generalFormik.touched.currencySymbol && generalFormik.errors.currencySymbol}
                />
              </Box>
              <Box sx={{ gridColumn: 'span 12' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSaving}
                    startIcon={isSaving ? <CircularProgress size={24} color="inherit" /> : null}
                  >
                    {t('common.save')}
                  </Button>
                </Box>
              </Box>
            </Box>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <form onSubmit={bookingFormik.handleSubmit}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <TextField
                  fullWidth
                  id="maxDaysInAdvance"
                  name="maxDaysInAdvance"
                  label={t('admin.settings.booking.maxDaysInAdvance')}
                  type="number"
                  value={bookingFormik.values.maxDaysInAdvance}
                  onChange={bookingFormik.handleChange}
                  error={bookingFormik.touched.maxDaysInAdvance && Boolean(bookingFormik.errors.maxDaysInAdvance)}
                  helperText={bookingFormik.touched.maxDaysInAdvance && bookingFormik.errors.maxDaysInAdvance}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <TextField
                  fullWidth
                  id="minHoursBeforeBooking"
                  name="minHoursBeforeBooking"
                  label={t('admin.settings.booking.minHoursBeforeBooking')}
                  type="number"
                  value={bookingFormik.values.minHoursBeforeBooking}
                  onChange={bookingFormik.handleChange}
                  error={bookingFormik.touched.minHoursBeforeBooking && Boolean(bookingFormik.errors.minHoursBeforeBooking)}
                  helperText={bookingFormik.touched.minHoursBeforeBooking && bookingFormik.errors.minHoursBeforeBooking}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <TextField
                  fullWidth
                  id="maxBookingDuration"
                  name="maxBookingDuration"
                  label={t('admin.settings.booking.maxBookingDuration')}
                  type="number"
                  value={bookingFormik.values.maxBookingDuration}
                  onChange={bookingFormik.handleChange}
                  error={bookingFormik.touched.maxBookingDuration && Boolean(bookingFormik.errors.maxBookingDuration)}
                  helperText={bookingFormik.touched.maxBookingDuration && bookingFormik.errors.maxBookingDuration}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <FormControl fullWidth>
                  <InputLabel>{t('admin.settings.booking.startTimeIncrement')}</InputLabel>
                  <Select
                    id="startTimeIncrement"
                    name="startTimeIncrement"
                    value={bookingFormik.values.startTimeIncrement}
                    onChange={bookingFormik.handleChange}
                    label={t('admin.settings.booking.startTimeIncrement')}
                  >
                    <MenuItem value={15}>15 {t('common.minutes')}</MenuItem>
                    <MenuItem value={30}>30 {t('common.minutes')}</MenuItem>
                    <MenuItem value={60}>60 {t('common.minutes')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ gridColumn: 'span 12' }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {t('admin.settings.booking.features')}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={bookingFormik.values.allowEquipmentRental}
                      onChange={bookingFormik.handleChange}
                      name="allowEquipmentRental"
                    />
                  }
                  label={t('admin.settings.booking.allowEquipmentRental')}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={bookingFormik.values.enableSmsNotifications}
                      onChange={bookingFormik.handleChange}
                      name="enableSmsNotifications"
                    />
                  }
                  label={t('admin.settings.booking.enableSmsNotifications')}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={bookingFormik.values.enableEmailNotifications}
                      onChange={bookingFormik.handleChange}
                      name="enableEmailNotifications"
                    />
                  }
                  label={t('admin.settings.booking.enableEmailNotifications')}
                />
              </Box>
              <Box sx={{ gridColumn: 'span 12' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSaving}
                    startIcon={isSaving ? <CircularProgress size={24} color="inherit" /> : null}
                  >
                    {t('common.save')}
                  </Button>
                </Box>
              </Box>
            </Box>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <form onSubmit={paymentFormik.handleSubmit}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
              <Box sx={{ gridColumn: 'span 12' }}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">Stripe</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={paymentFormik.values.stripeEnabled}
                            onChange={paymentFormik.handleChange}
                            name="stripeEnabled"
                          />
                        }
                        label={t('admin.settings.payment.enable')}
                      />
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    {paymentFormik.values.stripeEnabled && (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                          <TextField
                            fullWidth
                            id="stripePublicKey"
                            name="stripePublicKey"
                            label={t('admin.settings.payment.stripePublicKey')}
                            value={paymentFormik.values.stripePublicKey}
                            onChange={paymentFormik.handleChange}
                            error={paymentFormik.touched.stripePublicKey && Boolean(paymentFormik.errors.stripePublicKey)}
                            helperText={paymentFormik.touched.stripePublicKey && paymentFormik.errors.stripePublicKey}
                          />
                        </Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                          <TextField
                            fullWidth
                            id="stripeSecretKey"
                            name="stripeSecretKey"
                            label={t('admin.settings.payment.stripeSecretKey')}
                            value={paymentFormik.values.stripeSecretKey}
                            onChange={paymentFormik.handleChange}
                            error={paymentFormik.touched.stripeSecretKey && Boolean(paymentFormik.errors.stripeSecretKey)}
                            helperText={paymentFormik.touched.stripeSecretKey && paymentFormik.errors.stripeSecretKey}
                            type="password"
                          />
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">Wave</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={paymentFormik.values.waveEnabled}
                            onChange={paymentFormik.handleChange}
                            name="waveEnabled"
                          />
                        }
                        label={t('admin.settings.payment.enable')}
                      />
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    {paymentFormik.values.waveEnabled && (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                        <Box sx={{ gridColumn: 'span 12' }}>
                          <TextField
                            fullWidth
                            id="waveApiKey"
                            name="waveApiKey"
                            label={t('admin.settings.payment.waveApiKey')}
                            value={paymentFormik.values.waveApiKey}
                            onChange={paymentFormik.handleChange}
                            error={paymentFormik.touched.waveApiKey && Boolean(paymentFormik.errors.waveApiKey)}
                            helperText={paymentFormik.touched.waveApiKey && paymentFormik.errors.waveApiKey}
                            type="password"
                          />
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">Orange Money</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={paymentFormik.values.orangeMoneyEnabled}
                            onChange={paymentFormik.handleChange}
                            name="orangeMoneyEnabled"
                          />
                        }
                        label={t('admin.settings.payment.enable')}
                      />
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    {paymentFormik.values.orangeMoneyEnabled && (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                        <Box sx={{ gridColumn: 'span 12' }}>
                          <TextField
                            fullWidth
                            id="orangeMoneyApiKey"
                            name="orangeMoneyApiKey"
                            label={t('admin.settings.payment.orangeMoneyApiKey')}
                            value={paymentFormik.values.orangeMoneyApiKey}
                            onChange={paymentFormik.handleChange}
                            error={paymentFormik.touched.orangeMoneyApiKey && Boolean(paymentFormik.errors.orangeMoneyApiKey)}
                            helperText={paymentFormik.touched.orangeMoneyApiKey && paymentFormik.errors.orangeMoneyApiKey}
                            type="password"
                          />
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ gridColumn: 'span 12' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSaving}
                    startIcon={isSaving ? <CircularProgress size={24} color="inherit" /> : null}
                  >
                    {t('common.save')}
                  </Button>
                </Box>
              </Box>
            </Box>
          </form>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminSettings;
