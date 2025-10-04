# 🔧 Fix Production API Connection

## Problème Identifié
Le frontend en production sur Vercel essaie de se connecter à `http://localhost:5001/api` au lieu de l'API de production.

## Solution Rapide

### 1. Identifier l'URL du Backend
Vérifiez votre backend déployé sur Railway et notez l'URL (ex: `https://urban-foot-center-backend.railway.app`)

### 2. Configurer Vercel
1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `urban-foot-center`
3. Aller dans **Settings** → **Environment Variables**
4. Ajouter :
   - **Name**: `REACT_APP_API_BASE_URL`
   - **Value**: `https://VOTRE-BACKEND-URL.railway.app/api`
   - **Environment**: Production

### 3. Redéployer
```bash
cd frontend
vercel --prod
```

### 4. Vérifier
- Ouvrir https://urban-foot-center-og52.vercel.app/fields
- Vérifier que les terrains se chargent correctement

## Variables d'Environnement Nécessaires

### Backend (Railway)
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=votre-cle-securisee
CORS_ORIGIN=https://urban-foot-center-og52.vercel.app
```

### Frontend (Vercel)
```env
REACT_APP_API_BASE_URL=https://votre-backend.railway.app/api
```

## Test de Connectivité
Une fois configuré, testez :
1. https://votre-backend.railway.app/api/health
2. https://votre-backend.railway.app/api/fields
3. https://urban-foot-center-og52.vercel.app/fields
