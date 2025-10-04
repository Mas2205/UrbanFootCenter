const fs = require('fs');
const path = require('path');

// Chemin vers le composant AdminPayments.tsx
const componentPath = path.resolve(__dirname, '../components/admin/payments/AdminPayments.tsx');

// Lire le contenu du fichier
fs.readFile(componentPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier du composant:', err);
    return;
  }

  // Corriger la structure de la réponse API pour respecter le type TypeScript
  const updatedContent = data.replace(
    'setPayments(response.data.data || []); // Accès au bon champ de la réponse API',
    'setPayments(response.data.payments || []); // Structure correcte selon le type TypeScript'
  );

  // Améliorer la gestion des erreurs tout en respectant les types
  const improvedErrorHandling = updatedContent.replace(
    'error && payments.length > 0 ?',
    'error ?'
  );

  // Écrire le fichier mis à jour
  fs.writeFile(componentPath, improvedErrorHandling, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier du composant:', writeErr);
      return;
    }
    console.log('Le composant AdminPayments.tsx a été corrigé avec succès!');
    console.log('La structure de la réponse API a été corrigée pour correspondre au type TypeScript (response.data.payments)');
  });
});
