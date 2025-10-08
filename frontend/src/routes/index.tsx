import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';

// Layout
import Layout from '../components/layout/Layout';

// Route Protection
import ProtectedRoute from '../components/routing/ProtectedRoute';

// Public Components
import HomePage from '../components/home/HomePage';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import ForgotPassword from '../components/auth/ForgotPassword';
import ResetPassword from '../components/auth/ResetPassword';
import VerifyEmail from '../components/auth/VerifyEmail';
import NotFound from '../components/common/NotFound';
import Unauthorized from '../components/common/Unauthorized';

// Lazy-loaded components
const ProfilePage = React.lazy(() => import('../components/profile/ProfilePage'));
const FieldsList = React.lazy(() => import('../components/fields/FieldsList'));
const FieldDetails = React.lazy(() => import('../components/fields/FieldDetails'));
const BookingPage = React.lazy(() => import('../components/reservations/BookingPage'));
const ReservationsList = React.lazy(() => import('../components/reservations/ReservationsList'));
const DemandeEquipePage = React.lazy(() => import('../components/client/DemandeEquipePage'));
const TournoisPage = React.lazy(() => import('../pages/client/TournoisPage'));
// Utiliser le nouveau tableau de bord administrateur
const AdminDashboard = React.lazy(() => import('../components/admin/NewAdminDashboard'));
const EmployeeDashboard = React.lazy(() => import('../components/employee/EmployeeDashboard'));

// Composant d'attente pendant le chargement des composants lazy-loaded
const LazyLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
    <div className="loading-spinner"></div>
  </div>
);

const AppRoutes: React.FC = () => {
  const location = useLocation();
  console.log('Rendu des routes, chemin actuel:', location.pathname);
    
  return (
    <Routes>
      {/* Routes publiques avec layout standard */}
      <Route element={<Layout><Outlet /></Layout>}>
        <Route path="/" element={<HomePage />} />
        
        {/* Routes d'authentification (accessibles uniquement aux utilisateurs non connectés) */}
        <Route element={<ProtectedRoute requireUnauth />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>
        
        {/* Routes de profil utilisateur (authentification requise) */}
        <Route element={<ProtectedRoute requireAuth />}>
          <Route path="/profile" element={
            <React.Suspense fallback={<LazyLoading />}>
              <ProfilePage />
            </React.Suspense>
          } />
        </Route>
        
        {/* Routes des terrains */}
        <Route path="/fields">
          {/* Liste des terrains (accès public) */}
          <Route index element={
            <React.Suspense fallback={<LazyLoading />}>
              <FieldsList />
            </React.Suspense>
          } />
          
          {/* Détails d'un terrain (accès public) */}
          <Route path=":id" element={
            <React.Suspense fallback={<LazyLoading />}>
              <FieldDetails />
            </React.Suspense>
          } />
        </Route>
        
        {/* Route pour les terrains (authentification requise) */}
        <Route element={<ProtectedRoute requireAuth />}>
          {/* Réservation d'un terrain (authentification requise) */}
          <Route path="fields/:id/book" element={
            <React.Suspense fallback={<LazyLoading />}>
              <BookingPage />
            </React.Suspense>
          } />
        </Route>
        
        {/* Routes des réservations (authentification requise) */}
        <Route element={<ProtectedRoute requireAuth />}>
          <Route path="/reservations" element={
            <React.Suspense fallback={<LazyLoading />}>
              <ReservationsList />
            </React.Suspense>
          } />
          
          {/* Route pour la demande d'équipe (clients uniquement) */}
          <Route path="/mon-equipe" element={
            <React.Suspense fallback={<LazyLoading />}>
              <DemandeEquipePage />
            </React.Suspense>
          } />
          
          {/* Route pour les tournois (clients uniquement) */}
          <Route path="/tournois" element={
            <React.Suspense fallback={<LazyLoading />}>
              <TournoisPage />
            </React.Suspense>
          } />
        </Route>
        
        {/* Routes protégées pour les administrateurs */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <React.Suspense fallback={<LazyLoading />}>
                <AdminDashboard />
              </React.Suspense>
            </ProtectedRoute>
          } 
        />

        {/* Routes protégées pour les employés */}
        <Route 
          path="/employee/*" 
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <React.Suspense fallback={<LazyLoading />}>
                <EmployeeDashboard />
              </React.Suspense>
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Pages d'erreur */}
      <Route path="/not-found" element={<NotFound />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

export default AppRoutes;
