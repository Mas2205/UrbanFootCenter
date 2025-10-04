const { User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// Email de l'administrateur
const adminEmail = 'mas@exemple.com';

// Nouveau mot de passe souhaité
const newPassword = 'AdminUrbanFoot2025!'; // Mot de passe fort et mémorisable

async function resetAdminPassword() {
  try {
    console.log('=== RÉINITIALISATION DU MOT DE PASSE ADMINISTRATEUR ===');
    console.log(`Email administrateur: ${adminEmail}`);

    // Recherche de l'utilisateur
    const user = await User.findOne({ where: { email: adminEmail } });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé!');
      return;
    }
    
    console.log(`✅ Utilisateur trouvé: ID=${user.id}, Role=${user.role}`);

    // Création du hash du nouveau mot de passe
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Mise à jour du mot de passe
    await user.update({ password_hash: passwordHash });
    
    console.log('✅ Mot de passe mis à jour avec succès');
    console.log(`📝 Nouveau mot de passe: ${newPassword}`);
    console.log('🔐 Vous pouvez maintenant vous connecter avec ce mot de passe');

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
  } finally {
    // Fermeture de la connexion
    await sequelize.close();
  }
}

// Exécution de la fonction
resetAdminPassword();
