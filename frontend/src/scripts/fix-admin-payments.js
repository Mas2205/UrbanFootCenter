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

  // Corriger la structure de la réponse API
  const updatedContent = data.replace(
    'setPayments(response.data.payments);',
    'setPayments(response.data.data || []); // Accès au bon champ de la réponse API'
  );

  // Vérifier si l'erreur est affichée seulement quand il y a vraiment une erreur et pas de données vides
  const improvedErrorHandling = updatedContent.replace(
    `{loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      ) : filteredPayments.length === 0 ? (`,
    `{loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error && payments.length > 0 ? (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      ) : filteredPayments.length === 0 ? (`
  );

  // Écrire le fichier mis à jour
  fs.writeFile(componentPath, improvedErrorHandling, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier du composant:', writeErr);
      return;
    }
    console.log('Le composant AdminPayments.tsx a été corrigé avec succès!');
    console.log('1. La structure de la réponse API a été corrigée (response.data.data au lieu de response.data.payments)');
    console.log('2. La logique d\'affichage des erreurs a été améliorée pour mieux gérer le cas où il n\'y a pas de données');
  });
});
