const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fichiers à analyser
const appPath = path.resolve(__dirname, '../app.js');
const routesPath = path.resolve(__dirname, '../routes/payment.routes.js');
const mainServerPath = path.resolve(__dirname, '../../server.js');

console.log('=== ANALYSE COMPLÈTE DE LA CONFIGURATION DES ROUTES ET DES MIDDLEWARES ===');

// Vérifier si un middleware global d'authentification pourrait bloquer toutes les routes
try {
  console.log('\n1. ANALYSE DU FICHIER APP.JS:');
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  // Rechercher les déclarations globales de middlewares
  const authMiddlewareGlobal = appContent.match(/app\.use\(.*auth.*middleware.*\)/gi);
  if (authMiddlewareGlobal && authMiddlewareGlobal.length > 0) {
    console.log('⚠️ Middleware d\'authentification global détecté:');
    authMiddlewareGlobal.forEach(middleware => {
      console.log(`   ${middleware}`);
    });
    
    // Créer une copie de sauvegarde avant modification
    fs.copyFileSync(appPath, `${appPath}.bak`);
    console.log('✅ Fichier app.js sauvegardé: app.js.bak');
    
    // Modification du fichier: commenter le middleware global d'authentification
    let updatedContent = appContent;
    authMiddlewareGlobal.forEach(middleware => {
      updatedContent = updatedContent.replace(
        middleware, 
        `// COMMENTÉ TEMPORAIREMENT POUR DEBUGGER: ${middleware}`
      );
    });
    
    // Écrire les modifications
    if (updatedContent !== appContent) {
      fs.writeFileSync(appPath, updatedContent, 'utf8');
      console.log('✅ Middleware d\'authentification global commenté temporairement');
    }
  } else {
    console.log('✅ Aucun middleware d\'authentification global détecté');
  }
  
  // Vérifier comment les routes de paiement sont montées
  const paymentRoutesMount = appContent.match(/app\.use\(['"]\/api\/payments.*?,.*?paymentRoutes.*?\)/);
  if (paymentRoutesMount) {
    console.log(`✅ Routes de paiement montées correctement: ${paymentRoutesMount[0]}`);
  } else {
    console.log('⚠️ Routes de paiement non trouvées dans app.js');
  }
} catch (error) {
  console.error(`Erreur lors de l'analyse de app.js: ${error.message}`);
}

// Ajouter une route de test simple sans aucune authentification
try {
  console.log('\n2. AJOUT D\'UNE ROUTE DE TEST SIMPLE DANS APP.JS:');
  
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  // Vérifier si la route de test existe déjà
  if (appContent.includes('/api/test-no-auth')) {
    console.log('✅ Route de test sans authentification déjà présente');
  } else {
    // Ajouter une route simple pour tester
    const routeTestCode = `
// Route de test sans authentification (TEMPORAIRE POUR DEBUGGER)
app.get('/api/test-no-auth', (req, res) => {
  res.json({
    success: true,
    message: 'Cette route fonctionne sans authentification',
    timestamp: new Date().toISOString()
  });
});
`;
    
    // Insérer la route de test avant le montage des routes de l'API
    const updatedContent = appContent.replace(
      /\/\/ Montage des routes de l'API/,
      `${routeTestCode}\n// Montage des routes de l'API`
    );
    
    // Écrire les modifications
    fs.writeFileSync(appPath, updatedContent, 'utf8');
    console.log('✅ Route de test sans authentification ajoutée: GET /api/test-no-auth');
  }
} catch (error) {
  console.error(`Erreur lors de l'ajout de la route de test: ${error.message}`);
}

// Vérifier la configuration du CORS
try {
  console.log('\n3. ANALYSE DE LA CONFIGURATION CORS:');
  
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  // Rechercher la configuration CORS
  const corsConfig = appContent.match(/app\.use\(cors\((.*?)\)\)/s);
  if (corsConfig) {
    console.log('✅ Configuration CORS trouvée:');
    console.log(corsConfig[0]);
  } else {
    console.log('⚠️ Configuration CORS non trouvée ou dans un format différent');
    
    // Vérifier si cors est simplement utilisé sans configuration
    const simpleCors = appContent.match(/app\.use\(cors\(\)\)/);
    if (simpleCors) {
      console.log('✅ CORS configuré avec les options par défaut:', simpleCors[0]);
    }
  }
} catch (error) {
  console.error(`Erreur lors de l'analyse de la configuration CORS: ${error.message}`);
}

console.log('\n=== RECOMMANDATIONS ===');
console.log('1. Redémarrez le serveur backend pour appliquer les changements');
console.log('2. Testez la route simple sans authentification: GET /api/test-no-auth');
console.log('3. Si cette route fonctionne, cela confirme que le problème est lié à l\'authentification');
console.log('4. Vérifiez ensuite pourquoi toutes les routes sont bloquées malgré une tentative de contournement');

console.log('\n=== POUR TESTER LA ROUTE SIMPLE ===');
console.log('curl http://localhost:5000/api/test-no-auth');
