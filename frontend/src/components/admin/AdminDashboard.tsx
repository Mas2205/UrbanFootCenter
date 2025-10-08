import React, { useState } from 'react';
import { Routes, Route, Link as RouterLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link,
  Button,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  SportsSoccer,
  EventNote,
  People,
  Settings,
  MenuOpen,
  Home,
  ChevronRight,
  MonetizationOn,
  Notifications,
  Assessment,
  Schedule,
  Menu as MenuIcon,
  Groups as GroupsIcon,
  EmojiEvents as TrophyIcon,
  WorkspacePremium as ChampionshipIcon
} from '@mui/icons-material';

import AdminFields from './fields/AdminFields';
import AdminFieldCreate from './fields/AdminFieldCreate';
import AdminFieldEdit from './fields/AdminFieldEdit';
import AdminReservations from './reservations/AdminReservations';
import AdminUsers from './users/AdminUsers';
import AdminSettings from './settings/AdminSettings';
import AdminOverview from './overview/AdminOverview';
import AdminPayments from './payments/AdminPayments';
import AdminReports from './reports/AdminReports';
import AdminNotifications from './notifications/AdminNotifications';
import AdminTimeSlots from './timeslots/AdminTimeSlots';
import EquipesPage from './equipes/EquipesPage';
import TournoisPage from './tournois/TournoisPage';
import ChampionnatsPage from './championnats/ChampionnatsPage';
import { useAuth } from '../../contexts';

// Largeur du drawer
const DRAWER_WIDTH = 240;

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  // États
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Vérifier que l'utilisateur est admin
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {t('admin.accessDenied')}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
          >
            {t('common.backToHome')}
          </Button>
        </Box>
      </Container>
    );
  }

  // Items du menu communs à tous les admins
  const commonMenuItems = [
    { text: t('admin.dashboard'), path: '/admin', icon: <DashboardIcon /> },
    { text: t('admin.fields'), path: '/admin/fields', icon: <SportsSoccer /> },
    { text: t('admin.reservations'), path: '/admin/reservations', icon: <EventNote /> },
    { text: t('admin.users'), path: '/admin/users', icon: <People /> },
    { text: t('admin.payments'), path: '/admin/payments', icon: <MonetizationOn /> },
    { text: t('admin.reports'), path: '/admin/reports', icon: <Assessment /> },
    { text: t('admin.notifications'), path: '/admin/notifications', icon: <Notifications /> },
  ];

  // Items du menu sportifs (visibles pour tous les admins)
  const sportsMenuItems = [
    { text: '🏆 Équipes', path: '/admin/equipes', icon: <GroupsIcon /> },
    { text: '🥇 Tournois', path: '/admin/tournois', icon: <TrophyIcon /> },
    { text: '👑 Championnats', path: '/admin/championnats', icon: <ChampionshipIcon /> },
  ];

  // Items du menu spécifiques au super admin
  const superAdminMenuItems = [
    { text: t('admin.timeSlots'), path: '/admin/timeslots', icon: <Schedule /> },
  ];

  // Réglages (visible pour tous les admins)
  const settingsMenuItem = { text: t('admin.settings'), path: '/admin/settings', icon: <Settings /> };

  // Combiner les menus selon le rôle
  const menuItems = user.role === 'super_admin'
    ? [...commonMenuItems, ...sportsMenuItems, ...superAdminMenuItems, settingsMenuItem]
    : [...commonMenuItems, ...sportsMenuItems, settingsMenuItem];
  
  
  // Obtenir le nom de la page actuelle pour le breadcrumb
  const getCurrentPageName = () => {
    const path = location.pathname;
    
    // Page principale du dashboard
    if (path === '/admin') {
      return t('admin.dashboard');
    }
    
    // Sous-pages
    const matchedItem = menuItems.find(item => path.startsWith(item.path) && item.path !== '/admin');
    if (matchedItem) {
      // Vérifier s'il y a des sous-pages supplémentaires
      const restPath = path.replace(matchedItem.path, '');
      
      // Création de terrain
      if (matchedItem.path === '/admin/fields' && restPath === '/create') {
        return [matchedItem.text, t('admin.createField')];
      }
      
      // Édition de terrain
      if (matchedItem.path === '/admin/fields' && restPath.startsWith('/edit')) {
        return [matchedItem.text, t('admin.editField')];
      }
      
      return matchedItem.text;
    }
    
    return '';
  };
  
  // Contenu du drawer
  const drawer = (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '16px', 
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <SportsSoccer fontSize="large" sx={{ mr: 1 }} />
        <Typography variant="h6" noWrap component="div">
          Urban Foot Admin
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            component={RouterLink} 
            to={item.path}
            onClick={() => {
              if (isMobile) {
                setMobileDrawerOpen(false);
              }
            }}
            sx={{
              backgroundColor: (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) 
                ? 'rgba(0, 128, 0, 0.1)' 
                : 'transparent',
              '&:hover': {
                backgroundColor: (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) 
                  ? 'rgba(0, 128, 0, 0.2)' 
                  : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Drawer pour version mobile */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{
          keepMounted: true, // Better performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Drawer permanent pour desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            width: DRAWER_WIDTH, 
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
      
      {/* Contenu principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        {/* En-tête avec menu mobile et fil d'Ariane */}
        <AppBar 
          position="static" 
          color="default" 
          elevation={0}
          sx={{ mb: 3, borderRadius: 1, bgcolor: 'background.paper' }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuOpen />
            </IconButton>
            
            <Breadcrumbs
              separator={<ChevronRight fontSize="small" />}
              aria-label="breadcrumb"
            >
              <Link 
                component={RouterLink}
                underline="hover"
                color="inherit"
                to="/"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Home sx={{ mr: 0.5 }} fontSize="inherit" />
                {t('nav.home')}
              </Link>
              <Link
                component={RouterLink}
                underline="hover"
                color="inherit"
                to="/admin"
              >
                {t('admin.panel')}
              </Link>
              {Array.isArray(getCurrentPageName()) ? (
                <>
                  <Link
                    component={RouterLink}
                    underline="hover"
                    color="inherit"
                    to={`/admin/${getCurrentPageName()[0].toLowerCase()}`}
                  >
                    {getCurrentPageName()[0]}
                  </Link>
                  <Typography color="text.primary">
                    {getCurrentPageName()[1]}
                  </Typography>
                </>
              ) : (
                <Typography color="text.primary">
                  {getCurrentPageName()}
                </Typography>
              )}
            </Breadcrumbs>
          </Toolbar>
        </AppBar>
        
        {/* Routes pour les différentes sections admin */}
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          
          {/* Routes existantes */}
          <Route path="/fields" element={<AdminFields />} />
          <Route path="/fields/create" element={<AdminFieldCreate />} />
          <Route path="/fields/edit/:id" element={<AdminFieldEdit />} />
          <Route path="/reservations" element={<AdminReservations />} />
          <Route path="/equipes" element={<EquipesPage />} />
          <Route path="/tournois" element={<TournoisPage />} />
          <Route path="/championnats" element={<ChampionnatsPage />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/settings" element={<AdminSettings />} />
          
          {/* Routes qui étaient en Coming Soon mais que nous allons implémenter */}
          <Route path="/payments" element={<AdminPayments />} />
          <Route path="/reports" element={<AdminReports />} />
          <Route path="/notifications" element={<AdminNotifications />} />
          
          {/* Nouvelles routes pour super admin */}
          <Route path="/timeslots" element={
            user.role === 'super_admin' ? <AdminTimeSlots /> : <Navigate to="/admin" replace />
          } />
          
          {/* Route par défaut */}
          <Route path="*" element={
            <Box sx={{ p: 3 }}>
              <Alert severity="warning">
                {t('common.pageNotFound')}
              </Alert>
              <Button 
                variant="contained" 
                onClick={() => navigate('/admin')}
                sx={{ mt: 2 }}
              >
                {t('admin.backToDashboard')}
              </Button>
            </Box>
          } />
        </Routes>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
