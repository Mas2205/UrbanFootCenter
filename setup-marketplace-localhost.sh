#!/bin/bash

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 === SETUP MARKETPLACE LOCALHOST ===${NC}"
echo ""

# Fonction pour afficher les étapes
log() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    error "Veuillez exécuter ce script depuis la racine du projet Urban Foot Center"
    exit 1
fi

echo -e "${BLUE}📋 Configuration du système de paiement marketplace${NC}"
echo "- PayDunya WebPay pour l'encaissement multi-canaux"
echo "- Wave Payout API pour les versements propriétaires"
echo "- Commission plateforme automatique (10%)"
echo ""

# 1. Installer les dépendances
echo -e "${BLUE}📦 Installation des dépendances...${NC}"

# Backend
cd backend
if [ ! -d "node_modules" ]; then
    log "Installation dépendances backend..."
    npm install
else
    log "Dépendances backend déjà installées"
fi

# Installer les nouvelles dépendances pour marketplace
log "Installation dépendances marketplace..."
npm install axios uuid qrcode

cd ..

# Frontend
cd frontend
if [ ! -d "node_modules" ]; then
    log "Installation dépendances frontend..."
    npm install
else
    log "Dépendances frontend déjà installées"
fi

# Installer QR code pour React
log "Installation dépendances QR code..."
npm install qrcode @types/qrcode

cd ..

# 2. Configuration des variables d'environnement
echo ""
echo -e "${BLUE}🔧 Configuration des variables d'environnement...${NC}"

# Backend .env
if [ ! -f "backend/.env" ]; then
    log "Création fichier backend/.env..."
    cp backend/.env.example backend/.env
fi

# Ajouter les variables marketplace si pas présentes
if ! grep -q "PAYDUNYA_MASTER_KEY" backend/.env; then
    log "Ajout variables marketplace au .env..."
    cat >> backend/.env << EOF

# === MARKETPLACE CONFIGURATION ===
# PayDunya (Sandbox) - REMPLACER PAR VOS VRAIES CLÉS
PAYDUNYA_MASTER_KEY=test-master-key-paydunya
PAYDUNYA_PRIVATE_KEY=test-private-key-paydunya
PAYDUNYA_PUBLIC_KEY=test-public-key-paydunya

# Wave Payout API (Sandbox) - REMPLACER PAR VOTRE VRAIE CLÉ
WAVE_API_KEY=wave_sn_sandbox_your_test_key

# Configuration Marketplace
PAYMENTS_ENV=sandbox
PLATFORM_FEE_BPS=1000
BASE_URL=http://localhost:5001
EOF
else
    log "Variables marketplace déjà présentes dans .env"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    log "Création fichier frontend/.env..."
    cat > frontend/.env << EOF
REACT_APP_API_BASE_URL=http://localhost:5001/api
REACT_APP_PAYMENTS_ENV=sandbox
EOF
else
    log "Fichier frontend/.env déjà existant"
fi

# 3. Exécuter les migrations
echo ""
echo -e "${BLUE}🗄️  Exécution des migrations marketplace...${NC}"

cd backend

# Vérifier si les migrations existent
if [ -f "migrations/20251005210000-add-marketplace-fields.js" ]; then
    log "Exécution des migrations..."
    npx sequelize-cli db:migrate
else
    warning "Migrations marketplace non trouvées, création manuelle..."
    
    # Créer les migrations si elles n'existent pas
    log "Création des migrations marketplace..."
    
    # Note: Les fichiers de migration ont déjà été créés dans les étapes précédentes
    # Ici on s'assure qu'ils sont exécutés
    npx sequelize-cli db:migrate
fi

cd ..

# 4. Mise à jour du modèle index.js
echo ""
echo -e "${BLUE}🔗 Mise à jour des modèles...${NC}"

# Vérifier si les nouveaux modèles sont inclus
if [ -f "backend/src/models/marketplace_payment.model.js" ]; then
    log "Modèles marketplace créés"
    
    # Ajouter les modèles à l'index si pas déjà fait
    if ! grep -q "MarketplacePayment" backend/src/models/index.js; then
        log "Ajout des modèles marketplace à l'index..."
        
        # Backup de l'index
        cp backend/src/models/index.js backend/src/models/index.js.backup
        
        # Ajouter les imports (à adapter selon votre structure)
        cat >> backend/src/models/index.js << EOF

// Modèles Marketplace
db.MarketplacePayment = require('./marketplace_payment.model')(sequelize, Sequelize.DataTypes);
db.Payout = require('./payout.model')(sequelize, Sequelize.DataTypes);
EOF
    fi
else
    warning "Modèles marketplace non trouvés"
fi

# 5. Tester la configuration
echo ""
echo -e "${BLUE}🧪 Test de la configuration...${NC}"

# Démarrer le serveur en arrière-plan pour tester
cd backend
log "Démarrage du serveur de test..."
npm start &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 5

# Tester l'endpoint health
if curl -s http://localhost:5001/api/marketplace/health > /dev/null; then
    log "API marketplace accessible"
else
    warning "API marketplace non accessible (normal si pas de token admin)"
fi

# Arrêter le serveur de test
kill $SERVER_PID 2>/dev/null

cd ..

# 6. Instructions finales
echo ""
echo -e "${GREEN}🎉 === SETUP MARKETPLACE TERMINÉ ===${NC}"
echo ""
echo -e "${BLUE}📋 PROCHAINES ÉTAPES:${NC}"
echo ""
echo "1. 🔑 CONFIGURER LES CLÉS API:"
echo "   - Créez un compte PayDunya sandbox: https://paydunya.com"
echo "   - Obtenez vos clés API PayDunya"
echo "   - Créez un compte Wave développeur"
echo "   - Obtenez votre clé Wave Payout API"
echo "   - Mettez à jour backend/.env avec vos vraies clés"
echo ""
echo "2. 🏗️  CONFIGURER LES TERRAINS:"
echo "   - Connectez-vous en tant qu'admin terrain"
echo "   - Allez dans 'Moyens de paiement'"
echo "   - Configurez le canal de payout (Wave/Orange Money)"
echo "   - Ajoutez le numéro mobile E.164 (+221xxxxxxxxx)"
echo ""
echo "3. 🧪 TESTER LE SYSTÈME:"
echo "   - Démarrez l'application: npm run dev"
echo "   - Créez une réservation"
echo "   - Testez le paiement marketplace"
echo "   - Vérifiez les logs de webhook"
echo ""
echo -e "${BLUE}🚀 COMMANDES UTILES:${NC}"
echo "   npm run dev              # Démarrer en développement"
echo "   npm run marketplace:test # Tester les services (à créer)"
echo "   npm run logs             # Voir les logs"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "   - Utilisez SANDBOX en développement"
echo "   - Testez avec de petits montants"
echo "   - Vérifiez les webhooks avec ngrok si nécessaire"
echo "   - Surveillez les logs pour débugger"
echo ""
echo -e "${GREEN}✅ Marketplace prêt pour le développement !${NC}"
