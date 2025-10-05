const { sequelize } = require('../config/database');

async function checkReservationsTable() {
  try {
    console.log('🔄 Vérification de la table reservations...');
    
    // Vérifier si la table reservations existe
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'reservations';
    `);
    
    if (tables.length === 0) {
      console.log('❌ La table reservations n\'existe pas !');
      
      // Lister toutes les tables disponibles
      const [allTables] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      
      console.log('📋 Tables disponibles dans la base de données:');
      allTables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
      
      return;
    }
    
    console.log('✅ Table reservations trouvée');
    
    // Vérifier la structure de la table
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'reservations' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Structure de la table reservations:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Compter le nombre de réservations
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total FROM reservations;
    `);
    
    console.log(`📊 Nombre total de réservations: ${countResult[0].total}`);
    
    // Afficher les dernières réservations
    if (countResult[0].total > 0) {
      const [recentReservations] = await sequelize.query(`
        SELECT id, user_id, field_id, reservation_date, start_time, end_time, 
               total_price, status, payment_status, created_at
        FROM reservations 
        ORDER BY created_at DESC 
        LIMIT 5;
      `);
      
      console.log('📋 Dernières réservations:');
      recentReservations.forEach(res => {
        console.log(`  - ID: ${res.id}, Date: ${res.reservation_date}, Statut: ${res.status}, Paiement: ${res.payment_status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
checkReservationsTable();
