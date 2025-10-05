// Script pour corriger le conflit de vue avec la table fields
const { sequelize } = require('./src/config/database');

async function fixViewConflict() {
  console.log('🚀 === CORRECTION CONFLIT VUE FIELDS ===');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB établie');

    // 1. Supprimer les vues qui dépendent de la table fields
    console.log('🗑️  Suppression des vues dépendantes...');
    
    await sequelize.query('DROP VIEW IF EXISTS kpi_reservations_by_field CASCADE;');
    console.log('✅ Vue kpi_reservations_by_field supprimée');

    await sequelize.query('DROP VIEW IF EXISTS kpi_reservations_by_date CASCADE;');
    console.log('✅ Vue kpi_reservations_by_date supprimée');

    // 2. Forcer la synchronisation des modèles
    console.log('🔄 Synchronisation des modèles...');
    await sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés');

    // 3. Recréer les vues avec la nouvelle structure
    console.log('🔄 Recréation des vues...');
    
    await sequelize.query(`
      CREATE OR REPLACE VIEW kpi_reservations_by_date AS
      SELECT 
        DATE(reservation_date) as reservation_date,
        COUNT(*) as total_reservations,
        SUM(CAST(total_price AS DECIMAL)) as total_revenue
      FROM reservations 
      WHERE status IN ('confirmed', 'completed')
      GROUP BY DATE(reservation_date)
      ORDER BY reservation_date DESC;
    `);
    console.log('✅ Vue kpi_reservations_by_date recréée');

    await sequelize.query(`
      CREATE OR REPLACE VIEW kpi_reservations_by_field AS
      SELECT 
        f.id as field_id,
        f.name as field_name,
        COUNT(r.id) as total_reservations,
        SUM(CAST(r.total_price AS DECIMAL)) as total_revenue
      FROM fields f
      LEFT JOIN reservations r ON f.id = r.field_id 
        AND r.status IN ('confirmed', 'completed')
      GROUP BY f.id, f.name
      ORDER BY total_reservations DESC;
    `);
    console.log('✅ Vue kpi_reservations_by_field recréée');

    // 4. Test des vues
    const [test1] = await sequelize.query('SELECT COUNT(*) as count FROM kpi_reservations_by_date LIMIT 1');
    const [test2] = await sequelize.query('SELECT COUNT(*) as count FROM kpi_reservations_by_field LIMIT 1');
    
    console.log('🎉 Tests réussis:');
    console.log(`   - kpi_reservations_by_date: ${test1[0].count} enregistrements`);
    console.log(`   - kpi_reservations_by_field: ${test2[0].count} enregistrements`);

    console.log('✅ Conflit de vue résolu avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  fixViewConflict().catch(console.error);
}

module.exports = fixViewConflict;
