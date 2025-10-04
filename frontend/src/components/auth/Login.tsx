import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, error, loading, clearError, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [authReset, setAuthReset] = useState(false);
  
  // Vérifier si l'utilisateur a été déconnecté en raison d'une session expirée ou réinitialisée
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('expired') === 'true') {
      setSessionExpired(true);
      // Nettoyer l'URL pour éviter que le message ne réapparaîsse après rafraîchissement
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Détecter une réinitialisation d'authentification
    if (urlParams.get('reset') === 'true') {
      setAuthReset(true);
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // S'assurer que le localStorage est vide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // Écouter l'événement de déconnexion global
    const handleLogout = () => {
      setSessionExpired(true);
      clearError(); // Effacer les erreurs précédentes
    };
    
    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, []);
  
  // Effet de redirection après connexion réussie ou si déjà authentifié
  React.useEffect(() => {
    // Si l'utilisateur est déjà authentifié, rediriger immédiatement
    if (isAuthenticated) {
      // Vérifier s'il y a une URL de redirection dans localStorage
      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
      
      console.log("Utilisateur déjà authentifié, redirection vers:", redirectPath);
      
      // Nettoyer le localStorage après utilisation
      localStorage.removeItem('redirectAfterLogin');
      
      // Utiliser replace au lieu de push pour éviter les problèmes de navigation arrière
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Effet séparé pour gérer la redirection après connexion réussie
  React.useEffect(() => {
    if (loginSuccess) {
      // Vérifier s'il y a une URL de redirection dans localStorage
      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
      
      console.log("Connexion réussie, redirection vers:", redirectPath);
      
      // Nettoyer le localStorage après utilisation
      localStorage.removeItem('redirectAfterLogin');
      
      navigate(redirectPath, { replace: true });
    }
  }, [loginSuccess, navigate]);

  // Validation schema avec Yup
  const validationSchema = Yup.object({
    email: Yup.string()
      .email(t('common.invalidEmail'))
      .required(t('common.required')),
    password: Yup.string()
      .required(t('common.required'))
  });

  // Gestion du formulaire avec Formik
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        console.log('Tentative de connexion avec:', values.email);
        await login(values.email, values.password);
        console.log('Connexion réussie, activation du flag de redirection...');
        // Activer l'indicateur de connexion réussie pour déclencher la redirection via useEffect
        setLoginSuccess(true);
      } catch (err) {
        console.error('Erreur de connexion:', err);
        // L'erreur est déjà gérée dans le contexte d'authentification
      }
    }
  });

  // Toggle pour afficher/masquer le mot de passe
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f0f2f5'
    }}>
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2
        }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Connexion
          </Typography>
          
          {/* Affichage des erreurs */}
          {error && (
            <Box sx={{ mt: 1, mb: 2, width: '100%' }}>
              <Alert severity="error" onClose={clearError}>
                {error}
              </Alert>
            </Box>
          )}
          
          {/* Message de session expirée */}
          {sessionExpired && !error && (
            <Box sx={{ mt: 1, mb: 2, width: '100%' }}>
              <Alert severity="warning">
                Votre session a expiré. Veuillez vous reconnecter.
              </Alert>
            </Box>
          )}
          
          {/* Message de réinitialisation d'authentification */}
          {authReset && !error && !sessionExpired && (
            <Box sx={{ mt: 1, mb: 2, width: '100%' }}>
              <Alert severity="info">
                Nous avons détecté un problème avec votre session. L'état d'authentification a été réinitialisé. Veuillez vous reconnecter.
              </Alert>
            </Box>
          )}
          
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Nom d'utilisateur"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1d693b',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1d693b',
                  },
                },
                '& .MuiFormLabel-root.Mui-focused': {
                  color: '#1d693b',
                },
                bgcolor: '#fafafa'
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1d693b',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1d693b',
                  },
                },
                '& .MuiFormLabel-root.Mui-focused': {
                  color: '#1d693b',
                },
                bgcolor: '#fafafa'
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                bgcolor: '#1d693b', 
                '&:hover': {
                  bgcolor: '#14532d'
                },
                py: 1.5
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Se connecter"}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Vous n'avez pas de compte ?{' '}
                <Link to="/register" style={{ textDecoration: 'none', color: '#1d693b', fontWeight: 500 }}>
                  S'inscrire
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
