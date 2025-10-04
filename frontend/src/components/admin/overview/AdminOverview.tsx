import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Dashboard,
  SportsSoccer,
  EventNote,
  People,
  ArrowUpward,
  ArrowDownward,
  TrendingUp,
  TrendingDown,
  MoreVert,
  AttachMoney,
  Event,
  AccountCircle
} from '@mui/icons-material';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { adminAPI } from '../../../services/api';

// Enregistrement des composants Chart.js nécessaires
Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

// Types
interface DashboardStats {
  totalUsers: number;
  totalFields: number;
  totalReservations: number;
  totalRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
  reservationGrowth: number;
  reservationsThisWeek: number;
  activeFields: number;
  completionRate: number;
}

interface RecentReservation {
  id: string;
  fieldName: string;
  userName: string;
  date: string;
  status: string;
  amount: number;
}

const AdminOverview: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // États
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Couleurs pour les graphiques
  const chartColors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
    background: theme.palette.background.paper,
    text: theme.palette.text.primary,
  };
  
  // Chargement des statistiques
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Données simulées pour la démo - à remplacer par de vraies API calls
        const dashboardResponse = await adminAPI.getDashboardStats();
        setStats(dashboardResponse.data.stats);
        
        const reservationsResponse = await adminAPI.getRecentReservations();
        setRecentReservations(reservationsResponse.data.reservations);
        
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError(t('admin.fetchError'));
        console.error('Error fetching dashboard data:', err);
        
        // Données simulées en cas d'erreur pour la démo
        setStats({
          totalUsers: 245,
          totalFields: 18,
          totalReservations: 876,
          totalRevenue: 15720000,
          revenueGrowth: 12.5,
          userGrowth: 8.3,
          reservationGrowth: 15.7,
          reservationsThisWeek: 47,
          activeFields: 15,
          completionRate: 92.4
        });
        
        setRecentReservations([
          { 
            id: 'rsv-001', 
            fieldName: 'Terrain Premium A', 
            userName: 'Amadou Diallo', 
            date: '2023-08-12T15:00:00', 
            status: 'confirmed', 
            amount: 25000 
          },
          { 
            id: 'rsv-002', 
            fieldName: 'Terrain Classic B', 
            userName: 'Fatou Ndiaye', 
            date: '2023-08-12T17:00:00', 
            status: 'pending', 
            amount: 15000 
          },
          { 
            id: 'rsv-003', 
            fieldName: 'Terrain Indoor C', 
            userName: 'Moussa Sall', 
            date: '2023-08-13T10:00:00', 
            status: 'confirmed', 
            amount: 35000 
          },
          { 
            id: 'rsv-004', 
            fieldName: 'Terrain Premium A', 
            userName: 'Aicha Ba', 
            date: '2023-08-13T12:00:00', 
            status: 'completed', 
            amount: 25000 
          },
          { 
            id: 'rsv-005', 
            fieldName: 'Terrain Classic B', 
            userName: 'Omar Mbaye', 
            date: '2023-08-14T09:00:00', 
            status: 'cancelled', 
            amount: 15000 
          }
        ]);
      }
    };

    fetchDashboardData();
  }, [t]);
  
  // Données pour le graphique des réservations par jour
  const reservationsChartData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: t('admin.reservations'),
        data: [5, 8, 12, 9, 15, 25, 20],
        fill: true,
        backgroundColor: `${chartColors.primary}33`, // avec transparence
        borderColor: chartColors.primary,
        tension: 0.4
      }
    ]
  };
  
  // Données pour le graphique des revenus par mois
  const revenueChartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'],
    datasets: [
      {
        label: t('admin.revenue'),
        data: [1250000, 1890000, 1456000, 1789000, 2150000, 1980000, 2340000, 1572000],
        backgroundColor: chartColors.success,
      }
    ]
  };
  
  // Données pour le graphique de répartition des terrains
  const fieldsChartData = {
    labels: [t('fields.indoor'), t('fields.outdoor')],
    datasets: [
      {
        data: [6, 12],
        backgroundColor: [chartColors.primary, chartColors.secondary],
        borderWidth: 0,
      }
    ]
  };
  
  // Affichage du loader pendant le chargement
  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Titre */}
      <Typography variant="h5" gutterBottom>
        {t('admin.dashboardOverview')}
      </Typography>
      
      {/* Message d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Cartes statistiques */}
      <Grid sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, mb: 4 }}>
        {/* Total d'utilisateurs */}
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('admin.totalUsers')}
              </Typography>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {stats?.totalUsers.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {stats?.userGrowth && stats.userGrowth > 0 ? (
                  <ArrowUpward fontSize="small" color="success" />
                ) : (
                  <ArrowDownward fontSize="small" color="error" />
                )}
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  {stats?.userGrowth}% {t('admin.thisMonth')}
                </Typography>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: -15,
                  right: -15,
                  opacity: 0.15,
                  transform: 'rotate(15deg)',
                }}
              >
                <People sx={{ fontSize: 100 }} />
              </Box>
            </CardContent>
            <CardActionArea onClick={() => navigate('/admin/users')}>
              <Box sx={{ p: 1, bgcolor: 'primary.main', textAlign: 'center' }}>
                <Typography variant="body2">{t('admin.viewDetails')}</Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
        
        {/* Total des terrains */}
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Card sx={{ bgcolor: 'secondary.light', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('admin.totalFields')}
              </Typography>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {stats?.totalFields.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">
                  {stats?.activeFields} {t('admin.activeFields')}
                </Typography>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: -15,
                  right: -15,
                  opacity: 0.15,
                  transform: 'rotate(15deg)',
                }}
              >
                <SportsSoccer sx={{ fontSize: 100 }} />
              </Box>
            </CardContent>
            <CardActionArea onClick={() => navigate('/admin/fields')}>
              <Box sx={{ p: 1, bgcolor: 'secondary.main', textAlign: 'center' }}>
                <Typography variant="body2">{t('admin.viewDetails')}</Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
        
        {/* Total des réservations */}
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Card sx={{ bgcolor: 'success.light', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('admin.totalReservations')}
              </Typography>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {stats?.totalReservations.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {stats?.reservationGrowth && stats.reservationGrowth > 0 ? (
                  <TrendingUp fontSize="small" />
                ) : (
                  <TrendingDown fontSize="small" />
                )}
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  {stats?.reservationGrowth}% {t('admin.compared')}
                </Typography>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: -15,
                  right: -15,
                  opacity: 0.15,
                  transform: 'rotate(15deg)',
                }}
              >
                <EventNote sx={{ fontSize: 100 }} />
              </Box>
            </CardContent>
            <CardActionArea onClick={() => navigate('/admin/reservations')}>
              <Box sx={{ p: 1, bgcolor: 'success.main', textAlign: 'center' }}>
                <Typography variant="body2">{t('admin.viewDetails')}</Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
        
        {/* Revenus totaux */}
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Card sx={{ bgcolor: 'info.light', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('admin.totalRevenue')}
              </Typography>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {stats?.totalRevenue.toLocaleString()} F
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {stats?.revenueGrowth && stats.revenueGrowth > 0 ? (
                  <ArrowUpward fontSize="small" color="success" />
                ) : (
                  <ArrowDownward fontSize="small" color="error" />
                )}
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  {stats?.revenueGrowth}% {t('admin.thisMonth')}
                </Typography>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: -15,
                  right: -15,
                  opacity: 0.15,
                  transform: 'rotate(15deg)',
                }}
              >
                <AttachMoney sx={{ fontSize: 100 }} />
              </Box>
            </CardContent>
            <CardActionArea onClick={() => navigate('/admin/payments')}>
              <Box sx={{ p: 1, bgcolor: 'info.main', textAlign: 'center' }}>
                <Typography variant="body2">{t('admin.viewDetails')}</Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
      
      {/* Graphiques et tableaux */}
      <Grid sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
        {/* Graphique des réservations */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{t('admin.weeklyReservations')}</Typography>
              <IconButton size="small">
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Line
                data={reservationsChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: theme.palette.divider,
                      },
                      ticks: {
                        color: theme.palette.text.secondary,
                      },
                    },
                    x: {
                      grid: {
                        color: theme.palette.divider,
                      },
                      ticks: {
                        color: theme.palette.text.secondary,
                      },
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Répartition des terrains */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {t('admin.fieldDistribution')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', height: 300 }}>
              <Doughnut
                data={fieldsChartData}
                options={{
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: theme.palette.text.primary,
                      },
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Graphique des revenus */}
        <Grid sx={{ gridColumn: 'span 12' }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{t('admin.monthlyRevenue')}</Typography>
              <IconButton size="small">
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Bar
                data={revenueChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: theme.palette.divider,
                      },
                      ticks: {
                        color: theme.palette.text.secondary,
                        callback: function(value: number): string {
                          return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " F";
                        },
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        color: theme.palette.text.secondary,
                      },
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Réservations récentes */}
        <Grid sx={{ gridColumn: 'span 12' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('admin.recentReservations')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.id')}</TableCell>
                    <TableCell>{t('admin.field')}</TableCell>
                    <TableCell>{t('admin.user')}</TableCell>
                    <TableCell>{t('admin.date')}</TableCell>
                    <TableCell>{t('admin.status')}</TableCell>
                    <TableCell align="right">{t('admin.amount')}</TableCell>
                    <TableCell align="center">{t('admin.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>{reservation.id}</TableCell>
                      <TableCell>{reservation.fieldName}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccountCircle sx={{ mr: 1 }} />
                          {reservation.userName}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Event fontSize="small" sx={{ mr: 1 }} />
                          {new Date(reservation.date).toLocaleString(undefined, {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            reservation.status === 'confirmed' 
                              ? t('reservations.confirmed') 
                              : reservation.status === 'cancelled'
                                ? t('reservations.cancelled')
                                : reservation.status === 'completed'
                                  ? t('reservations.completed')
                                  : t('reservations.pending')
                          } 
                          color={
                            reservation.status === 'confirmed' 
                              ? 'success' 
                              : reservation.status === 'cancelled'
                                ? 'error'
                                : reservation.status === 'completed'
                                  ? 'default'
                                  : 'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {reservation.amount.toLocaleString()} F
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" onClick={() => navigate(`/admin/reservations?id=${reservation.id}`)}>
                          {t('admin.details')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button variant="outlined" onClick={() => navigate('/admin/reservations')}>
                {t('admin.viewAllReservations')}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminOverview;
