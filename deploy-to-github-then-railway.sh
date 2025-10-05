#!/bin/bash

echo "🚀 === DÉPLOIEMENT URBAN FOOT CENTER VIA GITHUB → RAILWAY ==="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que nous sommes dans un repo git
if [ ! -d ".git" ]; then
    print_error "Ce répertoire n'est pas un repository Git"
    exit 1
fi

print_status "Repository Git détecté"

# Vérifier le statut Git
print_info "Vérification du statut Git..."
git status

echo ""
print_info "=== ÉTAPE 1: PRÉPARATION DES CHANGEMENTS ==="

# Ajouter tous les fichiers modifiés
print_info "Ajout des fichiers modifiés..."

# Fichiers spécifiques du système de paiement en espèces
git add backend/src/controllers/reservation_with_payment.controller.js
git add backend/src/routes/reservation_with_payment.routes.js
git add backend/src/routes/index.js
git add backend/src/controllers/payment.controller.js
git add backend/src/controllers/availability.controller.js

# Scripts de déploiement
git add scripts/
git add DEPLOYMENT-CHECKLIST.md
git add deploy-production.sh

# Autres fichiers potentiellement modifiés
git add backend/src/routes/reservation.routes.js 2>/dev/null || true

print_status "Fichiers ajoutés au staging"

# Afficher les changements à commiter
echo ""
print_info "Changements à commiter :"
git diff --cached --name-only

echo ""
print_info "=== ÉTAPE 2: COMMIT DES CHANGEMENTS ==="

# Créer un commit descriptif
COMMIT_MESSAGE="feat: Système de paiement en espèces complet

✅ Fonctionnalités ajoutées :
- Paiement en espèces pour les réservations
- Validation des paiements par admin terrain
- API /api/reservations/with-payment fonctionnelle
- Interface admin terrain pour gestion paiements
- Gestion d'erreurs robuste avec logs détaillés

🔧 Corrections techniques :
- Suppression route conflictuelle reservation.routes.js
- Correction champs Payment model (payment_date vs paid_at)
- Adaptation logique sans time_slot_id
- Attribution terrains aux admins pour accès API
- Gestion transactions Sequelize optimisée

📋 Migrations requises en production :
- ALTER TYPE payment_methods_payment_type ADD VALUE 'especes'
- ALTER TYPE enum_reservations_payment_status ADD VALUE 'pending_cash'

🚀 Prêt pour déploiement en production"

git commit -m "$COMMIT_MESSAGE"

if [ $? -eq 0 ]; then
    print_status "Commit créé avec succès"
else
    print_error "Échec du commit"
    exit 1
fi

echo ""
print_info "=== ÉTAPE 3: PUSH VERS GITHUB ==="

# Vérifier la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
print_info "Branche actuelle : $CURRENT_BRANCH"

# Push vers GitHub
print_info "Push vers GitHub..."
git push origin $CURRENT_BRANCH

if [ $? -eq 0 ]; then
    print_status "Code poussé vers GitHub avec succès"
else
    print_error "Échec du push vers GitHub"
    exit 1
fi

echo ""
print_info "=== ÉTAPE 4: DÉPLOIEMENT AUTOMATIQUE RAILWAY ==="

print_info "Railway va maintenant déployer automatiquement depuis GitHub..."
print_warning "Attendez quelques minutes pour que Railway détecte et déploie les changements"

# Optionnel : déclencher manuellement le déploiement Railway
read -p "Voulez-vous déclencher manuellement le déploiement Railway ? (y/N) : " trigger_railway

if [[ $trigger_railway =~ ^[Yy]$ ]]; then
    if command -v railway &> /dev/null; then
        print_info "Déclenchement du déploiement Railway..."
        cd backend
        railway up --detach
        cd ..
        print_status "Déploiement Railway déclenché"
    else
        print_warning "Railway CLI non installé, déploiement automatique via GitHub webhook"
    fi
fi

echo ""
print_info "=== ÉTAPE 5: MIGRATIONS BASE DE DONNÉES ==="

print_warning "IMPORTANT: Après le déploiement Railway, exécutez les migrations :"
echo ""
echo "1. Connectez-vous au dashboard Railway"
echo "2. Ouvrez la console de votre service backend"
echo "3. Exécutez ces commandes :"
echo ""
echo "node -e \""
echo "const { Client } = require('pg');"
echo "(async () => {"
echo "  const client = new Client({"
echo "    connectionString: process.env.DATABASE_URL,"
echo "    ssl: { rejectUnauthorized: false }"
echo "  });"
echo "  try {"
echo "    await client.connect();"
echo "    await client.query(\\\`ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'especes';\\\`);"
echo "    await client.query(\\\`ALTER TYPE enum_reservations_payment_status ADD VALUE IF NOT EXISTS 'pending_cash';\\\`);"
echo "    console.log('✅ Migrations terminées');"
echo "  } catch (e) {"
echo "    console.log('ℹ️', e.message);"
echo "  } finally {"
echo "    await client.end();"
echo "  }"
echo "})();"
echo "\""

echo ""
print_status "=== DÉPLOIEMENT GITHUB → RAILWAY TERMINÉ ! ==="
echo ""
print_info "Prochaines étapes :"
echo "  1. ⏳ Attendre le déploiement automatique Railway (2-5 min)"
echo "  2. 🗄️  Exécuter les migrations de base de données"
echo "  3. ✅ Tester les nouvelles fonctionnalités"
echo ""
print_info "URLs de production :"
echo "  🌐 Backend: https://urbanfootcenter-production.up.railway.app"
echo "  🌐 Frontend: https://urban-foot-center.vercel.app"
echo ""
print_status "Le système de paiement en espèces sera bientôt actif ! 🎉"
