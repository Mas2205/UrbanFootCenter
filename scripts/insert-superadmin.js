const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration Railway PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function insertSuperAdmin() {
  try {
    console.log('🔄 Connexion à Railway PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Connexion établie');

    console.log('👤 Insertion du Super Admin...');
    
    const result = await sequelize.query(`
      INSERT INTO users (
        id, 
        email, 
        phone_number, 
        password_hash, 
        first_name, 
        last_name, 
        role, 
        created_at, 
        updated_at, 
        last_login, 
        is_active
      ) VALUES (
        :id,
        :email,
        :phone_number,
        :password_hash,
        :first_name,
        :last_name,
        :role,
        :created_at,
        :updated_at,
        :last_login,
        :is_active
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone_number = EXCLUDED.phone_number,
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        updated_at = EXCLUDED.updated_at,
        last_login = EXCLUDED.last_login,
        is_active = EXCLUDED.is_active
    `, {
      replacements: {
        id: 'e6941a7d-6c11-401d-a9ba-b412ce59344e',
        email: 'superadmin@urbanfootcenter.com',
        phone_number: '+221777777777',
        password_hash: '$2a$10$euC8EDHGyoSm9QNAVw5h9erW30VFxn4htknzFWgDgWhDcSLdgdzS6',
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin',
        created_at: '2025-07-16 22:41:41.821+02',
        updated_at: '2025-09-20 20:45:58.232+02',
        last_login: '2025-09-20 20:45:58.231+02',
        is_active: true
      }
    });

    console.log('✅ Super Admin inséré avec succès !');
    console.log('📧 Email: superadmin@urbanfootcenter.com');
    console.log('📱 Téléphone: +221777777777');
    console.log('🔑 Rôle: super_admin');
    console.log('🆔 ID: e6941a7d-6c11-401d-a9ba-b412ce59344e');

    // Vérification
    const [users] = await sequelize.query(`
      SELECT id, email, first_name, last_name, role, is_active 
      FROM users 
      WHERE email = 'superadmin@urbanfootcenter.com'
    `);

    if (users.length > 0) {
      console.log('✅ Vérification réussie - Utilisateur trouvé:');
      console.log(users[0]);
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('ℹ️  L\'utilisateur existe déjà, tentative de mise à jour...');
    }
  } finally {
    await sequelize.close();
    console.log('🔒 Connexion fermée');
  }
}

// Exécuter l'insertion
if (require.main === module) {
  insertSuperAdmin();
}

module.exports = { insertSuperAdmin };
