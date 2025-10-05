const { sequelize } = require('./src/config/database');
const { Reservation, Field, User, Payment } = require('./src/models');
const { Op } = require('sequelize');

/**
 * Script pour trouver et analyser les réservations passées
 */
async function findPastReservations() {
  try {
    console.log('🔍 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie\n');

    // Date d'aujourd'hui à 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('📅 Date de référence (aujourd\'hui):', today.toISOString().split('T')[0]);
    console.log('📅 Timestamp:', today.toISOString());
    console.log('');

    // 1. Toutes les réservations passées
    console.log('🔍 Recherche de toutes les réservations passées...');
    const allPastReservations = await Reservation.findAll({
      where: {
        reservation_date: {
          [Op.lt]: today
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name']
        }
      ],
      order: [['reservation_date', 'DESC'], ['start_time', 'ASC']]
    });

    console.log(`📊 Total des réservations passées: ${allPastReservations.length}\n`);

    // 2. Réservations passées par statut
    console.log('📊 Analyse par statut:');
    const statusCounts = {};
    allPastReservations.forEach(res => {
      statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   • ${status}: ${count} réservations`);
    });
    console.log('');

    // 3. Réservations passées non annulées (celles qui devraient apparaître dans "Passées")
    console.log('🎯 Réservations passées non annulées (pour onglet "Passées"):');
    const pastNotCancelled = allPastReservations.filter(res => res.status !== 'cancelled');
    console.log(`📊 Nombre: ${pastNotCancelled.length}\n`);

    if (pastNotCancelled.length > 0) {
      console.log('📋 Liste détaillée:');
      pastNotCancelled.forEach((res, index) => {
        console.log(`${index + 1}. ${res.reservation_date} ${res.start_time} - ${res.field?.name || 'Terrain inconnu'}`);
        console.log(`   User: ${res.user?.first_name} ${res.user?.last_name} (${res.user?.email})`);
        console.log(`   Status: ${res.status} | Payment: ${res.payment_status}`);
        console.log(`   ID: ${res.id}`);
        console.log('');
      });
    }

    // 4. Test spécifique pour l'utilisateur client1
    const userId = 'd7a1b392-f061-48f6-bfc6-41879638fc60';
    console.log(`🔍 Réservations passées pour l'utilisateur ${userId}:`);
    
    const userPastReservations = await Reservation.findAll({
      where: {
        user_id: userId,
        reservation_date: {
          [Op.lt]: today
        },
        status: {
          [Op.notIn]: ['cancelled']
        }
      },
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name', 'image_url']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'payment_method', 'payment_status']
        }
      ],
      order: [['reservation_date', 'DESC'], ['start_time', 'ASC']]
    });

    console.log(`📊 Nombre pour cet utilisateur: ${userPastReservations.length}`);
    
    if (userPastReservations.length > 0) {
      console.log('📋 Détails:');
      userPastReservations.forEach((res, index) => {
        console.log(`${index + 1}. ${res.reservation_date} ${res.start_time} - ${res.field?.name}`);
        console.log(`   Status: ${res.status} | Payment: ${res.payment_status}`);
        console.log(`   Prix: ${res.total_price} FCFA`);
        console.log('');
      });
    }

    // 5. Requête SQL brute pour comparaison
    console.log('🔍 Vérification avec requête SQL brute:');
    const [rawResults] = await sequelize.query(`
      SELECT 
        r.id,
        r.reservation_date,
        r.start_time,
        r.status,
        r.payment_status,
        u.first_name,
        u.last_name,
        f.name as field_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN fields f ON r.field_id = f.id
      WHERE r.user_id = '${userId}'
        AND r.reservation_date < '${today.toISOString().split('T')[0]}'
        AND r.status != 'cancelled'
      ORDER BY r.reservation_date DESC, r.start_time ASC;
    `);

    console.log(`📊 Résultats SQL bruts: ${rawResults.length}`);
    rawResults.forEach((res, index) => {
      console.log(`${index + 1}. ${res.reservation_date} ${res.start_time} - ${res.field_name}`);
      console.log(`   Status: ${res.status} | Payment: ${res.payment_status}`);
    });

    console.log('\n✅ Analyse terminée !');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  findPastReservations();
}

module.exports = { findPastReservations };
