import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import fieldAPI from '../../../services/api/fieldAPI';
import { 
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useTheme,
  Tab,
  Tabs,
  Tooltip,
  OutlinedInput,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  AlertColor
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
// Import direct du module userAPI (export par défaut)
import userAPI from '../../../services/api/userAPI';
import { API_BASE_URL } from '../../../config/constants';

// Configuration de l'API

// Types pour le composant
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'super_admin' | 'client' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fieldId?: string;
  emailVerified?: boolean;
  age?: number;
  sexe?: 'M' | 'F' | 'Autre';
  password?: string; // Mot de passe provisoire pour les nouveaux administrateurs
  
  // Ajouter les propriétés snake_case pour compatibilité avec le backend
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  is_verified?: boolean;
  field_id?: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  registered30days: number;
}

const AdminUsers: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  // États
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({});
  const [fields, setFields] = useState<any[]>([]);
  
  // États pour les notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');
  
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    registered30days: 0,
  });

  // Récupérer les terrains
  const fetchFields = async () => {
    try {
      const response = await fieldAPI.getAllFields();
      console.log('Terrains récupérés:', response);
      
      // Extraire les données en fonction de la structure de la réponse
      let fieldArray: any[] = [];
      
      if (response && Array.isArray(response)) {
        fieldArray = response;
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        fieldArray = response.data;
      } else if (response && typeof response === 'object' && 'data' in response && 
                typeof response.data === 'object' && response.data && 'data' in response.data && 
                Array.isArray(response.data.data)) {
        fieldArray = response.data.data;
      } else {
        console.error('Structure de données inattendue pour les terrains:', response);
        fieldArray = [];
      }
      
      setFields(fieldArray);
    } catch (error) {
      console.error('Erreur lors de la récupération des terrains:', error);
    }
  };

  // Récupérer les utilisateurs
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Vérifier si le token existe
      const token = localStorage.getItem('token');
      console.log('Token présent:', !!token);
      if (!token) {
        setError(t('admin.userManagement.authError') || 'Erreur d\'authentification. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }
      
      // Log de la requête pour debug
      console.log('API URL de base:', process.env.REACT_APP_API_BASE_URL);
      
      // Construire l'URL correcte en s'assurant qu'elle correspond à la structure de l'API
      // L'URL du backend est généralement configurée via les variables d'environnement
      const baseApiUrl = API_BASE_URL;
      const apiUrl = `${baseApiUrl}/admin/users`;
      
      console.log('URL API complète:', apiUrl);
      console.log('Headers:', { 'Authorization': `Bearer ${token.substring(0, 10)}...` });
      console.log('Params:', { page: 1, limit: 50, search: '' });
      
      // Utiliser axios directement pour éviter les problèmes de typage
      const response = await axios.get(apiUrl, {
        params: { page: 1, limit: 50, search: '' },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Log de la réponse pour le débogage
      console.log('Réponse API reçue:', response.status, response.statusText);
      console.log('Structure de la réponse:', Object.keys(response.data));
      
      // Extraire les données de la réponse - accéder au tableau users à l'intérieur de data
      const rawUserData = response.data.success ? (response.data.data?.users || []) : [];
      
      // Afficher les données brutes pour débogage
      console.log('Données utilisateurs brutes:', rawUserData);
      console.log('Premier utilisateur brut:', rawUserData.length > 0 ? rawUserData[0] : 'Aucun utilisateur');
      
      if (rawUserData.length > 0) {
        const firstUser = rawUserData[0];
        console.log('DÉBOGAGE - Téléphone:', firstUser.phone_number, 'Type:', typeof firstUser.phone_number);
        console.log('DÉBOGAGE - Rôle:', firstUser.role, 'Type:', typeof firstUser.role);
        console.log('DÉBOGAGE - Date création:', firstUser.created_at, 'Type:', typeof firstUser.created_at);
        console.log('DÉBOGAGE - Statut actif:', firstUser.is_active, 'Type:', typeof firstUser.is_active);
      }
      
      // Mappage manuel pour s'assurer que tous les champs sont correctement convertis
      const userData = rawUserData.map((user: any) => {
        const mappedUser = {
          id: user.id,
          firstName: user.firstName || user.first_name,
          lastName: user.lastName || user.last_name,
          email: user.email,
          phone: user.phone || user.phone_number,
          role: user.role,
          isActive: typeof user.isActive !== 'undefined' ? user.isActive : 
                   typeof user.is_active !== 'undefined' ? user.is_active : true,
          createdAt: user.createdAt || user.created_at,
          updatedAt: user.updatedAt || user.updated_at,
          emailVerified: typeof user.emailVerified !== 'undefined' ? user.emailVerified : 
                         typeof user.is_verified !== 'undefined' ? user.is_verified : false,
          fieldId: user.fieldId || user.field_id,
          // Ajouter les champs age et sexe
          age: user.age,
          sexe: user.sexe,
          
          // Copier explicitement les propriétés snake_case
          phone_number: user.phone_number,
          first_name: user.first_name,
          last_name: user.last_name,
          is_active: user.is_active,
          created_at: user.created_at,
          is_verified: user.is_verified
        };
        
        // Log pour chaque utilisateur
        console.log(`Utilisateur mappé ${mappedUser.id || 'inconnu'}:`, 
                   `Téléphone=${mappedUser.phone_number || mappedUser.phone || 'non défini'}`,
                   `Rôle=${mappedUser.role || 'non défini'}`,
                   `Date=${mappedUser.created_at || mappedUser.createdAt || 'non définie'}`);
                   
        return mappedUser;
      });
      
      console.log('Données utilisateurs mappées (premier utilisateur):', userData.length > 0 ? userData[0] : 'Aucun utilisateur');
      
      setUsers(userData);
      setFilteredUsers(userData);
      
      // Calculer les statistiques
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const userStats: UserStats = {
        total: userData.length,
        active: userData.filter((user: User) => user.isActive).length,
        inactive: userData.filter((user: User) => !user.isActive).length,
        admins: userData.filter((user: User) => user.role === 'admin' || user.role === 'super_admin').length,
        registered30days: userData.filter((user: User) => 
          new Date(user.createdAt) >= thirtyDaysAgo
        ).length,
      };
      
      setStats(userStats);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des utilisateurs', err);
      
      // Afficher plus d'informations sur l'erreur pour le débogage
      if (err.response) {
        // La réponse du serveur contient une erreur
        console.error('Réponse d\'erreur:', {
          data: err.response.data,
          status: err.response.status,
          headers: err.response.headers
        });
        setError(`Erreur ${err.response.status}: ${err.response.data?.message || 'Erreur lors de la récupération des utilisateurs'}`);
      } else if (err.request) {
        // La requête a été faite mais pas de réponse
        console.error('Pas de réponse reçue:', err.request);
        setError('Aucune réponse du serveur. Vérifiez votre connexion.');
      } else {
        // Erreur dans la configuration de la requête
        console.error('Erreur de configuration:', err.message);
        setError(`Erreur: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchFields();
  }, []);

  // Filtrer les utilisateurs lors du changement de la recherche
  useEffect(() => {
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(lowercasedSearch) ||
          user.lastName.toLowerCase().includes(lowercasedSearch) ||
          user.email.toLowerCase().includes(lowercasedSearch) ||
          user.phone.includes(searchTerm)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  // Gestionnaires de pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestionnaires d'actions
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };
  
  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
  };

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };
  
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Préparer les données à envoyer
      const userData = {
        first_name: selectedUser.firstName || selectedUser.first_name,
        last_name: selectedUser.lastName || selectedUser.last_name,
        email: selectedUser.email,
        phone_number: selectedUser.phone || selectedUser.phone_number,
        role: selectedUser.role,
        is_active: selectedUser.isActive !== undefined ? selectedUser.isActive : selectedUser.is_active,
        age: selectedUser.age,
        sexe: selectedUser.sexe
      };
      
      console.log('Envoi des données de mise à jour:', userData);
      
      // Appel de l'API pour mettre à jour l'utilisateur
      const response = await userAPI.updateUser(selectedUser.id, userData);
      
      console.log('Réponse API mise à jour utilisateur:', response);
      
      // Mettre à jour la liste des utilisateurs avec les données à jour
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { 
          ...user,
          ...response, // Utiliser directement response, pas response.data
          // S'assurer que les propriétés camelCase et snake_case sont à jour
          firstName: response.first_name || response.firstName,
          lastName: response.last_name || response.lastName,
          phone: response.phone_number || response.phone,
          isActive: response.is_active === true || response.isActive === true ? true : false, // Toujours boolean
          // Date en format ISO string
          createdAt: response.created_at || response.createdAt
        } : user
      ));
      
      // Mettre à jour également les utilisateurs filtrés
      setFilteredUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? { 
          ...user,
          ...response,
          firstName: response.first_name || response.firstName,
          lastName: response.last_name || response.lastName,
          phone: response.phone_number || response.phone,
          isActive: response.is_active === true || response.isActive === true ? true : false, // Toujours boolean
          createdAt: response.created_at || response.createdAt
        } : user
      ));
      
      setEditDialogOpen(false);
      
      // Notification de succès
      setSnackbarSeverity('success');
      setSnackbarMessage(t('admin.userManagement.userUpdated'));
      setSnackbarOpen(true);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      setSnackbarSeverity('error');
      setSnackbarMessage(error.response?.data?.message || t('admin.userManagement.errorUpdating'));
      setSnackbarOpen(true);
    }
  };

  // Gestionnaires pour l'ajout d'utilisateur
  const handleAddUser = () => {
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'user',
      isActive: true
    });
    setAddUserDialogOpen(true);
  };

  const handleCloseAddUserDialog = () => {
    setAddUserDialogOpen(false);
  };

  // Handler pour les champs texte
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setNewUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handler spécifique pour le Select MUI v5
  const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement> | any) => {
    const { name, value } = event.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async () => {
    try {
      // Vérification des champs obligatoires
      if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.phone) {
        setSnackbarSeverity('error');
        setSnackbarMessage(t('admin.userManagement.fieldsRequired'));
        setSnackbarOpen(true);
        return;
      }
      
      // Vérification du mot de passe pour les administrateurs
      if ((newUser.role === 'admin' || newUser.role === 'super_admin') && !newUser.password) {
        setSnackbarSeverity('error');
        setSnackbarMessage('Un mot de passe provisoire est obligatoire pour les administrateurs');
        setSnackbarOpen(true);
        return;
      }

      // Préparer les données à envoyer
      const userData: Record<string, any> = {
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        email: newUser.email,
        phone_number: newUser.phone,
        role: newUser.role || 'user',
        is_active: newUser.isActive !== undefined ? newUser.isActive : true,
        age: newUser.age || null,
        sexe: newUser.sexe || null
      };
      
      // Ajouter le fieldId uniquement pour les administrateurs
      if ((newUser.role === 'admin' || newUser.role === 'super_admin') && newUser.fieldId) {
        userData.field_id = newUser.fieldId;
      }
      
      // Ajouter le mot de passe provisoire pour les administrateurs
      if ((newUser.role === 'admin' || newUser.role === 'super_admin') && newUser.password) {
        userData.password = newUser.password;
      }
      
      console.log('Données utilisateur à envoyer:', userData);
      
      // Récupérer le token d'authentification du localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification non trouvé');
      }
      
      // Appel de l'API pour créer l'utilisateur avec le token d'authentification
      const response = await axios.post(`${API_BASE_URL}/admin/users`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 201) {
        // Fermer le dialogue
        setAddUserDialogOpen(false);
        
        // Rafraîchir la liste des utilisateurs
        fetchUsers();
        
        // Notification de succès
        setSnackbarSeverity('success');
        setSnackbarMessage(t('admin.userManagement.userCreated'));
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      setSnackbarSeverity('error');
      setSnackbarMessage(error.response?.data?.message || t('admin.userManagement.errorCreating'));
      setSnackbarOpen(true);
    }
  };

  const handleOpenBlockDialog = (user: User) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
  };

  const handleCloseBlockDialog = () => {
    setBlockDialogOpen(false);
    setSelectedUser(null);
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;

    try {
      const newStatus = !selectedUser.isActive;
      await userAPI.updateUserStatus(selectedUser.id, newStatus ? 'active' : 'inactive');
      
      // Mettre à jour la liste des utilisateurs
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, isActive: newStatus } : user
      ));
      
      handleCloseBlockDialog();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut de l\'utilisateur', err);
      setError(t('admin.userManagement.updateError'));
    }
  };

  // Fonction utilitaire pour formatter les dates avec gestion défensive
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      return '-'; // Valeur par défaut si la date n'existe pas
    }
    
    try {
      // Vérifie si la date est valide avant de la formater
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) {
        console.warn(`Date invalide détectée: '${dateString}'`);
        return '-';
      }
      return format(dateObj, 'dd MMM yyyy', { locale: fr });
    } catch (err) {
      console.error(`Erreur de formatage de date: '${dateString}'`, err);
      return '-';
    }
  };

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {t('admin.userTitle')}
      </Typography>

      {/* Statistiques des utilisateurs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('admin.userManagement.totalUsers')}
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip 
                  label={`${stats.active} ${t('admin.userManagement.active')}`} 
                  color="success" 
                  size="small" 
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={`${stats.inactive} ${t('admin.userManagement.inactive')}`} 
                  color="error" 
                  size="small" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('admin.userManagement.newUsers30Days')}
              </Typography>
              <Typography variant="h4">
                {stats.registered30days}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('admin.userManagement.admins')}
              </Typography>
              <Typography variant="h4">
                {stats.admins}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barre de recherche et bouton d'ajout */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder={t('admin.userManagement.searchPlaceholder')}
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: '300px' }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleAddUser}
        >
          {t('admin.userManagement.addUser')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Ajout d'un composant de débogage pour afficher les données brutes */}
      {process.env.NODE_ENV !== 'production' && filteredUsers.length > 0 && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Données brutes pour débogage</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(filteredUsers[0], null, 2)}
              </Typography>
              
              {/* Ajouter des informations de débogage spécifiques avec formatage sécurisé */}
              {filteredUsers.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Données spécifiques:</Typography>
                  <Typography variant="body2">Email: {String(filteredUsers[0].email || 'non défini')}</Typography>
                  <Typography variant="body2">Téléphone (phone): {String(filteredUsers[0].phone || 'non défini')}</Typography>
                  <Typography variant="body2">Téléphone (phone_number): {String(filteredUsers[0].phone_number || 'non défini')}</Typography>
                  
                  {/* Sécuriser l'affichage des dates */}
                  <Typography variant="body2">Date création (createdAt): {
                    typeof filteredUsers[0].createdAt === 'object' && filteredUsers[0].createdAt !== null 
                    ? JSON.stringify(filteredUsers[0].createdAt) 
                    : String(filteredUsers[0].createdAt || 'non définie')
                  }</Typography>
                  
                  <Typography variant="body2">Date création (created_at): {
                    typeof filteredUsers[0].created_at === 'object' && filteredUsers[0].created_at !== null 
                    ? JSON.stringify(filteredUsers[0].created_at) 
                    : String(filteredUsers[0].created_at || 'non définie')
                  }</Typography>
                  
                  <Typography variant="body2">Rôle: {String(filteredUsers[0].role || 'non défini')}</Typography>
                  <Typography variant="body2">Type de created_at: {typeof filteredUsers[0].created_at}</Typography>
                  <Typography variant="body2">Type de phone_number: {typeof filteredUsers[0].phone_number}</Typography>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 450px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>{t('admin.userManagement.name')}</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Sexe</TableCell>
                <TableCell>{t('admin.userManagement.email')}</TableCell>
                <TableCell>{t('admin.userManagement.phone')}</TableCell>
                <TableCell>{t('admin.userManagement.role')}</TableCell>
                <TableCell>{t('admin.userManagement.status')}</TableCell>
                <TableCell>{t('admin.userManagement.registered')}</TableCell>
                <TableCell align="center">{t('admin.common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow hover key={user.id || 'unknown'}>
                    <TableCell>
                      {`${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`}
                    </TableCell>
                    <TableCell>
                      {user.age || '-'}
                    </TableCell>
                    <TableCell>
                      {user.sexe || '-'}
                    </TableCell>
                    <TableCell>
                      {user.email || ''}
                      {!(user.is_verified || user.emailVerified) && (
                        <Chip 
                          label={t('admin.userManagement.notVerified')} 
                          color="warning" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </TableCell>
                    <TableCell>{user.phone_number || user.phone || ''}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role || ''}
                        color={user.role === 'admin' || user.role === 'super_admin' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={(user.is_active || user.isActive) ? t('admin.userManagement.active') : t('admin.userManagement.inactive')} 
                        color={(user.is_active || user.isActive) ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.created_at || user.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewUser(user)}
                          sx={{ color: theme.palette.info.main }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditUser(user)}
                          sx={{ color: theme.palette.warning.main }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenBlockDialog(user)}
                          sx={{ color: theme.palette.error.main }}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {searchTerm 
                      ? t('admin.userManagement.noSearchResults') 
                      : t('admin.userManagement.noUsers')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('admin.common.rowsPerPage')}
        />
      </Paper>
      
      {/* Dialogue de blocage/déblocage */}
      <Dialog open={blockDialogOpen} onClose={handleCloseBlockDialog}>
        <DialogTitle>{t('admin.userManagement.confirmBlock')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedUser?.isActive 
              ? t('admin.userManagement.confirmBlockMessage', { name: `${selectedUser?.firstName} ${selectedUser?.lastName}` })
              : t('admin.userManagement.confirmUnblockMessage', { name: `${selectedUser?.firstName} ${selectedUser?.lastName}` })
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBlockDialog}>{t('admin.common.cancel')}</Button>
          <Button onClick={handleToggleUserStatus} color="primary" autoFocus>
            {t('admin.common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de visualisation d'utilisateur */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('admin.userManagement.viewUser')}
          <IconButton
            aria-label="close"
            onClick={handleCloseViewDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle1" component="div" fontWeight="bold">
                    {t('admin.userManagement.name')}:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Typography>
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle1" component="div" fontWeight="bold">
                    Email:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedUser.email}
                  </Typography>
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle1" component="div" fontWeight="bold">
                    {t('admin.userManagement.phone')}:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedUser.phone}
                  </Typography>
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle1" component="div" fontWeight="bold">
                    {t('admin.userManagement.role')}:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <Chip 
                      label={selectedUser.role} 
                      color={selectedUser.role === 'admin' || selectedUser.role === 'super_admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </Typography>
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle1" component="div" fontWeight="bold">
                    Age:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedUser.age || '-'}
                  </Typography>
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle1" component="div" fontWeight="bold">
                    Sexe:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedUser.sexe || '-'}
                  </Typography>
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle1" component="div" fontWeight="bold">
                    {t('admin.userManagement.status')}:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <Chip 
                      label={selectedUser.isActive ? t('admin.userManagement.active') : t('admin.userManagement.inactive')} 
                      color={selectedUser.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </Typography>
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle1" component="div" fontWeight="bold">
                    {t('admin.userManagement.registered')}:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedUser.createdAt)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>{t('admin.common.close')}</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue d'édition d'utilisateur */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('admin.userManagement.editUser')}
          <IconButton
            aria-label="close"
            onClick={handleCloseEditDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Box sx={{ flexGrow: 1, mt: 2 }}>
              <Grid container spacing={3}>
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <TextField
                    label={t('admin.userManagement.firstName')}
                    value={selectedUser.firstName || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, firstName: e.target.value})}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <TextField
                    label={t('admin.userManagement.lastName')}
                    value={selectedUser.lastName || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, lastName: e.target.value})}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={selectedUser.email || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <TextField
                    label={t('admin.userManagement.phone')}
                    value={selectedUser.phone || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="user-role-label">{t('admin.userManagement.role')}</InputLabel>
                    <Select
                      labelId="user-role-label"
                      value={selectedUser.role || 'user'}
                      onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as 'admin' | 'super_admin' | 'client' | 'user'})}
                      label={t('admin.userManagement.role')}
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="client">Client</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="super_admin">Super Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                  <TextField
                    label="Age"
                    type="number"
                    value={selectedUser.age || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, age: e.target.value ? parseInt(e.target.value) : undefined})}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="user-sexe-label">Sexe</InputLabel>
                    <Select
                      labelId="user-sexe-label"
                      value={selectedUser.sexe || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, sexe: e.target.value as 'M' | 'F'})}
                      label="Sexe"
                    >
                      <MenuItem value=""><em>Non spécifié</em></MenuItem>
                      <MenuItem value="M">Homme</MenuItem>
                      <MenuItem value="F">Femme</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="user-status-label">{t('admin.userManagement.status')}</InputLabel>
                    <Select
                      labelId="user-status-label"
                      value={selectedUser.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setSelectedUser({...selectedUser, isActive: e.target.value === 'active'})}
                      label={t('admin.userManagement.status')}
                    >
                      <MenuItem value="active">{t('admin.userManagement.active')}</MenuItem>
                      <MenuItem value="inactive">{t('admin.userManagement.inactive')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {(selectedUser.role === 'admin' || selectedUser.role === 'super_admin') && (
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="field-label">Terrain</InputLabel>
                      <Select
                        labelId="field-label"
                        value={selectedUser.fieldId || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, fieldId: e.target.value})}
                        label="Terrain"
                      >
                        <MenuItem value=""><em>Aucun terrain</em></MenuItem>
                        {fields.map((field: any) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>{t('admin.common.cancel')}</Button>
          <Button onClick={handleUpdateUser} color="primary" variant="contained">
            {t('admin.common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue d'ajout d'utilisateur */}
      <Dialog open={addUserDialogOpen} onClose={handleCloseAddUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un utilisateur</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid sx={{ gridColumn: '1/7' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="firstName"
                  label="Prénom"
                  name="firstName"
                  value={newUser.firstName || ''}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid sx={{ gridColumn: '7/13' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label="Nom"
                  name="lastName"
                  value={newUser.lastName || ''}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  type="email"
                  value={newUser.email || ''}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="phone"
                  label="Téléphone"
                  name="phone"
                  value={newUser.phone || ''}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              {/* Nouveau champ Age */}
              <Grid sx={{ gridColumn: 'span 6' }}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="age"
                  label="Age"
                  name="age"
                  type="number"
                  inputProps={{ min: 0, max: 120 }}
                  value={newUser.age || ''}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              {/* Nouveau champ Sexe */}
              <Grid sx={{ gridColumn: 'span 6' }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="sexe-label">Sexe</InputLabel>
                  <Select
                    labelId="sexe-label"
                    id="sexe"
                    name="sexe"
                    value={newUser.sexe || ''}
                    label="Sexe"
                    onChange={handleRoleChange}
                  >
                    <MenuItem value=""><em>Non spécifié</em></MenuItem>
                    <MenuItem value="M">Homme</MenuItem>
                    <MenuItem value="F">Femme</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel id="role-label">Rôle</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={newUser.role || 'user'}
                    label="Rôle"
                    onChange={handleRoleChange}
                  >
                    <MenuItem value="user">Utilisateur</MenuItem>
                    <MenuItem value="admin">Administrateur</MenuItem>
                    <MenuItem value="super_admin">Super Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Ajout du champ Terrain - visible uniquement pour les administrateurs */}
              {(newUser.role === 'admin' || newUser.role === 'super_admin') && (
                <>
                  <Grid sx={{ gridColumn: 'span 12' }}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="field-label">Terrain</InputLabel>
                      <Select
                        labelId="field-label"
                        id="fieldId"
                        name="fieldId"
                        value={newUser.fieldId || ''}
                        label="Terrain"
                        onChange={handleRoleChange}
                      >
                        <MenuItem value=""><em>Aucun terrain</em></MenuItem>
                        {fields.map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Ajout du champ mot de passe provisoire pour les administrateurs */}
                  <Grid sx={{ gridColumn: 'span 12' }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="password"
                      label="Mot de passe provisoire"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={newUser.password || ''}
                      onChange={handleTextFieldChange}
                      helperText="Ce mot de passe permettra à l'administrateur de se connecter avec tous les droits sauf la gestion des utilisateurs"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddUserDialog}>{t('admin.common.cancel')}</Button>
          <Button onClick={handleCreateUser} color="primary" variant="contained">
            {t('admin.common.save')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar pour les notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminUsers;
