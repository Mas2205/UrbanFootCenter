/**
 * Déclaration de types pour le contexte d'authentification
 */

declare module '../../contexts/AuthContext' {
  export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'client' | 'admin' | 'super_admin';
    phone?: string;
    createdAt?: string;
  }

  export interface AuthContextType {
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

  export const useAuth: () => AuthContextType;
}

declare module '../../contexts' {
  export * from '../../contexts/AuthContext';
}
