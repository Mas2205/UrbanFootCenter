import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';
import fieldAPI from '../../../services/api/fieldAPI';

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
  price_per_hour: number;
  equipment_fee?: number | null;
  size: string;
  surface_type: string;
  indoor: boolean;
  is_active: boolean;
  image_url?: string;
};

const AdminFieldView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const [field, setField] = useState<ApiField | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchFieldDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const result = await fieldAPI.getFieldById(id);
        console.log('Réponse brute:', result);
        // Extraire les données du terrain de la structure de réponse
        const fieldData = result.data ? result.data : result;
        console.log('Détails du terrain extraits:', fieldData);
        console.log('Image URL du terrain:', fieldData.image_url);
        setField(fieldData as ApiField);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des détails du terrain:', err);
        setError(t('admin.fields.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchFieldDetails();
  }, [id, t]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await fieldAPI.deleteField(id);
      navigate('/admin/fields');
    } catch (err) {
      console.error('Erreur lors de la suppression du terrain:', err);
      setError(t('admin.fields.deleteError'));
    }
  };

  const handleEdit = () => {
    navigate(`/admin/fields/edit/${id}`);
  };

  const handleBack = () => {
    navigate('/admin/fields');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!field) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {t('admin.fields.notFound')}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {t('admin.fields.viewField')}
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
          color="primary"
        >
          {t('admin.common.back')}
        </Button>
      </Box>

      <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden', borderRadius: 2 }}>
        <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
          <Typography variant="h6">{field.name}</Typography>
        </Box>
        
        <Box sx={{ p: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {t('admin.fields.details')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Champ ID masqué pour des raisons de sécurité */}
                  
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" color="textSecondary" sx={{ width: '40%' }}>
                      {t('admin.fields.name')}:
                    </Typography>
                    <Typography variant="body2" sx={{ width: '60%' }}>
                      {field.name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" color="textSecondary" sx={{ width: '40%' }}>
                      {t('admin.fields.location')}:
                    </Typography>
                    <Typography variant="body2" sx={{ width: '60%' }}>
                      {typeof field.location === 'object' && field.location ? field.location.address : String(field.location)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" color="textSecondary" sx={{ width: '40%' }}>
                      {t('admin.fields.size')}:
                    </Typography>
                    <Typography variant="body2" sx={{ width: '60%' }}>
                      {t(`fields.sizeOptions.${field.size}`)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" color="textSecondary" sx={{ width: '40%' }}>
                      {t('admin.fields.surface')}:
                    </Typography>
                    <Typography variant="body2" sx={{ width: '60%' }}>
                      {t(`fields.surfaceOptions.${field.surface_type}`)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" color="textSecondary" sx={{ width: '40%' }}>
                      {t('admin.fields.pricePerHour')}:
                    </Typography>
                    <Typography variant="body2" sx={{ width: '60%' }}>
                      {field.price_per_hour ? field.price_per_hour.toLocaleString() : '0'} FCFA
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" color="textSecondary" sx={{ width: '40%' }}>
                      {t('admin.fields.status')}:
                    </Typography>
                    <Box sx={{ width: '60%' }}>
                      <Chip 
                        label={field.is_active ? t('admin.fields.available') : t('admin.fields.unavailable')}
                        color={field.is_active ? "success" : "error"}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {t('admin.fields.description')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" paragraph>
                  {field.description || t('admin.fields.noDescription')}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {t('admin.fields.image')}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {field.image_url ? (
                    <Box 
                      component="img"
                      src={field.image_url.startsWith('http') ? field.image_url : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001'}${field.image_url}`}
                      alt={field.name}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Erreur de chargement image:', field.image_url);
                        const fullUrl = field.image_url?.startsWith('http') ? field.image_url : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001'}${field.image_url}`;
                        console.error('URL complète tentée:', fullUrl);
                        // Forcer l'affichage de l'erreur dans l'interface
                        e.currentTarget.style.display = 'block';
                        e.currentTarget.style.border = '2px solid red';
                        e.currentTarget.style.background = '#ffebee';
                        e.currentTarget.style.padding = '20px';
                        e.currentTarget.style.color = 'red';
                        e.currentTarget.innerHTML = `Erreur de chargement: ${fullUrl}`;
                      }}
                      onLoad={() => {
                        console.log('Image chargée avec succès:', field.image_url);
                      }}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid #ddd',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <Box 
                      sx={{
                        width: '100%',
                        height: 150,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #ccc',
                        borderRadius: 1,
                        color: 'text.secondary'
                      }}
                    >
                      <Typography variant="body2">
                        Aucune image disponible
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
        
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            {t('admin.common.edit')}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t('admin.common.delete')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminFieldView;
