const { sequelize } = require('../config/database');

async function checkReservationsStructure() {
  try {
    console.log('🔄 Vérification de la structure de la table reservations...');
    
    // Vérifier la structure de la table reservations
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'reservations' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Structure actuelle de la table reservations:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Vérifier si time_slot_id existe
    const hasTimeSlotId = columns.some(col => col.column_name === 'time_slot_id');
    
    if (hasTimeSlotId) {
      console.log('✅ La colonne time_slot_id existe');
    } else {
      console.log('❌ La colonne time_slot_id N\'EXISTE PAS');
      console.log('🔧 Cette colonne doit être ajoutée ou la logique doit être adaptée');
    }
    
    // Vérifier la structure de la table time_slots pour comprendre la relation
    console.log('\n🔄 Vérification de la structure de la table time_slots...');
    
    const [timeSlotColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'time_slots' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Structure de la table time_slots:');
    timeSlotColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
checkReservationsStructure();
