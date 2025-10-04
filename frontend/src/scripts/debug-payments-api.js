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

  // Ajouter des logs de débogage plus détaillés
  const updatedContent = data.replace(
    `const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await (api as API).admin.getPayments();
      setPayments(response.data.payments || []); // Structure correcte selon le type TypeScript
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des paiements", err);
      setError(t('admin.payments.errorLoading'));
    } finally {
      setLoading(false);
    }
  };`,
    `const fetchPayments = async () => {
    console.log("Début du chargement des paiements...");
    setLoading(true);
    try {
      console.log("Avant appel API des paiements");
      const response = await (api as API).admin.getPayments();
      console.log("Réponse API des paiements:", response.data);
      setPayments(response.data.payments || []); // Structure correcte selon le type TypeScript
      setError(null);
    } catch (err) {
      console.error("Erreur détaillée lors du chargement des paiements:", err);
      setError(t('admin.payments.errorLoading'));
    } finally {
      setLoading(false);
      console.log("Fin du chargement des paiements");
    }
  };`
  );

  // Forcer l'appel API au chargement du composant (éviter la logique de mock)
  const forceFetch = updatedContent.replace(
    'useEffect(() => {',
    'useEffect(() => {\n    console.log("AdminPayments component mounted");'
  );

  // Écrire le fichier mis à jour
  fs.writeFile(componentPath, forceFetch, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier du composant:', writeErr);
      return;
    }
    console.log('Logs de débogage ajoutés avec succès dans AdminPayments.tsx!');
    console.log('Rafraîchissez la page et consultez la console du navigateur pour voir les détails');
  });
});
