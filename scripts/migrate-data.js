const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Configuration de l'ancienne base de données
const oldDB = new Sequelize({
  dialect: 'postgres', // ou 'mysql'
  host: 'ancien_host',
  port: 5432,
  database: 'ancienne_base',
  username: 'ancien_user',
  password: 'ancien_password'
});

// Configuration de la nouvelle base Railway
const newDB = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function migrateData() {
  try {
    console.log('🔄 Début de la migration...');

    // Test des connexions
    await oldDB.authenticate();
    await newDB.authenticate();
    console.log('✅ Connexions établies');

    // Migration des utilisateurs
    console.log('👥 Migration des utilisateurs...');
    const [oldUsers] = await oldDB.query('SELECT * FROM users');
    
    for (const user of oldUsers) {
      await newDB.query(`
        INSERT INTO users (id, email, password, first_name, last_name, phone, created_at, updated_at)
        VALUES (:id, :email, :password, :first_name, :last_name, :phone, :created_at, :updated_at)
        ON CONFLICT (id) DO NOTHING
      `, {
        replacements: {
          id: user.id,
          email: user.email,
          password: user.password,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      });
    }
    console.log(`✅ ${oldUsers.length} utilisateurs migrés`);

    // Migration des terrains
    console.log('⚽ Migration des terrains...');
    const [oldFields] = await oldDB.query('SELECT * FROM fields');
    
    for (const field of oldFields) {
      await newDB.query(`
        INSERT INTO fields (id, name, description, size, surface_type, price_per_hour, location, equipment_fee, indoor, is_active, created_at, updated_at)
        VALUES (:id, :name, :description, :size, :surface_type, :price_per_hour, :location, :equipment_fee, :indoor, :is_active, :created_at, :updated_at)
        ON CONFLICT (id) DO NOTHING
      `, {
        replacements: {
          id: field.id,
          name: field.name,
          description: field.description,
          size: field.size,
          surface_type: field.surface_type,
          price_per_hour: field.price_per_hour,
          location: field.location,
          equipment_fee: field.equipment_fee,
          indoor: field.indoor,
          is_active: field.is_active,
          created_at: field.created_at,
          updated_at: field.updated_at
        }
      });
    }
    console.log(`✅ ${oldFields.length} terrains migrés`);

    // Migration des réservations
    console.log('📅 Migration des réservations...');
    const [oldReservations] = await oldDB.query('SELECT * FROM reservations');
    
    for (const reservation of oldReservations) {
      await newDB.query(`
        INSERT INTO reservations (id, user_id, field_id, start_time, end_time, total_price, status, created_at, updated_at)
        VALUES (:id, :user_id, :field_id, :start_time, :end_time, :total_price, :status, :created_at, :updated_at)
        ON CONFLICT (id) DO NOTHING
      `, {
        replacements: {
          id: reservation.id,
          user_id: reservation.user_id,
          field_id: reservation.field_id,
          start_time: reservation.start_time,
          end_time: reservation.end_time,
          total_price: reservation.total_price,
          status: reservation.status,
          created_at: reservation.created_at,
          updated_at: reservation.updated_at
        }
      });
    }
    console.log(`✅ ${oldReservations.length} réservations migrées`);

    console.log('🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await oldDB.close();
    await newDB.close();
  }
}

// Exécuter la migration
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
