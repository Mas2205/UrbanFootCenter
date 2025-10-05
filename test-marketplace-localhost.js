#!/usr/bin/env node

/**
 * Script de test du système marketplace en localhost
 * Usage: node test-marketplace-localhost.js
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_USER = {
  email: 'test-marketplace@example.com',
  password: 'TestMarketplace123!',
  first_name: 'Test',
  last_name: 'Marketplace'
};

let authToken = '';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Fonction utilitaire pour les requêtes API
async function apiRequest(method, endpoint, data = null, useAuth = true) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (useAuth && authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.message || err.message,
      status: err.response?.status
    };
  }
}

// 1. Test de connexion à l'API
async function testApiConnection() {
  info('Test de connexion à l\'API...');
  
  const result = await apiRequest('GET', '/', null, false);
  
  if (result.success) {
    success('API accessible');
    return true;
  } else {
    error(`API non accessible: ${result.error}`);
    return false;
  }
}

// 2. Test des services marketplace
async function testMarketplaceServices() {
  info('Test des services marketplace...');
  
  // Test PayDunya service
  try {
    const paydunyaService = require('./backend/src/services/paydunya.service');
    success('Service PayDunya chargé');
  } catch (err) {
    error(`Erreur service PayDunya: ${err.message}`);
    return false;
  }

  // Test Wave service
  try {
    const waveService = require('./backend/src/services/wave.service');
    success('Service Wave chargé');
  } catch (err) {
    error(`Erreur service Wave: ${err.message}`);
    return false;
  }

  return true;
}

// 3. Test d'authentification
async function testAuthentication() {
  info('Test d\'authentification...');
  
  // Essayer de se connecter avec un utilisateur existant
  const loginResult = await apiRequest('POST', '/auth/login', {
    email: 'admin@example.com',
    password: 'admin123'
  }, false);

  if (loginResult.success) {
    authToken = loginResult.data.data.token;
    success('Authentification réussie');
    return true;
  } else {
    warning('Connexion admin échouée, création d\'un utilisateur test...');
    
    // Créer un utilisateur test
    const registerResult = await apiRequest('POST', '/auth/register', TEST_USER, false);
    
    if (registerResult.success) {
      success('Utilisateur test créé');
      
      // Se connecter avec l'utilisateur test
      const loginTestResult = await apiRequest('POST', '/auth/login', {
        email: TEST_USER.email,
        password: TEST_USER.password
      }, false);
      
      if (loginTestResult.success) {
        authToken = loginTestResult.data.data.token;
        success('Connexion utilisateur test réussie');
        return true;
      }
    }
    
    error('Impossible de s\'authentifier');
    return false;
  }
}

// 4. Test des routes marketplace
async function testMarketplaceRoutes() {
  info('Test des routes marketplace...');
  
  // Test health check
  const healthResult = await apiRequest('GET', '/marketplace/health');
  
  if (healthResult.success) {
    success('Route health marketplace accessible');
    log(`Configuration: ${JSON.stringify(healthResult.data.data, null, 2)}`, 'cyan');
  } else {
    if (healthResult.status === 403) {
      warning('Route health nécessite des privilèges admin (normal)');
    } else {
      error(`Route health échouée: ${healthResult.error}`);
      return false;
    }
  }

  return true;
}

// 5. Test de création d'une réservation
async function testReservationCreation() {
  info('Test de création de réservation...');
  
  // D'abord, récupérer la liste des terrains
  const fieldsResult = await apiRequest('GET', '/fields');
  
  if (!fieldsResult.success) {
    error(`Impossible de récupérer les terrains: ${fieldsResult.error}`);
    return null;
  }

  const fields = fieldsResult.data.data;
  if (!fields || fields.length === 0) {
    warning('Aucun terrain disponible pour les tests');
    return null;
  }

  const testField = fields[0];
  success(`Terrain test sélectionné: ${testField.name}`);

  // Créer une réservation test
  const reservationData = {
    field_id: testField.id,
    reservation_date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    end_time: '15:00',
    total_price: testField.price_per_hour || 10000
  };

  const reservationResult = await apiRequest('POST', '/reservations', reservationData);
  
  if (reservationResult.success) {
    const reservation = reservationResult.data.data;
    success(`Réservation créée: ${reservation.id}`);
    return reservation;
  } else {
    error(`Erreur création réservation: ${reservationResult.error}`);
    return null;
  }
}

// 6. Test du checkout marketplace
async function testMarketplaceCheckout(reservation) {
  if (!reservation) {
    warning('Pas de réservation pour tester le checkout');
    return false;
  }

  info('Test du checkout marketplace...');
  
  const checkoutResult = await apiRequest('POST', '/marketplace/checkout', {
    reservation_id: reservation.id
  });

  if (checkoutResult.success) {
    const checkout = checkoutResult.data.data;
    success('Checkout marketplace créé');
    log(`Payment ID: ${checkout.payment_id}`, 'cyan');
    log(`Checkout URL: ${checkout.checkout_url}`, 'cyan');
    log(`Montant: ${checkout.amount} FCFA`, 'cyan');
    log(`Commission: ${checkout.platform_fee} FCFA`, 'cyan');
    log(`Net propriétaire: ${checkout.net_to_owner} FCFA`, 'cyan');
    
    return checkout;
  } else {
    error(`Erreur checkout: ${checkoutResult.error}`);
    return false;
  }
}

// 7. Test du statut de paiement
async function testPaymentStatus(checkout) {
  if (!checkout) {
    warning('Pas de checkout pour tester le statut');
    return false;
  }

  info('Test du statut de paiement...');
  
  const statusResult = await apiRequest('GET', `/marketplace/payment/${checkout.payment_id}/status`);

  if (statusResult.success) {
    const status = statusResult.data.data;
    success(`Statut paiement: ${status.status}`);
    log(`Référence: ${status.client_reference}`, 'cyan');
    return true;
  } else {
    error(`Erreur statut: ${statusResult.error}`);
    return false;
  }
}

// Fonction principale
async function runTests() {
  log('🧪 === TEST MARKETPLACE LOCALHOST ===', 'magenta');
  log('', 'reset');

  const tests = [
    { name: 'Connexion API', fn: testApiConnection },
    { name: 'Services Marketplace', fn: testMarketplaceServices },
    { name: 'Authentification', fn: testAuthentication },
    { name: 'Routes Marketplace', fn: testMarketplaceRoutes },
    { name: 'Création Réservation', fn: testReservationCreation },
  ];

  let reservation = null;
  let checkout = null;

  for (const test of tests) {
    try {
      log(`\n🔍 ${test.name}...`, 'yellow');
      const result = await test.fn();
      
      if (test.name === 'Création Réservation') {
        reservation = result;
      }
      
      if (!result && test.name !== 'Création Réservation') {
        error(`Test ${test.name} échoué - Arrêt des tests`);
        process.exit(1);
      }
    } catch (err) {
      error(`Erreur test ${test.name}: ${err.message}`);
      process.exit(1);
    }
  }

  // Tests avec réservation
  if (reservation) {
    try {
      log(`\n🔍 Checkout Marketplace...`, 'yellow');
      checkout = await testMarketplaceCheckout(reservation);
      
      if (checkout) {
        log(`\n🔍 Statut Paiement...`, 'yellow');
        await testPaymentStatus(checkout);
      }
    } catch (err) {
      error(`Erreur tests checkout: ${err.message}`);
    }
  }

  log('\n🎉 === TESTS TERMINÉS ===', 'magenta');
  log('', 'reset');
  
  if (checkout) {
    info('Pour tester le paiement complet:');
    log(`1. Ouvrez: ${checkout.checkout_url}`, 'cyan');
    log(`2. Effectuez un paiement test`, 'cyan');
    log(`3. Vérifiez les logs du webhook`, 'cyan');
  }
  
  success('Système marketplace prêt pour les tests !');
}

// Exécuter les tests
if (require.main === module) {
  runTests().catch(err => {
    error(`Erreur générale: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };
