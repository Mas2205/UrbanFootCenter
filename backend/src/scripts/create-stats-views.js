const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createStatsViews() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Création des vues statistiques...');
    
    // Supprimer les vues existantes si elles existent
    await client.query(`DROP VIEW IF EXISTS kpi_reservations_by_field CASCADE;`);
    await client.query(`DROP VIEW IF EXISTS kpi_reservations_by_field_date CASCADE;`);
    await client.query(`DROP VIEW IF EXISTS kpi_reservations_by_field_date_hour CASCADE;`);
    await client.query(`DROP VIEW IF EXISTS kpi_reservations_by_status CASCADE;`);
    
    // Vue 1: Nombre total de réservations par terrain + montant total
    await client.query(`
      CREATE VIEW kpi_reservations_by_field AS
      SELECT 
          field_id,
          COUNT(*) AS total_reservations,
          SUM(total_price) AS total_revenue
      FROM reservations
      GROUP BY field_id;
    `);
    console.log('✅ Vue kpi_reservations_by_field créée');
    
    // Vue 2: Nombre de réservations par terrain et par date
    await client.query(`
      CREATE VIEW kpi_reservations_by_field_date AS
      SELECT 
          field_id,
          reservation_date,
          COUNT(*) AS total_reservations,
          SUM(total_price) AS total_revenue
      FROM reservations
      GROUP BY field_id, reservation_date;
    `);
    console.log('✅ Vue kpi_reservations_by_field_date créée');
    
    // Vue 3: Nombre de réservations par terrain, date et heure de début
    await client.query(`
      CREATE VIEW kpi_reservations_by_field_date_hour AS
      SELECT 
          field_id,
          reservation_date,
          start_time,
          COUNT(*) AS total_reservations,
          SUM(total_price) AS total_revenue
      FROM reservations
      GROUP BY field_id, reservation_date, start_time;
    `);
    console.log('✅ Vue kpi_reservations_by_field_date_hour créée');
    
    // Vue 4: Statistiques par statut de réservation
    await client.query(`
      CREATE VIEW kpi_reservations_by_status AS
      SELECT 
          field_id,
          status,
          COUNT(*) AS total_reservations,
          SUM(total_price) AS total_revenue
      FROM reservations
      GROUP BY field_id, status;
    `);
    console.log('✅ Vue kpi_reservations_by_status créée');
    
    console.log('🎉 Toutes les vues statistiques ont été créées avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des vues:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la création des vues si le script est appelé directement
if (require.main === module) {
  createStatsViews()
    .then(() => {
      console.log('Création des vues terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur lors de la création des vues:', error);
      process.exit(1);
    });
}

module.exports = { createStatsViews };
