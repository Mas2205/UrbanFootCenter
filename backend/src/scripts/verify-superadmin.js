/**
 * Script pour vérifier et activer le compte super administrateur
 */

// Charger les variables d'environnement
require('dotenv').config({ path: '../../.env' });

// Importer les modèles et la connexion à la base de données
const db = require('../models');
const { User } = db;

async function verifySuperAdmin() {
  try {
    // Trouver le super admin
    const superAdmin = await User.findOne({ 
      where: { 
        email: 'superadmin@urbanfootcenter.com',
        role: 'super_admin'
      }
    });

    if (!superAdmin) {
      console.log('Super administrateur non trouvé!');
      return;
    }

    // Afficher l'état actuel
    console.log('État actuel du compte super admin:');
    console.log(`ID: ${superAdmin.id}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Vérifié: ${superAdmin.is_verified}`);
    
    // Vérifier le compte s'il ne l'est pas déjà
    if (!superAdmin.is_verified) {
      await superAdmin.update({ 
        is_verified: true,
        verification_token: null
      });
      console.log('Compte super administrateur vérifié avec succès!');
    } else {
      console.log('Le compte super administrateur est déjà vérifié.');
    }

    console.log('Informations de connexion:');
    console.log(`Email: ${superAdmin.email}`);
    console.log('Mot de passe: Admin123!');
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    // Fermer la connexion à la base de données
    await db.sequelize.close();
  }
}

// Exécuter la fonction
verifySuperAdmin();
