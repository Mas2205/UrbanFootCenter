#!/usr/bin/env node

/**
 * Script pour créer un utilisateur admin de test
 */

const bcrypt = require('bcrypt');
const { User, Field } = require('../models');

async function createTestAdmin() {
  try {
    console.log('🚀 Création d\'un utilisateur admin de test...');

    // Vérifier si l'admin existe déjà
    let admin = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (admin) {
      console.log('✅ Admin test déjà existant');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Rôle: ${admin.role}`);
      return admin;
    }

    // Créer un terrain de test si nécessaire
    let field = await Field.findOne({ where: { name: 'URBAN FOOT CENTER' } });
    
    if (!field) {
      field = await Field.create({
        name: 'URBAN FOOT CENTER',
        address: 'Dakar, Sénégal',
        price_per_hour: 10000,
        description: 'Terrain de test pour marketplace',
        latitude: 14.6937,
        longitude: -17.4441,
        is_active: true
      });
      console.log('✅ Terrain de test créé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Créer l'utilisateur admin
    admin = await User.create({
      first_name: 'Admin',
      last_name: 'Test',
      email: 'admin@example.com',
      phone_number: '+221771234567',
      password_hash: hashedPassword,
      role: 'super_admin',
      field_id: field.id,
      is_active: true,
      is_verified: true
    });

    console.log('✅ Utilisateur admin créé avec succès !');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Mot de passe: admin123`);
    console.log(`   Rôle: ${admin.role}`);
    console.log(`   Terrain: ${field.name}`);

    return admin;

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createTestAdmin().then(() => {
    console.log('\n🎉 Prêt pour les tests !');
    console.log('Vous pouvez maintenant exécuter: node test-option1-integration.js');
    process.exit(0);
  });
}

module.exports = { createTestAdmin };
