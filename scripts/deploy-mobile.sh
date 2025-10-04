#!/bin/bash

# 📱 Script de déploiement mobile - Urban Foot Center
# Usage: ./deploy-mobile.sh [ios|android|all] [build|submit]

set -e

PLATFORM=${1:-all}
ACTION=${2:-build}

echo "📱 Déploiement mobile: $PLATFORM ($ACTION)"

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Navigation vers le dossier mobile
cd "$(dirname "$0")/../UrbanFootCenterMobile" || error "Dossier UrbanFootCenterMobile introuvable"

# Vérification des prérequis
log "Vérification des prérequis..."
command -v node >/dev/null 2>&1 || error "Node.js n'est pas installé"
command -v npm >/dev/null 2>&1 || error "npm n'est pas installé"

# Installation d'EAS CLI si nécessaire
if ! command -v eas &> /dev/null; then
    log "Installation d'EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Connexion à Expo (si pas déjà connecté)
log "Vérification de la connexion Expo..."
if ! eas whoami &> /dev/null; then
    warning "Vous devez vous connecter à Expo"
    eas login
fi

# Installation des dépendances
log "Installation des dépendances..."
npm install

# Vérification de la configuration
log "Vérification de la configuration..."
if [ ! -f "app.json" ]; then
    error "Fichier app.json manquant"
fi

if [ ! -f "eas.json" ]; then
    error "Fichier eas.json manquant"
fi

# Fonction de build
build_platform() {
    local platform=$1
    log "🔨 Build $platform en cours..."
    
    case $ACTION in
        "build")
            eas build --platform $platform --profile production --non-interactive
            ;;
        "submit")
            log "📤 Soumission $platform aux stores..."
            eas submit --platform $platform --profile production --non-interactive
            ;;
        *)
            error "Action non supportée: $ACTION"
            ;;
    esac
}

# Exécution selon la plateforme
case $PLATFORM in
    "ios")
        if [ "$ACTION" = "submit" ]; then
            warning "Assurez-vous d'avoir configuré votre Apple ID dans eas.json"
        fi
        build_platform "ios"
        ;;
    "android")
        if [ "$ACTION" = "submit" ]; then
            warning "Assurez-vous d'avoir le fichier google-service-account.json"
        fi
        build_platform "android"
        ;;
    "all")
        log "🔨 Build des deux plateformes..."
        build_platform "ios"
        build_platform "android"
        ;;
    *)
        error "Plateforme non supportée: $PLATFORM"
        ;;
esac

log "✅ Déploiement mobile terminé!"

# Informations post-déploiement
echo ""
echo "📋 Prochaines étapes:"
if [ "$ACTION" = "build" ]; then
    echo "   1. Testez les builds générés"
    echo "   2. Lancez './deploy-mobile.sh $PLATFORM submit' pour soumettre aux stores"
else
    echo "   1. Vérifiez le statut dans App Store Connect / Play Console"
    echo "   2. Les validations peuvent prendre 1-7 jours"
fi

echo ""
echo "🔗 Liens utiles:"
echo "   • App Store Connect: https://appstoreconnect.apple.com"
echo "   • Play Console: https://play.google.com/console"
echo "   • Expo Dashboard: https://expo.dev"
