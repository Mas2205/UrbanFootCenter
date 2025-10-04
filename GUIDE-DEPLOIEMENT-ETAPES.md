# 🚀 Guide de Déploiement Étape par Étape - Urban Foot Center

## ✅ Statut Actuel
- ✅ Backend préparé pour la production (Procfile, railway.json créés)
- ✅ Frontend build de production créé
- ✅ Vercel CLI disponible via npx

## 🎯 Prochaines Étapes

### Étape 1 : Déployer le Backend sur Railway

1. **Créer un compte Railway**
   - Aller sur https://railway.app
   - Se connecter avec GitHub

2. **Créer un nouveau projet**
   - Cliquer sur "New Project"
   - Sélectionner "Deploy from GitHub repo"
   - Choisir votre repo Urban Foot Center

3. **Configurer le service backend**
   - Railway détectera automatiquement le dossier `backend`
   - Ajouter PostgreSQL : "Add Service" → "Database" → "PostgreSQL"

4. **Variables d'environnement à configurer**
   ```env
   NODE_ENV=production
   PORT=5001
   DATABASE_URL=[Auto-générée par Railway PostgreSQL]
   JWT_SECRET=votre-cle-jwt-securisee-64-caracteres-minimum
   CORS_ORIGIN=https://votre-frontend.vercel.app
   ```

5. **Déploiement automatique**
   - Railway déploiera automatiquement
   - Récupérer l'URL du backend (ex: https://backend-production-xxxx.up.railway.app)

### Étape 2 : Déployer le Frontend sur Vercel

1. **Configurer les variables d'environnement frontend**
   ```bash
   cd frontend
   # Créer un fichier .env.production.local
   echo "REACT_APP_API_BASE_URL=https://votre-backend.railway.app/api" > .env.production.local
   echo "REACT_APP_API_URL=https://votre-backend.railway.app" >> .env.production.local
   echo "REACT_APP_NODE_ENV=production" >> .env.production.local
   ```

2. **Déployer avec Vercel**
   ```bash
   npx vercel login
   npx vercel --prod
   ```

3. **Suivre les instructions Vercel**
   - Confirmer le projet
   - Choisir les paramètres par défaut
   - Récupérer l'URL du frontend

### Étape 3 : Mettre à jour CORS

1. **Retourner sur Railway**
2. **Mettre à jour la variable CORS_ORIGIN**
   ```env
   CORS_ORIGIN=https://votre-frontend.vercel.app
   ```

### Étape 4 : Tests de Production

1. **Tester l'API backend**
   ```bash
   curl https://votre-backend.railway.app/health
   ```

2. **Tester le frontend**
   - Ouvrir l'URL Vercel
   - Vérifier la connexion à l'API
   - Tester l'inscription/connexion

## 🔧 Commandes Rapides

### Redéployer le frontend
```bash
cd frontend
npm run build
npx vercel --prod
```

### Voir les logs backend
```bash
# Sur Railway dashboard → votre projet → onglet "Deployments"
```

## 🆘 Dépannage

### Erreur CORS
- Vérifier que CORS_ORIGIN contient l'URL exacte de Vercel
- Pas de slash final dans l'URL

### Erreur de base de données
- Vérifier que DATABASE_URL est bien configurée
- Railway génère automatiquement cette variable

### Build frontend qui échoue
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

## 📋 Checklist Final

- [ ] Backend déployé sur Railway
- [ ] PostgreSQL configuré
- [ ] Variables d'environnement backend configurées
- [ ] Frontend déployé sur Vercel
- [ ] Variables d'environnement frontend configurées
- [ ] CORS mis à jour avec l'URL Vercel
- [ ] Tests de production effectués
- [ ] Connexion frontend-backend fonctionnelle

## 🎉 Prêt pour la Production !

Une fois ces étapes terminées, votre application Urban Foot Center sera accessible en ligne et prête pour vos utilisateurs.
