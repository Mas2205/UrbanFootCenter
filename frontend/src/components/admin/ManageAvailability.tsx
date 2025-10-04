import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

// Import du type API pour permettre l'accès aux propriétés
import { API } from '../../services/api/types';
import { TimeSlot } from '../../services/api/adminAPI';

// Types pour le composant
interface Field {
  id: string;
  name: string;
}

interface AvailabilityFormData {
  field_id: string;
  datefrom: Date | null;
  dateto: Date | null;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const ManageAvailability: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Utilisation de l'API importée

  // États du formulaire
  const [fields, setFields] = useState<Field[]>([]);
  const [formData, setFormData] = useState<AvailabilityFormData>({
    field_id: '',
    datefrom: new Date(),
    dateto: new Date(),
    start_time: '08:00',
    end_time: '20:00',
    is_available: true
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Chargement des terrains
  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      try {
        const response = await (api as API).field.getAllFields();
        // Extraction des données de la réponse de l'API
        // Si response.data.data existe, utilise-le, sinon prend response.data ou un tableau vide
        // Récupération des données de la réponse API
        const responseData = response.data;
        
        // Extraction des champs selon la structure de la réponse
        let fieldsData: Field[] = [];
        
        // Gérer les différentes structures possibles de réponse
        if (responseData && typeof responseData === 'object') {
          const data = responseData as any; // Cast temporaire pour accéder aux propriétés dynamiques
          
          if (data.data?.fields && Array.isArray(data.data.fields)) {
            fieldsData = data.data.fields;
          } else if (data.fields && Array.isArray(data.fields)) {
            fieldsData = data.fields;
          } else if (data.data && Array.isArray(data.data)) {
            fieldsData = data.data;
          } else if (Array.isArray(data)) {
            fieldsData = data;
          }
        }
        setFields(fieldsData as Field[]);
      } catch (err) {
        console.error('Erreur lors du chargement des terrains:', err);
        setError(t('admin.availability.errorLoadingFields'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchFields();
  }, [t]);

  // Transformation des données du formulaire pour l'API
  const transformTimeSlotFormToApiFormat = (formData: AvailabilityFormData): Omit<TimeSlot, 'id'> => {
    // Conversion des dates en format ISO
    const startDate = formData.datefrom?.toISOString().split('T')[0] || '';
    const endDate = formData.dateto?.toISOString().split('T')[0] || '';
    
    // Conversion des heures au format HH:mm:ss
    const startTime = formData.start_time
      ? `${String(formData.start_time.split(':')[0]).padStart(2, '0')}:${String(formData.start_time.split(':')[1]).padStart(2, '0')}:00`
      : '00:00:00';
      
    const endTime = formData.end_time
      ? `${String(formData.end_time.split(':')[0]).padStart(2, '0')}:${String(formData.end_time.split(':')[1]).padStart(2, '0')}:00`
      : '00:00:00';
    
    // Créer un objet avec tous les champs nécessaires pour respecter le type TimeSlot
    // Créer l'objet avec les bons types
    const result: Omit<TimeSlot, 'id'> = {
      fieldId: formData.field_id,  // camelCase pour TypeScript
      field_id: formData.field_id, // snake_case pour l'API
      datefrom: startDate,
      dateto: endDate,
      startTime: startTime,      // camelCase pour TypeScript
      start_time: startTime,     // snake_case pour l'API
      endTime: endTime,          // camelCase pour TypeScript
      end_time: endTime,         // snake_case pour l'API
      is_available: formData.is_available,
      // Champs obligatoires selon l'interface TimeSlot
      status: 'active',
      availableDays: [],
      price: 0,
      currency: 'XOF'
    };
    
    return result;
  };

  // Gestionnaires d'événements
  const handleFieldChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      field_id: event.target.value as string
    }));
  };

  const handleDateChange = (field: 'datefrom' | 'dateto', newValue: Date | null) => {
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        [field]: newValue
      }));
    }
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', newValue: Date | null) => {
    if (newValue) {
      const timeString = format(newValue, 'HH:mm');
      setFormData(prev => ({
        ...prev,
        [field]: timeString
      }));
    }
  };

  const handleCloseAlert = () => {
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.field_id || !formData.datefrom || !formData.dateto || !formData.start_time || !formData.end_time) {
      setError(t('admin.availability.allFieldsRequired'));
      return;
    }

    const dataForApi = transformTimeSlotFormToApiFormat(formData);

    setLoading(true);
    try {
      // Appel à l'API pour créer le créneau de disponibilité
      await (api as API).admin.createTimeSlot(dataForApi);
      setSuccess(t('admin.availability.createSuccess'));

      setFormData({
        field_id: '',
        datefrom: new Date(),
        dateto: new Date(),
        start_time: '08:00',
        end_time: '20:00',
        is_available: true
      });
    } catch (err) {
      console.error('Erreur lors de la création du créneau:', err);
      setError(t('admin.availability.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t('admin.availability.title', 'Gestion des disponibilités')}
      </Typography>

      {error && (
        <Alert severity="error" onClose={handleCloseAlert} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={handleCloseAlert} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* Sélection du terrain */}
          <Box sx={{ width: '100%', mb: 2 }}>
            <FormControl fullWidth required>
              <InputLabel id="field-select-label">{t('admin.availability.field', 'Terrain')}</InputLabel>
              <Select
                labelId="field-select-label"
                id="field-select"
                name="field_id"
                value={formData.field_id}
                label={t('admin.availability.field', 'Terrain')}
                onChange={handleFieldChange}
                disabled={loading}
              >
                {fields.map((field) => (
                  <MenuItem key={field.id} value={field.id}>{field.name}</MenuItem>
                ))}
              </Select>
              <FormHelperText>{t('admin.availability.selectField', 'Sélectionnez un terrain')}</FormHelperText>
            </FormControl>
          </Box>

          {/* Sélection des dates */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, pr: { md: 1 }, mb: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label={t('admin.availability.startDate', 'Date de début')}
                value={formData.datefrom}
                onChange={(newValue) => handleDateChange('datefrom', newValue)}
                disabled={loading}
                slotProps={{
                  textField: { fullWidth: true, required: true }
                }}
              />
            </LocalizationProvider>
          </Box>

          <Box sx={{ width: { xs: '100%', md: '50%' }, pr: { md: 1 }, mb: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label={t('admin.availability.endDate', 'Date de fin')}
                value={formData.dateto}
                onChange={(newValue) => handleDateChange('dateto', newValue)}
                disabled={loading}
                slotProps={{
                  textField: { fullWidth: true, required: true }
                }}
              />
            </LocalizationProvider>
          </Box>

          {/* Sélection des heures */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, pr: { md: 1 }, mb: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <TimePicker
                label={t('admin.availability.startTime', 'Heure de début')}
                value={formData.start_time ? parseISO(`2023-01-01T${formData.start_time}:00`) : null}
                onChange={(newValue) => handleTimeChange('start_time', newValue)}
                disabled={loading}
                slotProps={{
                  textField: { fullWidth: true, required: true }
                }}
              />
            </LocalizationProvider>
          </Box>

          <Box sx={{ width: { xs: '100%', md: '50%' }, pr: { md: 1 }, mb: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <TimePicker
                label={t('admin.availability.endTime', 'Heure de fin')}
                value={formData.end_time ? parseISO(`2023-01-01T${formData.end_time}:00`) : null}
                onChange={(newValue) => handleTimeChange('end_time', newValue)}
                disabled={loading}
                slotProps={{
                  textField: { fullWidth: true, required: true }
                }}
              />
            </LocalizationProvider>
          </Box>

          {/* Disponibilité */}
          <Box sx={{ width: '100%', mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_available}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                  name="is_available"
                  color="primary"
                  disabled={loading}
                />
              }
              label={t('admin.availability.isAvailable', 'Disponible')}
            />
          </Box>

          {/* Boutons d'action */}
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/dashboard')}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? t('common.saving', 'Enregistrement...') : t('common.save', 'Enregistrer')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ManageAvailability;
