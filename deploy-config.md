# 🚀 Configuration de Déploiement Urban Foot Center

## Variables d'Environnement Backend (Railway/Heroku)

```env
NODE_ENV=production
PORT=5001

# Base de données PostgreSQL (fournie par Railway/Heroku)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT - GÉNÉRER UNE CLÉ FORTE
JWT_SECRET=votre-cle-jwt-securisee-64-caracteres-minimum
JWT_EXPIRES_IN=24h

# CORS - Domaines autorisés
CORS_ORIGIN=https://votre-frontend.vercel.app,https://votre-domaine.com

# Mail (optionnel)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=votre-email@gmail.com
MAIL_PASS=votre-mot-de-passe-app
MAIL_FROM=no-reply@votre-domaine.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Variables d'Environnement Frontend (Vercel)

```env
REACT_APP_API_BASE_URL=https://votre-backend.railway.app/api
REACT_APP_API_URL=https://votre-backend.railway.app
REACT_APP_NODE_ENV=production
```

## Commandes de Déploiement

### 1. Backend sur Railway
```bash
# 1. Créer un compte sur railway.app
# 2. Connecter votre repo GitHub
# 3. Ajouter PostgreSQL
# 4. Configurer les variables d'environnement
```

### 2. Frontend sur Vercel
```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer depuis le dossier frontend
cd frontend
vercel --prod
```

## Checklist de Déploiement

- [ ] Compte Railway créé
- [ ] Repo GitHub connecté à Railway
- [ ] PostgreSQL ajouté sur Railway
- [ ] Variables d'environnement backend configurées
- [ ] Compte Vercel créé
- [ ] Variables d'environnement frontend configurées
- [ ] Tests en production effectués
