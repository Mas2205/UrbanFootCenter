import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
// Import direct pour éviter les problèmes de résolution de type
import userAPI from '../../services/api/userAPI';
// Utiliser userAPI au lieu de authAPI pour la compatibilité des types
const authAPI = userAPI;

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validation schema avec Yup
  const validationSchema = Yup.object({
    email: Yup.string()
      .email(t('common.invalidEmail'))
      .required(t('common.required'))
  });

  // Gestion du formulaire avec Formik
  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        await authAPI.requestPasswordReset(values.email);
        setSuccess(true);
        setLoading(false);
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

  // Effacer les messages d'erreur
  const clearError = () => {
    setError(null);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {t('auth.forgotPassword.title')}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}
        
        {success ? (
          <>
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {t('auth.forgotPassword.success', 'Un lien de réinitialisation a été envoyé à votre adresse email.')}
            </Alert>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="outlined" color="primary">
                  {t('auth.forgotPassword.backToLogin')}
                </Button>
              </Link>
            </Box>
          </>
        ) : (
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('auth.forgotPassword.instruction')}
            </Typography>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('auth.forgotPassword.email')}
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : t('auth.forgotPassword.submit')}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
