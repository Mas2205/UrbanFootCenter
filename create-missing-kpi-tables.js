// Script pour créer les tables/vues KPI manquantes en production
const { Client } = require('pg');

async function createMissingKPITables() {
  console.log('🚀 === CRÉATION DES TABLES KPI MANQUANTES ===');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connexion à la base de données Railway établie');

    // 1. Créer la vue kpi_reservations_by_date
    console.log('\n🔄 Création de la vue kpi_reservations_by_date...');
    
    await client.query(`
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
    console.log('✅ Vue kpi_reservations_by_date créée');

    // 2. Créer la vue kpi_reservations_by_field (si nécessaire)
    console.log('\n🔄 Création de la vue kpi_reservations_by_field...');
    
    await client.query(`
      CREATE OR REPLACE VIEW kpi_reservations_by_field AS
      SELECT 
        f.id as field_id,
        f.name as field_name,
        COUNT(r.id) as total_reservations,
        SUM(CAST(r.total_price AS DECIMAL)) as total_revenue,
        AVG(CAST(r.total_price AS DECIMAL)) as avg_price
      FROM fields f
      LEFT JOIN reservations r ON f.id = r.field_id 
        AND r.status IN ('confirmed', 'completed')
      GROUP BY f.id, f.name
      ORDER BY total_reservations DESC;
    `);
    console.log('✅ Vue kpi_reservations_by_field créée');

    // 3. Créer la vue kpi_payments_summary (si nécessaire)
    console.log('\n🔄 Création de la vue kpi_payments_summary...');
    
    await client.query(`
      CREATE OR REPLACE VIEW kpi_payments_summary AS
      SELECT 
        payment_method,
        payment_status,
        COUNT(*) as total_payments,
        SUM(CAST(amount AS DECIMAL)) as total_amount
      FROM payments
      GROUP BY payment_method, payment_status
      ORDER BY total_amount DESC;
    `);
    console.log('✅ Vue kpi_payments_summary créée');

    // 4. Créer la vue kpi_monthly_stats (si nécessaire)
    console.log('\n🔄 Création de la vue kpi_monthly_stats...');
    
    await client.query(`
      CREATE OR REPLACE VIEW kpi_monthly_stats AS
      SELECT 
        DATE_TRUNC('month', reservation_date) as month,
        COUNT(*) as total_reservations,
        SUM(CAST(total_price AS DECIMAL)) as total_revenue,
        COUNT(DISTINCT user_id) as unique_customers
      FROM reservations 
      WHERE status IN ('confirmed', 'completed')
      GROUP BY DATE_TRUNC('month', reservation_date)
      ORDER BY month DESC;
    `);
    console.log('✅ Vue kpi_monthly_stats créée');

    // 5. Vérifier que les vues ont été créées
    console.log('\n🔍 Vérification des vues créées...');
    
    const viewsResult = await client.query(`
      SELECT schemaname, viewname 
      FROM pg_views 
      WHERE viewname LIKE 'kpi_%'
      ORDER BY viewname;
    `);

    console.log('📋 Vues KPI disponibles:');
    viewsResult.rows.forEach(row => {
      console.log(`   ✅ ${row.viewname}`);
    });

    // 6. Test rapide des vues
    console.log('\n🧪 Test des vues...');
    
    try {
      const testResult = await client.query('SELECT COUNT(*) as count FROM kpi_reservations_by_date LIMIT 1');
      console.log(`✅ kpi_reservations_by_date: ${testResult.rows[0].count} enregistrements`);
    } catch (e) {
      console.log('⚠️  Erreur test kpi_reservations_by_date:', e.message);
    }

    console.log('\n🎉 === CRÉATION DES TABLES KPI TERMINÉE ! ===');
    console.log('Les pages Employés et Statistiques devraient maintenant fonctionner.');

  } catch (error) {
    console.error('\n❌ === ERREUR LORS DE LA CRÉATION ===');
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécuter le script
createMissingKPITables().catch(console.error);
