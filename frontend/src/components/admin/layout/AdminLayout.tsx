import React, { useState, ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Tooltip,
  Popover
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  SportsSoccer,
  EventNote,
  People,
  Settings,
  MenuOpen,
  Menu as MenuIcon,
  MonetizationOn,
  Notifications,
  Assessment,
  Schedule,
  LocalOffer,
  Groups,
  Logout,
  Person,
  LockReset,
  PersonAdd,
  Work,
  Home,
  Groups as GroupsIcon,
  EmojiEvents as TrophyIcon,
  WorkspacePremium as ChampionshipIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

// Largeur du drawer
const DRAWER_WIDTH = 240;

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  
  // États
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  
  const isProfileMenuOpen = Boolean(profileMenuAnchorEl);
  const isNotificationsOpen = Boolean(notificationsAnchorEl);
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setProfileMenuAnchorEl(null);
  };
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Items du menu pour les admins de terrain
  const fieldAdminMenuItems = [
    { text: t('admin.dashboard', 'Tableau de bord'), path: '/admin', icon: <DashboardIcon /> },
    { text: 'Mon Terrain', path: '/admin/my-field', icon: <SportsSoccer /> },
    { text: t('admin.reservationsNav', 'Réservations'), path: '/admin/reservations', icon: <EventNote /> },
    { text: 'Équipes', path: '/admin/equipes', icon: <GroupsIcon /> },
    { text: 'Tournois', path: '/admin/tournois', icon: <TrophyIcon /> },
    { text: 'Championnats', path: '/admin/championnats', icon: <ChampionshipIcon /> },
    { text: 'Employés', path: '/admin/employees', icon: <People /> },
    { text: 'Statistiques', path: '/admin/stats', icon: <Assessment /> },
    { text: 'Gestion des disponibilités', path: '/admin/availability', icon: <Schedule /> },
  ];

  // Items du menu pour les super admins
  const superAdminCommonMenuItems = [
    { text: t('admin.dashboard', 'Tableau de bord'), path: '/admin', icon: <DashboardIcon /> },
    { text: t('admin.fields.section', 'Terrains'), path: '/admin/fields', icon: <SportsSoccer /> },
    { text: t('admin.reservationsNav', 'Réservations'), path: '/admin/reservations', icon: <EventNote /> },
    { text: 'Équipes', path: '/admin/equipes', icon: <GroupsIcon /> },
    { text: 'Tournois', path: '/admin/tournois', icon: <TrophyIcon /> },
    { text: 'Championnats', path: '/admin/championnats', icon: <ChampionshipIcon /> },
    { text: t('admin.users', 'Utilisateurs'), path: '/admin/users', icon: <People /> },
    { text: t('admin.reports', 'Rapports'), path: '/admin/reports', icon: <Assessment /> },
  ];

  // Items du menu spécifiques au super admin
  const superAdminMenuItems = [
    { text: 'Régions', path: '/admin/regions', icon: <LocationIcon /> },
    { text: t('admin.schedules', 'Créneaux horaires'), path: '/admin/timeslots', icon: <Schedule /> },
    { text: t('admin.availability', 'Gestion des disponibilités'), path: '/admin/manage-availability', icon: <Schedule /> },
  ];

  // Combiner les menus selon le rôle
  const menuItems = user?.role === 'super_admin'
    ? [...superAdminCommonMenuItems, ...superAdminMenuItems]
    : fieldAdminMenuItems;
    
  // Contenu du drawer
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '20px 16px', 
        bgcolor: '#1d693b',
        color: 'white'
      }}>
        <Box
          component="div"
          sx={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            bgcolor: '#8BC34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1
          }}
        >
          <SportsSoccer fontSize="large" />
        </Box>
        <Typography variant="h6" noWrap component="div" align="center">
          URBAN FOOT
        </Typography>
        <Typography variant="caption" noWrap component="div" align="center">
          {user?.role === 'super_admin' ? 'superadmin' : 'admin'}
        </Typography>
        <Typography variant="body2" noWrap component="div" align="center" sx={{ mt: 0.5 }}>
          Gestion Sportive
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
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
                ? 'rgba(29, 105, 59, 0.1)' 
                : 'transparent',
              '&:hover': {
                backgroundColor: (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) 
                  ? 'rgba(29, 105, 59, 0.2)' 
                  : 'rgba(0, 0, 0, 0.04)',
              },
              color: (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
                ? '#1d693b'
                : 'inherit',
              borderLeft: (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
                ? '4px solid #1d693b'
                : '4px solid transparent',
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) 
                  ? '#1d693b' 
                  : 'inherit' 
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/admin/payment-methods">
            <ListItemIcon>
              <MonetizationOn />
            </ListItemIcon>
            <ListItemText primary="Moyens de paiement" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar principal */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, 
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: '#1d693b'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileDrawerOpen(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Espace flexible */}
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Icônes de droite */}
          <Box sx={{ display: 'flex' }}>
            {/* Bouton Accueil */}
            <Tooltip title="Retour à l'accueil">
              <IconButton 
                color="inherit"
                onClick={() => navigate('/')}
                sx={{ mr: 1 }}
              >
                <Home />
              </IconButton>
            </Tooltip>
            
            {/* Notifications */}
            <IconButton 
              color="inherit"
              onClick={handleNotificationsOpen}
            >
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            {/* Profil utilisateur */}
            <Tooltip title="Paramètres du compte">
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ ml: 1 }}
                color="inherit"
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: '#8BC34A',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                >
                  {user?.role === 'super_admin' ? 'SA' : 'A'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Menu déroulant du profil */}
      <Menu
        anchorEl={profileMenuAnchorEl}
        id="profile-menu"
        open={isProfileMenuOpen}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: { width: 220 }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {(user?.first_name || user?.firstName) && (user?.last_name || user?.lastName)
              ? `${user.first_name || user.firstName} ${user.last_name || user.lastName}` 
              : (user?.first_name || user?.firstName) || (user?.last_name || user?.lastName) || 'Utilisateur'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role === 'super_admin' ? 'Super Administrateur' : 
             user?.role === 'admin' ? 'Administrateur' : 
             user?.role === 'employee' ? 'Employé' : 
             user?.role || 'Utilisateur'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => {
          handleProfileMenuClose();
          navigate('/profile');
        }}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Mon Profil</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Déconnexion</Typography>
        </MenuItem>
      </Menu>
      
      {/* Popover des notifications */}
      <Popover
        open={isNotificationsOpen}
        anchorEl={notificationsAnchorEl}
        onClose={handleNotificationsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 320, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Notifications</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" sx={{ py: 1 }}>
            Nouvelle réservation #12345 confirmée
          </Typography>
          <Divider />
          <Typography variant="body2" sx={{ py: 1 }}>
            Paiement reçu pour la réservation #12340
          </Typography>
          <Divider />
          <Typography variant="body2" sx={{ py: 1 }}>
            Nouvel utilisateur inscrit
          </Typography>
        </Box>
      </Popover>
      
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
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
      
      {/* Contenu principal */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { 
            xs: '100%', // Pleine largeur sur mobile
            md: `calc(100% - ${DRAWER_WIDTH}px)` // Largeur réduite sur desktop
          },
          ml: { 
            xs: 0, // Pas de marge gauche sur mobile
            md: `${DRAWER_WIDTH}px` // Marge gauche sur desktop
          },
          mt: '64px' // Hauteur de l'AppBar
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
