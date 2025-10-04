import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/constants';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Button,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  AttachMoney,
  PeopleAlt,
  EventAvailable,
  TrendingUp,
  Download,
  SportsFootball,
  Payment
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { fr } from 'date-fns/locale/fr';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Charger Chart.js
import { Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement 
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Types pour les KPIs
interface DashboardKPIs {
  total_revenue: number;
  today_revenue: number;
  today_reservations: number;
  total_reservations: number;
  active_users: number;
  total_users: number;
  most_popular_field: string;
  pending_payments: number;
}

// Types pour les statistiques
interface PaymentStats {
  statusStats: Array<{ payment_status: string; count: number; total_amount: number }>;
  methodStats: Array<{ payment_method: string; count: number; total_amount: number }>;
  timeStats: Array<{ period: string; count: number; total_amount: number }>;
}

interface FieldStats {
  fieldStats: Array<{
    field_id: string;
    field_name: string;
    location: string;
    price_per_hour: number;
    size: string;
    surface_type: string;
    total_reservations: number;
    total_revenue: number;
    avg_reservation_price: number;
    confirmed_revenue: number;
    pending_revenue: number;
    cancelled_revenue: number;
    confirmed_reservations: number;
    pending_reservations: number;
    cancelled_reservations: number;
  }>;
  surfaceStats: Array<{ surface_type: string; field_count: number; total_reservations: number; total_revenue: number }>;
  sizeStats: Array<{ size: string; field_count: number; avg_price_per_hour: number; total_reservations: number }>;
}

interface ReservationStats {
  periodStats: Array<{ period: string; reservation_count: number; total_revenue: number; paid_count: number }>;
  fieldStats: Array<{ field_id: string; field_name: string; reservation_count: number; total_revenue: number }>;
  paymentStatusStats: Array<{ payment_status: string; count: number; total_amount: number }>;
  reservationStats: Array<{ reservation_date: string; field_name: string; status: string; total_amount: number }>;
  fieldStatusStats: Array<{ field_name: string; status: string; total_amount: number }>;
}

interface UserStats {
  roleStats: Array<{ role: string; user_count: number }>;
  registrationStats: Array<{ month: string; new_users: number }>;
  userFieldStats: Array<{ field_name: string; unique_users: number; total_reservations: number }>;
}

const AdminReports: React.FC = () => {
  const { t } = useTranslation();
  
  // États
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  // Filtres pour les réservations
  const [reservationStartDate, setReservationStartDate] = useState<Date | null>(null);
  const [reservationEndDate, setReservationEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // États pour les données
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPIs | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [fieldStats, setFieldStats] = useState<FieldStats | null>(null);
  const [reservationStats, setReservationStats] = useState<ReservationStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
  // Chargement des données
  useEffect(() => {
    fetchReportData();
  }, [periodType, startDate, endDate, reservationStartDate, reservationEndDate]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Erreur d\'authentification. Veuillez vous reconnecter.');
      setLoading(false);
      return;
    }

    try {
      const baseApiUrl = API_BASE_URL;
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      // Utiliser les filtres de réservation si définis, sinon les filtres généraux
      const reservationStartDateFormatted = reservationStartDate ? format(reservationStartDate, 'yyyy-MM-dd') : formattedStartDate;
      const reservationEndDateFormatted = reservationEndDate ? format(reservationEndDate, 'yyyy-MM-dd') : formattedEndDate;
      
      // Récupérer toutes les statistiques en parallèle
      const [kpisRes, paymentsRes, fieldsRes, reservationsRes, usersRes] = await Promise.all([
        axios.get(`${baseApiUrl}/reports/kpis`, { headers }),
        axios.get(`${baseApiUrl}/reports/payments?period=${periodType}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`, { headers }),
        axios.get(`${baseApiUrl}/reports/fields`, { headers }),
        axios.get(`${baseApiUrl}/reports/reservations?period=${periodType}&startDate=${reservationStartDateFormatted}&endDate=${reservationEndDateFormatted}`, { headers }),
        axios.get(`${baseApiUrl}/reports/users`, { headers })
      ]);

      setDashboardKPIs(kpisRes.data.data);
      setPaymentStats(paymentsRes.data.data);
      setFieldStats(fieldsRes.data.data);
      setReservationStats(reservationsRes.data.data);
      setUserStats(usersRes.data.data);
      
    } catch (err: any) {
      console.error('Erreur lors du chargement des rapports:', err);
      setError('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des onglets
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Formatage des montants
  const formatAmount = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0 FCFA';
    }
    return `${amount.toLocaleString()} FCFA`;
  };

  // Données pour les graphiques
  const getPaymentStatusChartData = () => {
    if (!paymentStats?.statusStats) return null;
    
    return {
      labels: paymentStats.statusStats.map(stat => {
        switch(stat.payment_status) {
          case 'completed': return 'Terminé';
          case 'pending': return 'En attente';
          case 'failed': return 'Échoué';
          case 'refunded': return 'Remboursé';
          default: return stat.payment_status;
        }
      }),
      datasets: [{
        data: paymentStats.statusStats.map(stat => stat.total_amount),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ]
      }]
    };
  };

  const getRevenueTimeChartData = () => {
    if (!paymentStats?.timeStats) return null;
    
    return {
      labels: paymentStats.timeStats.map(stat => stat.period),
      datasets: [{
        label: 'Revenus',
        data: paymentStats.timeStats.map(stat => stat.total_amount),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    };
  };

  const getFieldRevenueChartData = () => {
    if (!fieldStats?.fieldStats) return null;
    
    return {
      labels: fieldStats.fieldStats.map(field => field.field_name),
      datasets: [
        {
          label: 'Confirmé',
          data: fieldStats.fieldStats.map(field => field.confirmed_revenue || 0),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'En attente',
          data: fieldStats.fieldStats.map(field => field.pending_revenue || 0),
          backgroundColor: 'rgba(255, 206, 86, 0.6)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1
        },
        {
          label: 'Annulé',
          data: fieldStats.fieldStats.map(field => field.cancelled_revenue || 0),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getPeriodRevenueChartData = () => {
    if (!reservationStats?.periodStats) return null;
    
    return {
      labels: reservationStats.periodStats.map(stat => stat.period),
      datasets: [{
        data: reservationStats.periodStats.map(stat => stat.total_revenue),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(54, 162, 235, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 1
      }]
    };
  };

  const getReservationStatusChartData = () => {
    if (!reservationStats?.fieldStatusStats) return null;
    
    // Filtrer les données selon les filtres de date actifs (même logique que le tableau)
    const filteredFieldStatusStats = reservationStats.fieldStatusStats.filter((stat) => {
      // Pour le graphique par terrain/statut, on utilise les mêmes filtres de date
      // mais on ne peut pas filtrer par reservation_date car ces données sont agrégées
      // On garde toutes les données pour le moment
      return true;
    });
    
    // Obtenir tous les terrains uniques
    const fieldNames = Array.from(new Set(filteredFieldStatusStats.map(stat => stat.field_name)));
    
    // Obtenir tous les statuts uniques
    const statuses = Array.from(new Set(filteredFieldStatusStats.map(stat => stat.status)));
    
    // Créer les datasets pour chaque statut
    const datasets = statuses.map(status => {
      const statusLabel = status === 'confirmed' ? 'Confirmé' : 
                         status === 'pending' ? 'En attente' : 'Annulé';
      
      const backgroundColor = status === 'confirmed' ? 'rgba(75, 192, 192, 0.6)' :
                             status === 'pending' ? 'rgba(255, 206, 86, 0.6)' : 'rgba(255, 99, 132, 0.6)';
      
      const borderColor = status === 'confirmed' ? 'rgba(75, 192, 192, 1)' :
                         status === 'pending' ? 'rgba(255, 206, 86, 1)' : 'rgba(255, 99, 132, 1)';
      
      const data = fieldNames.map(fieldName => {
        const stat = filteredFieldStatusStats.find(s => s.field_name === fieldName && s.status === status);
        return stat ? stat.total_amount : 0;
      });
      
      return {
        label: statusLabel,
        data,
        backgroundColor,
        borderColor,
        borderWidth: 1
      };
    });

    return {
      labels: fieldNames,
      datasets
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {t('reports.title')}
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<Download />}
          onClick={() => {/* TODO: Implémenter l'export */}}
        >
          Exporter PDF
        </Button>
      </Box>

      {/* Filtres */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, alignItems: 'center' }}>
          <Box>
            <FormControl fullWidth>
              <InputLabel>Période</InputLabel>
              <Select
                value={periodType}
                label="Période"
                onChange={(e) => setPeriodType(e.target.value as any)}
              >
                <MenuItem value="day">Jour</MenuItem>
                <MenuItem value="week">Semaine</MenuItem>
                <MenuItem value="month">Mois</MenuItem>
                <MenuItem value="year">Année</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date de début"
                value={startDate}
                onChange={(newValue) => newValue && setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>
          <Box>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date de fin"
                value={endDate}
                onChange={(newValue) => newValue && setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>
          <Box>
            <Button
              fullWidth
              variant="outlined"
              onClick={fetchReportData}
            >
              Actualiser
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* KPIs */}
      {dashboardKPIs && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Revenus totaux
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {formatAmount(dashboardKPIs.total_revenue)}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EventAvailable color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Réservations
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {dashboardKPIs.total_reservations}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleAlt color="info" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Utilisateurs actifs
                </Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {dashboardKPIs.active_users}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SportsFootball color="warning" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Terrain populaire
                </Typography>
              </Box>
              <Typography variant="h6" color="warning.main">
                {dashboardKPIs.most_popular_field || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Onglets */}
      <Paper sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Paiements" />
          <Tab label="Terrains" />
          <Tab label="Réservations" />
          <Tab label="Utilisateurs" />
        </Tabs>

        {/* Contenu des onglets */}
        {tabValue === 0 && paymentStats && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>Répartition par statut</Typography>
              {getPaymentStatusChartData() && (
                <Box sx={{ height: 300 }}>
                  <Doughnut 
                    data={getPaymentStatusChartData()!} 
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </Box>
              )}
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom>Évolution des revenus</Typography>
              {getRevenueTimeChartData() && (
                <Box sx={{ height: 300 }}>
                  <Line 
                    data={getRevenueTimeChartData()!} 
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        )}

        {tabValue === 1 && fieldStats && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>Revenus par terrain</Typography>
              {getFieldRevenueChartData() && (
                <Box sx={{ height: 400 }}>
                  <Bar 
                    data={getFieldRevenueChartData()!} 
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </Box>
              )}
            </Box>
            <Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Terrain</TableCell>
                      <TableCell>Localisation</TableCell>
                      <TableCell align="right">Réservations</TableCell>
                      <TableCell align="right">Revenus</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fieldStats.fieldStats.map((field) => (
                      <TableRow key={field.field_id}>
                        <TableCell>{field.field_name}</TableCell>
                        <TableCell>{field.location}</TableCell>
                        <TableCell align="right">{field.total_reservations}</TableCell>
                        <TableCell align="right">{formatAmount(field.total_revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}

        {tabValue === 2 && reservationStats && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Filtres pour les réservations */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Filtres</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, alignItems: 'center' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <DatePicker
                    label="Date de début"
                    value={reservationStartDate}
                    onChange={(newValue) => setReservationStartDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <DatePicker
                    label="Date de fin"
                    value={reservationEndDate}
                    onChange={(newValue) => setReservationEndDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Statut"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">Tous</MenuItem>
                    <MenuItem value="confirmed">Confirmé</MenuItem>
                    <MenuItem value="pending">En attente</MenuItem>
                    <MenuItem value="cancelled">Annulé</MenuItem>
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  onClick={() => {
                    setReservationStartDate(null);
                    setReservationEndDate(null);
                    setStatusFilter('all');
                  }}
                >
                  Réinitialiser
                </Button>
              </Box>
            </Paper>

            {/* Diagramme en barres des statuts */}
            <Box>
              <Typography variant="h6" gutterBottom>Répartition par statut</Typography>
              {getReservationStatusChartData() && (
                <Box sx={{ height: 300 }}>
                  <Bar 
                    data={getReservationStatusChartData()!} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Tableau détaillé */}
            <Box>
              <Typography variant="h6" gutterBottom>Détail des réservations par date</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date de réservation</TableCell>
                      <TableCell>Terrain</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Montant</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservationStats.reservationStats
                      ?.filter((stat) => {
                        // Filtre par date
                        const reservationDate = new Date(stat.reservation_date);
                        const startDateMatch = !reservationStartDate || reservationDate >= reservationStartDate;
                        
                        // Pour la date de fin, ajouter 23h59m59s pour inclure toute la journée
                        let endDateMatch = true;
                        if (reservationEndDate) {
                          const endOfDay = new Date(reservationEndDate);
                          endOfDay.setHours(23, 59, 59, 999);
                          endDateMatch = reservationDate <= endOfDay;
                        }
                        
                        // Filtre par statut
                        const statusMatch = statusFilter === 'all' || stat.status === statusFilter;
                        
                        return startDateMatch && endDateMatch && statusMatch;
                      })
                      ?.map((stat, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(stat.reservation_date).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell>{stat.field_name}</TableCell>
                          <TableCell>
                            <Box sx={{ 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1, 
                              bgcolor: stat.status === 'confirmed' ? 'success.light' : 
                                      stat.status === 'pending' ? 'warning.light' : 'error.light',
                              color: stat.status === 'confirmed' ? 'success.dark' : 
                                     stat.status === 'pending' ? 'warning.dark' : 'error.dark',
                              display: 'inline-block'
                            }}>
                              {stat.status === 'confirmed' ? 'Confirmé' : 
                               stat.status === 'pending' ? 'En attente' : 'Annulé'}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatAmount(stat.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

          </Box>
        )}

        {tabValue === 3 && userStats && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>Répartition par rôle</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rôle</TableCell>
                      <TableCell align="right">Nombre</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userStats.roleStats.map((stat) => (
                      <TableRow key={stat.role}>
                        <TableCell>{stat.role}</TableCell>
                        <TableCell align="right">{stat.user_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminReports;
