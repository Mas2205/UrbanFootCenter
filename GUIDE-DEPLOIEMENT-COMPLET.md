# 🚀 Guide de Déploiement Complet - Urban Foot Center

## 📱 DÉPLOIEMENT APPLICATION MOBILE

### 🍎 App Store (iOS)

#### Prérequis
1. **Compte Apple Developer** (99$/an)
   - Inscrivez-vous sur https://developer.apple.com
   - Payez les frais annuels de 99$

2. **Installation des outils**
```bash
# Installer EAS CLI
npm install -g @expo/eas-cli

# Se connecter à Expo
eas login
```

#### Configuration iOS
1. **Mettre à jour eas.json**
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "votre-apple-id@gmail.com",
        "ascAppId": "VOTRE_APP_ID",
        "appleTeamId": "VOTRE_TEAM_ID"
      }
    }
  }
}
```

2. **Build de production iOS**
```bash
cd UrbanFootCenterMobile
eas build --platform ios --profile production
```

3. **Soumission à l'App Store**
```bash
eas submit --platform ios --profile production
```

#### Étapes dans App Store Connect
1. Aller sur https://appstoreconnect.apple.com
2. Créer une nouvelle app
3. Remplir les métadonnées :
   - **Nom** : Urban Foot Center
   - **Description** : Réservez votre terrain de football au Sénégal
   - **Mots-clés** : football, terrain, réservation, Sénégal, sport
   - **Catégorie** : Sports
4. Ajouter les captures d'écran (iPhone 6.7", 6.5", 5.5")
5. Soumettre pour révision

### 🤖 Play Store (Android)

#### Prérequis
1. **Compte Google Play Console** (25$ unique)
   - Inscrivez-vous sur https://play.google.com/console

2. **Créer une clé de service**
```bash
# Générer la clé de service Google
# Télécharger le fichier JSON depuis Google Cloud Console
# Le placer dans UrbanFootCenterMobile/google-service-account.json
```

#### Configuration Android
1. **Build de production Android**
```bash
cd UrbanFootCenterMobile
eas build --platform android --profile production
```

2. **Soumission au Play Store**
```bash
eas submit --platform android --profile production
```

#### Étapes dans Play Console
1. Créer une nouvelle application
2. Remplir les détails :
   - **Nom** : Urban Foot Center
   - **Description courte** : Réservation de terrains de football
   - **Description complète** : Application de réservation de terrains de football au Sénégal. Trouvez et réservez facilement votre terrain préféré.
   - **Catégorie** : Sports
3. Ajouter les captures d'écran et icônes
4. Publier en production

---

## 🌐 DÉPLOIEMENT INTERFACE WEB

### Option 1 : Vercel (Recommandé - Gratuit)

#### Configuration
1. **Installer Vercel CLI**
```bash
npm install -g vercel
```

2. **Déployer le frontend**
```bash
cd frontend
vercel --prod
```

3. **Variables d'environnement Vercel**
```env
REACT_APP_API_URL=https://votre-backend.herokuapp.com/api
REACT_APP_ENVIRONMENT=production
```

### Option 2 : Netlify (Alternative gratuite)

1. **Build du frontend**
```bash
cd frontend
npm run build
```

2. **Déployer sur Netlify**
   - Glisser-déposer le dossier `build` sur netlify.com
   - Ou connecter votre repo GitHub

### Option 3 : Serveur VPS (Production complète)

#### Configuration Nginx
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;
    
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    # Frontend React
    location / {
        root /var/www/urban-foot-center/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🖥️ DÉPLOIEMENT BACKEND

### Option 1 : Railway (Recommandé)

1. **Créer un compte sur Railway.app**
2. **Connecter votre repo GitHub**
3. **Variables d'environnement Railway**
```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=votre-cle-jwt-securisee
CORS_ORIGIN=https://votre-frontend.vercel.app
```

### Option 2 : Heroku

1. **Installer Heroku CLI**
```bash
# Créer l'application
heroku create urban-foot-center-api

# Ajouter PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Déployer
git subtree push --prefix backend heroku main
```

### Option 3 : DigitalOcean App Platform

1. **Créer une app sur DigitalOcean**
2. **Connecter votre repo**
3. **Configurer les variables d'environnement**

---

## 📊 BASE DE DONNÉES

### Option 1 : Supabase (Gratuit)
```bash
# Créer un projet sur supabase.com
# Importer votre schéma SQL
# Récupérer l'URL de connexion
```

### Option 2 : Railway PostgreSQL
```bash
# Ajouter PostgreSQL à votre projet Railway
# Importer les données existantes
```

### Option 3 : Neon (Serverless PostgreSQL)
```bash
# Créer une base sur neon.tech
# Configurer les connexions
```

---

## 🔧 SCRIPTS DE DÉPLOIEMENT AUTOMATISÉ

### Script de déploiement complet
```bash
#!/bin/bash
# deploy-all.sh

echo "🚀 Déploiement Urban Foot Center"

# 1. Build et déploiement frontend
echo "📱 Déploiement frontend..."
cd frontend
npm run build
vercel --prod --confirm

# 2. Déploiement backend
echo "🖥️ Déploiement backend..."
cd ../backend
git push railway main

# 3. Build mobile
echo "📱 Build applications mobiles..."
cd ../UrbanFootCenterMobile
eas build --platform all --profile production

echo "✅ Déploiement terminé !"
```

---

## 📋 CHECKLIST DE DÉPLOIEMENT

### Avant le déploiement
- [ ] Comptes créés (Apple Developer, Google Play, hébergement web)
- [ ] Variables d'environnement configurées
- [ ] Base de données de production prête
- [ ] Certificats SSL configurés
- [ ] Tests effectués en local

### Applications mobiles
- [ ] Icons et splash screens créés (1024x1024, 512x512, etc.)
- [ ] Captures d'écran prises (différentes tailles d'écran)
- [ ] Descriptions rédigées (français et anglais)
- [ ] Politique de confidentialité publiée
- [ ] Conditions d'utilisation rédigées

### Interface web
- [ ] Domaine acheté et configuré
- [ ] HTTPS activé
- [ ] Performance optimisée (Lighthouse score > 90)
- [ ] SEO configuré (meta tags, sitemap)
- [ ] Analytics installé (Google Analytics)

---

## 💰 COÛTS ESTIMÉS

### Obligatoires
- **Apple Developer** : 99$/an
- **Google Play Console** : 25$ (unique)
- **Domaine** : 10-15$/an

### Optionnels (selon l'hébergement)
- **Vercel Pro** : 20$/mois (si besoin de plus de bande passante)
- **Railway** : 5-20$/mois selon l'usage
- **VPS** : 5-50$/mois selon les performances

---

## 🎯 ÉTAPES RECOMMANDÉES

### Semaine 1 : Préparation
1. Créer tous les comptes nécessaires
2. Configurer les environnements de production
3. Préparer les assets (icons, screenshots)

### Semaine 2 : Déploiement web
1. Déployer le backend sur Railway/Heroku
2. Déployer le frontend sur Vercel/Netlify
3. Configurer le domaine et HTTPS

### Semaine 3 : Applications mobiles
1. Build et test des applications
2. Soumission App Store et Play Store
3. Attendre les validations (1-7 jours)

### Semaine 4 : Finalisation
1. Tests finaux en production
2. Documentation utilisateur
3. Lancement officiel

---

## 🆘 SUPPORT ET MAINTENANCE

### Monitoring recommandé
- **Sentry** : Tracking des erreurs
- **Google Analytics** : Statistiques web
- **Firebase Analytics** : Statistiques mobile

### Mises à jour
- **Web** : Déploiement automatique via Git
- **Mobile** : Nouvelles versions via EAS Update

---

**🎉 Votre Urban Foot Center sera bientôt disponible partout !**
