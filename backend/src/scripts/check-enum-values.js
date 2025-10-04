require('dotenv').config();
const { Sequelize } = require('sequelize');

// Créer une connexion Sequelize avec la configuration correcte
const sequelize = new Sequelize(
  process.env.DB_NAME || 'urban_foot_center',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function checkEnumValues() {
  try {
    console.log('=== VÉRIFICATION DES VALEURS D\'ÉNUMÉRATION ===');
    
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérifier les valeurs d'énumération pour les réservations
    console.log('\n📋 Valeurs d\'énumération pour reservations.status:');
    const [reservationStatuses] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_reservations_status)) AS status_value;
    `);
    
    reservationStatuses.forEach(status => {
      console.log(`  - ${status.status_value}`);
    });
    
    console.log('\n📋 Valeurs d\'énumération pour reservations.payment_status:');
    const [paymentStatuses] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_reservations_payment_status)) AS payment_status_value;
    `);
    
    paymentStatuses.forEach(status => {
      console.log(`  - ${status.payment_status_value}`);
    });
    
    // Vérifier les valeurs d'énumération pour les paiements
    console.log('\n📋 Valeurs d\'énumération pour payments.payment_status:');
    const [paymentsStatuses] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_payments_payment_status)) AS payment_status_value;
    `);
    
    paymentsStatuses.forEach(status => {
      console.log(`  - ${status.payment_status_value}`);
    });
    
    // Vérifier les valeurs d'énumération pour les utilisateurs
    console.log('\n📋 Valeurs d\'énumération pour users.role:');
    const [userRoles] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_users_role)) AS role_value;
    `);
    
    userRoles.forEach(role => {
      console.log(`  - ${role.role_value}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des énumérations:', error);
  } finally {
    await sequelize.close();
  }
}

checkEnumValues();
