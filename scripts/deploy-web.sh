#!/bin/bash

# 🌐 Script de déploiement web - Urban Foot Center
# Usage: ./deploy-web.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Déploiement web en mode: $ENVIRONMENT"

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Vérification des prérequis
log "Vérification des prérequis..."
command -v node >/dev/null 2>&1 || error "Node.js n'est pas installé"
command -v npm >/dev/null 2>&1 || error "npm n'est pas installé"

# Navigation vers le dossier frontend
cd "$(dirname "$0")/../frontend" || error "Dossier frontend introuvable"

# Installation des dépendances
log "Installation des dépendances..."
npm ci

# Tests (optionnel)
if [ "$ENVIRONMENT" = "production" ]; then
    log "Exécution des tests..."
    npm test -- --watchAll=false --coverage || error "Tests échoués"
fi

# Build de production
log "Build de l'application..."
if [ "$ENVIRONMENT" = "production" ]; then
    REACT_APP_API_URL="https://urban-foot-center-api.railway.app/api" npm run build
else
    REACT_APP_API_URL="https://urban-foot-center-staging.railway.app/api" npm run build
fi

# Déploiement selon la plateforme choisie
log "Déploiement sur Vercel..."

# Installation de Vercel CLI si nécessaire
if ! command -v vercel &> /dev/null; then
    log "Installation de Vercel CLI..."
    npm install -g vercel
fi

# Déploiement
if [ "$ENVIRONMENT" = "production" ]; then
    vercel --prod --confirm
else
    vercel --confirm
fi

log "✅ Déploiement web terminé avec succès!"
log "🌐 Votre application est maintenant en ligne"

# Affichage des URLs
echo ""
echo "📋 Informations de déploiement:"
echo "   Environment: $ENVIRONMENT"
echo "   Build: $(date)"
echo "   Status: ✅ Succès"
