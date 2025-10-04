import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Home } from '@mui/icons-material';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
          py: 8
        }}
      >
        <Typography variant="h1" component="h1" sx={{ fontSize: '8rem', fontWeight: 700, color: '#1d693b' }}>
          404
        </Typography>
        
        <Typography variant="h4" component="h2" sx={{ mb: 4 }}>
          {t('common.pageNotFound', 'Page non trouvée')}
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4, maxWidth: '600px' }}>
          {t('common.pageNotFoundDescription', "La page que vous recherchez n'existe pas ou a été déplacée.")}
        </Typography>
        
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          startIcon={<Home />}
          size="large"
          sx={{
            bgcolor: '#1d693b',
            '&:hover': {
              bgcolor: '#155a30',
            }
          }}
        >
          {t('common.returnToHome', "Retour à l'accueil")}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
