import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Alert } from '@mui/material';
import AdminReservations from '../admin/reservations/AdminReservations';
import EmployeeLayout from './layout/EmployeeLayout';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Vérifier que l'utilisateur est un employé
  if (!user || user.role !== 'employee') {
    return (
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Accès refusé. Vous devez être connecté en tant qu'employé pour accéder à cette page.
        </Alert>
      </Box>
    );
  }

  return (
    <EmployeeLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/employee/reservations" replace />} />
        <Route path="/reservations" element={<AdminReservations />} />
        
        {/* Route par défaut */}
        <Route path="*" element={<Navigate to="/employee/reservations" replace />} />
      </Routes>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
