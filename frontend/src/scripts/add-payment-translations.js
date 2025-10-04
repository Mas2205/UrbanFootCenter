const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de traduction française
const translationFilePath = path.resolve(__dirname, '../locales/fr/translation.json');

// Lire le contenu du fichier de traduction
fs.readFile(translationFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier de traduction:', err);
    return;
  }

  // Parser le JSON
  let translations;
  try {
    translations = JSON.parse(data);
  } catch (parseErr) {
    console.error('Erreur lors du parsing du fichier JSON:', parseErr);
    return;
  }

  // Définir les traductions pour la section admin.payments
  const paymentTranslations = {
    "admin.payments.title": "Gestion des Paiements",
    "admin.payments.errorLoading": "Erreur lors du chargement des paiements",
    "admin.payments.noData": "Aucun paiement trouvé",
    "admin.payments.filterByDate": "Filtrer par date",
    "admin.payments.filterByStatus": "Filtrer par statut",
    "admin.payments.tabAll": "Tous les paiements",
    "admin.payments.tabCompleted": "Paiements réussis",
    "admin.payments.tabPending": "Paiements en attente",
    "admin.payments.id": "Identifiant",
    "admin.payments.user": "Utilisateur",
    "admin.payments.amount": "Montant",
    "admin.payments.method": "Méthode",
    "admin.payments.status": "Statut",
    "admin.payments.date": "Date",
    "admin.payments.actions": "Actions",
    "admin.payments.view": "Détails",
    "admin.payments.refund": "Rembourser",
    "admin.payments.confirm": "Confirmer",
    "admin.payments.cancel": "Annuler",
    "admin.payments.search": "Rechercher un paiement",
    "admin.payments.confirmRefund": "Confirmer le remboursement",
    "admin.payments.confirmRefundMessage": "Êtes-vous sûr de vouloir rembourser ce paiement ?",
    "admin.payments.refundSuccess": "Remboursement effectué avec succès",
    "admin.payments.refundError": "Erreur lors du remboursement",
    "admin.payments.status.pending": "En attente",
    "admin.payments.status.completed": "Effectué",
    "admin.payments.status.failed": "Échoué",
    "admin.payments.status.refunded": "Remboursé",
    "admin.payments.method.card": "Carte bancaire",
    "admin.payments.method.wave": "WAVE",
    "admin.payments.method.orangeMoney": "Orange Money",
    "admin.payments.method.cash": "Espèces",
    "admin.payments.method.other": "Autre",
    "admin.payments.details": "Détails du paiement",
    "admin.payments.transactionId": "ID de transaction",
    "admin.payments.reservation": "Réservation associée",
    "admin.payments.customer": "Client",
    "admin.payments.paymentDate": "Date de paiement",
    "admin.payments.filterByUser": "Filtrer par utilisateur",
    "admin.payments.downloadReceipt": "Télécharger le reçu",
    "admin.payments.printReceipt": "Imprimer le reçu",
    "admin.payments.sendReceipt": "Envoyer le reçu par email",
    "admin.payments.viewReservation": "Voir la réservation",
    "admin.payments.close": "Fermer"
  };

  // Ajouter les traductions des paiements au fichier de traduction
  Object.entries(paymentTranslations).forEach(([key, value]) => {
    translations[key] = value;
  });

  // Convertir en JSON bien formaté
  const updatedTranslations = JSON.stringify(translations, null, 2);

  // Écrire le fichier mis à jour
  fs.writeFile(translationFilePath, updatedTranslations, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier de traduction:', writeErr);
      return;
    }
    console.log('Fichier de traduction mis à jour avec succès!');
    console.log(`${Object.keys(paymentTranslations).length} clés de traduction ont été ajoutées pour la section admin.payments`);
  });
});
