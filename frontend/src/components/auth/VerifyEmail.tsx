import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
// Import direct pour éviter les problèmes de résolution de type
import userAPI from '../../services/api/userAPI';
// Utiliser userAPI au lieu de authAPI pour la compatibilité des types
const authAPI = userAPI;

const VerifyEmail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage(t('auth.verifyEmail.invalidToken', 'Token invalide ou manquant.'));
        return;
      }

      try {
        await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(t('auth.verifyEmail.success'));
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        if (err.response) {
          // Token expiré
          if (err.response.status === 410) {
            setStatus('expired');
            setMessage(t('auth.verifyEmail.expired'));
          } else {
            setStatus('error');
            setMessage(err.response.data?.message || t('auth.verifyEmail.error'));
          }
        } else {
          setStatus('error');
          setMessage(t('common.unexpectedError'));
        }
      }
    };

    verifyEmail();
  }, [location.search, navigate, t]);

  // Demander un nouveau lien de vérification
  const handleResendVerification = async () => {
    try {
      setStatus('verifying');
      const searchParams = new URLSearchParams(location.search);
      const email = searchParams.get('email');
      
      if (!email) {
        setStatus('error');
        setMessage(t('auth.verifyEmail.missingEmail', 'Adresse email manquante.'));
        return;
      }
      
      await authAPI.resendVerificationEmail(email);
      setStatus('success');
      setMessage(t('auth.verifyEmail.resendSuccess', 'Un nouveau lien de vérification a été envoyé à votre adresse email.'));
    } catch (err: any) {
      setStatus('error');
      if (err.response && err.response.data) {
        setMessage(err.response.data.message || t('common.unexpectedError'));
      } else {
        setMessage(t('common.unexpectedError'));
      }
    }
  };

  // Rendu en fonction du statut
  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <>
            <CircularProgress size={60} sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              {t('auth.verifyEmail.checking')}
            </Typography>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircleOutline color="success" sx={{ fontSize: 80, my: 2 }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 3 }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/login"
            >
              {t('auth.verifyEmail.login')}
            </Button>
          </>
        );
      case 'expired':
        return (
          <>
            <ErrorOutline color="error" sx={{ fontSize: 80, my: 2 }} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleResendVerification}
              sx={{ mt: 3 }}
            >
              {t('auth.verifyEmail.resendLink', 'Renvoyer le lien de vérification')}
            </Button>
          </>
        );
      case 'error':
      default:
        return (
          <>
            <ErrorOutline color="error" sx={{ fontSize: 80, my: 2 }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 3 }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/login"
            >
              {t('auth.verifyEmail.login')}
            </Button>
          </>
        );
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {t('auth.verifyEmail.title')}
        </Typography>
        
        {renderContent()}
      </Paper>
    </Container>
  );
};

export default VerifyEmail;
