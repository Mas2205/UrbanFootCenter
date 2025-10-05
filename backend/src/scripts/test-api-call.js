const axios = require('axios');

async function testApiCall() {
  try {
    console.log('🔄 Test d\'appel API pour créer une réservation...');
    
    // Données de test (similaires à celles des logs)
    const reservationData = {
      field_id: 'a727274a-4068-414d-a2d6-0970697c2cdb',
      time_slot_id: 'd0c622f6-c57a-4ba3-83ae-58bf2bb66be4',
      reservation_date: '2025-10-19', // Nouvelle date pour éviter les conflits
      start_time: '19:00-20:00',
      equipment_rental: false,
      payment_method: 'cash',
      promo_code: null
    };
    
    console.log('📤 Données envoyées:', reservationData);
    
    // Appel à l'API (vous devrez remplacer le token par un vrai token)
    const response = await axios.post(
      'http://localhost:5001/api/reservations/with-payment',
      reservationData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE' // Remplacez par un vrai token
        }
      }
    );
    
    console.log('✅ Réponse reçue:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'appel API:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Pas de réponse reçue:', error.request);
    } else {
      console.error('Erreur de configuration:', error.message);
    }
  }
}

// Note: Ce script nécessite un token d'authentification valide
console.log('⚠️  ATTENTION: Ce script nécessite un token d\'authentification valide');
console.log('   Vous devez remplacer YOUR_TOKEN_HERE par un vrai token JWT');
console.log('   Ou utiliser directement le frontend pour tester');

// testApiCall();
