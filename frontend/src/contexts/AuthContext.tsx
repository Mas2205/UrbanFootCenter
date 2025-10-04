import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: 'client' | 'admin' | 'super_admin' | 'employee';
  phone?: string;
  phone_number?: string;
  createdAt?: string;
  fieldId?: string; // ID du terrain assigné pour les admins de terrain
}

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  first_name?: string;
  last_name?: string;
  iat: number;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier si l'utilisateur est déjà authentifié au chargement
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Vérifier si le token est expiré
          const decoded = jwtDecode<DecodedToken>(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // Token expiré
            console.log('Token expiré, déconnexion');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          } else {
            // Token valide, utiliser les données stockées d'abord
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setIsAuthenticated(true);
              
              // Optionnellement, vérifier avec le serveur en arrière-plan
              authAPI.getProfile().then(response => {
                const serverUser = response.data.data || response.data;
                if (serverUser && serverUser.id === userData.id) {
                  setUser(serverUser);
                }
              }).catch(err => {
                console.log('Erreur lors de la vérification du profil:', err);
                // Ne pas déconnecter immédiatement, garder les données locales
              });
            } catch (parseErr) {
              console.log('Erreur parsing user data:', parseErr);
              // Essayer de récupérer depuis le serveur
              try {
                const response = await authAPI.getProfile();
                const serverUser = response.data.data || response.data;
                setUser(serverUser);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(serverUser));
              } catch (serverErr) {
                console.log('Erreur serveur:', serverErr);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                setIsAuthenticated(false);
              }
            }
          }
        } catch (err) {
          // Token invalide
          console.log('Token invalide:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // Pas de token ou pas d'utilisateur stocké
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login({ email, password });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setIsAuthenticated(false);
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Erreur de connexion');
      } else {
        setError('Erreur de connexion au serveur');
      }
      throw err;
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.register(userData);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Erreur lors de l\'inscription');
      } else {
        setError('Erreur de connexion au serveur');
      }
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const clearError = () => {
    setError(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    updateUser,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
