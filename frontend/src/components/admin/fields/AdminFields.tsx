import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as ActivateIcon,
  Cancel as DeactivateIcon,
} from '@mui/icons-material';
import { fieldAPI } from '../../../services/api';
import { v4 as uuidv4 } from 'uuid';

// Types pour le composant
interface Field {
  id: string;
  name: string;
  description?: string;
  location?: string; // Champ emplacement correspondant à la colonne location dans la base
  size: string;
  surface_type: string;
  price_per_hour: number;
  is_active: boolean;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

const AdminFields: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  // États
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);

  // Récupérer les terrains
  const fetchFields = async () => {
    setLoading(true);
    try {
      // Utiliser la fonction API correcte
      const response = await fieldAPI.getAllFields();
      // Vérifier la structure de la réponse et adapter si nécessaire
      let fieldsData;
      if (response.data && Array.isArray(response.data)) {
        fieldsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        fieldsData = response.data.data;
      } else {
        console.error('Format de réponse inattendu:', response);
        fieldsData = [];
      }
      
      // Débogage - afficher les détails des terrains pour vérifier is_active
      console.log('Terrains reçus:', fieldsData);
      
      // S'assurer que is_active est correctement interprété comme un booléen
      const processedFields = fieldsData.map((field: any) => ({
        ...field,
        // Convertir is_active en booléen si ce n'est pas déjà le cas
        is_active: Boolean(field.is_active)
      }));
      
      console.log('Terrains après traitement:', processedFields);
      setFields(processedFields);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des terrains', err);
      setError(t('admin.fields.fetchError') || 'Erreur lors de la récupération des terrains');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  // Gestionnaire de pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestionnaires d'actions
  const handleAddField = () => {
    navigate('/admin/fields/create');
  };

  const handleEditField = (id: string) => {
    navigate(`/admin/fields/edit/${id}`);
  };

  const handleViewField = (id: string) => {
    // Redirection vers la vue détaillée du terrain dans l'interface admin
    navigate(`/admin/fields/view/${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setFieldToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fieldToDelete) return;

    try {
      await fieldAPI.deleteField(fieldToDelete);
      setFields(fields.filter(field => field.id !== fieldToDelete));
      setDeleteDialogOpen(false);
      setFieldToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression du terrain', err);
      setError(t('admin.fields.deleteError'));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFieldToDelete(null);
  };

  // Activer un terrain (changer is_active à true)
  const handleActivateField = async (fieldId: string) => {
    try {
      const response = await fieldAPI.updateField(fieldId, { is_active: true });
      
      // Mettre à jour l'état local
      setFields(fields.map(field => 
        field.id === fieldId 
          ? { ...field, is_active: true }
          : field
      ));
      
      console.log('Terrain activé avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'activation du terrain', err);
      setError('Erreur lors de l\'activation du terrain');
    }
  };

  // Désactiver un terrain (changer is_active à false)
  const handleDeactivateField = async (fieldId: string) => {
    try {
      const response = await fieldAPI.updateField(fieldId, { is_active: false });
      
      // Mettre à jour l'état local
      setFields(fields.map(field => 
        field.id === fieldId 
          ? { ...field, is_active: false }
          : field
      ));
      
      console.log('Terrain désactivé avec succès');
    } catch (err) {
      console.error('Erreur lors de la désactivation du terrain', err);
      setError('Erreur lors de la désactivation du terrain');
    }
  };

  if (loading && fields.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{t('admin.fields.title')}</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddField}
        >
          {t('admin.fields.addButton')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ width: '100%', mb: 4 }}>
        <TableContainer component={Paper} sx={{ boxShadow: 1, borderRadius: 2, maxWidth: '100%', overflowX: 'auto', margin: '0 auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('admin.fields.name')}</TableCell>
                <TableCell>{t('admin.fields.location')}</TableCell>
                <TableCell>{t('admin.fields.size')}</TableCell>
                <TableCell>{t('admin.fields.surface')}</TableCell>
                <TableCell>{t('admin.fields.pricePerHour')}</TableCell>
                <TableCell>{t('admin.fields.status')}</TableCell>
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((field) => (
                  <TableRow hover key={field.id}>
                    <TableCell>{field.name}</TableCell>
                    <TableCell>
                      {/* Affiche la valeur réelle du champ location */}
                      {field.location || '-'}
                    </TableCell>
                    <TableCell>{t(`fields.sizeOptions.${field.size}`)}</TableCell>
                    <TableCell>{t(`fields.surfaceOptions.${field.surface_type}`)}</TableCell>
                    <TableCell>{`${field.price_per_hour?.toLocaleString() || '0'} FCFA`}</TableCell>
                    <TableCell>
                      <Chip 
                        label={field.is_active ? t('admin.fields.available') : t('admin.fields.unavailable')} 
                        color={field.is_active ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewField(field.id)}
                          sx={{ color: theme.palette.info.main }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditField(field.id)}
                          sx={{ color: theme.palette.warning.main, mx: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {!field.is_active && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleActivateField(field.id)}
                            sx={{ color: theme.palette.success.main, mx: 1 }}
                            title="Activer le terrain"
                          >
                            <ActivateIcon fontSize="small" />
                          </IconButton>
                        )}
                        {field.is_active && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeactivateField(field.id)}
                            sx={{ color: theme.palette.error.main, mx: 1 }}
                            title="Désactiver le terrain"
                          >
                            <DeactivateIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(field.id)}
                          sx={{ color: theme.palette.error.main }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              {fields.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {t('admin.fields.noFields')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={fields.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('admin.common.rowsPerPage')}
        />
      </Box>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>{t('admin.fields.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('admin.fields.deleteConfirmation')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFields;
