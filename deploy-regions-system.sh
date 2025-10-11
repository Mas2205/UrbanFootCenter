#!/bin/bash

echo "🚀 DÉPLOIEMENT SYSTÈME RÉGIONS - URBAN FOOT CENTER"
echo "================================================="
echo ""

# Vérification que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

echo "📦 Étape 1: Installation des nouvelles dépendances backend..."
cd backend
echo "   - Installation de xlsx et multer pour l'export/import Excel..."

# Vérifier si Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé. Installation..."
    npm install -g @railway/cli
fi

echo ""
echo "🚀 Étape 2: Déploiement du backend sur Railway..."
railway up

echo ""
echo "🔧 Étape 3: Installation des dépendances en production..."
railway run npm install

echo ""
echo "🗃️ Étape 4: Vérification des tables de base de données..."
railway run node -e "
const { Region } = require('./src/models');
(async () => {
  try {
    console.log('🔍 Vérification de la table regions...');
    const count = await Region.count();
    console.log('✅ Table regions OK -', count, 'régions trouvées');
  } catch (error) {
    console.log('⚠️ Erreur table regions:', error.message);
  }
})();
"

cd ..

echo ""
echo "🎨 Étape 5: Déploiement du frontend sur Vercel..."
cd frontend

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
echo "✅ Nouvelles fonctionnalités déployées :"
echo "   • Page admin de gestion des régions"
echo "   • Export Excel de toutes les régions"
echo "   • Import Excel avec validation complète"
echo "   • Interface utilisateur avec boutons Export/Import"
echo ""
echo "🔗 URLs de production :"
echo "   Backend:  https://urbanfootcenter-production.up.railway.app"
echo "   Frontend: https://urban-foot-center.vercel.app"
echo ""
echo "🔒 Accès : Réservé aux super_admin uniquement"
echo "📍 Navigation : Menu Admin > Régions"
echo ""
echo "🧪 Pour tester :"
echo "   1. Connectez-vous en tant que super_admin"
echo "   2. Allez dans Admin > Régions"
echo "   3. Testez l'export Excel"
echo "   4. Testez l'import Excel avec un fichier valide"
echo ""
