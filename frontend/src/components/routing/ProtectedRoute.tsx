import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  requireAuth?: boolean;
  requireUnauth?: boolean;
  requireAdmin?: boolean;
  allowedRoles?: string[];
  children?: React.ReactNode;
}

/**
 * Composant de protection des routes selon l'état d'authentification
 * @param requireAuth - Route accessible uniquement aux utilisateurs authentifiés
 * @param requireUnauth - Route accessible uniquement aux utilisateurs non authentifiés (ex: login/register)
 * @param requireAdmin - Route accessible uniquement aux administrateurs
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requireAuth = false,
  requireUnauth = false,
  requireAdmin = false,
  allowedRoles,
  children,
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const currentPath = location.pathname;

  // Vérification d'une session préexistante dans localStorage
  useEffect(() => {
    // Vérifier si nous avons un token mais que l'authentification n'est pas encore terminée
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // Si nous avons un token mais que l'authentification est en cours, attendons
    if (token && storedUser && loading) {
      console.log('Session existante détectée, attente de létat auth...');
      return;
    }
    
    setInitialLoadComplete(true);
  }, [loading, isAuthenticated]);

  // Déboguer état d'authentification et route actuelle
  console.log('Route protégée:', {
    path: currentPath,
    loading,
    isAuthenticated,
    userRole: user?.role,
    requireAuth,
    requireUnauth,
    requireAdmin,
    initialLoadComplete
  });
  
  // Exception spéciale pour /login - toujours permettre l'accès
  // Cette exception permet de résoudre un éventuel état incohérent d'authentification
  if (currentPath === '/login' && !isAuthenticated) {
    console.log('Accès spécial à /login autorisé');
    return <Outlet />;
  }

  // Vérifier si le chemin actuel commence par /admin
  const isAdminRoute = currentPath.startsWith('/admin');
  
  // Spécial: Pendant le chargement, avec un token dans localStorage
  // Montrer le loader plus longtemps pour permettre à l'authentification de se terminer
  // IMPORTANT: Ceci est particulièrement crucial pour les routes admin
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if ((loading || !initialLoadComplete) && token) {
    console.log('Route protégée: Chargement en cours avec token présent...', { isAdminRoute });
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#1d693b' }} />
        {isAdminRoute && (
          <Typography sx={{ ml: 2, color: '#1d693b' }}>
            Chargement de l'interface administrateur...
          </Typography>
        )}
      </Box>
    );
  }

  // Routes accessibles uniquement aux utilisateurs non authentifiés (ex: login, register)
  if (requireUnauth) {
    // Vérification plus sécurisée pour s'assurer que isAuthenticated est vraiment true
    if (isAuthenticated && user !== null) {
      console.log('Utilisateur déjà authentifié, redirection vers la page d\'accueil');
      return <Navigate to="/" replace />;
    }
    console.log('Accès autorisé à une route non-auth');
    return <Outlet />;
  }

  // Routes accessibles uniquement aux administrateurs
  if (requireAdmin) {
    // Si nous avons un token mais pas encore d'utilisateur authentifié complètement,
    // continuons à afficher le loader pour éviter le flash de 404
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      // Vérifier si l'utilisateur stocké a un rôle administrateur
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && (parsedUser.role === 'admin' || parsedUser.role === 'super_admin')) {
          // Si nous avons un token valide et un utilisateur admin stocké localement,
          // autoriser l'accès pendant que l'authentification complète se termine
          console.log('Accès administrateur temporaire autorisé pendant la vérification');
          return <Outlet />;
        }
      } catch (e) {
        console.error('Erreur lors de l\'analyse du user stocké:', e);
      }
    }
    
    // Vérification standard une fois l'authentification terminée
    return isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin') ? (
      <Outlet />
    ) : isAuthenticated ? (
      <Navigate to="/unauthorized" replace />
    ) : (
      <Navigate to="/login" replace />
    );
  }

  // Routes accessibles uniquement aux utilisateurs authentifiés
  if (requireAuth) {
    if (!isAuthenticated) {
      console.log('Accès refusé à une route protégée:', currentPath);
      
      // Stocker l'URL d'origine dans localStorage pour une redirection après connexion
      localStorage.setItem('redirectAfterLogin', currentPath);
      
      // Rediriger vers la page de connexion
      return <Navigate to="/login" replace />;
    }
    return <Outlet />;
  }

  // Vérification par rôles spécifiques
  if (allowedRoles && allowedRoles.length > 0) {
    if (!isAuthenticated) {
      console.log('Accès refusé à une route protégée par rôle:', currentPath);
      localStorage.setItem('redirectAfterLogin', currentPath);
      return <Navigate to="/login" replace />;
    }
    
    if (!user?.role || !allowedRoles.includes(user.role)) {
      console.log('Rôle non autorisé:', user?.role, 'Rôles autorisés:', allowedRoles);
      return <Navigate to="/unauthorized" replace />;
    }
    
    return children ? <>{children}</> : <Outlet />;
  }

  // Routes accessibles à tous
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
