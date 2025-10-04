/**
 * Script pour créer un compte super administrateur dans la base de données
 * Ce script peut être exécuté directement avec Node.js
 */

// Charger les variables d'environnement
require('dotenv').config({ path: '../../.env' });

// Importer les modèles et la connexion à la base de données
const db = require('../models');
const { User } = db;
const { v4: uuidv4 } = require('uuid');

// Configuration du super administrateur
const superAdmin = {
  id: uuidv4(), // Génération d'un UUID v4 pour la clé primaire
  email: 'superadmin@urbanfootcenter.com',
  phone_number: '+221777777777', // Numéro de téléphone fictif
  password_hash: 'Admin123!', // Sera hashé automatiquement par le hook
  first_name: 'Super',
  last_name: 'Admin',
  role: 'super_admin',
  is_verified: true, // L'admin est déjà vérifié
  created_at: new Date(),
  updated_at: new Date()
};

/**
 * Fonction pour créer le super administrateur
 */
async function createSuperAdmin() {
  try {
    // Vérifier si un super admin existe déjà
    const existingAdmin = await User.findOne({ 
      where: { 
        role: 'super_admin'
      }
    });

    if (existingAdmin) {
      console.log('Un super administrateur existe déjà dans la base de données.');
      console.log(`Email: ${existingAdmin.email}`);
      return;
    }

    // Créer le super administrateur
    const newAdmin = await User.create(superAdmin);
    
    console.log('Super administrateur créé avec succès!');
    console.log('-------------------------------------');
    console.log(`ID: ${newAdmin.id}`);
    console.log(`Email: ${newAdmin.email}`);
    console.log(`Mot de passe: Admin123!`);
    console.log('-------------------------------------');
    console.log('Vous pouvez maintenant vous connecter avec ces identifiants.');
    
  } catch (error) {
    console.error('Erreur lors de la création du super administrateur:', error);
  } finally {
    // Fermer la connexion à la base de données
    await db.sequelize.close();
  }
}

// Exécuter la fonction
createSuperAdmin();
