#!/bin/bash

echo "🚀 === DÉPLOIEMENT URBAN FOOT CENTER SUR RAILWAY ==="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé. Installez-le avec:"
    echo "npm install -g @railway/cli"
    exit 1
fi

print_status "Railway CLI détecté"

# Se connecter à Railway (si pas déjà connecté)
print_info "Vérification de la connexion Railway..."
railway whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    print_info "Connexion à Railway requise..."
    railway login
fi

print_status "Connecté à Railway"

# Aller dans le répertoire backend
cd backend

# Déployer le backend
print_info "Déploiement du backend sur Railway..."
railway up

if [ $? -eq 0 ]; then
    print_status "Backend déployé avec succès sur Railway"
else
    echo "❌ Échec du déploiement backend"
    exit 1
fi

# Exécuter les migrations en production
print_info "Exécution des migrations de base de données..."

# Script pour les migrations
railway run node -e "
const { Client } = require('pg');

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connexion à la base de données Railway établie');

    // Ajouter especes à payment_methods_payment_type
    try {
      await client.query(\`ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'especes';\`);
      console.log('✅ Type especes ajouté');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Type especes existe déjà');
      } else throw e;
    }

    // Ajouter pending_cash à enum_reservations_payment_status
    try {
      await client.query(\`ALTER TYPE enum_reservations_payment_status ADD VALUE IF NOT EXISTS 'pending_cash';\`);
      console.log('✅ Statut pending_cash ajouté');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Statut pending_cash existe déjà');
      } else throw e;
    }

    console.log('🎉 Migrations terminées avec succès !');
  } catch (error) {
    console.error('❌ Erreur migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
"

if [ $? -eq 0 ]; then
    print_status "Migrations exécutées avec succès"
else
    echo "❌ Échec des migrations"
    exit 1
fi

# Retourner au répertoire racine
cd ..

# Déployer le frontend sur Vercel (si nécessaire)
if [ -d "frontend" ]; then
    print_info "Déploiement du frontend sur Vercel..."
    cd frontend
    
    # Vérifier si Vercel CLI est installé
    if command -v vercel &> /dev/null; then
        vercel --prod
        if [ $? -eq 0 ]; then
            print_status "Frontend déployé avec succès sur Vercel"
        else
            echo "⚠️  Échec du déploiement frontend (non-critique)"
        fi
    else
        echo "⚠️  Vercel CLI non installé, déploiement frontend ignoré"
    fi
    
    cd ..
fi

echo ""
print_status "=== DÉPLOIEMENT COMPLET TERMINÉ ! ==="
echo ""
print_info "URLs de production:"
echo "  🌐 Backend: https://urbanfootcenter-production.up.railway.app"
echo "  🌐 Frontend: https://urban-foot-center.vercel.app"
echo ""
print_info "Nouvelles fonctionnalités actives:"
echo "  ✅ Paiement en espèces"
echo "  ✅ Validation par admin terrain"
echo "  ✅ Workflow complet espèces"
echo ""
echo "🎉 Urban Foot Center est maintenant à jour en production !"
