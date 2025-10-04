const fs = require('fs');
const path = require('path');

// Chemin du fichier constants.ts
const constantsFilePath = path.resolve(__dirname, '../config/constants.ts');

console.log('=== CORRECTION DE L\'URL DE L\'API ===');

try {
  // Lire le fichier constants.ts
  const constantsContent = fs.readFileSync(constantsFilePath, 'utf8');
  
  // Vérifier l'URL actuelle
  const currentUrlMatch = constantsContent.match(/API_BASE_URL = process\.env\.REACT_APP_API_URL \|\| '(.+?)'/);
  if (currentUrlMatch) {
    const currentUrl = currentUrlMatch[1];
    console.log(`URL actuelle: ${currentUrl}`);
    
    // Remplacer par l'URL avec le port 5001
    const newUrl = 'http://localhost:5001/api';
    const updatedContent = constantsContent.replace(
      /API_BASE_URL = process\.env\.REACT_APP_API_URL \|\| '.+?'/,
      `API_BASE_URL = process.env.REACT_APP_API_URL || '${newUrl}'`
    );
    
    // Vérifier si le contenu a été mis à jour
    if (updatedContent === constantsContent) {
      console.log('⚠️ Aucune modification n\'a été effectuée. Le format du fichier pourrait être différent.');
    } else {
      // Créer une sauvegarde
      fs.writeFileSync(`${constantsFilePath}.bak`, constantsContent, 'utf8');
      console.log('✅ Sauvegarde créée:', `${constantsFilePath}.bak`);
      
      // Écrire les modifications
      fs.writeFileSync(constantsFilePath, updatedContent, 'utf8');
      console.log(`✅ URL de l'API mise à jour: ${newUrl}`);
    }
  } else {
    console.log('⚠️ Format inattendu dans constants.ts. Impossible de trouver la définition de API_BASE_URL.');
  }
  
  console.log('\n=== RECOMMANDATIONS ===');
  console.log('1. Redémarrez l\'application frontend pour appliquer les changements');
  console.log('2. Vérifiez que le serveur backend est bien en cours d\'exécution sur le port 5001');
  console.log('3. Testez à nouveau l\'interface admin des paiements');
  console.log('\nRemarque: Cela corrigera l\'URL de l\'API uniquement en local. Si vous déployez l\'application,');
  console.log('assurez-vous de définir correctement la variable d\'environnement REACT_APP_API_URL.');
  
} catch (error) {
  console.error('Erreur lors de la mise à jour de l\'URL de l\'API:', error);
}
