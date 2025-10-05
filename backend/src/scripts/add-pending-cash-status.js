const { sequelize } = require('../config/database');

async function addPendingCashStatus() {
  try {
    console.log('🔄 Ajout du statut "pending_cash" à l\'ENUM payment_status...');
    
    // Vérifier les valeurs actuelles de l'ENUM
    const [currentValues] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_reservations_payment_status)) as payment_status;
    `);
    
    console.log('📋 Statuts de paiement actuels:', currentValues.map(row => row.payment_status));
    
    // Ajouter 'pending_cash' s'il n'existe pas
    if (!currentValues.some(row => row.payment_status === 'pending_cash')) {
      await sequelize.query(`
        ALTER TYPE enum_reservations_payment_status ADD VALUE 'pending_cash';
      `);
      
      console.log('✅ Statut "pending_cash" ajouté avec succès !');
      
      // Vérifier à nouveau
      const [newValues] = await sequelize.query(`
        SELECT unnest(enum_range(NULL::enum_reservations_payment_status)) as payment_status;
      `);
      
      console.log('📋 Statuts de paiement mis à jour:', newValues.map(row => row.payment_status));
    } else {
      console.log('ℹ️  Le statut "pending_cash" existe déjà');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
addPendingCashStatus();
