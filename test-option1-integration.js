#!/usr/bin/env node

/**
 * Script de test pour l'intégration OPTION 1 - Interface marketplace complète
 * Usage: node test-option1-integration.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5001/api';
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

// 1. Test d'authentification
async function testAuthentication() {
  info('Test d\'authentification admin...');
  
  const loginResult = await apiRequest('POST', '/auth/login', {
    email: 'admin@example.com',
    password: 'admin123'
  }, false);

  if (loginResult.success) {
    authToken = loginResult.data.data.token;
    success('Authentification admin réussie');
    return true;
  } else {
    error(`Authentification échouée: ${loginResult.error}`);
    return false;
  }
}

// 2. Test des routes marketplace
async function testMarketplaceRoutes() {
  info('Test des routes marketplace...');
  
  // Test health check
  const healthResult = await apiRequest('GET', '/marketplace/health');
  
  if (healthResult.success) {
    success('Route marketplace/health accessible');
    log(`Configuration: ${JSON.stringify(healthResult.data.data, null, 2)}`, 'cyan');
    return true;
  } else {
    if (healthResult.status === 403) {
      warning('Route health nécessite des privilèges admin (normal)');
      return true;
    } else {
      error(`Route health échouée: ${healthResult.error}`);
      return false;
    }
  }
}

// 3. Test création moyen de paiement traditionnel
async function testTraditionalPaymentMethod() {
  info('Test création moyen de paiement traditionnel...');
  
  const traditionalData = {
    field_id: 'test-field-id', // À adapter selon votre terrain
    payment_type: 'wave',
    api_url: 'https://api.wave.com/test',
    api_key: 'test_api_key',
    api_secret: 'test_secret',
    merchant_id: 'test_merchant',
    mode: 'traditional'
  };

  const result = await apiRequest('POST', '/payment-methods', traditionalData);
  
  if (result.success) {
    success('Moyen de paiement traditionnel créé');
    log(`ID: ${result.data.data.id}`, 'cyan');
    return result.data.data;
  } else {
    warning(`Création traditionnelle: ${result.error}`);
    return null;
  }
}

// 4. Test création marketplace digital
async function testMarketplacePaymentMethod() {
  info('Test création marketplace digital...');
  
  const marketplaceData = {
    field_id: 'test-field-id', // À adapter selon votre terrain
    payment_type: 'marketplace_digital',
    mode: 'marketplace',
    owner_payout_channel: 'wave',
    owner_mobile_e164: '+221771234567',
    commission_rate_bps: 1000
  };

  const result = await apiRequest('POST', '/payment-methods', marketplaceData);
  
  if (result.success) {
    success('Marketplace digital configuré');
    log(`Configuration: ${JSON.stringify(result.data.data.configuration, null, 2)}`, 'cyan');
    return result.data.data;
  } else {
    error(`Création marketplace: ${result.error}`);
    return null;
  }
}

// 5. Test récupération moyens de paiement
async function testGetPaymentMethods() {
  info('Test récupération moyens de paiement...');
  
  const result = await apiRequest('GET', '/payment-methods');
  
  if (result.success) {
    const methods = result.data.data;
    success(`${methods.length} moyens de paiement récupérés`);
    
    methods.forEach((method, index) => {
      log(`${index + 1}. ${method.payment_type} - ${method.field?.name || 'N/A'}`, 'cyan');
      if (method.payment_type === 'marketplace_digital') {
        log(`   📱 Mobile: ${method.configuration?.owner_mobile_e164 || 'N/A'}`, 'cyan');
        log(`   💰 Commission: ${(method.configuration?.commission_rate_bps || 0) / 100}%`, 'cyan');
      }
    });
    
    return methods;
  } else {
    error(`Récupération échouée: ${result.error}`);
    return [];
  }
}

// 6. Test création checkout marketplace
async function testMarketplaceCheckout() {
  info('Test création checkout marketplace...');
  
  // D'abord créer une réservation test
  const reservationData = {
    field_id: 'test-field-id',
    reservation_date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    end_time: '15:00',
    total_price: 10000
  };

  const reservationResult = await apiRequest('POST', '/reservations', reservationData);
  
  if (!reservationResult.success) {
    warning('Impossible de créer réservation test pour checkout');
    return false;
  }

  const reservation = reservationResult.data.data;
  success(`Réservation test créée: ${reservation.id}`);

  // Tester le checkout marketplace
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
    return checkout;
  } else {
    error(`Checkout échoué: ${checkoutResult.error}`);
    return null;
  }
}

// Fonction principale
async function runIntegrationTests() {
  log('🧪 === TEST INTÉGRATION OPTION 1 ===', 'magenta');
  log('Interface marketplace complète avec 2 modes', 'magenta');
  log('', 'reset');

  const tests = [
    { name: 'Authentification', fn: testAuthentication },
    { name: 'Routes Marketplace', fn: testMarketplaceRoutes },
    { name: 'Paiement Traditionnel', fn: testTraditionalPaymentMethod },
    { name: 'Marketplace Digital', fn: testMarketplacePaymentMethod },
    { name: 'Liste Moyens Paiement', fn: testGetPaymentMethods },
    { name: 'Checkout Marketplace', fn: testMarketplaceCheckout }
  ];

  let results = [];

  for (const test of tests) {
    try {
      log(`\n🔍 ${test.name}...`, 'yellow');
      const result = await test.fn();
      results.push({ name: test.name, success: !!result, result });
      
      if (!result && test.name === 'Authentification') {
        error('Test authentification échoué - Arrêt des tests');
        break;
      }
    } catch (err) {
      error(`Erreur test ${test.name}: ${err.message}`);
      results.push({ name: test.name, success: false, error: err.message });
    }
  }

  // Résumé
  log('\n📊 === RÉSUMÉ DES TESTS ===', 'magenta');
  results.forEach(result => {
    if (result.success) {
      success(`${result.name}: RÉUSSI`);
    } else {
      error(`${result.name}: ÉCHOUÉ`);
    }
  });

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  log(`\n🎯 Résultat: ${successCount}/${totalCount} tests réussis`, 
      successCount === totalCount ? 'green' : 'yellow');

  if (successCount === totalCount) {
    success('🎉 OPTION 1 prête pour utilisation !');
    log('\n📋 Prochaines étapes:', 'blue');
    log('1. Remplacez votre modal actuel par PaymentModalUpgrade', 'cyan');
    log('2. Configurez vos clés PayDunya et Wave', 'cyan');
    log('3. Testez en interface utilisateur', 'cyan');
  } else {
    warning('⚠️  Certains tests ont échoué - Vérifiez la configuration');
  }
}

// Exécuter les tests
if (require.main === module) {
  runIntegrationTests().catch(err => {
    error(`Erreur générale: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { runIntegrationTests };
