import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Pagination,
  Chip,
  Skeleton,
  SelectChangeEvent
} from '@mui/material';
import {
  Search,
  FilterList,
  SportsSoccer,
  Event
} from '@mui/icons-material';
import { fieldAPI } from '../../services/api';

// Types
// Interface pour les données reçues du backend
interface ApiField {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  size: string;
  surface_type: string;
  is_active: boolean;
  price_per_hour: string | number;
  location: string | null;
  city: string | null;
}

// Interface pour les données utilisées dans le frontend
interface Field {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  size: string;
  surface: string;
  pricePerHour: number;
  location: string;
  city: string;
  features: string[];
}

// Fonction d'adaptation pour transformer les données du backend en format frontend
const adaptFieldFromApi = (apiField: ApiField): Field => {
  // Construire l'URL complète de l'image
  let imageUrl = ''; // Pas d'image par défaut
  
  console.log('🔍 Processing field:', apiField.name);
  
  if (apiField.image_url && apiField.image_url.trim() !== '') {
    // Si l'image_url commence par /uploads, c'est une image locale uploadée
    if (apiField.image_url.startsWith('/uploads')) {
      // Construire l'URL complète avec le serveur backend
      const baseUrl = API_BASE_URL.replace('/api', '');
      imageUrl = `${baseUrl}${apiField.image_url}`;
      console.log('✅ Generated uploaded image URL:', imageUrl);
    } else if (apiField.image_url.startsWith('/images')) {
      // Si c'est un chemin vers /images, l'utiliser directement
      imageUrl = apiField.image_url;
      console.log('✅ Using static image:', imageUrl);
    } else if (apiField.image_url.startsWith('http')) {
      // Si c'est déjà une URL complète, l'utiliser telle quelle
      imageUrl = apiField.image_url;
      console.log('✅ Using external image:', imageUrl);
    } else {
      // Fallback: construire l'URL avec le serveur backend
      const baseUrl = API_BASE_URL.replace('/api', '');
      imageUrl = `${baseUrl}${apiField.image_url}`;
      console.log('✅ Fallback image URL:', imageUrl);
    }
  } else {
    console.log('❌ No image_url found for field:', apiField.name, 'no image will be displayed');
  }
  
  console.log('🎯 Final imageUrl for', apiField.name, ':', imageUrl);
  console.log('---');
  
  return {
    id: apiField.id || '',
    name: apiField.name || '',
    description: apiField.description || '',
    imageUrl: imageUrl,
    size: apiField.size || '',
    surface: apiField.surface_type || '',
    pricePerHour: typeof apiField.price_per_hour === 'number' 
      ? apiField.price_per_hour 
      : Number(apiField.price_per_hour || 0),
    location: apiField.location || '',
    city: apiField.city || '',
    features: [] // Cette donnée n'existe pas dans l'API, on définit une valeur par défaut
  };
};

interface FilterOptions {
  surface: string;
  priceRange: string;
  city: string;
}

const FieldsList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // États
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    surface: '',
    priceRange: '',
    city: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fonction pour filtrer les terrains
  const filterFields = (fieldsToFilter: Field[]) => {
    return fieldsToFilter.filter(field => {
      // Filtrage par recherche
      const matchesSearch = !searchTerm || 
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtrage par surface
      const matchesSurface = !filters.surface || field.surface === filters.surface;
      
      // Filtrage par prix
      const matchesPrice = !filters.priceRange || (() => {
        const [min, max] = filters.priceRange.split('-').map(Number);
        return field.pricePerHour >= min && (max ? field.pricePerHour <= max : true);
      })();
      
      // Filtrage par ville
      const matchesCity = !filters.city || field.city.toLowerCase().includes(filters.city.toLowerCase()) || field.location.toLowerCase().includes(filters.city.toLowerCase());
      
      return matchesSearch && matchesSurface && matchesPrice && matchesCity;
    });
  };

  // Chargement des terrains
  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Appel direct à l'API sans transformation des paramètres
        const response = await fieldAPI.getAllFields();
        
        if (!response || !response.data) {
          throw new Error('Réponse API vide ou incorrecte');
        }
        
        const { data, count } = response.data;
        
        if (!Array.isArray(data)) {
          throw new Error('La réponse de l\'API ne contient pas un tableau de terrains');
        }
        
        // Transformation des données avec gestion des erreurs et filtrage des terrains actifs
        const adaptedFields = data
          .filter((field: ApiField) => field.is_active === true) // Filtrer seulement les terrains disponibles
          .map((field: ApiField) => {
            try {
              return adaptFieldFromApi(field);
            } catch (e) {
              console.error('Erreur lors de l\'adaptation d\'un terrain:', e);
              return null;
            }
          })
          .filter((field): field is Field => field !== null);
        
        setFields(adaptedFields);
        setTotalPages(Math.max(1, Math.ceil(count / 10)));
      } catch (err) {
        console.error('Erreur lors de la récupération des terrains:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setFields([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);  // Supprimer les dépendances pour éviter les rechargements inutiles

  // Gestion des filtres
  const handleFilterChange = (filterName: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPage(1);
  };

  // Gestion de la recherche
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  // Rendu des cartes de terrains
  const renderFieldCards = () => {
    if (loading) {
      return Array.from({ length: 6 }).map((_, index) => (
        <Box key={`skeleton-${index}`} sx={{ 
          width: { xs: '100%', sm: '50%', md: '33.333%' },
          p: 1.5
        }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Skeleton variant="rectangular" height={220} />
            <CardContent sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" height={32} width="80%" />
              <Skeleton variant="text" height={20} width="60%" />
              <Skeleton variant="text" height={20} width="40%" />
            </CardContent>
            <CardActions>
              <Skeleton variant="rectangular" height={36} width={100} />
              <Skeleton variant="rectangular" height={36} width={100} />
            </CardActions>
          </Card>
        </Box>
      ));
    }

    if (fields.length === 0) {
      return (
        <Alert severity="info">{t('fields.noFieldsFound', 'Aucun terrain trouvé')}</Alert>
      );
    }

    const filteredFields = filterFields(fields);
    
    if (filteredFields.length === 0) {
      return (
        <Alert severity="info">{t('fields.noFieldsFound', 'Aucun terrain trouvé avec ces critères')}</Alert>
      );
    }

    return filteredFields.map((field, index) => (
      <Box key={field.id || `field-${index}`} sx={{ 
        width: { xs: '100%', sm: '50%', md: '33.333%' },
        p: 1.5
      }}>
        <Card sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          boxShadow: 3,
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6
          }
        }}>
          {field.imageUrl ? (
            <img
              src={field.imageUrl}
              alt={field.name}
              crossOrigin="anonymous"
              style={{
                width: '100%',
                height: '220px',
                objectFit: 'cover',
                backgroundColor: '#f5f5f5'
              }}
              onLoad={(e) => {
                console.log('✅ Image loaded successfully:', field.name, '→', field.imageUrl);
                console.log('✅ Image dimensions:', (e.target as HTMLImageElement).naturalWidth, 'x', (e.target as HTMLImageElement).naturalHeight);
              }}
              onError={(e) => {
                console.log('❌ Image failed to load:', field.name, '→', field.imageUrl);
                console.log('❌ Error event:', e);
                // Masquer l'image si elle ne se charge pas
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '220px',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}>
              Aucune image
            </div>
          )}
          <CardContent sx={{ flexGrow: 1, p: 2 }}>
            <Typography gutterBottom variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              {field.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
              {field.description && field.description.length > 100 
                ? `${field.description.substring(0, 100)}...` 
                : field.description}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SportsSoccer fontSize="small" color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {field.surface || 'Non spécifié'} • {field.size || 'N/A'}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              📍 {field.location ? `${field.location}${field.city ? `, ${field.city}` : ''}` : field.city || 'Emplacement non spécifié'}
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
              {field.pricePerHour.toLocaleString()} FCFA / {t('fields.hour', 'heure')}
            </Typography>
          </CardContent>
          <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
            <Button
              fullWidth
              size="medium"
              onClick={() => navigate(`/fields/${field.id}`)}
              variant="contained"
              color="primary"
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {t('fields.viewDetails', 'Voir détails')}
            </Button>
            {/* Ne pas afficher le bouton Réserver pour les comptes clients */}
            {(!isAuthenticated || (isAuthenticated && user?.role !== 'client')) && (
              <Button
                fullWidth
                size="medium"
                onClick={() => navigate(`/fields/${field.id}/book`)}
                variant="outlined"
                color="success"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                {t('fields.bookNow', 'Réserver')}
              </Button>
            )}
          </CardActions>
        </Card>
      </Box>
    ));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('fields.title', 'Nos terrains de foot')}
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <form onSubmit={handleSearch}>
          <TextField 
            name="search" 
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('fields.searchPlaceholder', 'Rechercher un terrain...')} 
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowFilters(!showFilters)}>
                    <FilterList />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />
          
          {showFilters && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>{t('fields.filters.surface', 'Surface')}</InputLabel>
                <Select
                  value={filters.surface}
                  label={t('fields.filters.surface', 'Surface')}
                  onChange={(e: SelectChangeEvent) => handleFilterChange('surface', e.target.value)}
                >
                  <MenuItem value="">{t('fields.filters.allSurfaces', 'Toutes les surfaces')}</MenuItem>
                  <MenuItem value="gazon_synthetique">{t('fields.filters.surfaces.synthetic', 'Gazon synthétique')}</MenuItem>
                  <MenuItem value="gazon_naturel">{t('fields.filters.surfaces.natural', 'Gazon naturel')}</MenuItem>
                  <MenuItem value="dur">{t('fields.filters.surfaces.hard', 'Terrain dur')}</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>{t('fields.filters.priceRange', 'Gamme de prix')}</InputLabel>
                <Select
                  value={filters.priceRange}
                  label={t('fields.filters.priceRange', 'Gamme de prix')}
                  onChange={(e: SelectChangeEvent) => handleFilterChange('priceRange', e.target.value)}
                >
                  <MenuItem value="">{t('fields.filters.allPrices', 'Tous les prix')}</MenuItem>
                  <MenuItem value="0-10000">0 - 10,000 FCFA</MenuItem>
                  <MenuItem value="10000-20000">10,000 - 20,000 FCFA</MenuItem>
                  <MenuItem value="20000-50000">20,000 - 50,000 FCFA</MenuItem>
                  <MenuItem value="50000-100000">50,000+ FCFA</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>{t('fields.filters.city', 'Ville')}</InputLabel>
                <Select
                  value={filters.city}
                  label={t('fields.filters.city', 'Ville')}
                  onChange={(e: SelectChangeEvent) => handleFilterChange('city', e.target.value)}
                >
                  <MenuItem value="">{t('fields.filters.allCities', 'Toutes les villes')}</MenuItem>
                  <MenuItem value="Dakar">Dakar</MenuItem>
                  <MenuItem value="Thiès">Thiès</MenuItem>
                  <MenuItem value="Thivaouane">Thivaouane</MenuItem>
                  <MenuItem value="Kouly">Kouly</MenuItem>
                  <MenuItem value="Djeddah">Djeddah</MenuItem>
                  <MenuItem value="Fatick">Fatick</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </form>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ 
        display: 'flex',
        flexWrap: 'wrap',
        margin: -1.5
      }}>
        {renderFieldCards()}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
};

export default FieldsList;
