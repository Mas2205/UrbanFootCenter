import React, { useState, useEffect } from 'react';
import type { API } from '../../../services/api/types';
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
  InputAdornment
} from '@mui/material';
import { Add, Edit, Delete, Refresh, ContentCopy } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import api from '../../../services/api';
import { Promotion as ApiPromotion } from '../../../services/api/adminAPI';
import { fr } from 'date-fns/locale/fr';
import { format } from 'date-fns';

// Types composant (snake_case)
interface Promotion {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  min_purchase_amount?: number;
  max_uses?: number;
  uses_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PromotionFormData {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  min_purchase_amount?: number;
  max_uses?: number;
  is_active: boolean;
}

// Fonctions de transformation entre API (camelCase) et composant (snake_case) avec validation
const transformApiPromotionToComponent = (apiPromotion: ApiPromotion): Promotion => {
  if (!apiPromotion) {
    console.error("Promotion API invalide ou manquante");
    // Retourner une promotion par défaut
    return {
      id: "",
      code: "ERREUR",
      description: "Données de promotion invalides",
      discount_type: "percentage",
      discount_value: 0,
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      uses_count: 0,
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  try {
    // Validation des dates
    const validateDate = (dateStr: string | undefined): string => {
      if (!dateStr) return new Date().toISOString();
      
      try {
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) ? dateStr : new Date().toISOString();
      } catch (e) {
        console.error("Date invalide:", dateStr);
        return new Date().toISOString();
      }
    };

    return {
      id: apiPromotion.id || "",
      code: typeof apiPromotion.code === 'string' ? apiPromotion.code : "",
      description: typeof apiPromotion.description === 'string' ? apiPromotion.description : "",
      discount_type: (apiPromotion.discountType === 'percentage' || apiPromotion.discountType === 'fixed') 
        ? apiPromotion.discountType 
        : "percentage",
      discount_value: typeof apiPromotion.discountValue === 'number' ? apiPromotion.discountValue : 0,
      start_date: validateDate(apiPromotion.startDate),
      end_date: validateDate(apiPromotion.endDate),
      min_purchase_amount: 0, // Non fourni par l'API
      max_uses: typeof apiPromotion.usageLimit === 'number' ? apiPromotion.usageLimit : undefined,
      uses_count: typeof apiPromotion.timesUsed === 'number' ? apiPromotion.timesUsed : 0,
      is_active: apiPromotion.status === 'active',
      created_at: new Date().toISOString(), // L'API ne fournit pas ces champs
      updated_at: new Date().toISOString()  // L'API ne fournit pas ces champs
    };
  } catch (error) {
    console.error("Erreur lors de la transformation d'une promotion", error, apiPromotion);
    // Retourner une promotion par défaut en cas d'erreur
    return {
      id: apiPromotion.id || "",
      code: typeof apiPromotion.code === 'string' ? apiPromotion.code : "ERROR",
      description: "Erreur de format",
      discount_type: "percentage",
      discount_value: 0,
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      uses_count: 0,
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

const transformPromotionFormToApiFormat = (formData: PromotionFormData): Omit<ApiPromotion, "id" | "timesUsed"> => {
  return {
    code: formData.code,
    description: formData.description,
    discountType: formData.discount_type,
    discountValue: formData.discount_value,
    startDate: formData.start_date,
    endDate: formData.end_date,
    status: formData.is_active ? 'active' : 'inactive',
    usageLimit: formData.max_uses
  };
};

const AdminPromotions: React.FC = () => {
  const { t } = useTranslation();
  
  // États
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentPromotion, setCurrentPromotion] = useState<PromotionFormData>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    min_purchase_amount: undefined,
    max_uses: undefined,
    is_active: true
  });
  const [currentPromotionId, setCurrentPromotionId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState<string | null>(null);
  
  // Chargement des promotions
  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
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
      console.log(`Récupération des promotions avec auth: JWT ${token.substring(0, 15)}...`);
      
      const response = await (api as API).admin.getPromotions().catch(error => {
        console.error("Erreur lors de la récupération des promotions:", error);
        throw error; // Relancer l'erreur pour qu'elle soit capturée par le bloc catch extérieur
      });
      
      if (!response || !response.data) {
        throw new Error("Réponse de l'API invalide ou vide");
      }
      
      // Vérifier et transformer les promotions API en format composant avec validation
      const apiPromotions = response.data || [];
      console.log(`${apiPromotions.length} promotions récupérées`);
      
      const transformedPromotions = Array.isArray(apiPromotions) 
        ? apiPromotions.map(promotion => {
            try {
              return transformApiPromotionToComponent(promotion);
            } catch (transformError) {
              console.error("Erreur lors de la transformation d'une promotion:", transformError, promotion);
              return null;
            }
          }).filter(Boolean) as Promotion[]
        : [];
      
      setPromotions(transformedPromotions);
    } catch (err) {
      console.error("Erreur lors du chargement des promotions", err);
      setError(t('admin.promotions.errorLoading'));
      setPromotions([]);
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

  // Génération de code promo aléatoire
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCurrentPromotion(prev => ({
      ...prev,
      code: result
    }));
  };

  // Gestion du dialogue de création/édition
  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setCurrentPromotion({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
      min_purchase_amount: undefined,
      max_uses: undefined,
      is_active: true
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (promotion: Promotion) => {
    setDialogMode('edit');
    
    // Valider les dates avant formatage pour éviter les erreurs "Invalid Date"
    const formatDateSafely = (dateStr: string): string => {
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.warn(`Date invalide détectée: ${dateStr}, utilisation de la date actuelle`);
          return format(new Date(), 'yyyy-MM-dd');
        }
        return format(date, 'yyyy-MM-dd');
      } catch (error) {
        console.error(`Erreur de formatage de date: ${error}`);
        return format(new Date(), 'yyyy-MM-dd');
      }
    };
    
    setCurrentPromotion({
      code: promotion.code,
      description: promotion.description,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      start_date: formatDateSafely(promotion.start_date),
      end_date: formatDateSafely(promotion.end_date),
      min_purchase_amount: promotion.min_purchase_amount,
      max_uses: promotion.max_uses,
      is_active: promotion.is_active
    });
    
    setCurrentPromotionId(promotion.id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPromotionId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentPromotion(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDateChange = (type: 'start_date' | 'end_date', newValue: Date | null) => {
    if (newValue) {
      try {
        // Vérifier que la date est valide avant de la formatter
        if (isNaN(newValue.getTime())) {
          console.error(`Date invalide sélectionnée pour ${type}`);
          return;
        }
        
        const dateString = format(newValue, 'yyyy-MM-dd');
        console.log(`Date ${type} mise à jour: ${dateString}`);
        
        // Vérifier la cohérence des dates (start_date <= end_date)
        setCurrentPromotion(prev => {
          let updatedDates = {
            ...prev,
            [type]: dateString
          };
          
          // Si on modifie la date de début, vérifier qu'elle n'est pas après la date de fin
          if (type === 'start_date' && new Date(dateString) > new Date(prev.end_date)) {
            console.warn('La date de début est après la date de fin, ajustement de la date de fin');
            updatedDates.end_date = dateString;
          }
          
          // Si on modifie la date de fin, vérifier qu'elle n'est pas avant la date de début
          if (type === 'end_date' && new Date(dateString) < new Date(prev.start_date)) {
            console.warn('La date de fin est avant la date de début, ajustement de la date de début');
            updatedDates.start_date = dateString;
          }
          
          return updatedDates;
        });
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la date ${type}:`, error);
      }
    }
  };

  const handleSavePromotion = async () => {
    // Vérifier que le formulaire contient des données valides
    if (!currentPromotion.code || currentPromotion.code.trim() === '') {
      setError(t('admin.promotions.errorNoCode'));
      return;
    }
    
    if (currentPromotion.discount_value <= 0) {
      setError(t('admin.promotions.errorInvalidDiscount'));
      return;
    }
    
    // Vérification de l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Erreur d'authentification: Token manquant");
      setError(t('common.authError'));
      return;
    }
    
    try {
      // Transformer les données du formulaire au format API avec validation supplémentaire
      const apiPromotionData = transformPromotionFormToApiFormat(currentPromotion);
      console.log(`${dialogMode === 'create' ? 'Création' : 'Mise à jour'} d'une promotion:`, apiPromotionData);
      
      if (dialogMode === 'create') {
        await (api as API).admin.createPromotion(apiPromotionData)
          .catch(error => {
            console.error("Erreur lors de la création de la promotion:", error);
            // Extraction des détails de l'erreur pour un message plus précis
            const errorMsg = error.response?.data?.message || t('admin.promotions.errorCreating');
            throw new Error(errorMsg);
          });
        setSnackbarMessage(t('admin.promotions.createdSuccess'));
      } else {
        if (!currentPromotionId) {
          throw new Error("ID de promotion manquant pour la mise à jour");
        }
        
        await (api as API).admin.updatePromotion(currentPromotionId, apiPromotionData)
          .catch(error => {
            console.error("Erreur lors de la mise à jour de la promotion:", error);
            const errorMsg = error.response?.data?.message || t('admin.promotions.errorUpdating');
            throw new Error(errorMsg);
          });
        setSnackbarMessage(t('admin.promotions.updatedSuccess'));
      }
      
      setSnackbarOpen(true);
      setError(null); // Effacer toute erreur précédente en cas de succès
      handleCloseDialog();
      fetchPromotions(); // Rafraîchir la liste des promotions
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la promotion", err);
      // Afficher un message d'erreur détaillé si disponible
      setError(err instanceof Error && err.message 
        ? err.message 
        : (dialogMode === 'create' 
          ? t('admin.promotions.errorCreating')
          : t('admin.promotions.errorUpdating')));
      
      // Garder le dialogue ouvert pour permettre à l'utilisateur de corriger
    }
  };

  // Gestion de la suppression
  const handleOpenDeleteConfirm = (id: string) => {
    setPromotionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setPromotionToDelete(null);
  };

  const handleDelete = async () => {
    if (!promotionToDelete) {
      console.error("ID de promotion manquant pour la suppression");
      setError(t('admin.promotions.errorDeleting'));
      handleCloseDeleteConfirm();
      return;
    }

    // Vérification de l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Erreur d'authentification: Token manquant");
      setError(t('common.authError'));
      handleCloseDeleteConfirm();
      return;
    }

    try {
      console.log(`Suppression de la promotion avec ID: ${promotionToDelete}`);
      
      await (api as API).admin.deletePromotion(promotionToDelete)
        .catch(error => {
          console.error("Erreur lors de la suppression de la promotion:", error);
          // Extraction des détails de l'erreur pour un message plus précis
          const errorMsg = error.response?.data?.message || t('admin.promotions.errorDeleting');
          throw new Error(errorMsg);
        });
      
      setSnackbarMessage(t('admin.promotions.deletedSuccess'));
      setSnackbarOpen(true);
      setError(null); // Effacer toute erreur précédente en cas de succès
      fetchPromotions(); // Rafraîchir la liste des promotions
    } catch (err) {
      console.error("Erreur lors de la suppression de la promotion", err);
      // Afficher un message d'erreur détaillé si disponible
      setError(err instanceof Error && err.message 
        ? err.message 
        : t('admin.promotions.errorDeleting'));
    } finally {
      handleCloseDeleteConfirm();
    }
  };

  // Copier le code promo
  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCodeCopied(code);
        setTimeout(() => setCodeCopied(null), 2000);
      })
      .catch(err => console.error('Erreur lors de la copie du code', err));
  };

  // Formater la valeur de la promotion
  const formatDiscountValue = (promotion: Promotion) => {
    if (promotion.discount_type === 'percentage') {
      return `${promotion.discount_value}%`;
    } else {
      return `${promotion.discount_value} ${t('common.currency')}`;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {t('admin.promotions.title')}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchPromotions}
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
            {t('admin.promotions.addNew')}
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
        ) : promotions.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            {t('admin.promotions.noData')}
          </Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.promotions.code')}</TableCell>
                    <TableCell>{t('admin.promotions.description')}</TableCell>
                    <TableCell>{t('admin.promotions.value')}</TableCell>
                    <TableCell>{t('admin.promotions.validity')}</TableCell>
                    <TableCell>{t('admin.promotions.usage')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {promotions
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((promotion) => (
                      <TableRow hover key={promotion.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{promotion.code}</Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => copyCodeToClipboard(promotion.code)}
                            >
                              {codeCopied === promotion.code ? (
                                <Chip label={t('common.copied')} color="success" size="small" />
                              ) : (
                                <ContentCopy fontSize="small" />
                              )}
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>{promotion.description}</TableCell>
                        <TableCell>{formatDiscountValue(promotion)}</TableCell>
                        <TableCell>
                          {format(new Date(promotion.start_date), 'dd/MM/yyyy')} - {format(new Date(promotion.end_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          {promotion.uses_count} {promotion.max_uses ? `/ ${promotion.max_uses}` : ''}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={promotion.is_active ? t('common.active') : t('common.inactive')} 
                            color={promotion.is_active ? 'success' : 'default'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEditDialog(promotion)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteConfirm(promotion.id)}
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
              count={promotions.length}
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' 
            ? t('admin.promotions.create') 
            : t('admin.promotions.edit')}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  name="code"
                  label={t('admin.promotions.code')}
                  value={currentPromotion.code}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button size="small" onClick={generateRandomCode}>
                          {t('admin.promotions.generate')}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <FormControl fullWidth>
                  <InputLabel>{t('common.status')}</InputLabel>
                  <Select
                    name="is_active"
                    value={currentPromotion.is_active ? "true" : "false"}
                    label={t('common.status')}
                    onChange={(e) => {
                      const value = typeof e === 'object' && e !== null && 'target' in e ? 
                        (e.target as any).value : e;
                      setCurrentPromotion(prev => ({
                        ...prev,
                        is_active: value === "true"
                      }));
                    }}
                  >
                    <MenuItem value="true">{t('common.active')}</MenuItem>
                    <MenuItem value="false">{t('common.inactive')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  name="description"
                  label={t('admin.promotions.description')}
                  value={currentPromotion.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <FormControl fullWidth>
                  <InputLabel>{t('admin.promotions.discountType')}</InputLabel>
                  <Select
                    name="discount_type"
                    value={currentPromotion.discount_type}
                    label={t('admin.promotions.discountType')}
                    onChange={(e) => {
                      const value = typeof e === 'object' && e !== null && 'target' in e ? 
                        (e.target as any).value : e;
                      setCurrentPromotion(prev => ({
                        ...prev,
                        discount_type: value
                      }));
                    }}
                  >
                    <MenuItem value="percentage">{t('admin.promotions.percentage')}</MenuItem>
                    <MenuItem value="fixed">{t('admin.promotions.fixedAmount')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  name="discount_value"
                  label={t('admin.promotions.discountValue')}
                  value={currentPromotion.discount_value}
                  onChange={handleInputChange}
                  type="number"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {currentPromotion.discount_type === 'percentage' ? '%' : t('common.currency')}
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </Grid>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <DatePicker
                  label={t('admin.promotions.startDate')}
                  value={new Date(currentPromotion.start_date)}
                  onChange={(newValue) => handleDateChange('start_date', newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <DatePicker
                  label={t('admin.promotions.endDate')}
                  value={new Date(currentPromotion.end_date)}
                  onChange={(newValue) => handleDateChange('end_date', newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  name="min_purchase_amount"
                  label={t('admin.promotions.minPurchase')}
                  value={currentPromotion.min_purchase_amount || ''}
                  onChange={handleInputChange}
                  type="number"
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {t('common.currency')}
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  name="max_uses"
                  label={t('admin.promotions.maxUses')}
                  value={currentPromotion.max_uses || ''}
                  onChange={handleInputChange}
                  type="number"
                  fullWidth
                  helperText={t('admin.promotions.maxUsesHint')}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSavePromotion} variant="contained" color="primary">
            {dialogMode === 'create' ? t('common.create') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
      >
        <DialogTitle>{t('admin.promotions.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admin.promotions.deleteWarning')}
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

export default AdminPromotions;
