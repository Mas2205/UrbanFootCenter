#!/usr/bin/env node

/**
 * Script pour vérifier et corriger l'ENUM payment_methods_payment_type
 */

const { sequelize } = require('../models');

async function fixPaymentEnum() {
  try {
    console.log('🔍 Vérification de l\'ENUM payment_methods_payment_type...');

    // 1. Vérifier les valeurs actuelles de l'ENUM
    const [enumValues] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_payment_methods_payment_type)) as enum_value;
    `);
    
    console.log('📋 Valeurs actuelles dans l\'ENUM:');
    enumValues.forEach(row => {
      console.log(`   ✓ ${row.enum_value}`);
    });

    const hasMarketplaceDigital = enumValues.some(row => row.enum_value === 'marketplace_digital');
    
    if (hasMarketplaceDigital) {
      console.log('✅ marketplace_digital est déjà présent dans l\'ENUM');
    } else {
      console.log('⚠️  marketplace_digital MANQUE dans l\'ENUM');
      console.log('🔧 Ajout de marketplace_digital...');
      
      // Ajouter marketplace_digital à l'ENUM
      await sequelize.query(`
        ALTER TYPE enum_payment_methods_payment_type ADD VALUE 'marketplace_digital';
      `);
      
      console.log('✅ marketplace_digital ajouté à l\'ENUM');
      
      // Vérifier à nouveau
      const [newEnumValues] = await sequelize.query(`
        SELECT unnest(enum_range(NULL::enum_payment_methods_payment_type)) as enum_value;
      `);
      
      console.log('📋 Nouvelles valeurs dans l\'ENUM:');
      newEnumValues.forEach(row => {
        const isNew = row.enum_value === 'marketplace_digital' ? '🆕' : '✅';
        console.log(`   ${isNew} ${row.enum_value}`);
      });
    }

    // 2. Vérifier que le modèle PaymentMethod peut utiliser cette valeur
    console.log('\n🧪 Test de création d\'un enregistrement marketplace_digital...');
    
    try {
      // Test avec une requête directe
      await sequelize.query(`
        SELECT 'marketplace_digital'::enum_payment_methods_payment_type as test_value;
      `);
      console.log('✅ L\'ENUM accepte maintenant marketplace_digital');
    } catch (error) {
      console.error('❌ L\'ENUM refuse encore marketplace_digital:', error.message);
    }

    // 3. Vérifier les contraintes sur la table payment_methods
    const [constraints] = await sequelize.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'payment_methods' 
      AND constraint_type = 'CHECK';
    `);
    
    if (constraints.length > 0) {
      console.log('\n📋 Contraintes CHECK sur payment_methods:');
      constraints.forEach(constraint => {
        console.log(`   ⚠️  ${constraint.constraint_name} (${constraint.constraint_type})`);
      });
    }

    console.log('\n🎉 Vérification terminée !');
    console.log('✅ L\'ENUM devrait maintenant accepter marketplace_digital');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  fixPaymentEnum();
}

module.exports = { fixPaymentEnum };
