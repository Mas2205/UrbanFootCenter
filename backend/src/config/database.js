const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Chargement des variables d'environnement
require('dotenv').config();

// Debug des variables d'environnement
console.log('🔍 Variables de base de données:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'DÉFINIE' : 'NON DÉFINIE');
console.log('DB_HOST:', process.env.DB_HOST || 'NON DÉFINIE');
console.log('DB_NAME:', process.env.DB_NAME || 'NON DÉFINIE');
console.log('DB_USER:', process.env.DB_USER || 'NON DÉFINIE');

// Configuration de Sequelize pour PostgreSQL avec support UUID
// Utiliser DATABASE_URL en priorité (Railway), sinon variables individuelles (local)
const sequelize = process.env.DATABASE_URL 
  ? (() => {
      console.log('✅ Utilisation de DATABASE_URL pour la connexion PostgreSQL (Production)');
      return new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
          timestamps: true,
          underscored: true
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: {
          ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        }
      });
    })()
  : (() => {
      console.log('✅ Utilisation des variables individuelles pour la connexion PostgreSQL (Développement)');
      return new Sequelize(
        process.env.DB_NAME || 'urban_foot_center',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'postgres',
        {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          dialect: 'postgres',
          logging: process.env.NODE_ENV === 'development' ? console.log : false,
          define: {
            timestamps: true,
            underscored: true
          },
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          }
        }
      );
    })();

// Configuration pour utiliser les UUIDs comme clés primaires
const defaultOptions = {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
    allowNull: false
  }
};

// Fonction pour initialiser les modèles automatiquement
const initModels = async () => {
  // Chemin vers le répertoire des modèles
  const modelsPath = path.join(__dirname, '../models');
  
  // Lecture des fichiers du répertoire des modèles
  const modelFiles = fs.readdirSync(modelsPath)
    .filter(file => file.endsWith('.model.js'));
  
  // Synchronisation de la base de données si activé
  if (process.env.DB_SYNC === 'true') {
    try {
      console.log('Synchronisation des modèles avec la base de données...');
      await sequelize.sync({ alter: true });
      console.log('Synchronisation terminée avec succès');
    } catch (error) {
      console.error('Erreur lors de la synchronisation des modèles:', error);
    }
  }
  
  // Importation de chaque modèle
  for (const file of modelFiles) {
    const model = require(path.join(modelsPath, file))(sequelize, Sequelize, defaultOptions);
    console.log(`Modèle chargé: ${model.name}`);
  }
  
  // Synchronisation des associations après le chargement de tous les modèles
  const modelSync = () => {
    Object.keys(sequelize.models).forEach(modelName => {
      if (sequelize.models[modelName].associate) {
        sequelize.models[modelName].associate(sequelize.models);
      }
    });
  };
  
  modelSync();
};

module.exports = {
  sequelize,
  Sequelize,
  defaultOptions,
  initModels
};
