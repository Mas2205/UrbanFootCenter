const { sequelize } = require('../config/database');

async function addEspecesPaymentType() {
  try {
    console.log('🔄 Ajout du type de paiement "especes"...');
    
    // Ajouter le type 'especes' à l'ENUM payment_type
    await sequelize.query(`
      ALTER TYPE "enum_payment_methods_payment_type" 
      ADD VALUE IF NOT EXISTS 'especes';
    `);
    
    console.log('✅ Type de paiement "especes" ajouté avec succès !');
    
    // Vérifier les types disponibles
    const result = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_payment_methods_payment_type)) as payment_type;
    `);
    
    console.log('📋 Types de paiement disponibles:', result[0].map(row => row.payment_type));
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Le type "especes" existe déjà dans la base de données');
    } else {
      console.error('❌ Erreur lors de l\'ajout du type "especes":', error.message);
    }
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
addEspecesPaymentType();
