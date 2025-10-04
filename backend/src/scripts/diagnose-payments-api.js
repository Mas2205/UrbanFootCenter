const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Chemins des fichiers à vérifier
const backendControllerPath = path.resolve(__dirname, '../controllers/payment.controller.js');
const frontendApiPath = path.resolve(__dirname, '../../../frontend/src/services/api/paymentAPI.ts');
const frontendAdminApiPath = path.resolve(__dirname, '../../../frontend/src/services/api/adminAPI.ts');
const adminComponentPath = path.resolve(__dirname, '../../../frontend/src/components/admin/payments/AdminPayments.tsx');

console.log('=== DIAGNOSTIC COMPLET DE L\'API DE PAIEMENTS ===');

// 1. Vérifier l'instanciation de l'API dans le frontend
try {
  const adminPaymentsContent = fs.readFileSync(adminComponentPath, 'utf8');
  console.log('\n1. VÉRIFICATION DU COMPOSANT ADMIN PAYMENTS:');
  
  // Vérifier comment l'API est appelée
  const apiCall = adminPaymentsContent.match(/const response = await \(.*?\)\.admin\.getPayments\(\)/);
  if (apiCall) {
    console.log(`✅ Appel API détecté: ${apiCall[0]}`);
  } else {
    console.log('❌ Appel API non trouvé ou au format incorrect');
  }
  
  // Vérifier comment les données sont extraites
  const dataExtraction = adminPaymentsContent.match(/setPayments\((.*?)\)/);
  if (dataExtraction) {
    console.log(`✅ Extraction des données: ${dataExtraction[0]}`);
  } else {
    console.log('❌ Extraction des données non trouvée');
  }
} catch (error) {
  console.error(`Erreur lors de l'analyse du composant AdminPayments: ${error.message}`);
}

// 2. Vérifier les routes dans le frontend
try {
  const adminApiContent = fs.readFileSync(frontendAdminApiPath, 'utf8');
  console.log('\n2. VÉRIFICATION DE L\'API ADMIN DU FRONTEND:');
  
  // Vérifier l'URL utilisée
  const apiUrlMatch = adminApiContent.match(/await axios\.get\(`\${API_BASE_URL}\/payments\/admin\/all`/);
  if (apiUrlMatch) {
    console.log('✅ Route API correcte: /payments/admin/all');
  } else {
    console.log('❌ Route API incorrecte ou non trouvée');
    console.log('   Recherche de routes alternatives...');
    
    const anyApiUrlMatch = adminApiContent.match(/await axios\.get\(`\${API_BASE_URL}\/([^`]+)`.*?getPayments/);
    if (anyApiUrlMatch) {
      console.log(`   Route trouvée: ${anyApiUrlMatch[1]}`);
    }
  }
} catch (error) {
  console.error(`Erreur lors de l'analyse du fichier adminAPI: ${error.message}`);
}

// 3. Vérifier le contrôleur backend
try {
  const controllerContent = fs.readFileSync(backendControllerPath, 'utf8');
  console.log('\n3. VÉRIFICATION DU CONTRÔLEUR BACKEND:');
  
  // Vérifier l'utilisation de payment_date au lieu de created_at
  const paymentDateMatches = (controllerContent.match(/payment_date/g) || []).length;
  const createdAtMatches = (controllerContent.match(/created_at/g) || []).length;
  
  console.log(`✅ Références à payment_date: ${paymentDateMatches}`);
  console.log(`❗ Références à created_at: ${createdAtMatches}`);
  
  if (createdAtMatches > 0) {
    console.log('⚠️ ATTENTION: Il reste des références à created_at dans le contrôleur!');
  }
  
  // Vérifier le format de réponse
  const responseFormatMatch = controllerContent.match(/payments: payments.*?total: count/s);
  if (responseFormatMatch) {
    console.log('✅ Format de réponse correct: { payments: [...], total: ... }');
  } else {
    console.log('❌ Format de réponse incorrect ou non trouvé');
  }
} catch (error) {
  console.error(`Erreur lors de l'analyse du contrôleur: ${error.message}`);
}

// 4. Vérifier l'instanciation de l'API dans le frontend
try {
  const apiIndexPath = path.resolve(__dirname, '../../../frontend/src/services/api/index.ts');
  if (fs.existsSync(apiIndexPath)) {
    const apiIndexContent = fs.readFileSync(apiIndexPath, 'utf8');
    console.log('\n4. VÉRIFICATION DE L\'INSTANCIATION DE L\'API:');
    
    // Vérifier si adminAPI est correctement instancié
    const adminApiInstance = apiIndexContent.match(/api\.admin = adminAPI/);
    if (adminApiInstance) {
      console.log('✅ adminAPI correctement instancié');
    } else {
      console.log('❌ adminAPI incorrectement ou non instancié');
    }
  }
} catch (error) {
  console.error(`Erreur lors de l'analyse de l'instanciation de l'API: ${error.message}`);
}

// 5. Suggestions de résolution
console.log('\n5. SUGGESTIONS DE RÉSOLUTION:');
console.log('1. Assurez-vous que les serveurs frontend et backend ont été redémarrés');
console.log('2. Vérifiez les logs du serveur backend pour détecter des erreurs SQL');
console.log('3. Essayez d\'appeler directement l\'API avec curl ou Postman:');
console.log('   curl -X GET "http://localhost:5000/api/payments/admin/all"');
console.log('4. Vérifiez si le composant AdminPayments utilise correctement l\'API admin');
console.log('5. Vérifiez le format de la réponse API pour assurer la compatibilité frontend/backend');

// 6. Exécuter une requête curl pour tester l'API directement
console.log('\n6. TEST DE L\'API AVEC CURL:');
try {
  // Déterminer le port du backend à partir du package.json ou utiliser la valeur par défaut 5000
  let backendPort = 5000;
  const packageJsonPath = path.resolve(__dirname, '../../../backend/package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.scripts && packageJson.scripts.start) {
      const portMatch = packageJson.scripts.start.match(/PORT=(\d+)/);
      if (portMatch) {
        backendPort = portMatch[1];
      }
    }
  }
  
  console.log(`Tentative d'appel à l'API sur le port ${backendPort}...`);
  try {
    const curlResult = execSync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${backendPort}/api/payments/admin/all`, { timeout: 5000 }).toString().trim();
    console.log(`✅ Test API: Code de réponse ${curlResult}`);
  } catch (error) {
    console.log(`❌ Échec du test API: ${error.message}`);
    console.log('   Le serveur backend est-il démarré?');
  }
} catch (error) {
  console.error(`Erreur lors du test de l'API: ${error.message}`);
}

console.log('\n=== FIN DU DIAGNOSTIC ===');
console.log('Redémarrez les deux serveurs puis réessayez d\'accéder à la page des paiements');
