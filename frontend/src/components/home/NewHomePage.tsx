import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Container,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Skeleton,
  Chip,
  Avatar,
  Rating,
  Divider,
  Stack
} from '@mui/material';
import {
  Search,
  LocationOn,
  AccessTime,
  SportsSoccer,
  Star,
  TrendingUp,
  People,
  CheckCircle,
  ArrowForward,
  CalendarToday,
  FilterList
} from '@mui/icons-material';
import fieldAPI from '../../services/api/fieldAPI';
import { useAuth } from '../../contexts';

// Type pour les terrains
interface Field {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
  images: string[];
  location: string;
  surface: string;
  size: string;
  rating: number;
}

const NewHomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, user } = useAuth();

  const [featuredFields, setFeaturedFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Statistiques
  const stats = [
    { icon: <SportsSoccer />, value: '50+', label: 'Terrains disponibles' },
    { icon: <People />, value: '1000+', label: 'Joueurs actifs' },
    { icon: <CheckCircle />, value: '5000+', label: 'Réservations réussies' },
    { icon: <Star />, value: '4.8', label: 'Note moyenne' }
  ];

  useEffect(() => {
    const fetchFeaturedFields = async () => {
      try {
        const response = await fieldAPI.getFeaturedFields();
        const fieldsData = response.data.slice(0, 6).map((field: any) => ({
          ...field,
          location: typeof field.location === 'string' ? field.location : field.location?.address || 'Localisation non disponible'
        }));
        setFeaturedFields(fieldsData);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des terrains:', error);
        setLoading(false);
      }
    };

    fetchFeaturedFields();
  }, []);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(`/fields?search=${searchTerm}`);
  };

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Hero Section Redesigned */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)',
          minHeight: { xs: '70vh', md: '80vh' },
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("/images/soccer-field-pattern.svg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1,
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                    fontWeight: 800,
                    color: 'white',
                    mb: 2,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  Réservez votre terrain de football
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    mb: 4,
                    fontWeight: 400,
                    lineHeight: 1.4
                  }}
                >
                  Trouvez et réservez le terrain parfait pour votre match en quelques clics
                </Typography>

                {/* Barre de recherche améliorée */}
                <Paper
                  component="form"
                  onSubmit={handleSearch}
                  sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    maxWidth: 500,
                    mx: { xs: 'auto', md: 0 }
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder="Rechercher par nom, localisation..."
                    variant="standard"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      disableUnderline: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: 'text.secondary', mr: 1 }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{ px: 2 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      bgcolor: '#1B5E20',
                      '&:hover': { bgcolor: '#14532d' }
                    }}
                  >
                    Rechercher
                  </Button>
                </Paper>

                {/* Filtres rapides */}
                <Stack direction="row" spacing={1} sx={{ mt: 3, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Chip
                    icon={<LocationOn />}
                    label="Dakar"
                    clickable
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                  />
                  <Chip
                    icon={<AccessTime />}
                    label="Disponible maintenant"
                    clickable
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                  />
                  <Chip
                    icon={<SportsSoccer />}
                    label="Terrain synthétique"
                    clickable
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                  />
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <img
                  src="/images/hero-football.png"
                  alt="Football"
                  style={{
                    width: '100%',
                    maxWidth: 400,
                    height: 'auto',
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Statistiques */}
      <Container maxWidth="lg" sx={{ mt: -8, position: 'relative', zIndex: 3 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
          }}
        >
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid size={{ xs: 6, md: 3 }} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: '#1B5E20',
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>

      {/* Terrains en vedette */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Terrains populaires
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Découvrez nos terrains les mieux notés et les plus réservés
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {loading
            ? Array.from(new Array(6)).map((_, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <Skeleton variant="rectangular" height={200} />
                    <CardContent>
                      <Skeleton variant="text" height={32} />
                      <Skeleton variant="text" height={20} />
                      <Skeleton variant="text" height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            : featuredFields.map((field) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={field.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={field.images?.[0] || '/images/field-placeholder.jpg'}
                        alt={field.name}
                      />
                      <Chip
                        label="Populaire"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          bgcolor: '#FF6B35',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          borderRadius: 2,
                          px: 1,
                          py: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                        <Typography variant="caption" fontWeight="bold">
                          {field.rating?.toFixed(1) || '4.8'}
                        </Typography>
                      </Box>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {field.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {field.location}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip size="small" label={field.surface} />
                        <Chip size="small" label={field.size} />
                      </Box>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {field.pricePerHour?.toLocaleString()} FCFA/h
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ p: 3, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={() => navigate(`/fields/${field.id}`)}
                        sx={{
                          borderRadius: 2,
                          py: 1.5,
                          bgcolor: '#1B5E20',
                          '&:hover': { bgcolor: '#14532d' }
                        }}
                      >
                        Réserver maintenant
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button
            variant="outlined"
            size="large"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/fields')}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              borderColor: '#1B5E20',
              color: '#1B5E20',
              '&:hover': {
                borderColor: '#14532d',
                bgcolor: 'rgba(27, 94, 32, 0.04)'
              }
            }}
          >
            Voir tous les terrains
          </Button>
        </Box>
      </Container>

      {/* Section Avantages */}
      <Box sx={{ bgcolor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Pourquoi choisir Urban Foot Center ?
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                icon: <CheckCircle sx={{ fontSize: 48, color: '#1B5E20' }} />,
                title: 'Réservation instantanée',
                description: 'Réservez votre terrain en quelques clics avec confirmation immédiate'
              },
              {
                icon: <Star sx={{ fontSize: 48, color: '#FFD700' }} />,
                title: 'Terrains de qualité',
                description: 'Tous nos terrains sont régulièrement entretenus et aux normes'
              },
              {
                icon: <People sx={{ fontSize: 48, color: '#1B5E20' }} />,
                title: 'Communauté active',
                description: 'Rejoignez une communauté de passionnés de football'
              }
            ].map((feature, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 3 }}>{feature.icon}</Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box
        sx={{
          bgcolor: '#1B5E20',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Prêt à jouer ?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Rejoignez des milliers de joueurs qui font confiance à Urban Foot Center
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/fields')}
              sx={{
                bgcolor: 'white',
                color: '#1B5E20',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
            >
              Réserver un terrain
            </Button>
            {!isAuthenticated && (
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Créer un compte
              </Button>
            )}
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default NewHomePage;
