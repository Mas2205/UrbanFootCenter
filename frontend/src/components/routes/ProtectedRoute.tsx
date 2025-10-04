import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireUnauth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requireAuth = false,
  requireAdmin = false,
  requireUnauth = false,
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Chargement...
        </Typography>
      </Box>
    );
  }

  // Rediriger vers la page de connexion si l'authentification est requise mais l'utilisateur n'est pas connecté
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rediriger vers la page d'accueil si l'accès admin est requis mais l'utilisateur n'est pas admin
  if (requireAdmin && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin'))) {
    return <Navigate to="/" replace />;
  }

  // Rediriger vers la page d'accueil si la route est destinée aux utilisateurs non authentifiés mais l'utilisateur est connecté
  if (requireUnauth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Rendre les composants enfants si les conditions sont remplies
  return <Outlet />;
};

export default ProtectedRoute;
