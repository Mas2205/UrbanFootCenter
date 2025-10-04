const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// Email de l'administrateur
const adminEmail = 'mas@exemple.com';

// Nouveau mot de passe souhaité
const newPassword = 'AdminUrbanFoot2025!'; // Mot de passe fort et mémorisable

async function resetPasswordDirectly() {
  try {
    console.log('=== RÉINITIALISATION DIRECTE DU MOT DE PASSE ADMINISTRATEUR ===');
    console.log(`Email administrateur: ${adminEmail}`);
    console.log(`Nouveau mot de passe: ${newPassword}`);
    
    // Création du hash du nouveau mot de passe
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log(`Hash généré: ${passwordHash.substring(0, 15)}...`);
    
    // Mise à jour directe via une requête SQL brute pour éviter les hooks Sequelize
    const [affectedRows] = await sequelize.query(
      `UPDATE users SET password_hash = ? WHERE email = ?`,
      {
        replacements: [passwordHash, adminEmail],
        type: sequelize.QueryTypes.UPDATE
      }
    );
    
    if (affectedRows > 0) {
      console.log('✅ Mot de passe mis à jour avec succès');
      console.log(`📝 Nouveau mot de passe: ${newPassword}`);
      console.log('🔐 Vous pouvez maintenant vous connecter avec ce mot de passe');
    } else {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
  } finally {
    // Fermeture de la connexion
    await sequelize.close();
  }
}

// Exécution de la fonction
resetPasswordDirectly();
