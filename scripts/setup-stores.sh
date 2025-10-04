#!/bin/bash

# 🏪 Script de configuration des stores - Urban Foot Center
# Usage: ./setup-stores.sh

set -e

echo "🏪 Configuration des comptes stores pour Urban Foot Center"

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[ACTION REQUISE] $1${NC}"
}

info() {
    echo -e "${BLUE}[ÉTAPE] $1${NC}"
}

echo ""
echo "📋 CHECKLIST DE CONFIGURATION DES STORES"
echo "========================================"

info "1. 🍎 APPLE APP STORE"
echo ""
warning "Actions à effectuer:"
echo "   • Créer un compte Apple Developer (99$/an)"
echo "   • URL: https://developer.apple.com"
echo "   • Noter votre Team ID et Apple ID"
echo ""
echo "   Informations nécessaires pour eas.json:"
echo "   - Apple ID: votre-email@example.com"
echo "   - Team ID: XXXXXXXXXX (10 caractères)"
echo "   - App Store Connect App ID: XXXXXXXXXX"
echo ""

info "2. 🤖 GOOGLE PLAY STORE"
echo ""
warning "Actions à effectuer:"
echo "   • Créer un compte Google Play Console (25$ unique)"
echo "   • URL: https://play.google.com/console"
echo "   • Créer une clé de service API"
echo ""
echo "   Étapes pour la clé de service:"
echo "   1. Aller dans Google Cloud Console"
echo "   2. Créer un projet ou sélectionner existant"
echo "   3. Activer l'API Google Play Developer"
echo "   4. Créer une clé de service (JSON)"
echo "   5. Télécharger le fichier JSON"
echo "   6. Le placer dans: UrbanFootCenterMobile/google-service-account.json"
echo ""

info "3. 📱 CONFIGURATION EXPO/EAS"
echo ""
warning "Actions à effectuer:"
echo "   • Créer un compte Expo: https://expo.dev"
echo "   • Installer EAS CLI: npm install -g @expo/eas-cli"
echo "   • Se connecter: eas login"
echo ""

info "4. 🎨 ASSETS REQUIS"
echo ""
warning "Préparer les fichiers suivants:"
echo "   • Icon 1024x1024px (PNG, pas de transparence)"
echo "   • Adaptive icon 1024x1024px (Android)"
echo "   • Splash screen 1242x2436px"
echo "   • Screenshots iPhone (6.7\", 6.5\", 5.5\")"
echo "   • Screenshots Android (Phone, 7\" Tablet, 10\" Tablet)"
echo ""

info "5. 📄 DOCUMENTS LÉGAUX"
echo ""
warning "Créer et publier:"
echo "   • Politique de confidentialité"
echo "   • Conditions d'utilisation"
echo "   • URL publique accessible (ex: votre-site.com/privacy)"
echo ""

info "6. 💰 COÛTS À PRÉVOIR"
echo ""
echo "   Obligatoires:"
echo "   • Apple Developer: 99$/an"
echo "   • Google Play Console: 25$ (unique)"
echo ""
echo "   Optionnels:"
echo "   • Domaine web: ~15$/an"
echo "   • Hébergement: 0-50$/mois"
echo ""

info "7. ⏱️ DÉLAIS À PRÉVOIR"
echo ""
echo "   • Configuration initiale: 1-2 jours"
echo "   • Premier build: 30-60 minutes"
echo "   • Validation App Store: 1-7 jours"
echo "   • Validation Play Store: 1-3 jours"
echo ""

echo "🎯 PROCHAINES ÉTAPES RECOMMANDÉES:"
echo "================================="
echo ""
echo "1. Créer les comptes développeur (Apple + Google)"
echo "2. Préparer tous les assets visuels"
echo "3. Rédiger les textes de description"
echo "4. Configurer eas.json avec vos identifiants"
echo "5. Lancer le premier build de test"
echo "6. Soumettre aux stores"
echo ""

log "✅ Configuration terminée!"
log "📞 En cas de problème, consultez la documentation Expo: https://docs.expo.dev"
