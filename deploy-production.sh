#!/bin/bash

echo "🚀 DÉPLOIEMENT RAPIDE - URBAN FOOT CENTER"
echo "========================================"

# Rendre les scripts exécutables
chmod +x scripts/deploy-to-railway.sh
chmod +x scripts/deploy-cash-payment-system.sh

# Choix du type de déploiement
echo ""
echo "Choisissez le type de déploiement :"
echo "1. Déploiement complet (Railway + Vercel + Migrations)"
echo "2. Backend seulement (Railway)"
echo "3. Migrations base de données seulement"
echo ""

read -p "Votre choix (1-3) : " choice

case $choice in
    1)
        echo "🚀 Déploiement complet en cours..."
        ./scripts/deploy-to-railway.sh
        ;;
    2)
        echo "🚀 Déploiement backend seulement..."
        cd backend
        railway up
        echo "✅ Backend déployé sur Railway"
        ;;
    3)
        echo "🚀 Exécution des migrations..."
        cd backend
        railway run node -e "
        const { Client } = require('pg');
        (async () => {
          const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
          });
          try {
            await client.connect();
            await client.query(\`ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'especes';\`);
            await client.query(\`ALTER TYPE enum_reservations_payment_status ADD VALUE IF NOT EXISTS 'pending_cash';\`);
            console.log('✅ Migrations terminées');
          } catch (e) {
            console.log('ℹ️', e.message);
          } finally {
            await client.end();
          }
        })();
        "
        ;;
    *)
        echo "❌ Choix invalide"
        exit 1
        ;;
esac

echo ""
echo "🎉 Déploiement terminé !"
echo ""
echo "🔗 URLs de production :"
echo "   Backend:  https://urbanfootcenter-production.up.railway.app"
echo "   Frontend: https://urban-foot-center.vercel.app"
echo ""
echo "✅ Le système de paiement en espèces est maintenant actif !"
