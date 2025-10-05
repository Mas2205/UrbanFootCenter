// Setup automatique en production
const { sequelize } = require('./database');

async function setupProduction() {
  // Ne s'exécute qu'en production
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  console.log('🚀 === SETUP AUTOMATIQUE PRODUCTION ===');
  
  try {
    // Attendre que la DB soit prête
    await sequelize.authenticate();
    console.log('✅ Connexion DB établie');

    // 1. Ajouter les ENUMs manquants
    try {
      await sequelize.query(`ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'especes';`);
      console.log('✅ ENUM especes ajouté');
    } catch (e) {
      console.log('ℹ️  ENUM especes existe déjà');
    }

    try {
      await sequelize.query(`ALTER TYPE enum_reservations_payment_status ADD VALUE IF NOT EXISTS 'pending_cash';`);
      console.log('✅ ENUM pending_cash ajouté');
    } catch (e) {
      console.log('ℹ️  ENUM pending_cash existe déjà');
    }

    // 2. Créer les vues KPI
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
    console.log('✅ Vue kpi_reservations_by_date créée');

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
    console.log('✅ Vue kpi_reservations_by_field créée');

    // Test rapide
    const [test] = await sequelize.query('SELECT COUNT(*) as count FROM kpi_reservations_by_date LIMIT 1');
    console.log('🎉 Setup terminé - Test:', test[0].count, 'enregistrements');

  } catch (error) {
    console.error('❌ Erreur setup production:', error.message);
    // Ne pas faire planter l'app, juste logger l'erreur
  }
}

module.exports = setupProduction;
