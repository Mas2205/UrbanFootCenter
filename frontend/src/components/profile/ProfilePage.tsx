import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment
} from '@mui/material';
import {
  Person,
  Edit,
  Visibility,
  VisibilityOff,
  Save,
  Phone,
  Email,
  Lock,
  Badge
} from '@mui/icons-material';
import { useAuth } from '../../contexts';
// Import direct pour éviter les problèmes de résolution de type
import userAPI from '../../services/api/userAPI';

// Types
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Composant pour les onglets
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  
  // États
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Validation schema pour le formulaire de profil
  const profileValidationSchema = yup.object({
    firstName: yup.string().required(t('profile.firstNameRequired')),
    lastName: yup.string().required(t('profile.lastNameRequired')),
    email: yup.string().email(t('profile.invalidEmail')).required(t('profile.emailRequired')),
    phone: yup.string().required(t('profile.phoneRequired'))
      .matches(/^\+?[0-9]{9,15}$/, t('profile.invalidPhone')),
  });
  
  // Validation schema pour le formulaire de mot de passe
  const passwordValidationSchema = yup.object({
    currentPassword: yup.string().required(t('profile.currentPasswordRequired')),
    newPassword: yup.string()
      .required(t('profile.newPasswordRequired'))
      .min(8, t('profile.passwordMinLength'))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        t('profile.passwordRequirements')
      ),
    confirmPassword: yup.string()
      .required(t('profile.confirmPasswordRequired'))
      .oneOf([yup.ref('newPassword')], t('profile.passwordsMustMatch')),
  });
  
  // Initialisation du formulaire de profil
  const profileFormik = useFormik<ProfileFormValues>({
    initialValues: {
      firstName: user?.first_name || user?.firstName || '',
      lastName: user?.last_name || user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone_number || user?.phone || '',
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setUpdateError(null);
        setUpdateSuccess(false);
        
        await userAPI.updateProfile(values);
        updateUser({ ...user, ...values });
        
        setUpdateSuccess(true);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setUpdateError(t('profile.updateError'));
        console.error('Error updating profile:', err);
      }
    },
  });
  
  // Initialisation du formulaire de mot de passe
  const passwordFormik = useFormik<PasswordFormValues>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setPasswordError(null);
        setPasswordSuccess(false);
        
        await userAPI.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        
        setPasswordSuccess(true);
        setLoading(false);
        
        // Réinitialiser le formulaire
        passwordFormik.resetForm();
      } catch (err) {
        setLoading(false);
        setPasswordError(t('profile.passwordUpdateError'));
        console.error('Error updating password:', err);
      }
    },
  });
  
  // Mettre à jour les valeurs du formulaire lorsque l'utilisateur change
  useEffect(() => {
    if (user) {
      profileFormik.setValues({
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        email: user.email || '',
        phone: user.phone_number || user.phone || '',
      });
    }
  }, [user]);
  
  // Gestion du changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Réinitialiser les messages de succès et d'erreur
    setUpdateSuccess(false);
    setUpdateError(null);
    setPasswordSuccess(false);
    setPasswordError(null);
  };
  
  // Supprimer le compte utilisateur
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await userAPI.deleteAccount();
      setDeleteDialogOpen(false);
      setLoading(false);
      
      // Déconnexion et redirection
      logout();
      navigate('/');
    } catch (err) {
      setLoading(false);
      setUpdateError(t('profile.deleteError'));
      console.error('Error deleting account:', err);
    }
  };
  
  // Si l'utilisateur n'est pas défini (ne devrait jamais arriver grâce à ProtectedRoute)
  if (!user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('profile.title')}
        </Typography>
        
        {/* En-tête du profil */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'primary.main',
                fontSize: '2.5rem',
                mr: 3
              }}
            >
              {(user.first_name || user.firstName)?.charAt(0)}{(user.last_name || user.lastName)?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5">
                {(user.first_name || user.firstName)} {(user.last_name || user.lastName)}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {user.email}
              </Typography>
              <Typography variant="body2">
                {t('profile.member')} {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        
        {/* Onglets du profil */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="profile tabs"
          >
            <Tab icon={<Person />} iconPosition="start" label={t('profile.personalInfo')} id="profile-tab-0" />
            <Tab icon={<Lock />} iconPosition="start" label={t('profile.security')} id="profile-tab-1" />
          </Tabs>
        </Box>
        
        {/* Informations personnelles */}
        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={profileFormik.handleSubmit}>
            {updateSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {t('profile.updateSuccess')}
              </Alert>
            )}
            
            {updateError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {updateError}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  fullWidth
                  id="firstName"
                  name="firstName"
                  label={t('profile.firstName')}
                  value={profileFormik.values.firstName}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  error={profileFormik.touched.firstName && Boolean(profileFormik.errors.firstName)}
                  helperText={profileFormik.touched.firstName && profileFormik.errors.firstName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Badge />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  fullWidth
                  id="lastName"
                  name="lastName"
                  label={t('profile.lastName')}
                  value={profileFormik.values.lastName}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  error={profileFormik.touched.lastName && Boolean(profileFormik.errors.lastName)}
                  helperText={profileFormik.touched.lastName && profileFormik.errors.lastName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Badge />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label={t('profile.email')}
                  value={profileFormik.values.email}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                  helperText={profileFormik.touched.email && profileFormik.errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  fullWidth
                  id="phone"
                  name="phone"
                  label={t('profile.phone')}
                  value={profileFormik.values.phone}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  error={profileFormik.touched.phone && Boolean(profileFormik.errors.phone)}
                  helperText={profileFormik.touched.phone && profileFormik.errors.phone}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<Save />}
                disabled={loading || !profileFormik.dirty}
              >
                {loading ? <CircularProgress size={24} /> : t('common.save')}
              </Button>
            </Box>
          </Box>
        </TabPanel>
        
        {/* Sécurité */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            {t('profile.changePassword')}
          </Typography>
          
          <Box component="form" onSubmit={passwordFormik.handleSubmit}>
            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {t('profile.passwordUpdateSuccess')}
              </Alert>
            )}
            
            {passwordError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {passwordError}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  id="currentPassword"
                  name="currentPassword"
                  label={t('profile.currentPassword')}
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordFormik.values.currentPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                  helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  id="newPassword"
                  name="newPassword"
                  label={t('profile.newPassword')}
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordFormik.values.newPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                  helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label={t('profile.confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordFormik.values.confirmPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                  helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : t('profile.updatePassword')}
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 4 }} />
          
          {/* Zone de danger */}
          <Typography variant="h6" color="error" gutterBottom>
            {t('profile.dangerZone')}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('profile.deleteWarning')}
          </Typography>
          
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t('profile.deleteAccount')}
          </Button>
        </TabPanel>
      </Box>
      
      {/* Boîte de dialogue de confirmation de suppression de compte */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle color="error">{t('profile.confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('profile.deleteConfirmText')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDeleteAccount} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : t('profile.confirmDeleteButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
