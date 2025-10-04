import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../../config/constants';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  AppBar, 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  FormControl, 
  Grid, 
  IconButton, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  Toolbar, 
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, TimePicker, DatePicker } from '@mui/x-date-pickers';
import { fr } from 'date-fns/locale/fr';
import { format, parse } from 'date-fns';

// Interface hybride permettant les propriétés camelCase et snake_case
interface TimeSlot {
  id: string;
  // Support des deux formats pour le champ field
  fieldId?: string;
  field_id?: string;
  field?: { name: string } | null;
  fieldName?: string;
  field_name?: string;
  // Support des deux formats pour disponibilité
  isAvailable?: boolean;
  is_available?: boolean;
  // Support des deux formats pour les dates
  dateFrom?: string;
  datefrom?: string;
  dateTo?: string;
  dateto?: string;
  // Support des deux formats pour les heures
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  // Support des deux formats pour dates de création/modification
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface TimeSlotFormData {
  field_id: string;
  datefrom: string;
  dateto: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// Fonctions de transformation entre API (camelCase) et composant (snake_case) avec validation robuste
const transformApiTimeSlotToComponent = (apiTimeSlot: any): TimeSlot => {
  if (!apiTimeSlot) {
    console.error("TimeSlot API invalide", apiTimeSlot);
    return {
      id: '',
      fieldId: '',
      field_id: '',
      start_time: '',
      end_time: '',
      startTime: '',
      endTime: '',
      is_available: false,
      isAvailable: false,
      datefrom: new Date().toISOString(),
      dateFrom: new Date().toISOString(),
      dateto: new Date().toISOString(),
      dateTo: new Date().toISOString(),
      created_at: '',
      createdAt: '',
      updated_at: '',
      updatedAt: ''
    };
  }

  try {
    // Accès aux propriétés de façon sûre via des opérateurs optionnels et des valeurs par défaut
    const id = String(apiTimeSlot.id || '');
    const fieldIdValue = String(apiTimeSlot.fieldId || (apiTimeSlot as any).field_id || '');
    const fieldObj = (apiTimeSlot as any).field || { name: '' };
    const fieldNameValue = String(fieldObj.name || apiTimeSlot.fieldName || (apiTimeSlot as any).field_name || 'Terrain par défaut');
    const isAvailableValue = Boolean((apiTimeSlot as any).isAvailable ?? (apiTimeSlot as any).is_available ?? true);
    const dateFromValue = String((apiTimeSlot as any).dateFrom || (apiTimeSlot as any).datefrom || new Date().toISOString());
    const dateToValue = String((apiTimeSlot as any).dateTo || (apiTimeSlot as any).dateto || new Date().toISOString());
    const startTimeValue = String((apiTimeSlot as any).startTime || (apiTimeSlot as any).start_time || '00:00');
    const endTimeValue = String((apiTimeSlot as any).endTime || (apiTimeSlot as any).end_time || '00:00');
    const createdAtValue = String((apiTimeSlot as any).createdAt || (apiTimeSlot as any).created_at || '');
    const updatedAtValue = String((apiTimeSlot as any).updatedAt || (apiTimeSlot as any).updated_at || '');
    
    // Création d'un objet TimeSlot propre avec toutes les propriétés possibles
    return {
      id,
      fieldId: fieldIdValue,
      field_id: fieldIdValue,
      field: fieldObj,
      fieldName: fieldNameValue,
      field_name: fieldNameValue,
      isAvailable: isAvailableValue,
      is_available: isAvailableValue,
      dateFrom: dateFromValue,
      datefrom: dateFromValue,
      dateTo: dateToValue,
      dateto: dateToValue,
      startTime: startTimeValue,
      start_time: startTimeValue,
      endTime: endTimeValue,
      end_time: endTimeValue,
      createdAt: createdAtValue,
      created_at: createdAtValue,
      updatedAt: updatedAtValue,
      updated_at: updatedAtValue
    };
  } catch (error) {
    console.error("Erreur lors de la transformation du TimeSlot:", error);
    // Objet par défaut en cas d'erreur
    return {
      id: apiTimeSlot.id || '',
      fieldId: '',
      field_id: '',
      startTime: '',
      start_time: '',
      endTime: '',
      end_time: '',
      isAvailable: true,
      is_available: true,
      dateFrom: new Date().toISOString(),
      datefrom: new Date().toISOString(),
      dateTo: new Date().toISOString(),
      dateto: new Date().toISOString(),
      createdAt: '',
      created_at: '',
      updatedAt: '',
      updated_at: ''
    };
  }
};

const transformTimeSlotFormToApiFormat = (formData: TimeSlotFormData): any => {
  console.log('Form data to transform:', formData);
  
  // S'assurer que les dates et heures sont au bon format
  const startTime = formData.start_time
    ? `${String(formData.start_time.split(':')[0]).padStart(2, '0')}:${String(formData.start_time.split(':')[1]).padStart(2, '0')}:00`
    : '00:00:00';
    
  const endTime = formData.end_time
    ? `${String(formData.end_time.split(':')[0]).padStart(2, '0')}:${String(formData.end_time.split(':')[1]).padStart(2, '0')}:00`
    : '00:00:00';
  
  // Créer un objet avec tous les champs obligatoires de l'interface ApiTimeSlot
  return {
    // Propriétés camelCase obligatoires dans l'interface
    startTime: startTime,
    endTime: endTime,
    availableDays: [],
    price: 0,
    currency: 'XOF',
    status: 'active' as const,
    
    // Propriétés snake_case pour l'API
    field_id: formData.field_id,
    start_time: startTime,
    end_time: endTime,
    is_available: Boolean(formData.is_available),
    datefrom: String(formData.datefrom),
    dateto: String(formData.dateto),
    
    // Propriétés optionnelles
    fieldId: formData.field_id,
    description: ''
  };
};

const dayNames = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche'
];

const AdminTimeSlots: React.FC = () => {
  const { t } = useTranslation();
  
  // États
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentTimeSlot, setCurrentTimeSlot] = useState<TimeSlotFormData>({
    field_id: '',
    start_time: '08:00',
    end_time: '09:00',
    is_available: true,
    datefrom: new Date().toISOString(),
    dateto: new Date().toISOString()
  });
  const [currentTimeSlotId, setCurrentTimeSlotId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [timeSlotToDelete, setTimeSlotToDelete] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  
  // Chargement des créneaux horaires
  useEffect(() => {
    console.log('AdminTimeSlots component mounted, calling fetchTimeSlots...');
    fetchTimeSlots();
  }, []);

  const fetchTimeSlots = async () => {
    console.log('=== DÉBUT fetchTimeSlots ===');
    setLoading(true);
    setError(null);
    
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    console.log('Token récupéré du localStorage:', token ? 'PRÉSENT' : 'ABSENT');
    if (!token) {
      console.error("Erreur d'authentification: Token manquant");
      setError(t('common.authError'));
      setLoading(false);
      return;
    }
    
    try {
      console.log(`Récupération des créneaux horaires avec auth: JWT ${token.substring(0, 15)}...`);
      console.log('Appel API vers:', `${API_BASE_URL}/admin/timeslots`);
      console.log('Token complet pour debug:', token);
      
      // Configuration de l'API comme dans AdminUsers
      const baseApiUrl = API_BASE_URL;
      const apiUrl = `${baseApiUrl}/admin/timeslots`;
      
      console.log('URL API complète:', apiUrl);
      console.log('Headers:', { 'Authorization': `Bearer ${token.substring(0, 10)}...` });
      
      // Utiliser axios directement comme dans AdminUsers
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response || !response.data) {
        throw new Error("Réponse de l'API invalide ou vide");
      }
      
      // Log de la réponse pour le débogage
      console.log('Réponse API reçue:', response.status, response.statusText);
      console.log('Structure de la réponse:', Object.keys(response.data));
      console.log('Données brutes:', response.data);
      
      // Extraire les données de la réponse - suivre le même pattern qu'AdminUsers
      const rawTimeSlotData = response.data.success ? (response.data.data || []) : [];
      
      console.log('Données créneaux horaires brutes:', rawTimeSlotData);
      console.log(`${rawTimeSlotData.length} créneaux horaires récupérés`);
      
      // Mappage direct des données sans transformation complexe
      const timeSlotData = Array.isArray(rawTimeSlotData) ? rawTimeSlotData.map((slot: any) => ({
        id: slot.id || '',
        fieldId: slot.fieldId || slot.field_id || '',
        field_id: slot.field_id || slot.fieldId || '',
        fieldName: slot.fieldName || slot.field_name || 'N/A',
        field_name: slot.field_name || slot.fieldName || 'N/A',
        createdAt: slot.createdAt || slot.created_at || '',
        created_at: slot.created_at || slot.createdAt || '',
        dateFrom: slot.dateFrom || slot.date_from || '',
        datefrom: slot.date_from || slot.dateFrom || '',
        dateTo: slot.dateTo || slot.date_to || '',
        dateto: slot.date_to || slot.dateTo || '',
        startTime: slot.startTime || slot.start_time || '',
        start_time: slot.start_time || slot.startTime || '',
        endTime: slot.endTime || slot.end_time || '',
        end_time: slot.end_time || slot.endTime || '',
        isAvailable: slot.isAvailable ?? slot.is_available ?? true,
        is_available: slot.is_available ?? slot.isAvailable ?? true
      })) : [];
      
      console.log('Données créneaux horaires mappées:', timeSlotData);
      setTimeSlots(timeSlotData);
    } catch (err: any) {
      console.error("Erreur lors du chargement des créneaux horaires", err);
      
      // Afficher plus d'informations sur l'erreur pour le débogage
      if (err.response) {
        console.error('Réponse d\'erreur:', {
          data: err.response.data,
          status: err.response.status,
          headers: err.response.headers
        });
        setError(`Erreur ${err.response.status}: ${err.response.data?.message || 'Erreur lors de la récupération des créneaux horaires'}`);
      } else if (err.request) {
        console.error('Pas de réponse reçue:', err.request);
        setError('Aucune réponse du serveur. Vérifiez votre connexion.');
      } else {
        console.error('Erreur de configuration:', err.message);
        setError(`Erreur: ${err.message}`);
      }
      setTimeSlots([]);
    } finally {
      setLoading(false);
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

  // Gestion du dialogue de création/édition
  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setCurrentTimeSlot({
      field_id: '',
      start_time: '08:00',
      end_time: '09:00',
      is_available: true,
      datefrom: new Date().toISOString(),
      dateto: new Date().toISOString()
    });
    setOpenDialog(true);
  };

  const handleEditTimeSlot = (timeSlot: TimeSlot) => {
    setCurrentTimeSlotId(timeSlot.id);
    setCurrentTimeSlot({
      field_id: String(timeSlot.field_id || timeSlot.fieldId || ''),
      start_time: String(timeSlot.start_time || timeSlot.startTime || ''),
      end_time: String(timeSlot.end_time || timeSlot.endTime || ''),
      is_available: Boolean(timeSlot.is_available ?? timeSlot.isAvailable ?? true),
      datefrom: String(timeSlot.datefrom || timeSlot.dateFrom || new Date().toISOString()),
      dateto: String(timeSlot.dateto || timeSlot.dateTo || new Date().toISOString())
    });
    setDialogMode('edit');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTimeSlotId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name?: string; value: unknown } }) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentTimeSlot(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTimeChange = (type: 'start_time' | 'end_time', newValue: Date | null) => {
    if (newValue) {
      const timeString = format(newValue, 'HH:mm');
      setCurrentTimeSlot(prev => ({
        ...prev,
        [type]: timeString
      }));
    }
  };

  const handleSaveTimeSlot = async () => {
    try {
      // Transformer les données du formulaire au format API
      const apiTimeSlotData = transformTimeSlotFormToApiFormat(currentTimeSlot);
      const baseApiUrl = API_BASE_URL;
      const token = localStorage.getItem('token');
      
      if (dialogMode === 'create') {
        await axios.post(`${baseApiUrl}/admin/timeslots`, apiTimeSlotData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSnackbarMessage(t('admin.timeSlots.createdSuccess'));
      } else {
        await axios.put(`${baseApiUrl}/admin/timeslots/${currentTimeSlotId}`, apiTimeSlotData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSnackbarMessage(t('admin.timeSlots.updatedSuccess'));
      }
      
      setSnackbarOpen(true);
      handleCloseDialog();
      fetchTimeSlots();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du créneau horaire", err);
      setError(dialogMode === 'create' 
        ? t('admin.timeSlots.errorCreating')
        : t('admin.timeSlots.errorUpdating'));
    }
  };

  // Gestion de la suppression
  const handleOpenDeleteConfirm = (id: string) => {
    setTimeSlotToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setTimeSlotToDelete(null);
  };

  const handleDelete = async () => {
    if (timeSlotToDelete) {
      try {
        const baseApiUrl = API_BASE_URL;
        const token = localStorage.getItem('token');
        
        await axios.delete(`${baseApiUrl}/admin/timeslots/${timeSlotToDelete}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSnackbarMessage(t('admin.timeSlots.deletedSuccess'));
        setSnackbarOpen(true);
        fetchTimeSlots();
      } catch (err) {
        console.error("Erreur lors de la suppression du créneau horaire", err);
        setError(t('admin.timeSlots.errorDeleting'));
      }
    }
    handleCloseDeleteConfirm();
  };

  // Afficher les jours en français
  const getDayName = (day: number) => {
    return dayNames[day - 1] || t('common.unknown');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {t('admin.timeSlots.title')}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchTimeSlots}
            sx={{ mr: 1 }}
          >
            {t('common.refresh')}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={handleOpenCreateDialog}
          >
            {t('admin.timeSlots.addNew')}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : timeSlots.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            {t('admin.timeSlots.noData')}
          </Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell>Field Name</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Date From</TableCell>
                    <TableCell>Date To</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Is Available</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeSlots
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((timeSlot) => (
                      <TableRow hover key={timeSlot.id}>
                        <TableCell>
                          {String(timeSlot.field_name || timeSlot.fieldName || 'N/A')}
                        </TableCell>
                        <TableCell>
                          {timeSlot.created_at || timeSlot.createdAt ? 
                            new Date(String(timeSlot.created_at || timeSlot.createdAt)).toLocaleString() : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          {timeSlot.datefrom || timeSlot.dateFrom ? 
                            new Date(String(timeSlot.datefrom || timeSlot.dateFrom)).toLocaleDateString() : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          {timeSlot.dateto || timeSlot.dateTo ? 
                            new Date(String(timeSlot.dateto || timeSlot.dateTo)).toLocaleDateString() : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>{String(timeSlot.start_time || timeSlot.startTime || '')}</TableCell>
                        <TableCell>{String(timeSlot.end_time || timeSlot.endTime || '')}</TableCell>
                        <TableCell>
                          <Chip 
                            label={Boolean(timeSlot.is_available ?? timeSlot.isAvailable ?? true) ? 'true' : 'false'} 
                            color={Boolean(timeSlot.is_available ?? timeSlot.isAvailable ?? true) ? 'success' : 'error'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small"
                            color="primary"
                            onClick={() => handleEditTimeSlot(timeSlot)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteConfirm(timeSlot.id)}
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
              count={timeSlots.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('common.rowsPerPage')}
            />
          </>
        )}
      </Paper>

      {/* Dialogue de création/édition */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' 
            ? t('admin.timeSlots.create') 
            : t('admin.timeSlots.edit')}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <DatePicker
                  label={t('admin.timeSlots.dateFrom')}
                  value={new Date(currentTimeSlot.datefrom)}
                  onChange={(newValue: Date | null) => {
                    setCurrentTimeSlot(prev => ({
                      ...prev,
                      datefrom: newValue ? newValue.toISOString() : new Date().toISOString()
                    }));
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <DatePicker
                  label={t('admin.timeSlots.dateTo')}
                  value={new Date(currentTimeSlot.dateto)}
                  onChange={(newValue: Date | null) => {
                    setCurrentTimeSlot(prev => ({
                      ...prev,
                      dateto: newValue ? newValue.toISOString() : new Date().toISOString()
                    }));
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <TimePicker
                  label={t('admin.timeSlots.startTime')}
                  value={new Date(`2023-01-01T${currentTimeSlot.start_time || '00:00:00'}`)}
                  onChange={(newValue) => {
                    if (newValue) {
                      const timeStr = format(newValue, 'HH:mm:ss');
                      setCurrentTimeSlot(prev => ({
                        ...prev,
                        start_time: timeStr,
                        startTime: timeStr // Version camelCase pour compatibilité
                      }));
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <TimePicker
                  label={t('admin.timeSlots.endTime')}
                  value={new Date(`2023-01-01T${currentTimeSlot.end_time || '00:00:00'}`)}
                  onChange={(newValue) => {
                    if (newValue) {
                      const timeStr = format(newValue, 'HH:mm:ss');
                      setCurrentTimeSlot(prev => ({
                        ...prev,
                        end_time: timeStr,
                        endTime: timeStr // Version camelCase pour compatibilité
                      }));
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <FormControl fullWidth>
                  <InputLabel id="available-select-label">{t('admin.timeSlots.availability')}</InputLabel>
                  <Select
                    labelId="available-select-label"
                    name="is_available"
                    value={currentTimeSlot.is_available ? "true" : "false"}
                    label={t('admin.timeSlots.availability')}
                    onChange={(e) => {
                      const value = typeof e === 'object' && e !== null && 'target' in e ? 
                        (e.target as any).value : e;
                      setCurrentTimeSlot(prev => ({
                        ...prev,
                        is_available: value === "true"
                      }));
                    }}
                  >
                    <MenuItem value="true">{t('common.available')}</MenuItem>
                    <MenuItem value="false">{t('common.unavailable')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveTimeSlot} variant="contained" color="primary">
            {dialogMode === 'create' ? t('common.create') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
      >
        <DialogTitle>{t('admin.timeSlots.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admin.timeSlots.deleteWarning')}
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

export default AdminTimeSlots;
