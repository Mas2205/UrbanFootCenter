#!/bin/bash

# Script de sauvegarde de la base de données PostgreSQL
# Urban Foot Center - Database Backup Script

# Configuration
DB_NAME="urban_foot_center"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Répertoire de sauvegarde
BACKUP_DIR="/Users/seck/Desktop/URBAN FOOT CENTER/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/urban_foot_center_backup_$DATE.sql"

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p "$BACKUP_DIR"

echo "🔄 Début de la sauvegarde de la base de données..."
echo "📅 Date: $(date)"
echo "🗄️  Base de données: $DB_NAME"
echo "📁 Fichier de sauvegarde: $BACKUP_FILE"

# Effectuer la sauvegarde avec pg_dump (utiliser la version système)
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --verbose \
  --clean \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file="$BACKUP_FILE"

# Vérifier si la sauvegarde s'est bien déroulée
if [ $? -eq 0 ]; then
    echo "✅ Sauvegarde réussie!"
    echo "📄 Fichier créé: $BACKUP_FILE"
    
    # Afficher la taille du fichier
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "📊 Taille du fichier: $FILE_SIZE"
    
    # Compresser le fichier de sauvegarde
    echo "🗜️  Compression du fichier..."
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Compression réussie: ${BACKUP_FILE}.gz"
        COMPRESSED_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
        echo "📊 Taille compressée: $COMPRESSED_SIZE"
    else
        echo "⚠️  Erreur lors de la compression"
    fi
    
    # Nettoyer les anciennes sauvegardes (garder seulement les 7 dernières)
    echo "🧹 Nettoyage des anciennes sauvegardes..."
    find "$BACKUP_DIR" -name "urban_foot_center_backup_*.sql.gz" -type f -mtime +7 -delete
    echo "✅ Nettoyage terminé"
    
else
    echo "❌ Erreur lors de la sauvegarde!"
    exit 1
fi

echo "🎉 Processus de sauvegarde terminé avec succès!"
