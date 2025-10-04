# 🚀 Déploiement Ultra-Simple Urban Foot Center

## Étape 1 : Déployer le Backend (Railway)

### A. Créer un compte Railway
1. Aller sur https://railway.app
2. Cliquer "Login with GitHub"
3. Autoriser Railway à accéder à vos repos

### B. Créer le projet backend
1. Cliquer "New Project"
2. Sélectionner "Deploy from GitHub repo"
3. Choisir votre repo "UrbanFootCenter"
4. Sélectionner le dossier "backend"

### C. Ajouter PostgreSQL
1. Dans votre projet Railway, cliquer "New Service"
2. Choisir "Database" → "PostgreSQL"
3. Railway va créer automatiquement la base de données

### D. Configurer les variables d'environnement
Dans Railway, aller dans "Variables" et ajouter :
```
NODE_ENV=production
JWT_SECRET=votre-cle-secrete-64-caracteres-minimum
CORS_ORIGIN=*
```

### E. Récupérer l'URL du backend
- Railway va vous donner une URL comme : `https://backend-production-xxxx.up.railway.app`
- **NOTEZ CETTE URL** pour l'étape suivante

---

## Étape 2 : Déployer le Frontend (Vercel)

### A. Configuration sur Vercel (ce que vous voyez actuellement)

1. **Root Directory** : Cliquer "Edit" → Changer vers `frontend`

2. **Framework Preset** : Changer "Other" vers "Create React App"

3. **Environment Variables** : Cliquer pour développer et ajouter :
   ```
   REACT_APP_API_BASE_URL = https://votre-url-railway.up.railway.app/api
   REACT_APP_API_URL = https://votre-url-railway.up.railway.app
   REACT_APP_NODE_ENV = production
   ```
   ⚠️ **Remplacer "votre-url-railway" par l'URL réelle de Railway**

4. **Cliquer "Deploy"**

### B. Attendre le déploiement
- Vercel va build et déployer automatiquement
- Vous obtiendrez une URL comme : `https://urban-foot-center-xxxx.vercel.app`

---

## Étape 3 : Finaliser la Configuration

### A. Mettre à jour CORS sur Railway
1. Retourner sur Railway
2. Dans les variables d'environnement
3. Changer `CORS_ORIGIN=*` vers `CORS_ORIGIN=https://votre-url-vercel.vercel.app`

### B. Tester l'application
1. Ouvrir l'URL Vercel
2. Essayer de créer un compte
3. Vérifier que tout fonctionne

---

## 🆘 Si ça ne marche pas

### Problème : Erreur CORS
**Solution** : Vérifier que CORS_ORIGIN sur Railway contient exactement l'URL Vercel

### Problème : Erreur 500 backend
**Solution** : Vérifier les logs sur Railway Dashboard

### Problème : Build frontend échoue
**Solution** : 
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

---

## ✅ Checklist Final

- [ ] Backend déployé sur Railway
- [ ] PostgreSQL ajouté sur Railway  
- [ ] Variables d'environnement backend configurées
- [ ] URL backend récupérée
- [ ] Frontend déployé sur Vercel avec bonne configuration
- [ ] Variables d'environnement frontend configurées
- [ ] CORS mis à jour avec URL Vercel
- [ ] Application testée et fonctionnelle

## 🎉 C'est tout !

Votre application sera accessible en ligne et prête à utiliser.
