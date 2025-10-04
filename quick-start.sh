#!/bin/bash

# Quick Start - Urban Foot Center
# Usage: ./quick-start.sh [web|mobile|all]

MODE=${1:-all}

case $MODE in
    web)
        echo "🌐 Démarrage Web uniquement..."
        cd backend && npm start &
        cd ../frontend && npm start &
        echo "✅ Backend: http://localhost:3001 | Frontend: http://localhost:3000"
        ;;
    mobile)
        echo "📱 Démarrage Mobile uniquement..."
        cd backend && npm start &
        cd ../UrbanFootCenterMobile && npm start &
        echo "✅ Backend: http://localhost:3001 | Mobile: Scannez le QR code"
        ;;
    all|*)
        echo "🚀 Démarrage complet..."
        cd backend && npm start &
        cd ../frontend && npm start &
        cd ../UrbanFootCenterMobile && npm start &
        echo "✅ Backend: http://localhost:3001"
        echo "✅ Frontend: http://localhost:3000" 
        echo "✅ Mobile: Scannez le QR code Expo"
        ;;
esac

echo "🛑 Ctrl+C pour arrêter"
trap 'jobs -p | xargs -r kill; exit 0' SIGINT
wait
