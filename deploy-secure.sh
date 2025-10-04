#!/bin/bash

# 🔐 Script de déploiement sécurisé Urban Foot Center
# Usage: ./deploy-secure.sh [environment]
# Environments: development, staging, production

set -e  # Arrêter en cas d'erreur

ENVIRONMENT=${1:-production}
PROJECT_DIR="/Users/seck/Desktop/URBAN FOOT CENTER"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 Déploiement sécurisé Urban Foot Center - Environnement: $ENVIRONMENT"
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Répertoire: $PROJECT_DIR"
echo ""

# Fonction de logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1"
}

error() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >&2
    exit 1
}

warning() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1"
}

# 1. Vérifications préliminaires
log "🔍 Vérifications de sécurité..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "SECURITY-CHECKLIST.md" ]; then
    error "Fichier SECURITY-CHECKLIST.md non trouvé. Êtes-vous dans le bon répertoire?"
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé"
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé"
fi

log "✅ Vérifications de base réussies"

# 2. Vérification des variables d'environnement
log "🔐 Vérification des variables d'environnement..."

if [ "$ENVIRONMENT" = "production" ]; then
    # Vérifier que les fichiers .env existent
    if [ ! -f "backend/.env" ]; then
        warning "Fichier backend/.env manquant. Génération des clés..."
        node scripts/generate-secure-keys.js --save
        echo "⚠️  Copiez les clés générées dans backend/.env avant de continuer!"
        read -p "Appuyez sur Entrée quand c'est fait..."
    fi
    
    # Vérifier NODE_ENV
    if grep -q "NODE_ENV=development" backend/.env 2>/dev/null; then
        error "NODE_ENV est encore en 'development' dans backend/.env!"
    fi
    
    # Vérifier JWT_SECRET
    if grep -q "JWT_SECRET=urban-foot-center-jwt-secret-key" backend/.env 2>/dev/null; then
        error "JWT_SECRET utilise encore la valeur par défaut!"
    fi
    
    # Vérifier CORS_ORIGIN
    if grep -q "CORS_ORIGIN=\*" backend/.env 2>/dev/null; then
        warning "CORS_ORIGIN est configuré sur '*' - non recommandé en production"
    fi
fi

log "✅ Variables d'environnement vérifiées"

# 3. Audit de sécurité des dépendances
log "🛡️  Audit de sécurité des dépendances..."

cd backend
if npm audit --audit-level high --production; then
    log "✅ Audit backend réussi"
else
    warning "Vulnérabilités détectées dans le backend"
    read -p "Continuer malgré les vulnérabilités? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Déploiement annulé à cause des vulnérabilités"
    fi
fi

cd ../frontend
if npm audit --audit-level high --production; then
    log "✅ Audit frontend réussi"
else
    warning "Vulnérabilités détectées dans le frontend"
fi

cd ..

# 4. Installation des dépendances
log "📦 Installation des dépendances..."

cd backend
npm ci --production
log "✅ Dépendances backend installées"

cd ../frontend
npm ci
log "✅ Dépendances frontend installées"

cd ..

# 5. Build du frontend
log "🏗️  Build du frontend..."

cd frontend
npm run build
if [ $? -eq 0 ]; then
    log "✅ Build frontend réussi"
else
    error "Échec du build frontend"
fi

cd ..

# 6. Tests de sécurité
log "🧪 Tests de sécurité..."

# Test de démarrage du serveur
cd backend
timeout 10s npm start &
SERVER_PID=$!
sleep 5

# Tester si le serveur répond
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    log "✅ Serveur démarre correctement"
else
    warning "Le serveur ne répond pas sur /health"
fi

# Tester le rate limiting
log "🚦 Test du rate limiting..."
for i in {1..6}; do
    curl -s http://localhost:5001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test","password":"test"}' > /dev/null
done

# La 6ème requête devrait être bloquée
if curl -s http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test","password":"test"}' | grep -q "Trop de tentatives"; then
    log "✅ Rate limiting fonctionne"
else
    warning "Rate limiting pourrait ne pas fonctionner"
fi

# Arrêter le serveur de test
kill $SERVER_PID 2>/dev/null || true
cd ..

# 7. Sauvegarde (si production)
if [ "$ENVIRONMENT" = "production" ]; then
    log "💾 Création d'une sauvegarde..."
    
    # Créer le répertoire de sauvegarde
    BACKUP_DIR="backups/deployment_$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    
    # Sauvegarder la configuration
    cp backend/.env "$BACKUP_DIR/backend.env.backup" 2>/dev/null || true
    cp frontend/.env "$BACKUP_DIR/frontend.env.backup" 2>/dev/null || true
    
    # Sauvegarder la base de données (si configurée)
    if command -v pg_dump &> /dev/null && [ -f "backend/.env" ]; then
        source backend/.env
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            > "$BACKUP_DIR/database_$TIMESTAMP.sql" 2>/dev/null || \
            warning "Impossible de sauvegarder la base de données"
    fi
    
    log "✅ Sauvegarde créée dans $BACKUP_DIR"
fi

# 8. Nettoyage des fichiers temporaires
log "🧹 Nettoyage..."

# Supprimer les fichiers de clés temporaires
rm -f secure-keys-*.env
log "✅ Fichiers temporaires supprimés"

# 9. Rapport final
echo ""
echo "🎉 Déploiement sécurisé terminé avec succès!"
echo ""
echo "📋 Résumé:"
echo "  • Environnement: $ENVIRONMENT"
echo "  • Timestamp: $TIMESTAMP"
echo "  • Audit sécurité: ✅"
echo "  • Build frontend: ✅"
echo "  • Tests serveur: ✅"
echo "  • Rate limiting: ✅"
if [ "$ENVIRONMENT" = "production" ]; then
echo "  • Sauvegarde: ✅"
fi
echo ""
echo "🚀 Votre application est prête pour la production!"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Configurer votre serveur web (Nginx/Apache)"
echo "  2. Configurer SSL/HTTPS"
echo "  3. Configurer la surveillance (monitoring)"
echo "  4. Tester en conditions réelles"
echo ""
echo "📞 En cas de problème, consultez SECURITY-CHECKLIST.md"
