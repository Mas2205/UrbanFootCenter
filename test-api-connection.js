const axios = require('axios');

async function testAPIConnection() {
  try {
    console.log('🔍 Test de connexion à l\'API...');
    
    // Test de l'endpoint fields
    const response = await axios.get('http://localhost:5001/api/fields');
    
    console.log('✅ Connexion réussie !');
    console.log(`📊 Nombre de terrains: ${response.data.count}`);
    console.log('🏟️  Terrains disponibles:');
    
    response.data.data.forEach((field, index) => {
      console.log(`   ${index + 1}. ${field.name} - ${field.location} (${field.price_per_hour} FCFA/h)`);
    });
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    if (error.response) {
      console.error('📄 Statut:', error.response.status);
      console.error('📝 Données:', error.response.data);
    }
  }
}

testAPIConnection();
