import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/constants';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
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
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Refresh,
  Search,
  FilterList
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';

// Types
interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  user_name?: string;
  created_at: string;
  payment_date?: string;
  reservation?: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

const AdminPayments: React.FC = () => {
  const { user } = useAuth();
  
  // États
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // États des filtres
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  
  // Chargement des paiements
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Erreur d\'authentification. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }
      
      const baseApiUrl = API_BASE_URL;
      const apiUrl = `${baseApiUrl}/payments`;
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        // Handle different possible response structures
        let paymentsData = [];
        if (Array.isArray(response.data)) {
          paymentsData = response.data;
        } else if (response.data.payments && Array.isArray(response.data.payments)) {
          paymentsData = response.data.payments;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          paymentsData = response.data.data;
        }
        
        setPayments(paymentsData);
        setFilteredPayments(paymentsData);
        setError(null);
      } else {
        setPayments([]);
        setFilteredPayments([]);
        setError(null);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des paiements:", err);
      setError('Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de filtrage
  useEffect(() => {
    let filtered = payments;

    // Filtre par recherche (nom client ou ID transaction)
    if (searchQuery) {
      filtered = filtered.filter(payment => {
        const clientName = payment.reservation?.user 
          ? `${payment.reservation.user.first_name} ${payment.reservation.user.last_name}`.toLowerCase()
          : payment.user_name?.toLowerCase() || '';
        const transactionId = payment.transaction_id?.toLowerCase() || '';
        
        return clientName.includes(searchQuery.toLowerCase()) || 
               transactionId.includes(searchQuery.toLowerCase());
      });
    }

    // Filtre par statut
    if (statusFilter) {
      filtered = filtered.filter(payment => payment.payment_status === statusFilter);
    }

    // Filtre par date
    if (dateFilter) {
      const filterDate = format(dateFilter, 'yyyy-MM-dd');
      filtered = filtered.filter(payment => {
        const paymentDate = payment.payment_date || payment.created_at;
        if (paymentDate) {
          const paymentDateFormatted = format(new Date(paymentDate), 'yyyy-MM-dd');
          return paymentDateFormatted === filterDate;
        }
        return false;
      });
    }

    setFilteredPayments(filtered);
    setPage(0); // Reset pagination when filters change
  }, [payments, searchQuery, statusFilter, dateFilter]);

  // Fonction pour effacer les filtres
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFilter(null);
  };

  // Gestion de la pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Formater le montant avec la devise
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  // Obtenir le libellé de la méthode de paiement
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'stripe':
        return 'Stripe';
      case 'wave':
        return 'Wave';
      case 'orange_money':
        return 'Orange Money';
      case 'cash':
        return 'Espèces';
      default:
        return method;
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      case 'refunded':
        return 'Remboursé';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Gestion des Paiements
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />}
          onClick={fetchPayments}
        >
          Actualiser
        </Button>
      </Box>

      {/* Filtres et recherche */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Rechercher par client ou ID transaction"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Statut"
                  >
                    <MenuItem value="">Tous les statuts</MenuItem>
                    <MenuItem value="completed">Terminé</MenuItem>
                    <MenuItem value="pending">En attente</MenuItem>
                    <MenuItem value="failed">Échoué</MenuItem>
                    <MenuItem value="refunded">Remboursé</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
                <DatePicker
                  label="Filtrer par date"
                  value={dateFilter}
                  onChange={(newValue) => setDateFilter(newValue)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      variant: 'outlined'
                    } 
                  }}
                />
              </Box>
              <Box sx={{ flex: '0 0 auto' }}>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  startIcon={<FilterList />}
                  sx={{ height: '56px' }}
                >
                  Effacer les filtres
                </Button>
              </Box>
            </Box>
          </Box>
        </LocalizationProvider>
      </Paper>

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
        ) : filteredPayments.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            Aucun paiement trouvé
          </Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Montant</TableCell>
                    <TableCell>Méthode de paiement</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>ID Transaction</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(filteredPayments) ? filteredPayments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((payment) => (
                      <TableRow hover key={payment.id}>
                        <TableCell>
                          {payment.payment_date 
                            ? format(new Date(payment.payment_date), 'dd/MM/yyyy HH:mm')
                            : payment.created_at 
                            ? format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')
                            : 'Date inconnue'}
                        </TableCell>
                        <TableCell>
                          {payment.reservation?.user 
                            ? `${payment.reservation.user.first_name} ${payment.reservation.user.last_name}`
                            : payment.user_name || 'Client inconnu'}
                        </TableCell>
                        <TableCell>{formatAmount(payment.amount)}</TableCell>
                        <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                        <TableCell>{getStatusLabel(payment.payment_status)}</TableCell>
                        <TableCell>{payment.transaction_id}</TableCell>
                      </TableRow>
                    )) : []}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={Array.isArray(filteredPayments) ? filteredPayments.length : 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page"
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AdminPayments;
