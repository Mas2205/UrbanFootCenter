import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Box, 
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  AccountCircle, 
  Translate, 
  SportsSoccer, 
  EventNote, 
  ExitToApp,
  Dashboard,
  Person,
  Login
} from '@mui/icons-material';
// Importer depuis le fichier index.ts des contexts qui exporte tous les contexts
import { useAuth } from '../../contexts';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // État pour les menus
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Gestion des menus
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLangMenu = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };
  
  const handleLangClose = () => {
    setLangAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // Changer la langue
  const changeLanguage = (lng: string) => {
    // Utiliser uniquement la méthode disponible dans i18n
    if (typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(lng);
    }
    localStorage.setItem('language', lng);
    handleLangClose();
  };
  
  // Déconnexion
  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };
  
  // Réinitialisation de l'authentification en cas d'état incohérent
  const handleResetAuth = () => {
    // Si on est dans un état étrange où user existe mais que des fonctionnalités ne marchent pas
    console.log('Réinitialisation de létat d´authentification...');
    logout(); // Forçage de la déconnexion
    
    // Nettoyer le localStorage manuellement pour éviter tout problème résiduel
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Rediriger vers la page de connexion après un court délai
    setTimeout(() => {
      window.location.href = '/login?reset=true'; // Utiliser window.location pour un rafraîchissement complet
    }, 100);
  };

  // Contenu du drawer mobile
  const drawerContent = (
    <div>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('app.name')}
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem component={Link} to="/">
          <ListItemIcon><SportsSoccer /></ListItemIcon>
          <ListItemText primary={t('nav.home')} />
        </ListItem>
        <ListItem component={Link} to="/fields">
          <ListItemIcon><SportsSoccer /></ListItemIcon>
          <ListItemText primary={t('nav.fields')} />
        </ListItem>
        {user ? (
          <>
            {user.role === 'admin' || user.role === 'super_admin' ? (
              <ListItem component={Link} to="/admin">
                <ListItemIcon><Dashboard /></ListItemIcon>
                <ListItemText primary="Administration" />
              </ListItem>
            ) : (
              <ListItem component={Link} to="/reservations">
                <ListItemIcon><EventNote /></ListItemIcon>
                <ListItemText primary={t('nav.reservations')} />
              </ListItem>
            )}
            <ListItem component={Link} to="/profile">
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText primary={t('nav.profile')} />
            </ListItem>
            {user.role === 'employee' ? (
              <ListItem component={Link} to="/employee">
                <ListItemIcon><Dashboard /></ListItemIcon>
                <ListItemText primary="Administration" />
              </ListItem>
            ) : null}
            <ListItem sx={{ cursor: 'pointer' }} onClick={handleLogout}>
              <ListItemIcon><ExitToApp /></ListItemIcon>
              <ListItemText primary={t('nav.logout')} />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem onClick={() => navigate('/login')} sx={{ cursor: 'pointer' }}>
              <ListItemIcon><Login /></ListItemIcon>
              <ListItemText primary={t('nav.login')} />
            </ListItem>
            <ListItem component={Link} to="/register">
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText primary={t('nav.register')} />
            </ListItem>
          </>
        )}
      </List>
      <Divider />
      <List>
        <ListItem sx={{ cursor: 'pointer' }} onClick={() => changeLanguage('fr')}>
          <ListItemText primary="Français" />
        </ListItem>
        <ListItem sx={{ cursor: 'pointer' }} onClick={() => changeLanguage('wo')}>
          <ListItemText primary="Wolof" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
            {t('app.name')}
          </Typography>

          {!isMobile && (
            <>
              <Button color="inherit" component={Link} to="/">
                {t('nav.home')}
              </Button>
              <Button color="inherit" component={Link} to="/fields">
                {t('nav.fields')}
              </Button>
              {user && (user.role === 'admin' || user.role === 'super_admin') ? (
                <Button color="inherit" component={Link} to="/admin">
                  Administration
                </Button>
              ) : user && user.role === 'client' ? (
                <Button color="inherit" component={Link} to="/reservations">
                  {t('nav.reservations')}
                </Button>
              ) : null}
            </>
          )}

          <IconButton
            onClick={handleLangMenu}
            color="inherit"
          >
            <Translate />
          </IconButton>
          <Menu
            id="language-menu"
            anchorEl={langAnchorEl}
            keepMounted
            open={Boolean(langAnchorEl)}
            onClose={handleLangClose}
          >
            <MenuItem onClick={() => changeLanguage('fr')}>Français</MenuItem>
            <MenuItem onClick={() => changeLanguage('wo')}>Wolof</MenuItem>
          </Menu>

          {!isMobile && (
            user ? (
              <div>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="inherit">
                    {(user.first_name || user.firstName) && (user.last_name || user.lastName)
                      ? `${user.first_name || user.firstName} ${user.last_name || user.lastName}` 
                      : (user.first_name || user.firstName) || (user.last_name || user.lastName) || 'Utilisateur'}
                  </Typography>
                  <IconButton
                    onClick={handleMenu}
                    color="inherit"
                  >
                    <Avatar sx={{ width: 32, height: 32, backgroundColor: 'secondary.main' }}>
                      {user.firstName ? user.firstName.charAt(0) : 'U'}
                    </Avatar>
                  </IconButton>
                </Box>
                <Menu
                  id="user-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem component={Link} to="/profile" onClick={handleClose}>
                    {t('nav.profile')}
                  </MenuItem>
                  {user.role === 'admin' || user.role === 'super_admin' ? (
                    <MenuItem component={Link} to="/admin" onClick={handleClose}>
                      {t('nav.admin')}
                    </MenuItem>
                  ) : user.role === 'employee' ? (
                    <MenuItem component={Link} to="/employee" onClick={handleClose}>
                      Administration
                    </MenuItem>
                  ) : null}
                  <MenuItem onClick={handleLogout}>
                    {t('nav.logout')}
                  </MenuItem>
                </Menu>
              </div>
            ) : (
              <div>
                <Button 
                  color="inherit" 
                  onClick={() => {
                    // Vérifier si nous sommes dans un état incohérent
                    const token = localStorage.getItem('token');
                    if (token && !user) {
                      handleResetAuth(); // Réinitialiser l'état si incohérence détectée
                    } else {
                      navigate('/login');
                    }
                  }}
                >
                  {t('nav.login')}
                </Button>
                <Button color="inherit" component={Link} to="/register">
                  {t('nav.register')}
                </Button>
              </div>
            )
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Navbar;
