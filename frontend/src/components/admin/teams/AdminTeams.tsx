import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Refresh, 
  Person, 
  PersonAdd, 
  RemoveCircle, 
  SportsHandball,
  SportsSoccer
} from '@mui/icons-material';
import api from '../../../services/api';
import type { API } from '../../../services/api/types';
import { Team as ApiTeam, TeamDetails as ApiTeamDetails, User as ApiUser } from '../../../services/api/adminAPI';

// Types composant (snake_case)
interface Player {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url?: string;
}

interface Team {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  captain_id: string;
  captain_name: string;
  player_count: number;
  created_at: string;
  updated_at: string;
}

interface TeamFormData {
  name: string;
  description?: string;
  captain_id?: string;
}

interface TeamDetailData extends Team {
  players: Player[];
}

// Fonctions de transformation entre API (camelCase) et composant (snake_case) avec validation
const transformApiTeamToComponent = (apiTeam: ApiTeam): Team => {
  if (!apiTeam) {
    console.error("Équipe API invalide ou manquante");
    // Retourner une équipe par défaut
    return {
      id: "",
      name: "ERREUR",
      description: "Données d'équipe invalides",
      captain_id: "",
      captain_name: "",
      player_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  try {
    // Validation des dates
    const validateDate = (dateStr: string | undefined): string => {
      if (!dateStr) return new Date().toISOString();
      
      try {
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) ? dateStr : new Date().toISOString();
      } catch (e) {
        console.error("Date invalide:", dateStr);
        return new Date().toISOString();
      }
    };

    return {
      id: apiTeam.id || "",
      name: typeof apiTeam.name === 'string' ? apiTeam.name : "Équipe sans nom",
      logo_url: typeof apiTeam.logo === 'string' ? apiTeam.logo : undefined,
      description: "",  // Non fourni directement par l'API
      captain_id: typeof apiTeam.captainId === 'string' ? apiTeam.captainId : "",
      captain_name: typeof apiTeam.captainName === 'string' ? apiTeam.captainName : "",
      player_count: typeof apiTeam.playerCount === 'number' ? apiTeam.playerCount : 0,
      created_at: validateDate(apiTeam.createdAt),
      updated_at: validateDate(apiTeam.updatedAt)
    };
  } catch (error) {
    console.error("Erreur lors de la transformation d'une équipe", error, apiTeam);
    // Retourner une équipe par défaut en cas d'erreur
    return {
      id: apiTeam.id || "",
      name: typeof apiTeam.name === 'string' ? apiTeam.name : "ERREUR",
      description: "Erreur de format",
      captain_id: "",
      captain_name: "",
      player_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

const transformApiTeamDetailsToComponent = (apiTeamDetails: ApiTeamDetails): TeamDetailData => {
  if (!apiTeamDetails) {
    console.error("Détails d'équipe API invalides ou manquants");
    // Retourner des détails d'équipe par défaut
    return {
      id: "",
      name: "ERREUR",
      description: "Détails d'équipe invalides",
      captain_id: "",
      captain_name: "",
      player_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      players: []
    };
  }
  
  try {
    // Transformer l'équipe de base avec la fonction déjà améliorée
    const team = transformApiTeamToComponent(apiTeamDetails);
    
    // Transformer et valider chaque joueur
    const players = Array.isArray(apiTeamDetails.players) 
      ? apiTeamDetails.players.map(player => {
          try {
            if (!player) return null;
            
            return {
              id: player.id || "",
              name: typeof player.name === 'string' ? player.name : "Joueur sans nom",
              email: typeof player.email === 'string' ? player.email : "",
              phone: typeof player.phone === 'string' ? player.phone : "",
              avatar_url: undefined  // Non fourni par l'API
            };
          } catch (playerError) {
            console.error("Erreur lors de la transformation d'un joueur", playerError, player);
            return null;
          }
        }).filter(Boolean) as Player[]
      : [];
    
    return {
      ...team,
      players
    };
  } catch (error) {
    console.error("Erreur lors de la transformation des détails d'équipe", error, apiTeamDetails);
    // Retourner des détails d'équipe par défaut en cas d'erreur
    return {
      id: apiTeamDetails.id || "",
      name: typeof apiTeamDetails.name === 'string' ? apiTeamDetails.name : "ERREUR",
      description: "Erreur de format",
      captain_id: "",
      captain_name: "",
      player_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      players: []
    };
  }
};

const transformApiUserToPlayer = (apiUser: ApiUser): Player => {
  if (!apiUser) {
    console.error("Utilisateur API invalide ou manquant");
    // Retourner un joueur par défaut
    return {
      id: "",
      name: "ERREUR",
      email: "donnees.invalides@exemple.com",
      phone: "",
      avatar_url: undefined
    };
  }
  
  try {
    return {
      id: apiUser.id || "",
      name: typeof apiUser.name === 'string' ? apiUser.name : "Utilisateur sans nom",
      email: typeof apiUser.email === 'string' ? apiUser.email : "",
      phone: typeof apiUser.phone === 'string' ? apiUser.phone : "",
      avatar_url: undefined  // Non fourni par l'API
    };
  } catch (error) {
    console.error("Erreur lors de la transformation d'un utilisateur en joueur", error, apiUser);
    // Retourner un joueur par défaut en cas d'erreur
    return {
      id: apiUser.id || "",
      name: "Erreur format",
      email: "",
      phone: "",
      avatar_url: undefined
    };
  }
};

const transformTeamFormToApiRequest = (formData: TeamFormData): Omit<ApiTeam, 'id' | 'playerCount' | 'createdAt' | 'updatedAt'> => {
  return {
    name: formData.name,
    captainId: formData.captain_id
  };
};

const AdminTeams: React.FC = () => {
  const { t } = useTranslation();
  
  // États
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentTeam, setCurrentTeam] = useState<TeamFormData>({
    name: '',
    description: '',
    captain_id: undefined
  });
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [teamDetailOpen, setTeamDetailOpen] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetailData | null>(null);
  const [userSearchDialog, setUserSearchDialog] = useState<boolean>(false);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [filteredUsers, setFilteredUsers] = useState<Player[]>([]);
  const [loadingTeamDetail, setLoadingTeamDetail] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  
  // Chargement des équipes
  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Erreur d'authentification: Token manquant");
      setError(t('common.authError'));
      setLoading(false);
      return;
    }
    
    try {
      console.log(`Récupération des équipes avec auth: JWT ${token.substring(0, 15)}...`);
      
      const response = await (api as API).admin.getTeams()
        .catch(error => {
          console.error("Erreur lors de la récupération des équipes:", error);
          throw error; // Relancer l'erreur pour qu'elle soit capturée par le bloc catch extérieur
        });
      
      if (!response || !response.data || !Array.isArray(response.data.teams)) {
        throw new Error("Réponse de l'API invalide ou vide");
      }
      
      // Transformer les équipes API en équipes composant avec validation
      const apiTeams = response.data.teams || [];
      console.log(`${apiTeams.length} équipes récupérées`);
      
      const transformedTeams = apiTeams.map(team => {
        try {
          return transformApiTeamToComponent(team);
        } catch (transformError) {
          console.error("Erreur lors de la transformation d'une équipe:", transformError, team);
          return null;
        }
      }).filter(Boolean) as Team[];
      
      setTeams(transformedTeams);
    } catch (err) {
      console.error("Erreur lors du chargement des équipes", err);
      setError(t('admin.teams.errorLoading'));
      setTeams([]); // Réinitialiser les équipes en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  // Chargement des utilisateurs pour la sélection du capitaine
  const fetchUsers = async () => {
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Erreur d'authentification: Token manquant");
      setError(t('common.authError'));
      return [];
    }
    
    try {
      console.log(`Récupération des utilisateurs avec auth: JWT ${token.substring(0, 15)}...`);
      
      const response = await (api as API).admin.getUsers()
        .catch(error => {
          console.error("Erreur lors de la récupération des utilisateurs:", error);
          throw error;
        });
      
      if (!response || !response.data || !Array.isArray(response.data)) {
        console.error("Réponse de l'API des utilisateurs invalide ou vide");
        setError(t('admin.teams.errorLoadingUsers'));
        return [];
      }
      
      // Transformer les utilisateurs API en joueurs pour le composant
      const apiUsers = response.data || [];
      console.log(`${apiUsers.length} utilisateurs récupérés`);
      
      const transformedUsers = apiUsers.map(user => {
        try {
          return transformApiUserToPlayer(user);
        } catch (transformError) {
          console.error("Erreur lors de la transformation d'un utilisateur:", transformError, user);
          return null;
        }
      }).filter(Boolean) as Player[];
      
      setUsers(transformedUsers);
      return transformedUsers;
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs", err);
      setError(t('admin.teams.errorLoadingUsers'));
      return [];
    }
  };

  // Gestion de la pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestion du dialogue de création/édition
  const handleOpenCreateDialog = async () => {
    setDialogMode('create');
    setCurrentTeam({
      name: '',
      description: '',
      captain_id: undefined
    });
    // Charger les utilisateurs pour la sélection du capitaine
    if (users.length === 0) {
      await fetchUsers();
    }
    setOpenDialog(true);
  };

  const handleOpenEditDialog = async (team: Team) => {
    setDialogMode('edit');
    setCurrentTeam({
      name: team.name,
      description: team.description || '',
      captain_id: team.captain_id
    });
    setCurrentTeamId(team.id);
    // Charger les utilisateurs pour la sélection du capitaine
    if (users.length === 0) {
      await fetchUsers();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTeamId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentTeam(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSaveTeam = async () => {
    // Valider les données requises
    if (!currentTeam.name) {
      setError(t('admin.teams.errorNameRequired'));
      return;
    }
    
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Erreur d'authentification: Token manquant");
      setError(t('common.authError'));
      return;
    }
    
    setFormSubmitting(true);
    setError(null); // Effacer les erreurs précédentes
    
    try {
      // Transformer les données du formulaire au format API
      const apiTeamData = transformTeamFormToApiRequest(currentTeam);
      console.log(`${dialogMode === 'create' ? 'Création' : 'Mise à jour'} d'équipe avec les données:`, apiTeamData);
      
      if (dialogMode === 'create') {
        await (api as API).admin.createTeam(apiTeamData)
          .catch(error => {
            console.error("Erreur lors de la création de l'équipe:", error);
            throw error;
          });
        setSnackbarMessage(t('admin.teams.createdSuccess'));
      } else {
        if (currentTeamId) {
          await (api as API).admin.updateTeam(currentTeamId, apiTeamData)
            .catch(error => {
              console.error("Erreur lors de la mise à jour de l'équipe:", error);
              throw error;
            });
          setSnackbarMessage(t('admin.teams.updatedSuccess'));
        } else {
          throw new Error("ID d'équipe manquant pour la mise à jour");
        }
      }
      
      setSnackbarOpen(true);
      handleCloseDialog();
      await fetchTeams(); // Recharger la liste des équipes après modification
    } catch (err) {
      console.error("Erreur lors de l'opération sur l'équipe", err);
      setError(dialogMode === 'create' 
        ? t('admin.teams.errorCreating')
        : t('admin.teams.errorUpdating'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Gestion de la suppression
  const handleOpenDeleteConfirm = (id: string) => {
    setTeamToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setTeamToDelete(null);
  };

  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);

  const handleDelete = async () => {
    if (!teamToDelete) {
      console.error("ID d'équipe manquant pour la suppression");
      handleCloseDeleteConfirm();
      return;
    }
      
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Erreur d'authentification: Token manquant");
      setError(t('common.authError'));
      handleCloseDeleteConfirm();
      return;
    }
    
    setDeleteSubmitting(true);
    setError(null); // Effacer les erreurs précédentes
      
    try {
      console.log(`Suppression de l'équipe ${teamToDelete}...`);
      await (api as API).admin.deleteTeam(teamToDelete)
        .catch(error => {
          console.error("Erreur lors de la suppression de l'équipe:", error);
          throw error;
        });
          
      setError(null);
      setSnackbarMessage(t('admin.teams.deletedSuccess'));
      setSnackbarOpen(true);
      await fetchTeams(); // Recharger la liste des équipes après suppression
    } catch (err) {
      console.error("Erreur lors de la suppression de l'équipe", err);
      setError(t('admin.teams.errorDeleting'));
    } finally {
      setDeleteSubmitting(false);
      handleCloseDeleteConfirm();
    }
  };

  const handleViewTeamDetail = async (teamId: string) => {
    if (!teamId) {
      console.error("ID d'équipe manquant pour les détails");
      setError(t('admin.teams.errorLoadingDetails'));
      return;
    }
    
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Erreur d'authentification: Token manquant");
      setError(t('common.authError'));
      return;
    }
    
    setLoadingTeamDetail(true);
    setError(null);
    
    try {
      console.log(`Récupération des détails de l'équipe ${teamId} avec auth: JWT ${token.substring(0, 15)}...`);
      
      const response = await (api as API).admin.getTeamDetail(teamId)
        .catch(error => {
          console.error("Erreur lors de la récupération des détails de l'équipe:", error);
          throw error;
        });
      
      if (!response || !response.data) {
        throw new Error("Réponse de l'API des détails d'équipe invalide ou vide");
      }
      
      // Transformer les détails d'équipe API en format composant
      try {
        const transformedTeamDetails = transformApiTeamDetailsToComponent(response.data);
        setSelectedTeam(transformedTeamDetails);
        setTeamDetailOpen(true);
      } catch (transformError) {
        console.error("Erreur lors de la transformation des détails de l'équipe", transformError);
        throw transformError;
      }
    } catch (err) {
      console.error("Erreur lors du chargement des détails de l'équipe", err);
      setError(t('admin.teams.errorLoadingDetails'));
      // Ne pas ouvrir le dialogue en cas d'erreur
      setSelectedTeam(null);
    } finally {
      setLoadingTeamDetail(false);
    }
  };

  // Ajouter un joueur à l'équipe
  const handleOpenAddPlayerDialog = async () => {
    if (users.length === 0) {
      await fetchUsers();
    }
    setFilteredUsers(users);
    setUserSearchQuery('');
    setUserSearchDialog(true);
  };

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setUserSearchQuery(query);
    
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const handleAddPlayerToTeam = async (userId: string) => {
    if (!selectedTeam) {
      console.error("Aucune équipe sélectionnée pour l'ajout du joueur");
      setError(t('admin.teams.errorAddingPlayer'));
      setUserSearchDialog(false);
      return;
    }
    
    if (!userId) {
      console.error("ID utilisateur manquant pour l'ajout du joueur");
      setError(t('admin.teams.errorAddingPlayer'));
      setUserSearchDialog(false);
      return;
    }
    
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Erreur d'authentification: Token manquant");
      setError(t('common.authError'));
      setUserSearchDialog(false);
      return;
    }
    
    try {
      console.log(`Ajout du joueur ${userId} à l'équipe ${selectedTeam.id}...`);
      
      // Ajouter le joueur à l'équipe
      await (api as API).admin.addPlayerToTeam(selectedTeam.id, userId)
        .catch(error => {
          console.error("Erreur lors de l'ajout du joueur à l'équipe:", error);
          throw error;
        });
      
      // Recharger les détails de l'équipe
      const response = await (api as API).admin.getTeamDetail(selectedTeam.id)
        .catch(error => {
          console.error("Erreur lors du rechargement des détails de l'équipe:", error);
          throw error;
        });
      
      if (!response || !response.data) {
        throw new Error("Réponse de l'API des détails d'équipe invalide ou vide");
      }
      
      // Transformer les données API en format composant
      try {
        const transformedTeamDetails = transformApiTeamDetailsToComponent(response.data);
        setSelectedTeam(transformedTeamDetails);
        setError(null); // Effacer toute erreur précédente
        setSnackbarMessage(t('admin.teams.playerAddedSuccess'));
        setSnackbarOpen(true);
      } catch (transformError) {
        console.error("Erreur lors de la transformation des détails de l'équipe après ajout", transformError);
        throw transformError;
      }
    } catch (err) {
      console.error("Erreur lors de l'ajout du joueur à l'équipe", err);
      setError(t('admin.teams.errorAddingPlayer'));
    } finally {
      setUserSearchDialog(false);
    }
  };

  // Retirer un joueur de l'équipe
  const handleRemovePlayerFromTeam = async (playerId: string) => {
    if (!selectedTeam) {
      console.error("Aucune équipe sélectionnée pour le retrait du joueur");
      setError(t('admin.teams.errorRemovingPlayer'));
      return;
    }
    
    if (!playerId) {
      console.error("ID joueur manquant pour le retrait de l'équipe");
      setError(t('admin.teams.errorRemovingPlayer'));
      return;
    }
    
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Erreur d'authentification: Token manquant");
      setError(t('common.authError'));
      return;
    }
    
    try {
      console.log(`Retrait du joueur ${playerId} de l'équipe ${selectedTeam.id}...`);
      
      // Retirer le joueur de l'équipe
      await (api as API).admin.removePlayerFromTeam(selectedTeam.id, playerId)
        .catch(error => {
          console.error("Erreur lors du retrait du joueur de l'équipe:", error);
          throw error;
        });
      
      // Recharger les détails de l'équipe
      const response = await (api as API).admin.getTeamDetail(selectedTeam.id)
        .catch(error => {
          console.error("Erreur lors du rechargement des détails de l'équipe après retrait:", error);
          throw error;
        });
      
      if (!response || !response.data) {
        throw new Error("Réponse de l'API des détails d'équipe invalide ou vide après retrait");
      }
      
      // Transformer les données API en format composant
      try {
        const transformedTeamDetails = transformApiTeamDetailsToComponent(response.data);
        setSelectedTeam(transformedTeamDetails);
        setError(null); // Effacer toute erreur précédente
        setSnackbarMessage(t('admin.teams.playerRemovedSuccess'));
        setSnackbarOpen(true);
      } catch (transformError) {
        console.error("Erreur lors de la transformation des détails de l'équipe après retrait", transformError);
        throw transformError;
      }
    } catch (err) {
      console.error("Erreur lors du retrait du joueur de l'équipe", err);
      setError(t('admin.teams.errorRemovingPlayer'));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {t('admin.teams.title')}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchTeams}
            sx={{ mr: 1 }}
          >
            {t('common.refresh')}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={handleOpenCreateDialog}
          >
            {t('admin.teams.addNew')}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : teams.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            {t('admin.teams.noData')}
          </Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.teams.name')}</TableCell>
                    <TableCell>{t('admin.teams.captain')}</TableCell>
                    <TableCell>{t('admin.teams.playerCount')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teams
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((team) => (
                      <TableRow hover key={team.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {team.logo_url ? (
                              <Avatar src={team.logo_url} alt={team.name} />
                            ) : (
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <SportsSoccer />
                              </Avatar>
                            )}
                            <Typography>{team.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{team.captain_name}</TableCell>
                        <TableCell>
                          <Chip 
                            icon={<Person />}
                            label={team.player_count} 
                            size="small" 
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => handleViewTeamDetail(team.id)}
                            sx={{ mr: 1 }}
                          >
                            {t('admin.teams.viewPlayers')}
                          </Button>
                          <IconButton 
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEditDialog(team)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteConfirm(team.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={teams.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('common.rowsPerPage')}
            />
          </>
        )}
      </Paper>

      {/* Dialogue de création/édition d'équipe */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' 
            ? t('admin.teams.create') 
            : t('admin.teams.edit')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid sx={{ gridColumn: '1 / -1' }}>
              <TextField
                name="name"
                label={t('admin.teams.name')}
                value={currentTeam.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid sx={{ gridColumn: '1 / -1' }}>
              <TextField
                name="description"
                label={t('admin.teams.description')}
                value={currentTeam.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid sx={{ gridColumn: '1 / -1' }}>
              <FormControl fullWidth>
                <InputLabel>{t('admin.teams.captain')}</InputLabel>
                <Select
                  name="captain_id"
                  value={currentTeam.captain_id || ''}
                  label={t('admin.teams.captain')}
                  onChange={(e) => {
                    const value = typeof e === 'object' && e !== null && 'target' in e ? 
                      (e.target as any).value : e;
                    setCurrentTeam(prev => ({
                      ...prev,
                      captain_id: value
                    }));
                  }}
                >
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleSaveTeam} 
            variant="contained" 
            color="primary"
            disabled={formSubmitting || !currentTeam.name || !currentTeam.captain_id}
            startIcon={formSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {formSubmitting
              ? t('common.processing')
              : dialogMode === 'create' 
                ? t('common.create') 
                : t('common.save')
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
      >
        <DialogTitle>{t('admin.teams.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admin.teams.deleteWarning')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} disabled={deleteSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={deleteSubmitting}
            startIcon={deleteSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {deleteSubmitting ? t('common.processing') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de détail d'équipe (liste des joueurs) */}
      <Dialog 
        open={teamDetailOpen} 
        onClose={() => setTeamDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedTeam && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {selectedTeam.logo_url ? (
                  <Avatar src={selectedTeam.logo_url} alt={selectedTeam.name} sx={{ width: 56, height: 56 }} />
                ) : (
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <SportsHandball fontSize="large" />
                  </Avatar>
                )}
                <Typography variant="h6">{selectedTeam.name}</Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedTeam.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedTeam.description}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
                <Typography variant="subtitle1" component="h2">
                  {t('admin.teams.players')}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PersonAdd />}
                  onClick={handleOpenAddPlayerDialog}
                  size="small"
                >
                  {t('admin.teams.addPlayer')}
                </Button>
              </Box>

              {loadingTeamDetail ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : selectedTeam.players.length === 0 ? (
                <Alert severity="info">
                  {t('admin.teams.noPlayers')}
                </Alert>
              ) : (
                <List>
                  {selectedTeam.players.map((player, index) => (
                    <React.Fragment key={player.id}>
                      <ListItem component="li">
                        <ListItemAvatar>
                          <Avatar src={player.avatar_url}>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={player.name}
                          secondary={
                            <>
                              {player.email}
                              {player.id === selectedTeam.captain_id && (
                                <Chip 
                                  label={t('admin.teams.captain')} 
                                  size="small" 
                                  color="primary"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </>
                          }
                        />
                        {player.id !== selectedTeam.captain_id && (
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              color="error"
                              onClick={() => handleRemovePlayerFromTeam(player.id)}
                            >
                              <RemoveCircle />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                      {index < selectedTeam.players.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setTeamDetailOpen(false)}>
                {t('common.close')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialogue de recherche d'utilisateur pour ajouter à l'équipe */}
      <Dialog
        open={userSearchDialog}
        onClose={() => setUserSearchDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('admin.teams.addPlayer')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('admin.teams.searchUser')}
            type="text"
            fullWidth
            variant="outlined"
            value={userSearchQuery}
            onChange={handleUserSearch}
            sx={{ mb: 2 }}
          />
          
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {filteredUsers.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                {t('admin.teams.noUsersFound')}
              </Typography>
            ) : (
              filteredUsers.map((user) => (
                <ListItem
                  key={user.id}
                  component="button"
                  onClick={() => handleAddPlayerToTeam(user.id)}
                  sx={{
                    cursor: selectedTeam?.players.some(p => p.id === user.id) ? 'not-allowed' : 'pointer',
                    opacity: selectedTeam?.players.some(p => p.id === user.id) ? 0.5 : 1,
                    pointerEvents: selectedTeam?.players.some(p => p.id === user.id) ? 'none' : 'auto'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={user.avatar_url}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={user.email}
                  />
                  {selectedTeam?.players.some(p => p.id === user.id) && (
                    <Chip 
                      label={t('admin.teams.alreadyInTeam')} 
                      size="small"
                      color="default"
                    />
                  )}
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserSearchDialog(false)}>
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default AdminTeams;
