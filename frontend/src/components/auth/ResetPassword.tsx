import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
// Import direct pour éviter les problèmes de résolution de type
import userAPI from '../../services/api/userAPI';
// Utiliser userAPI au lieu de authAPI pour la compatibilité des types
const authAPI = userAPI;

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Extraire le token du paramètre d'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const resetToken = searchParams.get('token');
    
    if (!resetToken) {
      setError(t('auth.resetPassword.invalidToken', 'Token invalide ou manquant.'));
      setVerifying(false);
      return;
    }

    // Vérifier la validité du token
    const verifyToken = async () => {
      try {
        await authAPI.verifyResetToken(resetToken);
        setToken(resetToken);
        setVerifying(false);
      } catch (err: any) {
        if (err.response && err.response.status === 410) {
          setError(t('auth.resetPassword.expiredToken', 'Ce lien a expiré. Veuillez demander un nouveau lien.'));
        } else {
          setError(t('auth.resetPassword.invalidToken', 'Token invalide ou expiré.'));
        }
        setVerifying(false);
      }
    };

    verifyToken();
  }, [location.search, t]);

  // Validation schema avec Yup
  const validationSchema = Yup.object({
    password: Yup.string()
      .min(8, t('common.passwordLength'))
      .required(t('common.required')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], t('common.passwordMatch'))
      .required(t('common.required'))
  });

  // Gestion du formulaire avec Formik
  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError(null);
        await authAPI.resetPassword(token, values.password);
        setSuccess(true);
        setLoading(false);
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        setLoading(false);
        if (err.response && err.response.data) {
          setError(err.response.data.message || t('common.unexpectedError'));
        } else {
          setError(t('common.unexpectedError'));
        }
      }
    }
  });

  // Toggle pour afficher/masquer le mot de passe
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Effacer les messages d'erreur
  const clearError = () => {
    setError(null);
  };

  // Afficher un loader pendant la vérification du token
  if (verifying) {
    return (
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            {t('auth.resetPassword.title')}
          </Typography>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            {t('common.loading')}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {t('auth.resetPassword.title')}
        </Typography>
        
        {error && (
          <>
            <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
            {error.includes('expiré') && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                  <Button variant="outlined" color="primary">
                    {t('auth.resetPassword.requestNewLink', 'Demander un nouveau lien')}
                  </Button>
                </Link>
              </Box>
            )}
          </>
        )}
        
        {success ? (
          <>
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {t('auth.resetPassword.success')}
            </Alert>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="contained" color="primary">
                  {t('auth.resetPassword.login')}
                </Button>
              </Link>
            </Box>
          </>
        ) : !error ? (
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('auth.resetPassword.newPassword')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
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
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label={t('auth.resetPassword.confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
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
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : t('auth.resetPassword.submit')}
            </Button>
          </Box>
        ) : null}
      </Paper>
    </Container>
  );
};

export default ResetPassword;
