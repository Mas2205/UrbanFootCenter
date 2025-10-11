import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { Box, Alert, Button } from '@mui/material';

// Import du layout et des composants
import AdminLayout from './layout/AdminLayout';
import SimpleAdminOverview from './overview/SimpleAdminOverview';

// Import des composants existants
import AdminFields from './fields/AdminFields';
import AdminFieldCreate from './fields/AdminFieldCreate';
import AdminFieldEdit from './fields/AdminFieldEdit';
import AdminFieldView from './fields/AdminFieldView';
import AdminReservations from './reservations/AdminReservations';
import AdminUsers from './users/AdminUsers';
import AdminSettings from './settings/AdminSettings';
import AdminTeams from './teams/AdminTeams';
import AdminPayments from './payments/AdminPayments';
import AdminReports from './reports/AdminReports';
import AdminNotifications from './notifications/AdminNotifications';
import AdminTimeSlots from './timeslots/AdminTimeSlots';
import AdminPromotions from './promotions/AdminPromotions';
import ManageAvailability from './availability/ManageAvailability';
import AdminClients from './clients/AdminClients';
import AdminStats from './stats/AdminStats';
import AdminEmployees from './employees/AdminEmployees';
import AdminFieldAvailability from './AdminFieldAvailability';
import AdminFieldManagement from './AdminFieldManagement';
import AdminPaymentMethods from './AdminPaymentMethods';

// Import des pages sportives
import EquipesPage from './equipes/EquipesPage';
import TournoisPage from './tournois/TournoisPage';
import ChampionnatsPage from './championnats/ChampionnatsPage';

// Import de la gestion des régions
import AdminRegions from './regions/AdminRegions';

const NewAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Vérifier que l'utilisateur est admin
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Accès refusé. Vous n'avez pas les permissions nécessaires.
        </Alert>
        <Button 
          variant="contained" 
          href="/"
          sx={{ bgcolor: '#1d693b' }}
        >
          Retour à l'accueil
        </Button>
      </Box>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<SimpleAdminOverview />} />
        
        {/* Routes existantes */}
        <Route path="/fields" element={<AdminFields />} />
        <Route path="/fields/create" element={<AdminFieldCreate />} />
        <Route path="/fields/edit/:id" element={<AdminFieldEdit />} />
        <Route path="/fields/view/:id" element={<AdminFieldView />} />
        <Route path="/reservations" element={<AdminReservations />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/settings" element={<AdminSettings />} />
        
        {/* Routes sportives (accessibles à tous les admins) */}
        <Route path="/equipes" element={<EquipesPage />} />
        <Route path="/tournois" element={<TournoisPage />} />
        <Route path="/championnats" element={<ChampionnatsPage />} />
        
        {/* Routes pour les fonctionnalités */}
        <Route path="/reports" element={<AdminReports />} />
        <Route path="/notifications" element={<AdminNotifications />} />
        <Route path="/employees" element={<AdminEmployees />} />
        <Route path="/stats" element={<AdminStats />} />
        <Route path="/availability" element={<AdminFieldAvailability />} />
        <Route path="/my-field" element={<AdminFieldManagement />} />
        <Route path="/payment-methods" element={<AdminPaymentMethods />} />
        
        {/* Nouvelles routes pour super admin */}
        <Route path="/regions" element={
          user.role === 'super_admin' ? <AdminRegions /> : <Navigate to="/admin" replace />
        } />
        <Route path="/timeslots" element={
          user.role === 'super_admin' ? <AdminTimeSlots /> : <Navigate to="/admin" replace />
        } />
        <Route path="/manage-availability" element={
          user.role === 'super_admin' ? <ManageAvailability /> : <Navigate to="/admin" replace />
        } />
        <Route path="/promotions" element={
          user.role === 'super_admin' ? <AdminPromotions /> : <Navigate to="/admin" replace />
        } />
        <Route path="/teams" element={
          user.role === 'super_admin' ? <AdminTeams /> : <Navigate to="/admin" replace />
        } />
        <Route path="/clients" element={
          user.role === 'super_admin' ? <AdminClients /> : <Navigate to="/admin" replace />
        } />
        
        {/* Route par défaut */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default NewAdminDashboard;
