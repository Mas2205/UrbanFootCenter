const fs = require('fs');
const path = require('path');

// Chemins des fichiers à modifier
const routesPath = path.resolve(__dirname, '../routes/payment.routes.js');

console.log('=== CORRECTION DE L\'AUTHENTIFICATION POUR L\'API DE PAIEMENTS ADMIN ===');

// 1. Lire le fichier des routes
try {
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  
  // Trouver la route admin actuelle
  const currentRoute = routesContent.match(/router\.get\('\/admin\/all'.*?\);/s);
  if (currentRoute) {
    console.log('Route admin actuelle trouvée:');
    console.log(currentRoute[0]);
    
    // 1. Solution 1: Créer une route publique temporaire pour tester
    const updatedContent = routesContent.replace(
      /router\.get\('\/admin\/all', authMiddleware, adminMiddleware, asyncHandler\(paymentController\.getAllPayments\)\);/,
      `// Route admin avec authentification normale
router.get('/admin/all', authMiddleware, adminMiddleware, asyncHandler(paymentController.getAllPayments));

// Route publique temporaire pour tester (À SUPPRIMER EN PRODUCTION)
router.get('/admin/test', asyncHandler(paymentController.getAllPayments));`
    );
    
    if (updatedContent === routesContent) {
      console.log('⚠️ Aucune modification n\'a été appliquée. La route n\'a peut-être pas la structure attendue.');
    } else {
      // Écrire les modifications
      fs.writeFileSync(routesPath, updatedContent, 'utf8');
      console.log('✅ Route de test publique ajoutée avec succès!');
      console.log('Nouvelle route de test: GET /api/payments/admin/test');
      console.log('Cette route contourne l\'authentification pour tester si le problème vient de là.');
      console.log('⚠️ N\'OUBLIEZ PAS DE SUPPRIMER CETTE ROUTE EN PRODUCTION!');
    }
  } else {
    console.log('⚠️ Route admin non trouvée dans le fichier des routes.');
    
    // Vérifier si le fichier contient bien la section des routes admin
    if (routesContent.includes('Routes administrateur')) {
      console.log('Section "Routes administrateur" trouvée, mais la route spécifique est introuvable.');
      console.log('Vérifiez le format exact de la route dans le fichier:', routesPath);
    } else {
      console.log('Section "Routes administrateur" non trouvée.');
      console.log('Ajout manuel de la section et de la route requise...');
      
      // Ajouter la section des routes admin à la fin du fichier
      const adminRouteSection = `
/**
 * Routes administrateur
 */

/**
 * @route GET /api/payments/admin/all
 * @desc Récupérer tous les paiements (admin)
 * @access Private (Admin)
 */
router.get('/admin/all', authMiddleware, adminMiddleware, asyncHandler(paymentController.getAllPayments));

// Route publique temporaire pour tester (À SUPPRIMER EN PRODUCTION)
router.get('/admin/test', asyncHandler(paymentController.getAllPayments));

`;
      
      // Insérer avant module.exports
      const updatedContent = routesContent.replace(
        /module\.exports = router;/,
        `${adminRouteSection}module.exports = router;`
      );
      
      fs.writeFileSync(routesPath, updatedContent, 'utf8');
      console.log('✅ Section des routes admin et route de test ajoutées avec succès!');
    }
  }
  
  // Conseil pour la procédure de test
  console.log('\n=== COMMENT TESTER APRÈS REDÉMARRAGE DU SERVEUR ===');
  console.log('1. Essayez d\'abord la route publique: GET /api/payments/admin/test');
  console.log('   Si celle-ci fonctionne mais pas la route normale, le problème vient de l\'authentification');
  console.log('2. Si vous utilisez Postman ou un outil similaire, ajoutez un token JWT valide');
  console.log('   dans le header Authorization: Bearer <votre_token>');
  console.log('3. Vérifiez que votre utilisateur a bien le rôle "admin" ou "super_admin"');
  
} catch (error) {
  console.error('Erreur lors de la modification des routes:', error);
}
