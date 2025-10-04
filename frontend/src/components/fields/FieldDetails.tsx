import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Container,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  ArrowBack,
  SportsSoccer, 
  AccessTime, 
  AttachMoney,
  Straighten,
  Star,
  StarBorder,
  LocationOn
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts';

// Types
interface TimeSlot {
  id: string;
  field_id: string;
  datefrom: string;
  dateto: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Field {
  id: string;
  name: string;
  description: string;
  imageUrls: string[];
  size: string;
  surface: string;
  indoor: boolean;
  pricePerHour: number;
  location: string;
  features: string[];
  openingTime: string;
  closingTime: string;
  rating: number;
  reviewCount: number;
  timeSlots?: TimeSlot[];
}

const FieldDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);

  // Fetch field data
  useEffect(() => {
    const fetchField = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/fields/${id}`);
        
        // Transform backend data to match frontend interface
        const fieldData = response.data.data || response.data;
        console.log('Field data from API:', fieldData); // Debug log
        
        const transformedField = {
          id: fieldData.id,
          name: fieldData.name,
          description: fieldData.description,
          imageUrls: fieldData.image_url ? [`http://localhost:3001${fieldData.image_url}`] : ['/images/default-field.jpg'],
          size: fieldData.size,
          surface: fieldData.surface_type,
          indoor: fieldData.indoor || false,
          pricePerHour: fieldData.price_per_hour,
          location: fieldData.location,
          features: fieldData.features || [],
          openingTime: fieldData.opening_time || '08:00',
          closingTime: fieldData.closing_time || '22:00',
          rating: fieldData.rating || 4,
          reviewCount: fieldData.review_count || 0,
          timeSlots: fieldData.timeSlots || []
        };
        
        console.log('Transformed field:', transformedField); // Debug log
        setField(transformedField);
      } catch (err) {
        console.error('Error fetching field:', err);
        setError('Erreur lors du chargement du terrain');
      } finally {
        setLoading(false);
      }
    };

    fetchField();
  }, [id]);

  const handleBooking = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/fields/${id}/book`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !field) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error || 'Terrain non trouvé'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with back button */}
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mb: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" gutterBottom>
          {field.name}
        </Typography>
      </Box>

      {/* Main content */}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 4 }}>
        {/* Left column - Images and basic info */}
        <Box sx={{ flex: 1 }}>
          {/* Image carousel */}
          {field.imageUrls && field.imageUrls.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardMedia
                component="img"
                height="400"
                image={field.imageUrls[currentImage]}
                alt={field.name}
                sx={{ objectFit: 'cover' }}
              />
              {field.imageUrls.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 1, gap: 1 }}>
                  {field.imageUrls.map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: index === currentImage ? 'primary.main' : 'grey.300',
                        cursor: 'pointer'
                      }}
                      onClick={() => setCurrentImage(index)}
                    />
                  ))}
                </Box>
              )}
            </Card>
          )}

          {/* Field details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Détails du terrain
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Chip icon={<Straighten />} label={`Taille: ${field.size}`} />
                <Chip icon={<SportsSoccer />} label={`Surface: ${field.surface}`} />
                {field.indoor && <Chip label="Intérieur" color="primary" />}
              </Box>

              <Typography variant="body1" paragraph>
                {field.description}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {field.location}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" color="success.main">
                  {field.pricePerHour?.toLocaleString()} FCFA/heure
                </Typography>
              </Box>

              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {[...Array(5)].map((_, index) => (
                  index < field.rating ? (
                    <Star key={index} sx={{ color: 'warning.main' }} />
                  ) : (
                    <StarBorder key={index} sx={{ color: 'warning.main' }} />
                  )
                ))}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  ({field.reviewCount} avis)
                </Typography>
              </Box>

              {/* Features */}
              {field.features && field.features.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Équipements disponibles:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {field.features.map((feature, index) => (
                      <Chip key={index} label={feature} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right column - Booking */}
        <Box sx={{ flex: 1, maxWidth: isMobile ? '100%' : 400 }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Réserver ce terrain
            </Typography>
            
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {field.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoney sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6" color="success.main">
                {field.pricePerHour?.toLocaleString()} FCFA / heure
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                Ouvert de {field.openingTime} à {field.closingTime}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleBooking}
              sx={{ mt: 2 }}
            >
              Réserver maintenant
            </Button>

            {!user && (
              <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                Connectez-vous pour réserver
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default FieldDetails;
