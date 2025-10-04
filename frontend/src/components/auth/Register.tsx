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
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, error, loading, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Étapes d'inscription
  const steps = [
    t('auth.register.personalInfo', 'Informations personnelles'),
    t('auth.register.accountInfo', 'Informations du compte'),
    t('auth.register.confirmation', 'Confirmation')
  ];

  // Validation schema avec Yup
  const validationSchema = [
    // Étape 1: Informations personnelles
    Yup.object({
      firstName: Yup.string()
        .required(t('common.required'))
        .min(2, t('common.minLength', 'Doit contenir au moins {{count}} caractères', { count: 2 })),
      lastName: Yup.string()
        .required(t('common.required'))
        .min(2, t('common.minLength', 'Doit contenir au moins {{count}} caractères', { count: 2 })),
      phone: Yup.string()
        .required(t('common.required'))
        .matches(/^\+?[0-9]{8,15}$/, t('common.invalidPhone', 'Numéro de téléphone invalide'))
    }),
    
    // Étape 2: Informations du compte
    Yup.object({
      email: Yup.string()
        .email(t('common.invalidEmail'))
        .required(t('common.required')),
      password: Yup.string()
        .min(8, t('common.passwordLength'))
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
          t('common.passwordRequirements', 'Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule et un chiffre')
        )
        .required(t('common.required')),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], t('common.passwordMatch'))
        .required(t('common.required'))
    }),
    
    // Étape 3: Confirmation
    Yup.object({
      termsAccepted: Yup.boolean()
        .oneOf([true], t('common.termsRequired', 'Vous devez accepter les conditions générales'))
    })
  ];

  // Gestion du formulaire avec Formik
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false
    },
    validationSchema: validationSchema[activeStep],
    validateOnMount: false,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      if (activeStep < steps.length - 1) {
        // Valider l'étape actuelle avant de passer à la suivante
        try {
          await validationSchema[activeStep].validate(values, { abortEarly: false });
          setActiveStep(activeStep + 1);
        } catch (error) {
          if (error instanceof Yup.ValidationError) {
            const fieldErrors: Record<string, string> = {};
            error.inner.forEach((err) => {
              if (err.path) {
                fieldErrors[err.path] = err.message;
              }
            });
            formik.setErrors(fieldErrors);
          }
        }
      } else {
        // Soumettre le formulaire à la dernière étape
        if (!values.termsAccepted) {
          formik.setFieldError('termsAccepted', t('common.termsRequired', 'Vous devez accepter les conditions générales'));
          return;
        }
        try {
          const { confirmPassword, termsAccepted, ...userData } = values;
          await register(userData);
          setRegistrationSuccess(true);
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } catch (err) {
          // L'erreur est déjà gérée dans le contexte d'authentification
        }
      }
    }
  });

  // Toggle pour afficher/masquer le mot de passe
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Gérer le retour à l'étape précédente
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  // Rendu des étapes du formulaire
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label={t('auth.register.firstName')}
              name="firstName"
              autoComplete="given-name"
              autoFocus
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.firstName && Boolean(formik.errors.firstName)}
              helperText={formik.touched.firstName && formik.errors.firstName}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label={t('auth.register.lastName')}
              name="lastName"
              autoComplete="family-name"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.lastName && Boolean(formik.errors.lastName)}
              helperText={formik.touched.lastName && formik.errors.lastName}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="phone"
              label={t('auth.register.phone')}
              name="phone"
              autoComplete="tel"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('auth.register.email')}
              name="email"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('auth.register.password')}
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
              label={t('auth.register.confirmPassword')}
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
          </>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('auth.register.reviewInfo', 'Vérifiez vos informations')}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
              <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="body2" color="textSecondary">
                  {t('auth.register.firstName')}
                </Typography>
                <Typography variant="body1">{formik.values.firstName}</Typography>
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="body2" color="textSecondary">
                  {t('auth.register.lastName')}
                </Typography>
                <Typography variant="body1">{formik.values.lastName}</Typography>
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="body2" color="textSecondary">
                  {t('auth.register.email')}
                </Typography>
                <Typography variant="body1">{formik.values.email}</Typography>
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="body2" color="textSecondary">
                  {t('auth.register.phone')}
                </Typography>
                <Typography variant="body1">{formik.values.phone}</Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <input
                  id="termsAccepted"
                  name="termsAccepted"
                  type="checkbox"
                  checked={formik.values.termsAccepted}
                  onChange={formik.handleChange}
                  style={{ marginRight: '10px' }}
                />
                <label htmlFor="termsAccepted">
                  <Typography variant="body2">
                    {t('auth.register.termsAgree', 'J\'accepte les conditions générales d\'utilisation et la politique de confidentialité')}
                  </Typography>
                </label>
              </Box>
              {formik.touched.termsAccepted && formik.errors.termsAccepted ? (
                <Typography color="error" variant="caption">
                  {formik.errors.termsAccepted as string}
                </Typography>
              ) : null}
              <Typography variant="body2" sx={{ mt: 2 }}>
                {t('auth.register.termsNotice', 'En vous inscrivant, vous acceptez nos conditions générales d\'utilisation et notre politique de confidentialité.')}
              </Typography>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {t('auth.register.title')}
        </Typography>

        <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {registrationSuccess ? (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {t('auth.register.success', 'Inscription réussie! Veuillez vérifier votre email pour activer votre compte.')}
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={clearError}>
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
              {renderStepContent(activeStep)}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0 || loading}
                  sx={{ mr: 1 }}
                >
                  {t('common.back')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : activeStep === steps.length - 1 ? (
                    t('common.submit')
                  ) : (
                    t('common.next')
                  )}
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Typography variant="body2">
                  {t('auth.register.haveAccount')}{' '}
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    {t('auth.register.login')}
                  </Link>
                </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Register;
