const { Sequelize } = require('sequelize');
const fs = require('fs');
const csv = require('csv-parser');

// Configuration Railway
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function importCSV(tableName, csvFilePath) {
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          console.log(`📊 Import de ${results.length} lignes dans ${tableName}...`);
          
          for (const row of results) {
            // Adapter selon votre structure
            if (tableName === 'users') {
              await sequelize.query(`
                INSERT INTO users (email, first_name, last_name, phone, password)
                VALUES (:email, :first_name, :last_name, :phone, :password)
                ON CONFLICT (email) DO NOTHING
              `, {
                replacements: row
              });
            } else if (tableName === 'fields') {
              await sequelize.query(`
                INSERT INTO fields (name, description, size, surface_type, price_per_hour, location)
                VALUES (:name, :description, :size, :surface_type, :price_per_hour, :location)
              `, {
                replacements: row
              });
            }
          }
          
          console.log(`✅ Import terminé pour ${tableName}`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
}

// Utilisation
async function runImport() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à Railway établie');
    
    // Importez vos fichiers CSV
    await importCSV('users', './data/users.csv');
    await importCSV('fields', './data/fields.csv');
    // await importCSV('reservations', './data/reservations.csv');
    
    console.log('🎉 Import terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  runImport();
}

module.exports = { importCSV };
