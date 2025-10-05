const { sequelize } = require('../config/database');

async function recreatePaymentMethodsTable() {
  try {
    console.log('🔄 Recréation de la table payment_methods...');
    
    // Supprimer l'ancien ENUM s'il existe
    await sequelize.query(`DROP TYPE IF EXISTS enum_payment_methods_payment_type CASCADE;`);
    
    // Créer le nouvel ENUM avec tous les types incluant 'especes'
    await sequelize.query(`
      CREATE TYPE enum_payment_methods_payment_type AS ENUM (
        'wave', 
        'orange_money', 
        'carte_bancaire', 
        'especes'
      );
    `);
    
    console.log('✅ ENUM payment_type créé avec le type "especes"');
    
    // Créer la table payment_methods
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
        payment_type enum_payment_methods_payment_type NOT NULL,
        api_url VARCHAR(500),
        api_key TEXT,
        api_secret TEXT,
        merchant_id VARCHAR(255),
        is_active BOOLEAN DEFAULT true NOT NULL,
        configuration JSONB DEFAULT '{}',
        ignore_validation BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(field_id, payment_type)
      );
    `);
    
    console.log('✅ Table payment_methods créée avec succès');
    
    // Créer l'index sur field_id
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_methods_field_id ON payment_methods(field_id);
    `);
    
    // Créer l'index sur payment_type
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_methods_payment_type ON payment_methods(payment_type);
    `);
    
    console.log('✅ Index créés avec succès');
    
    // Vérifier la structure de la table
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payment_methods' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Structure de la table payment_methods:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Vérifier les types de paiement disponibles
    const [types] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_payment_methods_payment_type)) as payment_type;
    `);
    
    console.log('📋 Types de paiement disponibles:', types.map(row => row.payment_type));
    
  } catch (error) {
    console.error('❌ Erreur lors de la recréation:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
recreatePaymentMethodsTable();
