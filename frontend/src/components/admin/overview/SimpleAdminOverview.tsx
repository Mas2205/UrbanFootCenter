import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  CardActionArea
} from '@mui/material';
import {
  SportsSoccer,
  People,
  Payments,
  LocalOffer,
  Assessment,
  Groups,
  Settings,
  Inventory,
  Notifications
} from '@mui/icons-material';

const SimpleAdminOverview: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Définition des cartes de fonctionnalités
  const featureCards = [
    {
      title: 'Gestion des terrains',
      description: 'Administrer les terrains du réseau',
      icon: <SportsSoccer sx={{ fontSize: 40, color: '#1d693b' }} />,
      path: '/admin/fields',
      access: ['admin', 'super_admin']
    },
    {
      title: "Création d'admin terrain",
      description: 'Créer de nouveaux comptes administrateurs',
      icon: <People sx={{ fontSize: 40, color: '#1d693b' }} />,
      path: '/admin/users/create',
      access: ['super_admin']
    },
    {
      title: "Création d'admin fournisseur",
      description: 'Créer des comptes fournisseurs',
      icon: <Inventory sx={{ fontSize: 40, color: '#1d693b' }} />,
      path: '/admin/suppliers/create',
      access: ['super_admin']
    },
    {
      title: 'Gestion des docteurs',
      description: 'Administrer les comptes médecins',
      icon: <People sx={{ fontSize: 40, color: '#1d693b' }} />,
      path: '/admin/users/doctors',
      access: ['super_admin']
    },
    {
      title: 'Gestion des clients',
      description: 'Gérer les comptes clients',
      icon: <People sx={{ fontSize: 40, color: '#1d693b' }} />,
      path: '/admin/users/clients',
      access: ['super_admin', 'admin']
    },
    {
      title: 'Gestion des paiements',
      description: 'Suivi et gestion des transactions',
      icon: <Payments sx={{ fontSize: 40, color: '#1d693b' }} />,
      path: '/admin/payments',
      access: ['super_admin', 'admin']
    },
    {
      title: 'Statistiques',
      description: 'Tableaux de bord et rapports',
      icon: <Assessment sx={{ fontSize: 40, color: '#1d693b' }} />,
      path: '/admin/reports',
      access: ['super_admin', 'admin']
    },
    {
      title: 'Gestion des promotions',
      description: 'Créer et gérer des promotions',
      icon: <LocalOffer sx={{ fontSize: 40, color: '#1d693b' }} />,
      path: '/admin/promotions',
      access: ['super_admin']
    }
  ];
  
  // Filtrer les cartes en fonction du rôle de l'utilisateur
  const filteredCards = featureCards.filter(
    card => card.access.includes(user?.role || '')
  );

  return (
    <Box>
      {/* Bannière de bienvenue */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          backgroundColor: '#1d693b',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" gutterBottom>
          Bienvenue {isSuperAdmin ? 'Super Administrateur' : 'Administrateur'}
        </Typography>
        <Typography variant="body1">
          dans URBAN FOOT CENTER - Votre partenaire pour une gestion sportive optimale
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          En tant que {isSuperAdmin ? 'Super Administrateur' : 'Administrateur'}, vous disposez d'outils puissants pour gérer efficacement vos activités.
          {isSuperAdmin ? " Vous supervisez l'ensemble du système URBAN FOOT CENTER pour tous les terrains." : ""}
        </Typography>
        <Button 
          variant="contained" 
          sx={{ 
            mt: 2, 
            bgcolor: 'white', 
            color: '#1d693b',
            '&:hover': {
              bgcolor: '#e0e0e0',
            }
          }}
        >
          {isSuperAdmin ? 'Super Administrateur' : 'Administrateur'}
        </Button>
      </Paper>
      
      {/* Fonctionnalités disponibles */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, borderBottom: '2px solid #1d693b', pb: 1 }}>
        Fonctionnalités disponibles
      </Typography>
      
      <Grid container spacing={3}>
        {filteredCards.map((card, index) => (
          <Grid key={index} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardActionArea 
                onClick={() => navigate(card.path)}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start', 
                  justifyContent: 'flex-start'
                }}
              >
                <CardContent sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {card.icon}
                  </Box>
                  <Typography gutterBottom variant="h6" component="h3">
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                  <Box sx={{ mt: 2, textAlign: 'left' }}>
                    <Typography 
                      variant="body2" 
                      color="#1d693b" 
                      sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      Accéder →
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SimpleAdminOverview;
