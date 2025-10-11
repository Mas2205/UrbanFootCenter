const axios = require('axios');

async function testTournoiAPI() {
  try {
    console.log('🔐 Test de l\'API tournois...');

    // D'abord, se connecter pour obtenir un token
    console.log('📡 Connexion...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin_urban_seck@ex.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Échec de la connexion:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie');

    // Récupérer la liste des tournois
    console.log('📊 Récupération des tournois...');
    const tournoiResponse = await axios.get('http://localhost:5001/api/tournois', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (tournoiResponse.data && tournoiResponse.data.length > 0) {
      const tournoi = tournoiResponse.data[0];
      console.log('🏆 Premier tournoi trouvé:', tournoi.nom, 'ID:', tournoi.id);

      // Tester l'API getTournoiById
      console.log('🔍 Test getTournoiById...');
      const detailResponse = await axios.get(`http://localhost:5001/api/tournois/${tournoi.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📋 Réponse détail tournoi:');
      console.log('- Success:', detailResponse.data.success);
      console.log('- Nom:', detailResponse.data.data?.nom);
      console.log('- Participations:', detailResponse.data.data?.participations?.length || 0);
      
      if (detailResponse.data.data?.participations) {
        detailResponse.data.data.participations.forEach((p, i) => {
          console.log(`  ${i+1}. ${p.equipe?.nom || 'Équipe inconnue'} - ${p.statut}`);
        });
      }

    } else {
      console.log('⚠️ Aucun tournoi trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testTournoiAPI();
