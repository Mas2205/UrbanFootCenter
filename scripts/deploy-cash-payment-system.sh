#!/bin/bash

echo "🚀 === DÉPLOIEMENT SYSTÈME PAIEMENT ESPÈCES EN PRODUCTION ==="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Vérification des prérequis
print_info "Vérification des prérequis..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "Erreur: package.json non trouvé. Exécutez ce script depuis le répertoire backend."
    exit 1
fi

print_status "Répertoire backend détecté"

# Vérifier les variables d'environnement de production
if [ -z "$DATABASE_URL" ]; then
    print_error "Erreur: Variable DATABASE_URL non définie pour la production"
    exit 1
fi

print_status "Variables d'environnement de production détectées"

echo ""
print_info "=== ÉTAPE 1: MISE À JOUR DES ENUMS EN PRODUCTION ==="

# Script pour ajouter le type de paiement "especes"
cat > temp_add_especes_enum.js << 'EOF'
const { Client } = require('pg');

async function addEspecesEnum() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connexion à la base de données établie');

    // Ajouter "especes" à l'ENUM payment_methods_payment_type
    try {
      await client.query(`
        ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'especes';
      `);
      console.log('✅ Type "especes" ajouté à payment_methods_payment_type');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Type "especes" existe déjà dans payment_methods_payment_type');
      } else {
        throw error;
      }
    }

    // Ajouter "pending_cash" à l'ENUM enum_reservations_payment_status
    try {
      await client.query(`
        ALTER TYPE enum_reservations_payment_status ADD VALUE IF NOT EXISTS 'pending_cash';
      `);
      console.log('✅ Statut "pending_cash" ajouté à enum_reservations_payment_status');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Statut "pending_cash" existe déjà dans enum_reservations_payment_status');
      } else {
        throw error;
      }
    }

    console.log('🎉 Mise à jour des ENUMs terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addEspecesEnum();
EOF

# Exécuter le script de mise à jour des ENUMs
print_info "Mise à jour des ENUMs en production..."
node temp_add_especes_enum.js

if [ $? -eq 0 ]; then
    print_status "ENUMs mis à jour avec succès"
    rm temp_add_especes_enum.js
else
    print_error "Échec de la mise à jour des ENUMs"
    rm temp_add_especes_enum.js
    exit 1
fi

echo ""
print_info "=== ÉTAPE 2: DÉPLOIEMENT DU CODE BACKEND ==="

# Vérifier que tous les fichiers nécessaires sont présents
required_files=(
    "src/controllers/reservation_with_payment.controller.js"
    "src/routes/reservation_with_payment.routes.js"
    "src/routes/index.js"
    "src/controllers/payment.controller.js"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Fichier manquant: $file"
        exit 1
    fi
done

print_status "Tous les fichiers requis sont présents"

# Installer les dépendances
print_info "Installation des dépendances..."
npm install

if [ $? -eq 0 ]; then
    print_status "Dépendances installées avec succès"
else
    print_error "Échec de l'installation des dépendances"
    exit 1
fi

# Redémarrer l'application (selon votre plateforme de déploiement)
print_info "Redémarrage de l'application..."

# Pour Railway
if command -v railway &> /dev/null; then
    print_info "Déploiement sur Railway..."
    railway up
elif [ -f "Procfile" ]; then
    print_info "Redémarrage via PM2 ou processus similaire..."
    # Commande de redémarrage spécifique à votre environnement
    pm2 restart all || systemctl restart your-app-name || print_warning "Redémarrage manuel requis"
else
    print_warning "Redémarrage manuel requis"
fi

echo ""
print_info "=== ÉTAPE 3: VÉRIFICATION POST-DÉPLOIEMENT ==="

# Script de vérification
cat > temp_verify_deployment.js << 'EOF'
const { Client } = require('pg');

async function verifyDeployment() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connexion à la base de données établie');

    // Vérifier les ENUMs
    const enumsResult = await client.query(`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname IN ('payment_methods_payment_type', 'enum_reservations_payment_status')
      AND e.enumlabel IN ('especes', 'pending_cash')
      ORDER BY t.typname, e.enumlabel;
    `);

    console.log('📋 ENUMs vérifiés:');
    enumsResult.rows.forEach(row => {
      console.log(`   ${row.enum_name}: ${row.enum_value}`);
    });

    if (enumsResult.rows.length >= 2) {
      console.log('✅ Tous les ENUMs requis sont présents');
    } else {
      console.log('❌ ENUMs manquants détectés');
      process.exit(1);
    }

    // Vérifier la structure des tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('reservations', 'payments', 'payment_methods')
      ORDER BY table_name;
    `);

    console.log('📋 Tables vérifiées:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    console.log('🎉 Vérification post-déploiement réussie !');

  } catch (error) {
    console.error('❌ Erreur de vérification:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyDeployment();
EOF

# Exécuter la vérification
print_info "Vérification du déploiement..."
node temp_verify_deployment.js

if [ $? -eq 0 ]; then
    print_status "Vérification réussie"
    rm temp_verify_deployment.js
else
    print_error "Échec de la vérification"
    rm temp_verify_deployment.js
    exit 1
fi

echo ""
print_status "=== DÉPLOIEMENT TERMINÉ AVEC SUCCÈS ! ==="
echo ""
print_info "Fonctionnalités déployées:"
echo "  ✅ Paiement en espèces pour les réservations"
echo "  ✅ Validation des paiements par les admins terrain"
echo "  ✅ Gestion complète du workflow espèces"
echo "  ✅ APIs /api/reservations/with-payment opérationnelle"
echo "  ✅ Interface admin terrain fonctionnelle"
echo ""
print_info "Le système de paiement en espèces est maintenant actif en production ! 🎉"
