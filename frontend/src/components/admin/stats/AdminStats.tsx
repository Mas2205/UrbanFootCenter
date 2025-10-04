import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/constants';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  EventNote,
  Schedule,
  Refresh,
  FilterList
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Types
interface GlobalStats {
  total_reservations: number;
  total_revenue: number;
}

interface StatusStats {
  status: string;
  total_reservations: number;
  total_revenue: number;
}

interface DateStats {
  reservation_date: string;
  total_reservations: number;
  total_revenue: number;
}

interface TimeSlotStats {
  start_time: string;
  total_bookings: number;
  total_revenue: number;
}

interface StatsData {
  fieldId: string;
  globalStats: GlobalStats;
  statusStats: StatusStats[];
  last30DaysStats: DateStats[];
  topTimeSlots: TimeSlotStats[];
}

interface GlobalDateStats {
  reservation_date: string;
  total_reservations: number;
  total_revenue: number;
}

const AdminStats: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // États
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [globalDateStats, setGlobalDateStats] = useState<GlobalDateStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // États des filtres
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Chargement des statistiques
  useEffect(() => {
    fetchStats();
  }, []);

  // Recharger les stats quand les filtres changent
  useEffect(() => {
    fetchStats();
  }, [startDate, endDate, statusFilter]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Erreur d\'authentification. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }
      
      const baseApiUrl = API_BASE_URL;
      
      // Construire les paramètres de requête pour les filtres
      const params = new URLSearchParams();
      if (startDate) {
        // Utiliser le fuseau horaire local pour éviter les décalages
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        params.append('startDate', `${year}-${month}-${day}`);
      }
      if (endDate) {
        // Utiliser le fuseau horaire local pour éviter les décalages
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        params.append('endDate', `${year}-${month}-${day}`);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      // Récupérer les stats du terrain avec filtres
      const fieldStatsUrl = `${baseApiUrl}/stats/field${params.toString() ? `?${params.toString()}` : ''}`;
      const fieldResponse = await axios.get(fieldStatsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Récupérer les stats globales par date
      const dateStatsUrl = `${baseApiUrl}/stats/by-date`;
      const dateResponse = await axios.get(dateStatsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (fieldResponse.data.success) {
        setStatsData(fieldResponse.data.data);
        setError(null);
      } else {
        setError('Erreur lors du chargement des statistiques');
      }
      
      if (dateResponse.data.success) {
        setGlobalDateStats(dateResponse.data.data);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des statistiques:", err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  // Formater le montant avec la devise
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Formater l'heure
  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Préparer les données pour le diagramme camembert des revenus par statut
  const preparePieChartData = () => {
    if (!statsData?.statusStats || statsData.statusStats.length === 0) {
      return null;
    }

    const colors = {
      'confirmed': '#4caf50',
      'pending': '#ff9800', 
      'cancelled': '#f44336'
    };

    const labels = statsData.statusStats.map(stat => getStatusLabel(stat.status));
    const data = statsData.statusStats.map(stat => parseFloat(stat.total_revenue?.toString() || '0'));
    const backgroundColors = statsData.statusStats.map(stat => colors[stat.status as keyof typeof colors] || '#9e9e9e');

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color),
          borderWidth: 2,
          hoverOffset: 4,
          cutout: '50%' // Crée le trou au centre (donut chart)
        }
      ]
    };
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${formatAmount(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Regrouper les données par date pour l'affichage du tableau
  const groupDataByDate = () => {
    if (!statsData?.last30DaysStats || statsData.last30DaysStats.length === 0) {
      return [];
    }

    const grouped = statsData.last30DaysStats.reduce((acc: any, stat: any) => {
      const date = stat.reservation_date;
      if (!acc[date]) {
        acc[date] = {
          reservation_date: date,
          total_reservations: 0,
          total_revenue: 0,
          statuses: {}
        };
      }
      
      acc[date].total_reservations += parseInt(stat.total_reservations);
      acc[date].total_revenue += parseFloat(stat.total_revenue?.toString() || '0');
      acc[date].statuses[stat.status] = parseInt(stat.total_reservations);
      
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(b.reservation_date).getTime() - new Date(a.reservation_date).getTime()
    );
  };

  // Préparer les données pour le diagramme en barres des 30 derniers jours (revenus par statut)
  const prepareBarChartData = () => {
    if (!statsData?.last30DaysStats || statsData.last30DaysStats.length === 0) {
      return null;
    }

    // Regrouper les données par date et calculer les revenus par statut
    const grouped = statsData.last30DaysStats.reduce((acc: any, stat: any) => {
      const date = stat.reservation_date;
      if (!acc[date]) {
        acc[date] = {
          reservation_date: date,
          statusRevenues: {}
        };
      }
      
      acc[date].statusRevenues[stat.status] = parseFloat(stat.total_revenue?.toString() || '0');
      
      return acc;
    }, {});

    // Trier les données par date (plus ancien en premier pour l'affichage chronologique)
    const sortedData = Object.values(grouped).sort((a: any, b: any) => 
      new Date(a.reservation_date).getTime() - new Date(b.reservation_date).getTime()
    );

    const labels = sortedData.map((stat: any) => formatDate(stat.reservation_date));
    
    // Obtenir tous les statuts possibles
    const allStatuses = new Set<string>();
    sortedData.forEach((stat: any) => {
      Object.keys(stat.statusRevenues).forEach(status => allStatuses.add(status));
    });

    // Couleurs pour chaque statut
    const statusColors: { [key: string]: { bg: string; border: string } } = {
      'confirmed': { bg: 'rgba(76, 175, 80, 0.6)', border: 'rgba(76, 175, 80, 1)' },
      'pending': { bg: 'rgba(255, 152, 0, 0.6)', border: 'rgba(255, 152, 0, 1)' },
      'cancelled': { bg: 'rgba(244, 67, 54, 0.6)', border: 'rgba(244, 67, 54, 1)' },
      'completed': { bg: 'rgba(33, 150, 243, 0.6)', border: 'rgba(33, 150, 243, 1)' }
    };

    // Créer un dataset pour chaque statut avec ses revenus
    const datasets = Array.from(allStatuses).map(status => ({
      label: `${status.charAt(0).toUpperCase() + status.slice(1)}`,
      data: sortedData.map((stat: any) => stat.statusRevenues[status] || 0),
      backgroundColor: statusColors[status]?.bg || 'rgba(158, 158, 158, 0.6)',
      borderColor: statusColors[status]?.border || 'rgba(158, 158, 158, 1)',
      borderWidth: 1
    }));

    return {
      labels,
      datasets
    };
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Évolution des Revenus par Statut - 30 Derniers Jours'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatAmount(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        },
        stacked: false
      },
      y: {
        type: 'linear' as const,
        display: true,
        title: {
          display: true,
          text: 'Revenus (FCFA)'
        },
        stacked: false
      }
    },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchStats} startIcon={<Refresh />}>
          Réessayer
        </Button>
      </Box>
    );
  }

  if (!statsData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Aucune donnée statistique disponible
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Statistiques du Terrain
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />}
          onClick={fetchStats}
        >
          Actualiser
        </Button>
      </Box>

      {/* Section de filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterList sx={{ mr: 1 }} />
          <Typography variant="h6">
            Filtres
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <DatePicker
              label="Date de début"
              value={startDate}
              onChange={(newValue: Date | null) => setStartDate(newValue)}
              slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }}
            />
          </LocalizationProvider>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <DatePicker
              label="Date de fin"
              value={endDate}
              onChange={(newValue: Date | null) => setEndDate(newValue)}
              slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }}
            />
          </LocalizationProvider>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              label="Statut"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tous les statuts</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="confirmed">Confirmé</MenuItem>
              <MenuItem value="cancelled">Annulé</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
              setStatusFilter('all');
            }}
          >
            Réinitialiser
          </Button>
        </Box>
      </Paper>

      {/* Statistiques globales */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventNote color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Réservations
                  </Typography>
                  <Typography variant="h4">
                    {statsData.globalStats.total_reservations || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Revenus Total
                  </Typography>
                  <Typography variant="h4">
                    {formatAmount(parseFloat(statsData.globalStats.total_revenue?.toString() || '0'))}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Statistiques par statut */}
      <Paper sx={{ mb: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Répartition par Statut
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Tableau des statistiques */}
          <Box sx={{ flex: '1 1 400px', minWidth: '350px' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Réservations</TableCell>
                    <TableCell align="right">Revenus</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statsData.statusStats.map((stat) => (
                    <TableRow key={stat.status}>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(stat.status)}
                          color={getStatusColor(stat.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{stat.total_reservations}</TableCell>
                      <TableCell align="right">
                        {formatAmount(parseFloat(stat.total_revenue?.toString() || '0'))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          {/* Diagramme camembert des revenus */}
          <Box sx={{ flex: '1 1 400px', minWidth: '350px' }}>
            <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                Répartition des Revenus par Statut
              </Typography>
              {preparePieChartData() ? (
                <Box sx={{ width: '100%', height: '100%' }}>
                  <Pie data={preparePieChartData()!} options={pieChartOptions} />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucune donnée disponible pour le graphique
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Statistiques des 30 derniers jours du terrain */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Activité des 30 Derniers Jours (Mon Terrain)
        </Typography>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Réservations</TableCell>
                <TableCell align="right">Revenus</TableCell>
                <TableCell>Statuts</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupDataByDate().map((stat: any) => (
                <TableRow key={stat.reservation_date}>
                  <TableCell>{formatDate(stat.reservation_date)}</TableCell>
                  <TableCell align="right">{stat.total_reservations}</TableCell>
                  <TableCell align="right">
                    {formatAmount(stat.total_revenue)}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {Object.entries(stat.statuses).map(([status, count]: [string, any]) => (
                        <Chip
                          key={status}
                          label={`${status}: ${count}`}
                          size="small"
                          color={
                            status === 'confirmed' ? 'success' :
                            status === 'pending' ? 'warning' :
                            status === 'cancelled' ? 'error' : 'default'
                          }
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diagramme en barres des 30 derniers jours */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Graphique d'Évolution - 30 Derniers Jours
        </Typography>
        <Box sx={{ height: 400, mt: 2 }}>
          {prepareBarChartData() ? (
            <Bar data={prepareBarChartData()!} options={barChartOptions} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                Aucune donnée disponible pour le graphique
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Top créneaux horaires */}
      <Paper sx={{ mb: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Top 10 des Créneaux les Plus Populaires
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Heure</TableCell>
                <TableCell align="right">Réservations</TableCell>
                <TableCell align="right">Revenus</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statsData.topTimeSlots.map((slot, index) => (
                <TableRow key={`${slot.start_time}-${index}`}>
                  <TableCell>
                    {slot.start_time}
                  </TableCell>
                  <TableCell align="right">{slot.total_bookings}</TableCell>
                  <TableCell align="right">
                    {formatAmount(parseFloat(slot.total_revenue?.toString() || '0'))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Statistiques globales par date */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Statistiques Globales par Date (Tous Terrains)
        </Typography>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell align="right"><strong>Total Réservations</strong></TableCell>
                <TableCell align="right"><strong>Revenus Total</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {globalDateStats.map((stat) => (
                <TableRow key={stat.reservation_date}>
                  <TableCell>{formatDate(stat.reservation_date)}</TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={stat.total_reservations} 
                      color="primary" 
                      variant="outlined" 
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <strong>{formatAmount(parseFloat(stat.total_revenue?.toString() || '0'))}</strong>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AdminStats;
