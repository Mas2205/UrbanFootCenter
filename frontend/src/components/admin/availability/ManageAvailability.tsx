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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fr } from 'date-fns/locale';

// API et types
import api from '../../../services/api';
import { TimeSlot } from '../../../services/api/adminAPI';

// Types
interface Field {
  id: string;
  name: string;
}

interface AvailabilityFormData {
  field_id: string;
  fieldId: string;
  datefrom: Date | null;
  dateto: Date | null;
  start_time: string;
  startTime: string;
  end_time: string;
  endTime: string;
  is_available: boolean;
  isAvailable: boolean;
}

function ManageAvailability() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldsLoaded, setFieldsLoaded] = useState<boolean>(false);
  const [availability, setAvailability] = useState<AvailabilityFormData>({
    field_id: '',
    fieldId: '',
    datefrom: new Date(),
    dateto: new Date(),
    start_time: '08:00',
    startTime: '08:00',
    end_time: '20:00',
    endTime: '20:00',
    is_available: true,
    isAvailable: true
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/fields');
        console.log('API Response Fields:', response.data);
        if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
          // La structure correcte est response.data.data (pas response.data.data.fields)
          setFields(response.data.data);
          setFieldsLoaded(true);
        } else {
          setSnackbarMessage(t('errors.fieldsLoadFailed'));
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      } catch (error) {
        setSnackbarMessage(t('errors.fieldsLoadFailed'));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFields();
  }, [t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAvailability({
      ...availability,
      [name]: value
    });
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvailability({
      ...availability,
      isAvailable: e.target.checked,
      is_available: e.target.checked
    });
  };

  const handleFieldChange = (e: SelectChangeEvent<string>) => {
    const fieldId = e.target.value;
    setAvailability({ 
      ...availability, 
      field_id: fieldId,
      fieldId: fieldId 
    });
  };

  const handleDateChange = (field: 'datefrom' | 'dateto') => (date: Date | null) => {
    setAvailability({
      ...availability,
      [field]: date
    });
  };

  const handleTimeChange = (field: 'startTime' | 'endTime') => (time: Date | null) => {
    if (time) {
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      // Mettre à jour à la fois les versions camelCase et snake_case pour assurer la cohérence
      if (field === 'startTime') {
        setAvailability({
          ...availability,
          startTime: timeString,
          start_time: timeString  // Important : synchroniser avec la propriété snake_case
        });
      } else {
        setAvailability({
          ...availability,
          endTime: timeString,
          end_time: timeString  // Important : synchroniser avec la propriété snake_case
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availability.fieldId || !availability.datefrom || !availability.dateto) {
      setSnackbarMessage(t('errors.allFieldsRequired'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      // Formatage des dates pour l'API
      const formatDate = (date: Date | null) => {
        if (!date) return null;
        return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
      };

      const timeSlotToCreate = {
        field_id: availability.field_id, // Déjà un UUID
        datefrom: formatDate(availability.datefrom),
        dateto: formatDate(availability.dateto),
        start_time: availability.start_time,
        end_time: availability.end_time,
        is_available: availability.is_available
      };

      console.log('Creating time slot with data:', timeSlotToCreate);
      // Utilisation de la route correcte avec l'ID du terrain
      const response = await api.post(`/fields/${availability.field_id}/time-slots`, timeSlotToCreate);
      if (response && response.data && response.data.success) {
        setSnackbarMessage('Créneau horaire créé avec succès');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        // Réinitialiser le formulaire
        setAvailability({
          field_id: '',
          fieldId: '',
          datefrom: new Date(),
          dateto: new Date(),
          start_time: '08:00',
          startTime: '08:00',
          end_time: '20:00',
          endTime: '20:00',
          is_available: true,
          isAvailable: true
        });
      } else {
        setSnackbarMessage(t('errors.timeslotCreationFailed'));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage(t('errors.timeslotCreationFailed'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      console.error('Error creating time slot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardHeader title="Gestion des disponibilités" />
            <Divider />
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flexGrow: 1, minWidth: '45%' }}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="field-select-label">Sélectionner un terrain</InputLabel>
                        <Select
                          labelId="field-select-label"
                          id="fieldId"
                          name="fieldId"
                          value={availability.fieldId}
                          onChange={handleFieldChange}
                          label="Sélectionner un terrain"
                          required
                        >
                          {fieldsLoaded && fields && fields.length > 0 ? (
                            fields.map((field) => (
                              <MenuItem key={field.id} value={field.id}>
                                {field.name}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled>Chargement des terrains...</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '45%' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={availability.isAvailable}
                            onChange={handleSwitchChange}
                            name="isAvailable"
                            color="primary"
                          />
                        }
                        label={availability.isAvailable ? 'Disponible' : 'Indisponible'}
                      />
                    </Box>
                  </Box>

                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flexGrow: 1, minWidth: '45%' }}>
                        <DatePicker
                          label="Date de début"
                          value={availability.datefrom}
                          onChange={handleDateChange('datefrom')}
                          slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                        />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: '45%' }}>
                        <DatePicker
                          label="Date de fin"
                          value={availability.dateto}
                          onChange={handleDateChange('dateto')}
                          minDate={availability.datefrom || undefined}
                          slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flexGrow: 1, minWidth: '45%' }}>
                        <TimePicker
                          label="Heure de début"
                          value={new Date(`2022-01-01T${availability.startTime}`)}
                          onChange={handleTimeChange('startTime')}
                          slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                        />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: '45%' }}>
                        <TimePicker
                          label="Heure de fin"
                          value={new Date(`2022-01-01T${availability.endTime}`)}
                          onChange={handleTimeChange('endTime')}
                          slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                        />
                      </Box>
                    </Box>
                  </LocalizationProvider>
                  
                  <Box>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary" 
                      size="large" 
                      disabled={isLoading}
                      fullWidth
                    >
                      {isLoading ? (
                        <CircularProgress size={24} />
                      ) : (
                        'Enregistrer'
                      )}
                    </Button>
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

export default ManageAvailability;
