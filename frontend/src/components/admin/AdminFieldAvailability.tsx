import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardHeader,
  Container,
  Divider,
  CardContent,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fr } from 'date-fns/locale';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import api from '../../services/api';

// Types
interface TimeSlot {
  id: string;
  field_id: string;
  datefrom: string;
  dateto: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  field?: {
    id: string;
    name: string;
  };
}

interface AvailabilityFormData {
  datefrom: Date | null;
  dateto: Date | null;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

function AdminFieldAvailability() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [fieldId, setFieldId] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [availability, setAvailability] = useState<AvailabilityFormData>({
    datefrom: new Date(),
    dateto: new Date(),
    start_time: '08:00',
    end_time: '20:00',
    is_available: true
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/availability');
      if (response && response.data && response.data.success) {
        setTimeSlots(response.data.data);
        setFieldId(response.data.field_id);
      } else {
        setSnackbarMessage('Erreur lors du chargement des disponibilités');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Erreur lors du chargement des disponibilités');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvailability({
      ...availability,
      is_available: e.target.checked
    });
  };

  const handleDateChange = (field: 'datefrom' | 'dateto') => (date: Date | null) => {
    setAvailability({
      ...availability,
      [field]: date
    });
  };

  const handleTimeChange = (field: 'start_time' | 'end_time') => (time: Date | null) => {
    if (time) {
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      setAvailability({
        ...availability,
        [field]: timeString
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleOpenDialog = (slot?: TimeSlot) => {
    if (slot) {
      setEditingSlot(slot);
      setAvailability({
        datefrom: new Date(slot.datefrom),
        dateto: new Date(slot.dateto),
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available
      });
    } else {
      setEditingSlot(null);
      setAvailability({
        datefrom: new Date(),
        dateto: new Date(),
        start_time: '08:00',
        end_time: '20:00',
        is_available: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSlot(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availability.datefrom || !availability.dateto) {
      setSnackbarMessage('Toutes les dates sont obligatoires');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      
      const formatDate = (date: Date | null) => {
        if (!date) return null;
        return date.toISOString().split('T')[0];
      };

      const timeSlotData = {
        datefrom: formatDate(availability.datefrom),
        dateto: formatDate(availability.dateto),
        start_time: availability.start_time,
        end_time: availability.end_time,
        is_available: availability.is_available
      };

      let response;
      if (editingSlot) {
        response = await api.put(`/availability/${editingSlot.id}`, timeSlotData);
      } else {
        response = await api.post('/availability', timeSlotData);
      }

      if (response && response.data && response.data.success) {
        setSnackbarMessage(editingSlot ? 'Créneau horaire mis à jour avec succès' : 'Créneau horaire créé avec succès');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        handleCloseDialog();
        fetchAvailability();
      } else {
        setSnackbarMessage('Erreur lors de la sauvegarde');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Erreur lors de la sauvegarde');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau horaire ?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.delete(`/availability/${id}`);
      
      if (response && response.data && response.data.success) {
        setSnackbarMessage('Créneau horaire supprimé avec succès');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchAvailability();
      } else {
        setSnackbarMessage('Erreur lors de la suppression');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Erreur lors de la suppression');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardHeader 
              title="Gestion des disponibilités" 
              action={
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Ajouter un créneau
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : timeSlots.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Aucun créneau horaire configuré pour votre terrain.
                </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date de début</TableCell>
                        <TableCell>Date de fin</TableCell>
                        <TableCell>Heure de début</TableCell>
                        <TableCell>Heure de fin</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timeSlots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell>{formatDate(slot.datefrom)}</TableCell>
                          <TableCell>{formatDate(slot.dateto)}</TableCell>
                          <TableCell>{slot.start_time}</TableCell>
                          <TableCell>{slot.end_time}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                px: 2,
                                py: 0.5,
                                borderRadius: 1,
                                backgroundColor: slot.is_available ? 'success.main' : 'error.main',
                                color: 'white',
                                display: 'inline-block',
                                fontSize: '0.875rem'
                              }}
                            >
                              {slot.is_available ? 'Disponible' : 'Indisponible'}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDialog(slot)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(slot.id)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* Dialog pour ajouter/modifier un créneau */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSlot ? 'Modifier le créneau horaire' : 'Ajouter un créneau horaire'}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={availability.is_available}
                      onChange={handleSwitchChange}
                      name="is_available"
                      color="primary"
                    />
                  }
                  label={availability.is_available ? 'Disponible' : 'Indisponible'}
                />
              </Box>

              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <DatePicker
                    label="Date de début"
                    value={availability.datefrom}
                    onChange={handleDateChange('datefrom')}
                    slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                  />
                  <DatePicker
                    label="Date de fin"
                    value={availability.dateto}
                    onChange={handleDateChange('dateto')}
                    minDate={availability.datefrom || undefined}
                    slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TimePicker
                    label="Heure de début"
                    value={new Date(`2022-01-01T${availability.start_time}`)}
                    onChange={handleTimeChange('start_time')}
                    slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                  />
                  <TimePicker
                    label="Heure de fin"
                    value={new Date(`2022-01-01T${availability.end_time}`)}
                    onChange={handleTimeChange('end_time')}
                    slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                  />
                </Box>
              </LocalizationProvider>
            </Box>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            color="primary" 
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : (editingSlot ? 'Modifier' : 'Créer')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default AdminFieldAvailability;
