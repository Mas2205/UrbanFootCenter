#!/usr/bin/env node

/**
 * Script pour AJOUTER SEULEMENT les champs marketplace à la table fields
 * SANS modifier les colonnes existantes
 */

const { sequelize } = require('../models');

async function addMarketplaceFieldsOnly() {
  try {
    console.log('🚀 Ajout des champs marketplace à la table fields...');
    console.log('⚠️  AUCUNE colonne existante ne sera modifiée !');

    // 1. Ajouter SEULEMENT les nouvelles colonnes marketplace
    console.log('📋 Ajout des colonnes marketplace...');
    
    await sequelize.query(`
      ALTER TABLE fields 
      ADD COLUMN IF NOT EXISTS owner_payout_channel VARCHAR(50) DEFAULT 'wave',
      ADD COLUMN IF NOT EXISTS owner_mobile_e164 VARCHAR(20),
      ADD COLUMN IF NOT EXISTS commission_rate_bps INTEGER DEFAULT 1000;
    `);
    
    console.log('✅ Colonnes marketplace ajoutées avec succès !');

    // 2. Créer l'ENUM pour owner_payout_channel si nécessaire
    console.log('📋 Création de l\'ENUM owner_payout_channel...');
    
    try {
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_fields_owner_payout_channel AS ENUM ('wave', 'orange_money', 'paydunya_push', 'bank_transfer');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log('✅ ENUM owner_payout_channel créé');
    } catch (error) {
      console.log('✅ ENUM owner_payout_channel déjà existant');
    }

    // 3. Vérifier que les colonnes ont été ajoutées
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'fields' 
      AND column_name IN ('owner_payout_channel', 'owner_mobile_e164', 'commission_rate_bps')
      ORDER BY column_name;
    `);
    
    console.log('📋 Colonnes marketplace dans la table fields:');
    columns.forEach(column => {
      console.log(`   ✓ ${column.column_name} (${column.data_type}) - défaut: ${column.column_default || 'NULL'}`);
    });

    // 4. Ajouter marketplace_digital à l'ENUM payment_methods si nécessaire
    console.log('📋 Ajout du type marketplace_digital...');
    
    try {
      await sequelize.query(`
        ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'marketplace_digital';
      `);
      console.log('✅ Type marketplace_digital ajouté');
    } catch (error) {
      console.log('✅ Type marketplace_digital déjà présent');
    }

    // 5. Vérifier l'état final de la table fields (SANS la modifier)
    const [fieldInfo] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'fields' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 État final de la table fields:');
    fieldInfo.forEach(col => {
      const status = ['owner_payout_channel', 'owner_mobile_e164', 'commission_rate_bps'].includes(col.column_name) ? '🆕' : '✅';
      console.log(`   ${status} ${col.column_name} (${col.data_type}) - nullable: ${col.is_nullable}`);
    });

    console.log('\n🎉 Ajout des champs marketplace terminé avec succès !');
    console.log('✅ Aucune colonne existante n\'a été modifiée');
    console.log('✅ Seules les nouvelles colonnes marketplace ont été ajoutées');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Redémarrez votre serveur');
    console.log('   2. Testez l\'interface "Marketplace Digital"');
    console.log('   3. Configurez vos clés PayDunya et Wave');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des champs:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  addMarketplaceFieldsOnly();
}

module.exports = { addMarketplaceFieldsOnly };
