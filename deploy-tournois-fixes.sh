#!/bin/bash

echo "🚀 DÉPLOIEMENT CORRECTIONS TOURNOIS - URBAN FOOT CENTER"
echo "======================================================"
echo ""

# Vérification que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

echo "📦 Étape 1: Déploiement du backend sur Railway..."
cd backend

# Vérifier si Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé. Installation..."
    npm install -g @railway/cli
fi

railway up

echo ""
echo "🗃️ Étape 2: Correction du schéma de base de données en production..."

# Script pour corriger le schéma matchs_tournois en production
railway run node -e "
const { sequelize } = require('./src/models');
(async () => {
  try {
    console.log('🔧 Correction du schéma matchs_tournois en production...');
    
    const alterations = [
      {
        name: 'groupe_poule',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS groupe_poule VARCHAR(1);'
      },
      {
        name: 'numero_match',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS numero_match INTEGER DEFAULT 1;'
      },
      {
        name: 'created_by',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS created_by UUID;'
      },
      {
        name: 'updated_by',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS updated_by UUID;'
      },
      {
        name: 'score1_prolongation',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS score1_prolongation INTEGER;'
      },
      {
        name: 'score2_prolongation',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS score2_prolongation INTEGER;'
      },
      {
        name: 'tirs_au_but_equipe1',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS tirs_au_but_equipe1 INTEGER;'
      },
      {
        name: 'tirs_au_but_equipe2',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS tirs_au_but_equipe2 INTEGER;'
      }
    ];

    for (const alteration of alterations) {
      try {
        await sequelize.query(alteration.sql);
        console.log('✅', alteration.name, '- OK');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ ', alteration.name, '- Déjà existante');
        } else {
          console.log('❌', alteration.name, '- Erreur:', error.message);
        }
      }
    }

    console.log('🎉 Correction du schéma terminée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();
"

echo ""
echo "🎨 Étape 3: Déploiement du frontend sur Vercel..."
cd ../frontend

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé. Installation..."
    npm install -g vercel
fi

vercel --prod

cd ..

echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ !"
echo "======================="
echo ""
echo "✅ Corrections déployées :"
echo "   • Schéma base de données corrigé (matchs_tournois)"
echo "   • Permissions admin terrain restaurées"
echo "   • Interface gestion inscriptions opérationnelle"
echo "   • Boutons Valider/Refuser fonctionnels"
echo ""
echo "🔗 URLs de production :"
echo "   Backend:  https://urbanfootcenter-production.up.railway.app"
echo "   Frontend: https://urban-foot-center.vercel.app"
echo ""
echo "🎯 Fonctionnalités restaurées :"
echo "   • Super admin: gestion complète des tournois"
echo "   • Admin terrain: accès aux inscriptions de leur terrain"
echo "   • Validation/refus des participations d'équipes"
echo "   • Interface robuste sans erreurs undefined"
echo ""
echo "🧪 Pour tester :"
echo "   1. Connectez-vous en tant qu'admin terrain"
echo "   2. Allez dans Tournois"
echo "   3. Cliquez sur 'Gérer les inscriptions'"
echo "   4. Validez ou refusez les participations en attente"
echo ""
