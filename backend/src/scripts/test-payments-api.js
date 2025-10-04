require('dotenv').config();
const { Sequelize } = require('sequelize');

// Importer le contrôleur des paiements
const paymentController = require('../controllers/payment.controller');

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

async function testPaymentsAPI() {
  try {
    console.log('=== TEST DIRECT DE L\'API DES PAIEMENTS ===');
    
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    
    // Simuler une requête HTTP pour tester le contrôleur
    const mockReq = {
      query: {}, // Pas de filtres pour commencer
      user: { 
        id: 'test-user-id',
        role: 'admin' 
      }
    };
    
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.responseData = data;
        return this;
      },
      statusCode: 200,
      responseData: null
    };
    
    console.log('\n🔍 Test du contrôleur getAllPayments...');
    
    // Appeler directement la méthode du contrôleur
    await paymentController.getAllPayments(mockReq, mockRes);
    
    console.log(`📊 Status Code: ${mockRes.statusCode}`);
    console.log('📋 Réponse du contrôleur:');
    console.log(JSON.stringify(mockRes.responseData, null, 2));
    
    if (mockRes.statusCode === 200 && mockRes.responseData) {
      const { payments, total } = mockRes.responseData;
      console.log(`\n✅ API fonctionne correctement !`);
      console.log(`   - Nombre de paiements: ${payments ? payments.length : 0}`);
      console.log(`   - Total: ${total || 'non défini'}`);
      
      if (payments && payments.length > 0) {
        console.log('\n🔍 Premier paiement:');
        console.log(`   - ID: ${payments[0].id}`);
        console.log(`   - Montant: ${payments[0].amount}`);
        console.log(`   - Méthode: ${payments[0].payment_method}`);
        console.log(`   - Statut: ${payments[0].payment_status}`);
      }
    } else {
      console.log('❌ L\'API a retourné une erreur');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de l\'API:', error);
  } finally {
    await sequelize.close();
  }
}

testPaymentsAPI();
