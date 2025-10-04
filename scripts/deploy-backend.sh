#!/bin/bash

# 🖥️ Script de déploiement backend - Urban Foot Center
# Usage: ./deploy-backend.sh [railway|heroku|digitalocean]

set -e

PLATFORM=${1:-railway}
echo "🚀 Déploiement backend sur: $PLATFORM"

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Navigation vers le dossier backend
cd "$(dirname "$0")/../backend" || error "Dossier backend introuvable"

# Vérification des variables d'environnement
log "Vérification de la configuration..."
if [ ! -f ".env" ]; then
    error "Fichier .env manquant. Copiez .env.example et configurez-le."
fi

# Installation des dépendances
log "Installation des dépendances..."
npm ci --only=production

# Tests de sécurité
log "Audit de sécurité..."
npm audit --audit-level high || log "⚠️ Vulnérabilités détectées, vérifiez npm audit"

# Déploiement selon la plateforme
case $PLATFORM in
    "railway")
        log "Déploiement sur Railway..."
        if ! command -v railway &> /dev/null; then
            error "Railway CLI non installé. Installez avec: npm install -g @railway/cli"
        fi
        railway login
        railway up
        ;;
    "heroku")
        log "Déploiement sur Heroku..."
        if ! command -v heroku &> /dev/null; then
            error "Heroku CLI non installé"
        fi
        git add .
        git commit -m "Deploy to production" || true
        git push heroku main
        ;;
    "digitalocean")
        log "Déploiement sur DigitalOcean..."
        # Configuration spécifique à DigitalOcean App Platform
        echo "Poussez votre code sur GitHub, puis déployez via l'interface DigitalOcean"
        ;;
    *)
        error "Plateforme non supportée: $PLATFORM"
        ;;
esac

log "✅ Déploiement backend terminé!"
log "🔗 API disponible sur votre plateforme $PLATFORM"
