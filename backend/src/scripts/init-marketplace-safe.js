#!/usr/bin/env node

/**
 * Script d'initialisation sécurisé des tables marketplace
 * Évite les conflits avec les vues existantes
 */

const { sequelize } = require('../models');

async function initMarketplaceSafe() {
  try {
    console.log('🚀 Initialisation sécurisée des tables marketplace...');

    // 1. Ajouter les champs marketplace à la table fields (sans sync)
    console.log('📋 Ajout des champs marketplace à la table fields...');
    
    try {
      await sequelize.query(`
        ALTER TABLE fields 
        ADD COLUMN IF NOT EXISTS owner_payout_channel VARCHAR(50) DEFAULT 'wave',
        ADD COLUMN IF NOT EXISTS owner_mobile_e164 VARCHAR(20),
        ADD COLUMN IF NOT EXISTS commission_rate_bps INTEGER DEFAULT 1000;
      `);
      console.log('✅ Champs marketplace ajoutés à la table fields');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Champs marketplace déjà présents dans la table fields');
      } else {
        throw error;
      }
    }

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

    // 3. Créer la table marketplace_payments
    console.log('📋 Création de la table marketplace_payments...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS marketplace_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reservation_id UUID NOT NULL,
        payment_id VARCHAR(255) UNIQUE NOT NULL,
        client_reference VARCHAR(255) UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        platform_fee INTEGER NOT NULL,
        net_to_owner INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'XOF',
        status VARCHAR(50) DEFAULT 'pending',
        paydunya_token VARCHAR(255),
        checkout_url TEXT,
        payment_method VARCHAR(50),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Table marketplace_payments créée');

    // 4. Créer la table payouts
    console.log('📋 Création de la table payouts...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        marketplace_payment_id UUID NOT NULL,
        field_id UUID NOT NULL,
        amount INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'XOF',
        payout_channel VARCHAR(50) NOT NULL,
        recipient_mobile VARCHAR(20),
        payout_reference VARCHAR(255) UNIQUE,
        status VARCHAR(50) DEFAULT 'pending',
        wave_transaction_id VARCHAR(255),
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (marketplace_payment_id) REFERENCES marketplace_payments(id) ON DELETE CASCADE,
        FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Table payouts créée');

    // 5. Ajouter marketplace_digital à l'ENUM payment_methods si nécessaire
    console.log('📋 Ajout du type marketplace_digital...');
    
    try {
      await sequelize.query(`
        ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'marketplace_digital';
      `);
      console.log('✅ Type marketplace_digital ajouté');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Type marketplace_digital déjà présent');
      } else {
        console.log('⚠️  Type marketplace_digital peut-être déjà présent');
      }
    }

    // 6. Créer les index pour les performances
    console.log('📋 Création des index...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_marketplace_payments_reservation_id ON marketplace_payments(reservation_id);
      CREATE INDEX IF NOT EXISTS idx_marketplace_payments_payment_id ON marketplace_payments(payment_id);
      CREATE INDEX IF NOT EXISTS idx_marketplace_payments_status ON marketplace_payments(status);
      CREATE INDEX IF NOT EXISTS idx_payouts_marketplace_payment_id ON payouts(marketplace_payment_id);
      CREATE INDEX IF NOT EXISTS idx_payouts_field_id ON payouts(field_id);
      CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
    `);
    console.log('✅ Index créés');

    // 7. Vérification finale
    console.log('📋 Vérification des tables créées...');
    
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('marketplace_payments', 'payouts', 'fields')
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables disponibles:');
    tables.forEach(table => {
      console.log(`   ✓ ${table.table_name}`);
    });

    // 8. Vérifier les champs marketplace dans fields
    const [fieldColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fields' 
      AND column_name IN ('owner_payout_channel', 'owner_mobile_e164', 'commission_rate_bps')
      ORDER BY column_name;
    `);
    
    console.log('📋 Champs marketplace dans fields:');
    fieldColumns.forEach(column => {
      console.log(`   ✓ ${column.column_name}`);
    });

    console.log('\n🎉 Initialisation marketplace terminée avec succès !');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Configurez vos variables ENV (PayDunya + Wave)');
    console.log('   2. Testez avec: node test-option1-integration.js');
    console.log('   3. Utilisez la nouvelle interface admin');
    console.log('   4. Remplacez votre modal par PaymentModalUpgrade');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initMarketplaceSafe();
}

module.exports = { initMarketplaceSafe };
