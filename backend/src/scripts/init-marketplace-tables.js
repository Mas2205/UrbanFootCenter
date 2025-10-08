#!/usr/bin/env node

/**
 * Script d'initialisation des tables marketplace
 * Usage: node src/scripts/init-marketplace-tables.js
 */

const { sequelize } = require('../models');

async function initMarketplaceTables() {
  try {
    console.log('🚀 Initialisation des tables marketplace...');

    // Synchroniser tous les modèles (créer les tables manquantes)
    await sequelize.sync({ alter: true });
    
    console.log('✅ Tables marketplace créées/mises à jour avec succès !');
    
    // Vérifier les tables créées
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('marketplace_payments', 'payouts')
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables marketplace disponibles:');
    results.forEach(table => {
      console.log(`   ✓ ${table.table_name}`);
    });

    // Vérifier les champs marketplace dans la table fields
    const [fieldColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fields' 
      AND column_name IN ('owner_payout_channel', 'owner_mobile_e164', 'commission_rate_bps')
      ORDER BY column_name;
    `);
    
    console.log('📋 Champs marketplace dans table fields:');
    fieldColumns.forEach(column => {
      console.log(`   ✓ ${column.column_name}`);
    });

    if (fieldColumns.length === 0) {
      console.log('⚠️  Ajout des champs marketplace à la table fields...');
      
      // Ajouter les champs marketplace à la table fields
      await sequelize.query(`
        ALTER TABLE fields 
        ADD COLUMN IF NOT EXISTS owner_payout_channel VARCHAR(50) DEFAULT 'wave',
        ADD COLUMN IF NOT EXISTS owner_mobile_e164 VARCHAR(20),
        ADD COLUMN IF NOT EXISTS commission_rate_bps INTEGER DEFAULT 1000;
      `);
      
      console.log('✅ Champs marketplace ajoutés à la table fields !');
    }

    // Vérifier le type marketplace_digital dans l'ENUM
    const [enumValues] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::payment_methods_payment_type)) as enum_value;
    `);
    
    const hasMarketplaceType = enumValues.some(row => row.enum_value === 'marketplace_digital');
    
    if (!hasMarketplaceType) {
      console.log('⚠️  Ajout du type marketplace_digital à l\'ENUM...');
      
      await sequelize.query(`
        ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'marketplace_digital';
      `);
      
      console.log('✅ Type marketplace_digital ajouté !');
    } else {
      console.log('✅ Type marketplace_digital déjà présent dans l\'ENUM');
    }

    console.log('\n🎉 Initialisation marketplace terminée avec succès !');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Configurez vos variables ENV (PayDunya + Wave)');
    console.log('   2. Testez avec: node test-option1-integration.js');
    console.log('   3. Utilisez la nouvelle interface admin');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initMarketplaceTables();
}

module.exports = { initMarketplaceTables };
