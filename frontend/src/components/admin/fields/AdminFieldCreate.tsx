import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import axios from 'axios';
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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import fieldAPI from '../../../services/api/fieldAPI';
import regionAPI from '../../../services/api/regionAPI';
import { v4 as uuidv4 } from 'uuid';

// Types pour le formulaire
interface FieldFormValues {
  name: string;
  location: string; // Remplacer par une chaîne simple compatible avec le backend
  city: string; // Nouveau champ pour la ville
  size: string;
  indoor: boolean;
  surface: string;
  pricePerHour: number | '';
  equipmentFee: number | '';
  imageUrl: string;
  description: string;
}

// Type pour le fichier uploadé
interface UploadedFile {
  file: File;
  preview: string;
}

const surfaceOptions = ['gazon_naturel', 'gazon_synthetique', 'dur', 'autre'];
const sizeOptions = ['5v5', '7v7', '11v11'];

const AdminFieldCreate: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

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
    imageUrl: Yup.string(),
    description: Yup.string().required(t('validation.required')),
  });

  // Initialiser le formulaire avec Formik
  // Gestionnaire d'upload d'image
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        enqueueSnackbar('Veuillez sélectionner un fichier image', { variant: 'error' });
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        enqueueSnackbar('La taille de l\'image ne doit pas dépasser 5MB', { variant: 'error' });
        return;
      }

      const preview = URL.createObjectURL(file);
      setUploadedImage({ file, preview });
    }
  };

  // Gestionnaire de soumission manuelle du formulaire pour debugging
  const handleManualSubmit = (e: React.MouseEvent) => {
    e.preventDefault(); // Empêcher la soumission par défaut
    console.log('Tentative de soumission manuelle du formulaire');
    console.log('Valeurs du formulaire:', formik.values);
    console.log('Erreurs de validation:', formik.errors);
    console.log('Champs touchés:', formik.touched);
    
    // Vérifier si le formulaire est valide
    if (Object.keys(formik.errors).length > 0) {
      console.log('Formulaire invalide, marquage de tous les champs comme touchés');
      formik.setTouched({
        name: true,
        location: true,
        size: true,
        surface: true,
        pricePerHour: true,
        description: true
      });
      return;
    }
    
    formik.handleSubmit(); // Déclencher la soumission du formulaire Formik manuellement
  };

  // Charger les villes au montage du composant
  React.useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const citiesList = await regionAPI.getCities();
        setCities(citiesList);
      } catch (error) {
        console.error('Erreur lors du chargement des villes:', error);
        enqueueSnackbar('Erreur lors du chargement des villes', { variant: 'error' });
      } finally {
        setLoadingCities(false);
      }
    };
    
    loadCities();
  }, [enqueueSnackbar]);

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
      imageUrl: '',
      description: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      console.log('onSubmit déclenché', values);
      setIsSubmitting(true);
      try {
        // Créer FormData pour l'upload de fichier
        const formData = new FormData();
        
        // Ajouter les données du terrain
        formData.append('id', uuidv4());
        formData.append('name', values.name);
        formData.append('description', values.description);
        formData.append('location', values.location.trim());
        formData.append('city', values.city);
        formData.append('price_per_hour', String(values.pricePerHour));
        formData.append('equipment_fee', values.equipmentFee ? String(values.equipmentFee) : '');
        formData.append('size', values.size);
        formData.append('surface_type', values.surface);
        formData.append('indoor', String(values.indoor));
        formData.append('is_active', 'true');
        
        // Ajouter l'image si elle existe
        if (uploadedImage) {
          formData.append('image', uploadedImage.file);
        }
        
        console.log('FormData préparé pour envoi');
        
        // Envoyer avec axios directement pour gérer FormData
        const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
        const response = await axios.post(`${apiUrl}/fields`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Réponse du serveur:', response.data);
        
        enqueueSnackbar(t('admin.fields.createSuccess'), { variant: 'success' });
        navigate('/admin/fields');
      } catch (error) {
        console.error('Erreur lors de la création du terrain:', error);
        enqueueSnackbar(t('admin.fields.createError'), { variant: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t('admin.fields.createTitle')}
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
              <InputLabel id="city-label">Ville</InputLabel>
              <Select
                labelId="city-label"
                id="city"
                name="city"
                value={formik.values.city}
                onChange={formik.handleChange}
                error={formik.touched.city && Boolean(formik.errors.city)}
                label="Ville"
                disabled={loadingCities}
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
              {loadingCities && (
                <FormHelperText>Chargement des villes...</FormHelperText>
              )}
            </FormControl>

            <FormControl component="fieldset" margin="normal">
              <FormLabel component="legend">{t('admin.fields.type')}</FormLabel>
              <RadioGroup
                row
                name="indoor"
                value={formik.values.indoor}
                onChange={(e) => {
                  formik.setFieldValue('indoor', e.target.value === 'true');
                }}
              >
                <FormControlLabel
                  value={true}
                  control={<Radio />}
                  label={t('admin.fields.indoor')}
                />
                <FormControlLabel
                  value={false}
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

            {/* Section d'upload d'image */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('admin.fields.image')}
              </Typography>
              
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2 }}
                >
                  Choisir une image
                </Button>
              </label>
              
              {uploadedImage && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Aperçu de l'image :
                  </Typography>
                  <Box
                    component="img"
                    src={uploadedImage.preview}
                    alt="Aperçu"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '1px solid #ddd'
                    }}
                  />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      URL.revokeObjectURL(uploadedImage.preview);
                      setUploadedImage(null);
                    }}
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Supprimer l'image
                  </Button>
                </Box>
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
              type="button" 
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ ml: 1 }}
              onClick={handleManualSubmit}
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                t('common.save')
              )}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminFieldCreate;
