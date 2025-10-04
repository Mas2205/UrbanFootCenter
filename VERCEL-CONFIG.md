# Configuration Vercel pour Urban Foot Center

## Problème résolu
Le frontend essayait de se connecter à `localhost:5001` en production au lieu de l'URL du backend de production.

## Solution appliquée

### 1. Code modifié
- ✅ Tous les fichiers API utilisent maintenant `API_BASE_URL` depuis `config/constants.ts`
- ✅ Suppression des URLs hardcodées dans tous les composants
- ✅ Centralisation de la configuration dans un seul endroit

### 2. Configuration Vercel requise

Pour que l'application fonctionne en production, vous devez configurer la variable d'environnement sur Vercel :

#### Étapes sur Vercel :
1. Aller sur [vercel.com](https://vercel.com) et ouvrir votre projet
2. Aller dans **Settings** → **Environment Variables**
3. Ajouter une nouvelle variable :
   - **Name**: `REACT_APP_API_BASE_URL`
   - **Value**: `https://votre-backend-railway.com/api` (remplacer par l'URL réelle de votre backend)
   - **Environments**: Cocher `Production`, `Preview`, et `Development`

#### Exemple d'URL backend :
```
REACT_APP_API_BASE_URL=https://urban-foot-center-backend-production.up.railway.app/api
```

### 3. Redéploiement
Après avoir ajouté la variable d'environnement :
1. Aller dans l'onglet **Deployments**
2. Cliquer sur **Redeploy** pour le dernier déploiement
3. Ou faire un nouveau commit pour déclencher un redéploiement automatique

### 4. Vérification
Une fois redéployé, l'application devrait :
- ✅ Se connecter au bon backend en production
- ✅ Ne plus afficher "Network Error"
- ✅ Charger les terrains correctement

## Structure des fichiers modifiés

### Services API
- `src/services/api/reservationAPI.ts`
- `src/services/api/userAPI.ts` 
- `src/services/api/fieldAPI.ts`
- `src/services/api/regionAPI.ts`
- `src/services/api/bookingsApi.ts`
- `src/services/api.ts`

### Composants Admin
- `src/components/admin/users/AdminUsers.tsx`
- `src/components/admin/employees/AdminEmployees.tsx`
- `src/components/admin/timeslots/AdminTimeSlots.tsx`
- `src/components/admin/reports/AdminReports.tsx`
- `src/components/admin/stats/AdminStats.tsx`
- `src/components/admin/clients/AdminClients.tsx`
- `src/components/admin/payments/AdminPayments.tsx`
- `src/components/admin/reservations/AdminReservations.tsx`

### Composants de terrain
- `src/components/fields/FieldsList.tsx`
- `src/components/admin/AdminFieldManagement.tsx`
- `src/components/admin/fields/AdminFieldView.tsx`
- `src/components/admin/fields/AdminFieldCreate.tsx`

### Configuration centrale
- `src/config/constants.ts` (point central pour `API_BASE_URL`)

## Notes importantes
- Le fallback `localhost:5001` reste dans `constants.ts` pour le développement local
- Tous les composants importent maintenant `API_BASE_URL` depuis `config/constants.ts`
- Plus aucune URL hardcodée dans le code
