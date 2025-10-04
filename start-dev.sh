#!/bin/bash

# Script de développement rapide - Urban Foot Center
# Version simplifiée pour développement local

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo "🚀 Démarrage rapide Urban Foot Center..."

# Fonction de nettoyage
cleanup() {
    echo -e "\n${BLUE}Arrêt des services...${NC}"
    jobs -p | xargs -r kill 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT

# Backend
echo -e "${BLUE}Backend:${NC} http://localhost:3001"
cd backend && npm start &

# Frontend  
echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
cd ../frontend && npm start &

# Mobile
echo -e "${PURPLE}Mobile:${NC} Expo QR Code"
cd ../UrbanFootCenterMobile && npm start &

echo -e "\n✅ Tous les services démarrés!"
echo "🛑 Ctrl+C pour arrêter"

wait
