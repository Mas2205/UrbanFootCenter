#!/bin/bash

# 🚀 Script de Déploiement Web Urban Foot Center
# Ce script automatise le déploiement du frontend et backend

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du déploiement Urban Foot Center"
echo "=============================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si nous sommes dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    print_error "Erreur: Ce script doit être exécuté depuis la racine du projet Urban Foot Center"
    exit 1
fi

# 1. Vérifier les prérequis
echo "🔍 Vérification des prérequis..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
fi
print_status "Node.js installé: $(node --version)"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
fi
print_status "npm installé: $(npm --version)"

# 2. Préparer le backend
echo ""
echo "🖥️ Préparation du backend..."
cd backend

# Vérifier si package.json existe
if [ ! -f "package.json" ]; then
    print_error "package.json non trouvé dans le dossier backend"
    exit 1
fi

# Installer les dépendances
print_status "Installation des dépendances backend..."
npm install --production

# Vérifier les fichiers de configuration
if [ ! -f "Procfile" ]; then
    print_warning "Procfile manquant, création automatique..."
    echo "web: node src/server.js" > Procfile
fi

if [ ! -f "railway.json" ]; then
    print_warning "railway.json manquant, création automatique..."
    cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
fi

print_status "Backend prêt pour le déploiement"

# 3. Préparer le frontend
echo ""
echo "🌐 Préparation du frontend..."
cd ../frontend

# Vérifier si package.json existe
if [ ! -f "package.json" ]; then
    print_error "package.json non trouvé dans le dossier frontend"
    exit 1
fi

# Installer les dépendances
print_status "Installation des dépendances frontend..."
npm install

# Créer le build de production
print_status "Création du build de production..."
npm run build

if [ ! -d "build" ]; then
    print_error "Échec de la création du build"
    exit 1
fi

print_status "Build de production créé avec succès"

# 4. Vérifier Vercel CLI
echo ""
echo "🔧 Vérification de Vercel CLI..."

if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI non installé, installation en cours..."
    npm install -g vercel
fi

print_status "Vercel CLI prêt"

# 5. Instructions finales
echo ""
echo "🎉 Préparation terminée avec succès !"
echo "=============================================="
echo ""
echo "📋 ÉTAPES SUIVANTES :"
echo ""
echo "1. 🖥️ DÉPLOYER LE BACKEND :"
echo "   - Aller sur https://railway.app"
echo "   - Créer un nouveau projet"
echo "   - Connecter votre repo GitHub"
echo "   - Sélectionner le dossier 'backend'"
echo "   - Ajouter PostgreSQL"
echo "   - Configurer les variables d'environnement (voir deploy-config.md)"
echo ""
echo "2. 🌐 DÉPLOYER LE FRONTEND :"
echo "   cd frontend"
echo "   vercel --prod"
echo "   # Suivre les instructions de Vercel"
echo ""
echo "3. 🔧 CONFIGURER LES VARIABLES :"
echo "   - Backend: Ajouter DATABASE_URL, JWT_SECRET, CORS_ORIGIN"
echo "   - Frontend: Ajouter REACT_APP_API_BASE_URL"
echo ""
echo "4. 🧪 TESTER :"
echo "   - Vérifier que l'API répond sur /health"
echo "   - Tester la connexion frontend-backend"
echo ""
echo "📖 Consultez deploy-config.md pour les détails complets"

cd ..
print_status "Script terminé avec succès !"
