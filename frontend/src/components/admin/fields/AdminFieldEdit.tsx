import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  MenuItem,
  InputLabel,
  Select,
  CircularProgress,
  Divider,
  FormHelperText,
  Alert,
} from '@mui/material';
import fieldAPI from '../../../services/api/fieldAPI';
import regionAPI from '../../../services/api/regionAPI';

// Interface pour les données renvoyées par l'API (snake_case)
interface ApiField {
  id: string;
  name: string;
  description: string;
  location: string | {
    address: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  city?: string;
  price_per_hour: number;
  equipment_fee?: number | null;
  size: string;
  surface_type: string;
  indoor: boolean;
  is_active: boolean;
  image_url?: string;
};

// Types pour le formulaire
interface FieldFormValues {
  name: string;
  location: string;
  city: string;
  size: string;
  indoor: boolean;
  surface: string;
  pricePerHour: number | '';
  equipmentFee: number | '';
  imageFile: File | null;
  description: string;
  available: boolean;
}

const surfaceOptions = ['gazon_naturel', 'gazon_synthetique', 'dur', 'autre'];
const sizeOptions = ['5v5', '7v7', '11v11'];

const AdminFieldEdit: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id: string }>();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);

  // Schéma de validation avec Yup
  const validationSchema = Yup.object({
    name: Yup.string().required(t('validation.required')),
    location: Yup.string().required(t('validation.required')),
    city: Yup.string().required(t('validation.required')),
    size: Yup.string().required(t('validation.required')),
    indoor: Yup.boolean(),
    surface: Yup.string().required(t('validation.required')),
    pricePerHour: Yup.number()
      .typeError(t('validation.mustBeNumber'))
      .positive(t('validation.mustBePositive'))
      .required(t('validation.required')),
    equipmentFee: Yup.number()
      .nullable()
      .typeError(t('validation.mustBeNumber'))
      .min(0, t('validation.mustBePositiveOrZero')),
    imageFile: Yup.mixed().nullable(),
    description: Yup.string().required(t('validation.required')),
    available: Yup.boolean(),
  });

  // Initialiser le formulaire avec Formik
  const formik = useFormik<FieldFormValues>({
    initialValues: {
      name: '',
      location: '',
      city: '',
      size: '',
      indoor: false,
      surface: '',
      pricePerHour: '',
      equipmentFee: '',
      imageFile: null,
      description: '',
      available: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!id) return;
      
      setIsSubmitting(true);
      try {
        const fieldData = {
          name: values.name,
          description: values.description,
          // Envoyer location comme une chaîne simple pour correspondre au modèle backend
          location: values.location.trim(),
          city: values.city,
          price_per_hour: Number(values.pricePerHour),
          equipment_fee: values.equipmentFee ? Number(values.equipmentFee) : null,
          size: values.size,
          surface_type: values.surface,
          indoor: values.indoor,
          is_active: values.available,
          image: values.imageFile
        };
        
        await fieldAPI.updateField(id, fieldData as any);
        
        enqueueSnackbar(t('admin.fields.updateSuccess'), { variant: 'success' });
        navigate('/admin/fields');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du terrain:', error);
        enqueueSnackbar(t('admin.fields.updateError'), { variant: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Charger les villes
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await regionAPI.getCities();
        setCities(response);
      } catch (error) {
        console.error('Erreur lors du chargement des villes:', error);
      }
    };

    fetchCities();
  }, []);

  // Charger les données du terrain
  useEffect(() => {
    const fetchField = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const response = await fieldAPI.getFieldById(id);
        const field = response.data as ApiField;
        
        formik.setValues({
          name: field.name,
          location: typeof field.location === 'object' && field.location ? field.location.address : (field.location || ''),
          city: field.city || '',
          size: field.size,
          indoor: field.indoor,
          surface: field.surface_type,
          pricePerHour: field.price_per_hour,
          equipmentFee: field.equipment_fee || '',
          imageFile: null,
          description: field.description,
          available: field.is_active,
        });
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement du terrain', err);
        setError(t('admin.fields.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchField();
  }, [id]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t('admin.fields.editTitle')}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <form onSubmit={formik.handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label={t('admin.fields.name')}
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              margin="normal"
            />

            <TextField
              fullWidth
              id="location"
              name="location"
              label={t('admin.fields.location')}
              value={formik.values.location}
              onChange={formik.handleChange}
              error={formik.touched.location && Boolean(formik.errors.location)}
              helperText={formik.touched.location && formik.errors.location}
              margin="normal"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="city-label">{t('admin.fields.city')}</InputLabel>
              <Select
                labelId="city-label"
                id="city"
                name="city"
                value={formik.values.city}
                onChange={formik.handleChange}
                error={formik.touched.city && Boolean(formik.errors.city)}
                label={t('admin.fields.city')}
              >
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.city && formik.errors.city && (
                <FormHelperText error>{formik.errors.city}</FormHelperText>
              )}
            </FormControl>

            <FormControl component="fieldset" margin="normal">
              <FormLabel component="legend">{t('admin.fields.type')}</FormLabel>
              <RadioGroup
                row
                name="indoor"
                value={formik.values.indoor?.toString() || 'false'}
                onChange={(e) => {
                  formik.setFieldValue('indoor', e.target.value === 'true');
                }}
              >
                <FormControlLabel
                  value="true"
                  control={<Radio />}
                  label={t('admin.fields.indoor')}
                />
                <FormControlLabel
                  value="false"
                  control={<Radio />}
                  label={t('admin.fields.outdoor')}
                />
              </RadioGroup>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="size-label">{t('admin.fields.size')}</InputLabel>
              <Select
                labelId="size-label"
                id="size"
                name="size"
                value={formik.values.size}
                onChange={formik.handleChange}
                error={formik.touched.size && Boolean(formik.errors.size)}
                label={t('admin.fields.size')}
              >
                {sizeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {t(`fields.sizeOptions.${option}`)}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.size && formik.errors.size && (
                <FormHelperText error>{formik.errors.size}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="surface-label">{t('admin.fields.surface')}</InputLabel>
              <Select
                labelId="surface-label"
                id="surface"
                name="surface"
                value={formik.values.surface}
                onChange={formik.handleChange}
                error={formik.touched.surface && Boolean(formik.errors.surface)}
                label={t('admin.fields.surface')}
              >
                {surfaceOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {t(`fields.surfaceOptions.${option}`)}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.surface && formik.errors.surface && (
                <FormHelperText error>{formik.errors.surface}</FormHelperText>
              )}
            </FormControl>

            <TextField
              fullWidth
              id="pricePerHour"
              name="pricePerHour"
              label={t('admin.fields.pricePerHour')}
              type="number"
              InputProps={{ inputProps: { min: 0 } }}
              value={formik.values.pricePerHour}
              onChange={formik.handleChange}
              error={formik.touched.pricePerHour && Boolean(formik.errors.pricePerHour)}
              helperText={formik.touched.pricePerHour && formik.errors.pricePerHour}
              margin="normal"
            />

            <TextField
              fullWidth
              id="equipmentFee"
              name="equipmentFee"
              label={t('admin.fields.equipmentFee')}
              type="number"
              InputProps={{ inputProps: { min: 0 } }}
              value={formik.values.equipmentFee}
              onChange={formik.handleChange}
              error={formik.touched.equipmentFee && Boolean(formik.errors.equipmentFee)}
              helperText={formik.touched.equipmentFee && formik.errors.equipmentFee}
              margin="normal"
            />

            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('admin.fields.image')}
              </Typography>
              <input
                accept="image/png,image/jpeg,image/jpg"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    formik.setFieldValue('imageFile', file);
                  }
                }}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {formik.values.imageFile 
                    ? `${t('admin.fields.imageSelected')}: ${formik.values.imageFile.name}`
                    : t('admin.fields.selectImage')
                  }
                </Button>
              </label>
              {formik.values.imageFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  {t('admin.fields.imageSize')}: {Math.round(formik.values.imageFile.size / 1024)} KB
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              id="description"
              name="description"
              label={t('admin.fields.description')}
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
              margin="normal"
            />

            <FormControl component="fieldset" margin="normal">
              <FormLabel component="legend">{t('admin.fields.status')}</FormLabel>
              <RadioGroup
                row
                name="available"
                value={formik.values.available}
                onChange={(e) => {
                  formik.setFieldValue('available', e.target.value === 'true');
                }}
              >
                <FormControlLabel
                  value={true}
                  control={<Radio />}
                  label={t('admin.fields.available')}
                />
                <FormControlLabel
                  value={false}
                  control={<Radio />}
                  label={t('admin.fields.unavailable')}
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/fields')}
              disabled={isSubmitting}
            >
              {t('admin.fields.cancelButton')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={24} color="inherit" /> : null}
            >
              {t('admin.fields.saveButton')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminFieldEdit;
