const { Client } = require('pg');

/**
 * Script simple pour trouver les réservations passées
 */
async function findPastReservations() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'urban_foot_center',
    user: 'postgres',
    password: 'postgres' // Remplacez par votre mot de passe
  });

  try {
    console.log('🔍 Connexion à PostgreSQL...');
    await client.connect();
    console.log('✅ Connexion réussie\n');

    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Date d\'aujourd\'hui:', today);
    console.log('');

    // 1. Toutes les réservations passées
    console.log('🔍 Toutes les réservations passées:');
    const allPastQuery = `
      SELECT 
        r.id,
        r.reservation_date,
        r.start_time,
        r.status,
        r.payment_status,
        u.first_name,
        u.last_name,
        u.email,
        f.name as field_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN fields f ON r.field_id = f.id
      WHERE r.reservation_date < $1
      ORDER BY r.reservation_date DESC, r.start_time ASC;
    `;

    const allPastResult = await client.query(allPastQuery, [today]);
    console.log(`📊 Total: ${allPastResult.rows.length} réservations\n`);

    // 2. Réservations passées non annulées
    console.log('🎯 Réservations passées non annulées (pour onglet "Passées"):');
    const pastNotCancelledQuery = `
      SELECT 
        r.id,
        r.reservation_date,
        r.start_time,
        r.status,
        r.payment_status,
        u.first_name,
        u.last_name,
        u.email,
        f.name as field_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN fields f ON r.field_id = f.id
      WHERE r.reservation_date < $1
        AND r.status != 'cancelled'
      ORDER BY r.reservation_date DESC, r.start_time ASC;
    `;

    const pastNotCancelledResult = await client.query(pastNotCancelledQuery, [today]);
    console.log(`📊 Total: ${pastNotCancelledResult.rows.length} réservations\n`);

    if (pastNotCancelledResult.rows.length > 0) {
      console.log('📋 Liste détaillée:');
      pastNotCancelledResult.rows.forEach((res, index) => {
        console.log(`${index + 1}. ${res.reservation_date} ${res.start_time} - ${res.field_name}`);
        console.log(`   User: ${res.first_name} ${res.last_name} (${res.email})`);
        console.log(`   Status: ${res.status} | Payment: ${res.payment_status}`);
        console.log(`   ID: ${res.id}`);
        console.log('');
      });
    }

    // 3. Spécifiquement pour l'utilisateur client1
    const userId = 'd7a1b392-f061-48f6-bfc6-41879638fc60';
    console.log(`🔍 Réservations passées pour l'utilisateur client1 (${userId}):`);
    
    const userPastQuery = `
      SELECT 
        r.id,
        r.reservation_date,
        r.start_time,
        r.status,
        r.payment_status,
        r.total_price,
        f.name as field_name
      FROM reservations r
      LEFT JOIN fields f ON r.field_id = f.id
      WHERE r.user_id = $1
        AND r.reservation_date < $2
        AND r.status != 'cancelled'
      ORDER BY r.reservation_date DESC, r.start_time ASC;
    `;

    const userPastResult = await client.query(userPastQuery, [userId, today]);
    console.log(`📊 Total pour cet utilisateur: ${userPastResult.rows.length}\n`);

    if (userPastResult.rows.length > 0) {
      console.log('📋 Détails:');
      userPastResult.rows.forEach((res, index) => {
        console.log(`${index + 1}. ${res.reservation_date} ${res.start_time} - ${res.field_name}`);
        console.log(`   Status: ${res.status} | Payment: ${res.payment_status}`);
        console.log(`   Prix: ${res.total_price} FCFA`);
        console.log(`   ID: ${res.id}`);
        console.log('');
      });
    } else {
      console.log('❌ Aucune réservation passée trouvée pour cet utilisateur !');
      console.log('   Cela explique pourquoi l\'onglet "Passées" est vide.\n');
    }

    // 4. Analyse par statut
    console.log('📊 Analyse par statut (toutes réservations):');
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM reservations
      WHERE reservation_date < $1
      GROUP BY status
      ORDER BY count DESC;
    `;

    const statusResult = await client.query(statusQuery, [today]);
    statusResult.rows.forEach(row => {
      console.log(`   • ${row.status}: ${row.count} réservations`);
    });

    console.log('\n✅ Analyse terminée !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

// Exécuter le script
findPastReservations();
