const axios = require('axios');

// Configuration corrigée avec le bon port (5001)
const API_BASE_URL = 'http://localhost:5001/api';
const ROUTES = {
  protectedRoute: `${API_BASE_URL}/payments/admin/all`,
  publicRoute: `${API_BASE_URL}/payments/admin/test`
};

// Tests
async function testPaymentAPI() {
  console.log('=== TEST DES ROUTES DE PAIEMENTS ADMIN ===');
  console.log('Port corrigé: 5001');
  
  // 1. Tester la route publique (sans authentification)
  console.log('\n1. Test de la route publique:');
  try {
    const publicResponse = await axios.get(ROUTES.publicRoute);
    console.log(`✅ Route publique: ${ROUTES.publicRoute}`);
    console.log(`✅ Statut: ${publicResponse.status}`);
    console.log(`✅ Structure de la réponse:`);
    console.log(`   - success: ${publicResponse.data.success}`);
    console.log(`   - payments: ${Array.isArray(publicResponse.data.payments) ? 'Array' : 'N/A'}`);
    console.log(`   - total: ${publicResponse.data.total}`);
    
    // Afficher quelques paiements s'ils existent
    if (publicResponse.data.payments && publicResponse.data.payments.length > 0) {
      console.log(`✅ Nombre de paiements: ${publicResponse.data.payments.length}`);
      console.log('   Exemple de paiement:');
      console.log(JSON.stringify(publicResponse.data.payments[0], null, 2).substring(0, 300) + '...');
    } else {
      console.log('⚠️ Aucun paiement trouvé dans la réponse.');
    }
  } catch (error) {
    console.error(`❌ Erreur avec la route publique: ${error.message}`);
    if (error.response) {
      console.error(`   Statut: ${error.response.status}`);
      console.error(`   Réponse: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  // 2. Tester la route protégée (sans token, devrait échouer)
  console.log('\n2. Test de la route protégée (sans token):');
  try {
    const protectedResponse = await axios.get(ROUTES.protectedRoute);
    console.log(`⚠️ Route protégée: ${ROUTES.protectedRoute}`);
    console.log(`⚠️ Statut: ${protectedResponse.status} (devrait échouer avec 401 ou 403)`);
    console.log(`⚠️ Réponse inattendue: ${JSON.stringify(protectedResponse.data, null, 2)}`);
  } catch (error) {
    console.log(`✅ Route protégée: ${ROUTES.protectedRoute}`);
    console.log(`✅ Statut: ${error.response?.status} (401 ou 403 attendu)`);
    console.log(`✅ Message: ${error.response?.data?.message || error.message}`);
  }
  
  console.log('\n=== RÉSUMÉ ===');
  console.log('Si la route publique fonctionne mais pas la route protégée,');
  console.log('cela confirme que le problème est lié à l\'authentification.');
  console.log('\nPour corriger le problème dans le frontend:');
  console.log('1. Assurez-vous que l\'utilisateur est connecté et a un token JWT valide');
  console.log('2. Vérifiez que le token est correctement stocké et envoyé avec les requêtes');
  console.log('3. Vérifiez que l\'utilisateur connecté a bien le rôle "admin" ou "super_admin"');
}

// Exécuter les tests
testPaymentAPI().catch(error => {
  console.error('Erreur globale:', error);
});
