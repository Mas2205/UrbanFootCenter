import React, { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  Tabs,
  Tab,
  SelectChangeEvent
} from '@mui/material';
import {
  Refresh,
  Send,
  Delete,
  Visibility,
  NotificationsActive,
  MarkEmailRead,
  FilterList
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../../services/api';
import type { API } from '../../../services/api/types';
import { Notification as ApiNotification, NotificationCreateRequest, User as ApiUser } from '../../../services/api/adminAPI';

// Types avec transformation pour compatibilité avec le composant existant
// Interface composant (snake_case) vs API (camelCase)
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: 'read' | 'unread' | 'sent' | 'pending' | 'failed';
  target_type: 'all' | 'user' | 'admin' | 'super_admin';
  created_at: string;
  updated_at?: string;
  target_id?: string;
}

interface NotificationFormData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target_type: 'all' | 'user' | 'admin' | 'super_admin';
  target_id?: string;
}

// Interface User pour le composant
interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'admin' | 'super_admin';
}

// Fonction utilitaire pour transformer ApiNotification en Notification (snake_case) avec validation
const transformApiNotificationToComponent = (apiNotification: ApiNotification): Notification => {
  if (!apiNotification) {
    throw new Error("Notification API invalide ou manquante");
  }
  
  try {
    return {
      id: apiNotification.id || "",
      title: apiNotification.title || "",
      message: apiNotification.message || "",
      type: apiNotification.type || "info",
      status: (apiNotification.status as any) || "pending",
      target_type: (apiNotification.targetAudience as any) || "all", // conversion de camelCase à snake_case
      created_at: apiNotification.createdAt 
        ? (new Date(apiNotification.createdAt) instanceof Date && !isNaN(new Date(apiNotification.createdAt).getTime())) 
          ? apiNotification.createdAt 
          : new Date().toISOString()
        : new Date().toISOString(),
      updated_at: apiNotification.createdAt 
        ? (new Date(apiNotification.createdAt) instanceof Date && !isNaN(new Date(apiNotification.createdAt).getTime())) 
          ? apiNotification.createdAt 
          : new Date().toISOString()
        : new Date().toISOString(),
      target_id: Array.isArray(apiNotification.targetUserIds) && apiNotification.targetUserIds.length > 0 
        ? apiNotification.targetUserIds[0] 
        : undefined
    };
  } catch (error) {
    console.error("Erreur lors de la transformation d'une notification", error, apiNotification);
    // Retourner une notification par défaut en cas d'erreur
    return {
      id: apiNotification.id || "",
      title: "[Erreur de format]",
      message: "Cette notification n'a pas pu être correctement formatée",
      type: "error",
      status: "failed" as any,
      target_type: "all" as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
};

// Fonction pour transformer NotificationFormData en NotificationCreateRequest
const transformNotificationFormToRequest = (formData: NotificationFormData): NotificationCreateRequest => ({
  title: formData.title,
  message: formData.message,
  type: formData.type || 'info',
  targetAudience: formData.target_type, // Utiliser target_type au lieu de audience
  targetUserIds: formData.target_id ? [formData.target_id] : undefined // Utiliser target_id au lieu de userId
});

const AdminNotifications: React.FC = () => {
  const { t } = useTranslation();
  
  // États
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [currentNotification, setCurrentNotification] = useState<NotificationFormData>({
    title: '',
    message: '',
    type: 'info',
    target_type: 'all'
  });
  const [viewNotificationOpen, setViewNotificationOpen] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [tabValue, setTabValue] = useState<number>(0);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  
  // Chargement des notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filtrer les notifications en fonction de l'onglet sélectionné
  useEffect(() => {
    if (notifications.length > 0) {
      filterNotifications();
    }
  }, [tabValue, notifications]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Erreur d'authentification: Token manquant");
      setError(t('common.authError'));
      setLoading(false);
      return;
    }
    
    try {
      console.log(`Récupération des notifications avec auth: JWT ${token.substring(0, 15)}...`);
      
      const response = await (api as API).admin.getNotifications().catch(error => {
        console.error("Erreur lors de la récupération des notifications:", error);
        throw error; // Relancer l'erreur pour qu'elle soit capturée par le bloc catch extérieur
      });
      
      if (!response || !response.data) {
        throw new Error("Réponse de l'API invalide ou vide");
      }
      
      // Vérifier et transformer les notifications API en format composant avec validation
      const apiNotifications = response.data.notifications || [];
      console.log(`${apiNotifications.length} notifications récupérées`);
      
      const transformedNotifications = Array.isArray(apiNotifications) 
        ? apiNotifications.map(notification => {
            try {
              return transformApiNotificationToComponent(notification);
            } catch (transformError) {
              console.error("Erreur lors de la transformation d'une notification:", transformError, notification);
              return null;
            }
          }).filter(Boolean) as Notification[]
        : [];
      
      setNotifications(transformedNotifications);
      setFilteredNotifications(transformedNotifications);
    } catch (err) {
      console.error("Erreur lors du chargement des notifications", err);
      setError(t('admin.notifications.errorLoading'));
      setNotifications([]);
      setFilteredNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];
    
    switch (tabValue) {
      case 0: // Toutes
        break;
      case 1: // Non lues
        filtered = filtered.filter(notification => notification.status === 'unread');
        break;
      case 2: // Utilisateurs
        filtered = filtered.filter(notification => 
          notification.target_type === 'user' || notification.target_type === 'all');
        break;
      case 3: // Administrateurs
        filtered = filtered.filter(notification => 
          notification.target_type === 'admin' || notification.target_type === 'all');
        break;
      default:
        break;
    }
    
    setFilteredNotifications(filtered);
    setPage(0);
  };

  // Charger la liste des utilisateurs pour la sélection
  const fetchUsers = async () => {
    try {
      const response = await (api as API).admin.getUsers();
      // Transformer les utilisateurs API en format composant si nécessaire
      const transformedUsers: User[] = response.data.map((apiUser: ApiUser) => ({
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role as 'client' | 'admin' | 'super_admin'
      }));
      setUsers(transformedUsers);
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs", err);
      setError(t('admin.notifications.errorLoadingUsers'));
    }
  };

  // Gestion de la pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestion des onglets
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Gestion du dialogue de création
  const handleOpenCreateDialog = async () => {
    setCurrentNotification({
      title: '',
      message: '',
      type: 'info',
      target_type: 'all'
    });
    
    // Charger la liste des utilisateurs si on peut cibler un utilisateur spécifique
    if (users.length === 0) {
      await fetchUsers();
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Gestionnaires d'événements séparés pour les TextField et les Select
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentNotification(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentNotification(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Transformer les données du formulaire en format API avant l'envoi
      const notificationRequest = transformNotificationFormToRequest(currentNotification);
      await (api as API).admin.createNotification(notificationRequest);
      setSnackbarMessage(t('admin.notifications.createdSuccess'));
      setSnackbarOpen(true);
      handleCloseDialog();
      fetchNotifications();
    } catch (err) {
      console.error("Erreur lors de la création de la notification", err);
      setError(t('admin.notifications.errorCreating'));
    }
  };

  // Afficher les détails d'une notification
  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setViewNotificationOpen(true);
    
    // Si la notification est non lue, la marquer comme lue
    if (notification.status === 'unread') {
      handleMarkAsRead(notification.id, false);
    }
  };

  // Marquer une notification comme lue
  const handleMarkAsRead = async (id: string, showSnackbar: boolean = true) => {
    try {
      await (api as API).admin.markNotificationAsRead(id);
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, status: 'read' } 
            : notification
        )
      );
      
      if (showSnackbar) {
        setSnackbarMessage(t('admin.notifications.markedAsRead'));
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error("Erreur lors du marquage de la notification", err);
      setError(t('admin.notifications.errorMarking'));
    }
  };

  // Supprimer une notification
  const handleOpenDeleteConfirm = (id: string) => {
    setNotificationToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setNotificationToDelete(null);
  };

  const handleDelete = async () => {
    if (notificationToDelete) {
      try {
        await (api as API).admin.deleteNotification(notificationToDelete);
        setSnackbarMessage(t('admin.notifications.deletedSuccess'));
        setSnackbarOpen(true);
        fetchNotifications();
      } catch (err) {
        console.error("Erreur lors de la suppression de la notification", err);
        setError(t('admin.notifications.errorDeleting'));
      }
    }
    handleCloseDeleteConfirm();
  };

  // Obtenir la couleur de la puce pour le type de notification
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  // Obtenir le libellé pour le type de cible
  const getTargetTypeLabel = (targetType: string) => {
    switch (targetType) {
      case 'all':
        return t('admin.notifications.targetAll');
      case 'user':
        return t('admin.notifications.targetUser');
      case 'admin':
        return t('admin.notifications.targetAdmin');
      case 'super_admin':
        return t('admin.notifications.targetSuperAdmin');
      default:
        return targetType;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {t('admin.notifications.title')}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchNotifications}
            sx={{ mr: 1 }}
          >
            {t('common.refresh')}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Send />}
            onClick={handleOpenCreateDialog}
          >
            {t('admin.notifications.sendNew')}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label={t('admin.notifications.tabAll')} />
          <Tab label={t('admin.notifications.tabUnread')} />
          <Tab label={t('admin.notifications.tabUsers')} />
          <Tab label={t('admin.notifications.tabAdmins')} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            {t('admin.notifications.noData')}
          </Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell width="15%">{t('admin.notifications.date')}</TableCell>
                    <TableCell width="20%">{t('admin.notifications.title')}</TableCell>
                    <TableCell width="30%">{t('admin.notifications.message')}</TableCell>
                    <TableCell width="10%">{t('admin.notifications.type')}</TableCell>
                    <TableCell width="10%">{t('admin.notifications.target')}</TableCell>
                    <TableCell width="15%" align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredNotifications
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((notification) => (
                      <TableRow 
                        hover 
                        key={notification.id}
                        sx={{ 
                          backgroundColor: notification.status === 'unread' 
                            ? 'rgba(25, 118, 210, 0.08)' 
                            : 'inherit'
                        }}
                      >
                        <TableCell>
                          {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              fontWeight: notification.status === 'unread' ? 'bold' : 'normal',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100%'
                            }}
                          >
                            {notification.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100%'
                            }}
                          >
                            {notification.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={t(`admin.notifications.type${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}`)} 
                            color={getNotificationTypeColor(notification.type) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {getTargetTypeLabel(notification.target_type)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small"
                            color="primary"
                            onClick={() => handleViewNotification(notification)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          {notification.status === 'unread' && (
                            <IconButton 
                              size="small"
                              color="success"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <MarkEmailRead fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton 
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteConfirm(notification.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredNotifications.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('common.rowsPerPage')}
            />
          </>
        )}
      </Paper>

      {/* Dialogue de création de notification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{t('admin.notifications.sendNew')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
              <TextField
                name="title"
                label={t('admin.notifications.title')}
                value={currentNotification.title}
                onChange={handleTextFieldChange}
                fullWidth
                required
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
              <FormControl fullWidth>
                <InputLabel>{t('admin.notifications.type')}</InputLabel>
                <Select
                  name="type"
                  value={currentNotification.type}
                  label={t('admin.notifications.type')}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="info">{t('admin.notifications.typeInfo')}</MenuItem>
                  <MenuItem value="success">{t('admin.notifications.typeSuccess')}</MenuItem>
                  <MenuItem value="warning">{t('admin.notifications.typeWarning')}</MenuItem>
                  <MenuItem value="error">{t('admin.notifications.typeError')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid sx={{ gridColumn: '1 / -1' }}>
              <TextField
                name="message"
                label={t('admin.notifications.message')}
                value={currentNotification.message}
                onChange={handleTextFieldChange}
                fullWidth
                required
                multiline
                rows={4}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
              <FormControl fullWidth>
                <InputLabel>{t('admin.notifications.targetType')}</InputLabel>
                <Select
                  name="target_type"
                  value={currentNotification.target_type}
                  label={t('admin.notifications.targetType')}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="all">{t('admin.notifications.targetAll')}</MenuItem>
                  <MenuItem value="user">{t('admin.notifications.targetUser')}</MenuItem>
                  <MenuItem value="admin">{t('admin.notifications.targetAdmin')}</MenuItem>
                  <MenuItem value="super_admin">{t('admin.notifications.targetSuperAdmin')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {currentNotification.target_type === 'user' && (
              <Grid sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                <FormControl fullWidth>
                  <InputLabel>{t('admin.notifications.specificUser')}</InputLabel>
                  <Select
                    name="target_id"
                    value={currentNotification.target_id || ''}
                    label={t('admin.notifications.specificUser')}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">{t('admin.notifications.allUsers')}</MenuItem>
                    {users
                      .filter(user => user.role === 'client')
                      .map(user => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {currentNotification.target_type === 'admin' && (
              <Grid sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                <FormControl fullWidth>
                  <InputLabel>{t('admin.notifications.specificAdmin')}</InputLabel>
                  <Select
                    name="target_id"
                    value={currentNotification.target_id || ''}
                    label={t('admin.notifications.specificAdmin')}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">{t('admin.notifications.allAdmins')}</MenuItem>
                    {users
                      .filter(user => user.role === 'admin' || user.role === 'super_admin')
                      .map(user => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name} ({user.email}) - {user.role === 'super_admin' ? t('roles.superAdmin') : t('roles.admin')}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!currentNotification.title || !currentNotification.message}
          >
            {t('admin.notifications.send')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de visualisation des détails */}
      <Dialog 
        open={viewNotificationOpen} 
        onClose={() => setViewNotificationOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedNotification && (
          <>
            <DialogTitle sx={{ pb: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsActive 
                  color={getNotificationTypeColor(selectedNotification.type) as any} 
                />
                <Typography variant="h6">{selectedNotification.title}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {format(new Date(selectedNotification.created_at), 'dd/MM/yyyy HH:mm')}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" paragraph>
                  {selectedNotification.message}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid sx={{ gridColumn: 'span 6' }}>
                  <Typography variant="subtitle2">{t('admin.notifications.type')}</Typography>
                  <Chip 
                    label={t(`admin.notifications.type${selectedNotification.type.charAt(0).toUpperCase() + selectedNotification.type.slice(1)}`)} 
                    color={getNotificationTypeColor(selectedNotification.type) as any}
                    size="small"
                  />
                </Grid>
                <Grid sx={{ gridColumn: 'span 6' }}>
                  <Typography variant="subtitle2">{t('admin.notifications.target')}</Typography>
                  <Typography variant="body2">
                    {getTargetTypeLabel(selectedNotification.target_type)}
                  </Typography>
                </Grid>
                <Grid sx={{ gridColumn: 'span 6' }}>
                  <Typography variant="subtitle2">{t('admin.notifications.status')}</Typography>
                  <Chip 
                    label={selectedNotification.status === 'read' 
                      ? t('admin.notifications.statusRead') 
                      : t('admin.notifications.statusUnread')} 
                    color={selectedNotification.status === 'read' ? 'default' : 'primary'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewNotificationOpen(false)}>
                {t('common.close')}
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<Delete />}
                onClick={() => {
                  setViewNotificationOpen(false);
                  handleOpenDeleteConfirm(selectedNotification.id);
                }}
              >
                {t('common.delete')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
      >
        <DialogTitle>{t('admin.notifications.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admin.notifications.deleteWarning')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default AdminNotifications;
