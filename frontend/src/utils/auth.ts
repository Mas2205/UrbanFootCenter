/**
 * Utilitaires pour l'authentification
 */

/**
 * Récupère le header d'authentification à utiliser dans les appels API
 * @returns Objet contenant le header Authorization avec le token JWT
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Vérifie si le token JWT est expiré
 * @param token - Le token JWT à vérifier
 * @returns true si le token est expiré, false sinon
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    // Extraire la partie payload du JWT (la deuxième partie)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Vérifier si le token contient une date d'expiration
    if (!payload.exp) {
      return true;
    }
    
    // Comparer la date d'expiration avec la date actuelle
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    // Si une erreur se produit lors du décodage, considérer le token comme expiré
    return true;
  }
};

/**
 * Vérifie si l'utilisateur est admin
 * @param userRole - Le rôle de l'utilisateur
 * @returns true si l'utilisateur est admin ou super_admin, false sinon
 */
export const isAdmin = (userRole?: string): boolean => {
  return userRole === 'admin' || userRole === 'super_admin';
};

/**
 * Récupère les informations de l'utilisateur du localStorage
 * @returns Les informations de l'utilisateur ou null s'il n'est pas connecté
 */
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    localStorage.removeItem('user');
    return null;
  }
};
