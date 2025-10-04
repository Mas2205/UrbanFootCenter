import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  is_active: boolean;
  field_id: string;
  created_at: string;
}

interface NewEmployee {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

const AdminEmployees: React.FC = () => {
  const { user } = useAuth();
  
  // États
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Chargement des employés
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Erreur d\'authentification. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }
      
      const baseApiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const apiUrl = `${baseApiUrl}/admin/employees`;
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setEmployees(response.data.data);
        setError(null);
      } else {
        setError('Erreur lors du chargement des employés');
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des employés:", err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async () => {
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email || !newEmployee.password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Erreur d\'authentification. Veuillez vous reconnecter.');
        return;
      }
      
      const baseApiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const apiUrl = `${baseApiUrl}/admin/employees`;
      
      const employeeData = {
        first_name: newEmployee.firstName,
        last_name: newEmployee.lastName,
        email: newEmployee.email,
        phone_number: newEmployee.phone || null,
        password: newEmployee.password,
        role: 'employee',
        field_id: user?.fieldId
      };
      
      const response = await axios.post(apiUrl, employeeData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setOpenDialog(false);
        setNewEmployee({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: ''
        });
        fetchEmployees(); // Recharger la liste
        setError(null);
      } else {
        setError(response.data.message || 'Erreur lors de la création de l\'employé');
      }
    } catch (err: any) {
      console.error("Erreur lors de la création de l'employé:", err);
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'employé');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Erreur d\'authentification. Veuillez vous reconnecter.');
        return;
      }
      
      const baseApiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const apiUrl = `${baseApiUrl}/admin/employees/${employeeId}`;
      
      const response = await axios.delete(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        fetchEmployees(); // Recharger la liste
        setError(null);
      } else {
        setError(response.data.message || 'Erreur lors de la suppression de l\'employé');
      }
    } catch (err: any) {
      console.error("Erreur lors de la suppression de l'employé:", err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'employé');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
          Gestion des Employés
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={fetchEmployees}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Ajouter un Employé
          </Button>
        </Box>
      </Box>

      {/* Affichage des erreurs */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tableau des employés */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nom</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Téléphone</strong></TableCell>
                <TableCell><strong>Statut</strong></TableCell>
                <TableCell><strong>Date de création</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Aucun employé trouvé
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      {employee.first_name} {employee.last_name}
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone_number || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.is_active ? 'Actif' : 'Inactif'}
                        color={employee.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(employee.created_at)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Supprimer">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog pour ajouter un employé */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un Nouvel Employé</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Prénom *"
              value={newEmployee.firstName}
              onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Nom *"
              value={newEmployee.lastName}
              onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Téléphone"
              value={newEmployee.phone}
              onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Mot de passe *"
              type="password"
              value={newEmployee.password}
              onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
              margin="normal"
              helperText="L'employé pourra modifier son mot de passe après connexion"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button 
            onClick={handleCreateEmployee} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminEmployees;
