import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import { useAuth } from '../../contexts';

const Unauthorized: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Rediriger automatiquement après un court délai si l'utilisateur est authentifié
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (user) {
      // Si l'utilisateur est authentifié, essayons de le rediriger vers
      // la page appropriée après une brève pause
      timer = setTimeout(() => {
        if (user.role === 'admin' || user.role === 'super_admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 3000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user, navigate]);

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Box sx={{ mb: 2 }}>
          <ErrorOutlineIcon sx={{ fontSize: 60, color: 'error.main' }} />
        </Box>
        
        <Typography variant="h4" component="h1" color="primary.main" gutterBottom fontWeight="bold">
          {t('common.unauthorized.title', 'Accès refusé')}
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          {t('common.unauthorized.message', 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.')}
        </Typography>

        <Typography variant="body2" sx={{ mb: 4, fontStyle: 'italic', color: 'text.secondary' }}>
          {user ? t('common.unauthorized.redirectMessage', 'Vous serez redirigé automatiquement dans quelques secondes...') : ''}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            {t('common.unauthorized.backHome', 'Retour à l\'accueil')}
          </Button>
          
          {!user && (
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => navigate('/login')}
            >
              {t('common.unauthorized.login', 'Se connecter')}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Unauthorized;
