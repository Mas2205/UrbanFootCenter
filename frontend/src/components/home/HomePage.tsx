import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  Avatar,
  Paper,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Popper,
  ClickAwayListener
} from '@mui/material';
import {
  SportsSoccer,
  LocationOn,
  AccessTime,
  Search,
  Event,
  Payment,
  NotificationsActive,
  EmojiEvents,
  Groups,
  Star,
  KeyboardArrowDown,
  WorkspacePremium
} from '@mui/icons-material';
import { useAuth } from '../../contexts';
import fieldAPI, { Field as FieldType } from '../../services/api/fieldAPI';

// Type pour les terrains de la page d'accueil
interface Field {
  id: string;
  name: string;
  description?: string;
  pricePerHour: number;
  images?: string[];
  location?: string;
  surface?: string;
  size?: string;
  rating?: number;
}

// Type pour les suggestions de recherche
interface SearchSuggestion {
  id: string;
  name: string;
  city: string;
  location?: string;
  price_per_hour: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [cities, setCities] = useState<string[]>(['Dakar', 'Thiès', 'Saint-Louis']); // Fallback statique
  const [selectedCity, setSelectedCity] = useState('Dakar');
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityMenuAnchor, setCityMenuAnchor] = useState<null | HTMLElement>(null);
  const isCityMenuOpen = Boolean(cityMenuAnchor);

  // États pour l'autocomplétion
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Récupérer les villes depuis la base de données
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await fieldAPI.getCities();
        if (response.data && response.data.length > 0) {
          setCities(response.data);
          // Si la ville sélectionnée n'est pas dans la liste, prendre la première
          if (!response.data.includes(selectedCity)) {
            setSelectedCity(response.data[0]);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des villes:', error);
        // Garder les villes par défaut en cas d'erreur
        setCities(['Dakar', 'Thiès', 'Saint-Louis', 'Kaolack']);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

  const handleCityMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setCityMenuAnchor(event.currentTarget);
  };

  const handleCityMenuClose = () => {
    setCityMenuAnchor(null);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    handleCityMenuClose();
  };

  // Statistiques
  const stats = [
    { icon: <Event />, value: '150+', label: 'Réservations aujourd\'hui' },
    { icon: <Payment />, value: '98%', label: 'Satisfaction client' },
    { icon: <NotificationsActive />, value: '24/7', label: 'Support disponible' },
    { icon: <Star />, value: '4.8', label: 'Note moyenne' }
  ];

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowSuggestions(false);
    navigate(`/fields?search=${searchTerm}`);
  };

  // Fonction pour rechercher les terrains
  const searchFields = async (query: string) => {
    if (query.length < 1) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fieldAPI.searchFields(query, 8);
      if (response.success) {
        // Mapper les données de l'API vers le type SearchSuggestion
        let mappedSuggestions: SearchSuggestion[] = response.data.map((field: any) => ({
          id: field.id,
          name: field.name,
          city: field.city,
          location: field.location,
          price_per_hour: field.price_per_hour
        }));

        // Filtrer par ville si une ville est sélectionnée
        if (selectedCity && selectedCity !== 'Toutes les villes') {
          mappedSuggestions = mappedSuggestions.filter(field => 
            field.city.toLowerCase() === selectedCity.toLowerCase()
          );
        }

        setSearchSuggestions(mappedSuggestions);
        setShowSuggestions(mappedSuggestions.length > 0);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Gérer les changements dans la barre de recherche
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    // Annuler le timer précédent
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Débounce la recherche avec un délai plus court
    const newTimer = setTimeout(() => {
      searchFields(value);
    }, 150);
    
    setDebounceTimer(newTimer);
  };

  // Sélectionner une suggestion
  const handleSuggestionSelect = (field: SearchSuggestion) => {
    setSearchTerm(field.name);
    setShowSuggestions(false);
    navigate(`/fields/${field.id}`);
  };

  // Fermer les suggestions
  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
  };

  // Relancer la recherche quand la ville change
  useEffect(() => {
    if (searchTerm.length >= 1) {
      searchFields(searchTerm);
    }
  }, [selectedCity]);

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Hero Section Redesigned */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0F4C3A 0%, #1B5E20 30%, #2E7D32 70%, #388E3C 100%)',
          minHeight: { xs: '85vh', md: '95vh' },
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)',
            zIndex: 1
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.4,
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center" justifyContent="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.2rem', md: '3.2rem', lg: '3.8rem' },
                    fontWeight: 700,
                    color: 'white',
                    mb: 3,
                    textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1
                  }}
                >
                  Réservez votre terrain
                  <Box component="span" sx={{ display: 'block', color: '#81C784', fontWeight: 800 }}>
                    de football
                  </Box>
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255,255,255,0.95)',
                    mb: 5,
                    fontWeight: 300,
                    lineHeight: 1.5,
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    maxWidth: '600px'
                  }}
                >
                  Découvrez et réservez les meilleurs terrains de football au Sénégal. Une expérience de réservation simple, rapide et sécurisée.
                </Typography>

                {/* Barre de recherche et filtre localisation */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    mb: 4,
                    p: 2,
                    borderRadius: 5,
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.12) 100%)',
                    backdropFilter: 'blur(30px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 5,
                      padding: '1px',
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'xor',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor'
                    }
                  }}
                >
                  {/* Barre de recherche */}
                  <Box
                    sx={{
                      flex: 1,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: 'rgba(255,255,255,0.08)',
                      borderRadius: 4,
                      border: '1px solid rgba(255,255,255,0.12)',
                      overflow: 'visible',
                      transition: 'all 0.3s ease',
                      zIndex: 1000000,
                      '&:focus-within': {
                        bgcolor: 'rgba(255,255,255,0.15)',
                        borderColor: 'rgba(255,255,255,0.25)',
                        boxShadow: '0 0 0 3px rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 50,
                        height: 50,
                        color: 'rgba(255,255,255,0.7)'
                      }}
                    >
                      <Search sx={{ fontSize: 22 }} />
                    </Box>
                    <ClickAwayListener onClickAway={handleCloseSuggestions}>
                      <Box sx={{ position: 'relative', flex: 1, zIndex: 1000000, isolation: 'isolate' }}>
                        <TextField
                          ref={searchInputRef}
                          placeholder="Rechercher par nom, localisation..."
                          variant="outlined"
                          value={searchTerm}
                          onChange={handleSearchChange}
                          onFocus={() => {
                            if (searchTerm.length >= 1) {
                              if (searchSuggestions.length > 0) {
                                setShowSuggestions(true);
                              } else {
                                searchFields(searchTerm);
                              }
                            }
                          }}
                          sx={{
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: 'white',
                              fontSize: '1rem',
                              fontWeight: 400,
                              '& fieldset': {
                                border: 'none'
                              },
                              '&:hover fieldset': {
                                border: 'none'
                              },
                              '&.Mui-focused fieldset': {
                                border: 'none'
                              }
                            },
                            '& .MuiInputBase-input': {
                              padding: '12px 16px',
                              color: 'white',
                              '&::placeholder': {
                                color: 'rgba(255,255,255,0.7)',
                                opacity: 1
                              }
                            }
                          }}
                        />
                        
                        {/* Suggestions d'autocomplétion */}
                        {showSuggestions && (searchSuggestions.length > 0 || loadingSuggestions) && (
                          <Paper
                            sx={{
                              position: 'absolute',
                              bottom: 'calc(100% + 8px)',
                              left: 0,
                              right: 0,
                              zIndex: 999999,
                              maxHeight: 300,
                              overflow: 'auto',
                              bgcolor: 'white',
                              borderRadius: 2,
                              border: '1px solid #e0e0e0',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                              '&::-webkit-scrollbar': {
                                width: '6px'
                              },
                              '&::-webkit-scrollbar-track': {
                                background: '#f1f1f1',
                                borderRadius: '3px'
                              },
                              '&::-webkit-scrollbar-thumb': {
                                background: '#c1c1c1',
                                borderRadius: '3px',
                                '&:hover': {
                                  background: '#a8a8a8'
                                }
                              }
                            }}
                          >
                            {loadingSuggestions ? (
                              <ListItem sx={{ py: 2 }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                  <Search sx={{ color: '#666', fontSize: 18 }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Recherche en cours..." 
                                  primaryTypographyProps={{
                                    color: '#666',
                                    fontSize: '0.9rem'
                                  }}
                                />
                              </ListItem>
                            ) : (
                              <List sx={{ py: 0 }}>
                                {searchSuggestions.map((field, index) => {
                                  // Mettre en évidence le texte recherché
                                  const highlightText = (text: string, query: string) => {
                                    if (!query) return text;
                                    const parts = text.split(new RegExp(`(${query})`, 'gi'));
                                    return parts.map((part, i) => 
                                      part.toLowerCase() === query.toLowerCase() ? 
                                        <Box component="span" key={i} sx={{ fontWeight: 'bold', color: '#1B5E20' }}>{part}</Box> : 
                                        part
                                    );
                                  };
                                  
                                  return (
                                    <ListItem
                                      key={field.id}
                                      component="div"
                                      sx={{
                                        py: 1.2,
                                        px: 2,
                                        borderBottom: index < searchSuggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        '&:last-child': {
                                          borderBottom: 'none'
                                        }
                                      }}
                                    >
                                      <ListItemIcon sx={{ minWidth: 35 }}>
                                        <Search sx={{ color: '#999', fontSize: 16 }} />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ color: '#333', fontSize: '0.9rem' }}>
                                              {highlightText(field.name, searchTerm)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem' }}>
                                              dans {field.city}
                                            </Typography>
                                          </Box>
                                        }
                                        secondary={
                                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.8rem' }}>
                                            {field.price_per_hour} FCFA/heure
                                          </Typography>
                                        }
                                      />
                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleSuggestionSelect(field)}
                                        sx={{
                                          bgcolor: '#1B5E20',
                                          color: 'white',
                                          fontSize: '0.75rem',
                                          px: 2,
                                          py: 0.5,
                                          minWidth: 'auto',
                                          '&:hover': {
                                            bgcolor: '#2E7D32'
                                          }
                                        }}
                                      >
                                        Détails
                                      </Button>
                                    </ListItem>
                                  );
                                })}
                              </List>
                            )}
                          </Paper>
                        )}
                      </Box>
                    </ClickAwayListener>
                  </Box>

                  {/* Filtre localisation */}
                  <Box
                    onClick={handleCityMenuClick}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      minWidth: { xs: 'auto', sm: 200 },
                      bgcolor: 'rgba(255,255,255,0.08)',
                      borderRadius: 4,
                      border: '1px solid rgba(255,255,255,0.12)',
                      px: 3,
                      py: 2,
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                        transition: 'left 0.6s ease'
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.15)',
                        borderColor: 'rgba(255,255,255,0.25)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)',
                        '&::before': {
                          left: '100%'
                        }
                      },
                      '&:active': {
                        transform: 'translateY(0px)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <LocationOn sx={{ fontSize: 20, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.85rem',
                          fontWeight: 400,
                          mb: 0.5,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Ville
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          letterSpacing: '0.3px'
                        }}
                      >
                        {selectedCity}
                      </Typography>
                    </Box>
                    <KeyboardArrowDown 
                      sx={{ 
                        fontSize: 24, 
                        color: 'rgba(255,255,255,0.8)',
                        transform: isCityMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }} 
                    />
                  </Box>
                </Box>
                
                {/* Menu déroulant des villes */}
                <Menu
                  anchorEl={cityMenuAnchor}
                  open={isCityMenuOpen}
                  onClose={handleCityMenuClose}
                  TransitionComponent={Fade}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  {loadingCities ? (
                    <MenuItem disabled sx={{ py: 1.5, px: 2, fontSize: '1rem' }}>
                      Chargement des villes...
                    </MenuItem>
                  ) : (
                    cities.map((city) => (
                      <MenuItem
                        key={city}
                        onClick={() => handleCitySelect(city)}
                        selected={city === selectedCity}
                        sx={{
                          py: 1.5,
                          px: 2,
                          fontSize: '1rem',
                          fontWeight: city === selectedCity ? 600 : 400,
                          color: city === selectedCity ? '#1B5E20' : '#333',
                          '&:hover': {
                            bgcolor: 'rgba(27, 94, 32, 0.08)',
                            color: '#1B5E20'
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(27, 94, 32, 0.12)',
                            '&:hover': {
                              bgcolor: 'rgba(27, 94, 32, 0.16)'
                            }
                          }
                        }}
                      >
                        <LocationOn sx={{ fontSize: 18, mr: 1.5, color: 'inherit' }} />
                        {city}
                      </MenuItem>
                    ))
                  )}
                </Menu>
              </Box>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* Statistiques */}
      <Container maxWidth="lg" sx={{ mt: -10, position: 'relative', zIndex: 3 }}>
        <Paper
          sx={{
            p: 5,
            borderRadius: 4,
            boxShadow: '0 25px 80px rgba(0,0,0,0.08)',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid rgba(255,255,255,0.8)'
          }}
        >
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid size={{ xs: 6, md: 3 }} key={index}>
                <Box sx={{ 
                  textAlign: 'center',
                  p: 3,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
                  }
                }}>
                  <Avatar
                    sx={{
                      bgcolor: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                      width: 72,
                      height: 72,
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 25px rgba(27, 94, 32, 0.3)'
                    }}
                  >
                    {React.cloneElement(stat.icon, { sx: { fontSize: 32 } })}
                  </Avatar>
                  <Typography variant="h3" fontWeight="800" color="primary" sx={{ mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" fontWeight="500">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>


      {/* Section Caractéristiques */}
      <Box sx={{ 
        background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 50%, #f1f3f4 100%)', 
        py: 10,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23e8f5e8" fill-opacity="0.4"%3E%3Cpath d="M20 20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8zm0-20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8z"/%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.5
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 700, color: '#1B5E20', mb: 2 }}>
              {t('home.whyChooseUs', 'Pourquoi nous choisir')}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontWeight: 400 }}>
              Découvrez les avantages qui font de nous le leader de la réservation de terrains au Sénégal
            </Typography>
          </Box>
          
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 4,
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                border: '1px solid rgba(27, 94, 32, 0.1)',
                transition: 'all 0.4s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 50px rgba(27, 94, 32, 0.15)',
                  borderColor: 'rgba(27, 94, 32, 0.2)'
                }
              }}>
                <Box sx={{ 
                  bgcolor: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
                  borderRadius: '50%',
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <SportsSoccer sx={{ fontSize: 40, color: '#1B5E20' }} />
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1B5E20' }}>
                  {t('home.features.quality', 'Terrains de qualité')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {t('home.features.qualityDesc', 'Des terrains de football modernes et bien entretenus pour une expérience de jeu optimale.')}
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 4,
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                border: '1px solid rgba(27, 94, 32, 0.1)',
                transition: 'all 0.4s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 50px rgba(27, 94, 32, 0.15)',
                  borderColor: 'rgba(27, 94, 32, 0.2)'
                }
              }}>
                <Box sx={{ 
                  bgcolor: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
                  borderRadius: '50%',
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <Event sx={{ fontSize: 40, color: '#1B5E20' }} />
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1B5E20' }}>
                  {t('home.features.booking', 'Réservation facile')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {t('home.features.bookingDesc', 'Système de réservation simple et rapide avec confirmation instantanée.')}
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 4,
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                border: '1px solid rgba(27, 94, 32, 0.1)',
                transition: 'all 0.4s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 50px rgba(27, 94, 32, 0.15)',
                  borderColor: 'rgba(27, 94, 32, 0.2)'
                }
              }}>
                <Box sx={{ 
                  bgcolor: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
                  borderRadius: '50%',
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <Payment sx={{ fontSize: 40, color: '#1B5E20' }} />
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1B5E20' }}>
                  {t('home.features.payment', 'Paiement sécurisé')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {t('home.features.paymentDesc', 'Multiples options de paiement sécurisées avec Stripe, WAVE et Orange Money.')}
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 4,
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                border: '1px solid rgba(27, 94, 32, 0.1)',
                transition: 'all 0.4s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 50px rgba(27, 94, 32, 0.15)',
                  borderColor: 'rgba(27, 94, 32, 0.2)'
                }
              }}>
                <Box sx={{ 
                  bgcolor: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
                  borderRadius: '50%',
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <NotificationsActive sx={{ fontSize: 40, color: '#1B5E20' }} />
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1B5E20' }}>
                  {t('home.features.notifications', 'Notifications')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {t('home.features.notificationsDesc', 'Recevez des rappels et des mises à jour importantes par email et SMS.')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Section Services */}
      <Box sx={{ 
        py: 10, 
        background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.6
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom 
              sx={{ fontWeight: 700, color: 'white', mb: 2 }}
            >
              Nos services de sport au Sénégal
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 600, mx: 'auto', fontWeight: 400 }}>
              Une plateforme complète pour tous vos besoins sportifs
            </Typography>
          </Box>
          
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ 
                height: '100%', 
                textAlign: 'center', 
                p: 5,
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.8)',
                transition: 'all 0.4s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.15)'
                }
              }}>
                <Box sx={{ 
                  bgcolor: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
                  borderRadius: '50%',
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 4
                }}>
                  <SportsSoccer sx={{ fontSize: 50, color: '#1B5E20' }} />
                </Box>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1B5E20', mb: 3 }}>
                  Réservation de terrains
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.7, mb: 4 }}>
                  Réservez facilement vos terrains de football préférés en quelques clics avec notre système moderne.
                </Typography>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => navigate('/fields')}
                  sx={{
                    bgcolor: '#1B5E20',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    boxShadow: '0 8px 25px rgba(27, 94, 32, 0.3)',
                    '&:hover': {
                      bgcolor: '#2E7D32',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 35px rgba(27, 94, 32, 0.4)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Réserver maintenant
                </Button>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ 
                height: '100%', 
                textAlign: 'center', 
                p: 5,
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.8)',
                transition: 'all 0.4s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.15)'
                }
              }}>
                <Box sx={{ 
                  bgcolor: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
                  borderRadius: '50%',
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 4
                }}>
                  <EmojiEvents sx={{ fontSize: 50, color: '#FFC107' }} />
                </Box>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1B5E20', mb: 3 }}>
                  Tournois
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.7, mb: 4 }}>
                  Participez à des tournois organisés et affrontez d'autres équipes dans un esprit de compétition saine.
                </Typography>
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{
                    bgcolor: '#FFC107',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    boxShadow: '0 8px 25px rgba(255, 193, 7, 0.3)',
                    '&:hover': {
                      bgcolor: '#FFB300',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 35px rgba(255, 193, 7, 0.4)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Voir les tournois
                </Button>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ 
                height: '100%', 
                textAlign: 'center', 
                p: 5,
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.8)',
                transition: 'all 0.4s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.15)'
                }
              }}>
                <Box sx={{ 
                  bgcolor: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
                  borderRadius: '50%',
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 4
                }}>
                  <WorkspacePremium sx={{ fontSize: 50, color: '#D32F2F' }} />
                </Box>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1B5E20', mb: 3 }}>
                  Championnat
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.7, mb: 4 }}>
                  Participez à nos championnats officiels et montrez vos talents sur le terrain pour remporter des trophées.
                </Typography>
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{
                    bgcolor: '#D32F2F',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    boxShadow: '0 8px 25px rgba(211, 47, 47, 0.3)',
                    '&:hover': {
                      bgcolor: '#C62828',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 35px rgba(211, 47, 47, 0.4)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Voir les championnats
                </Button>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
