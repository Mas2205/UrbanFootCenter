const { User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// Email de l'administrateur
const adminEmail = 'mas@exemple.com';
// ID de l'utilisateur
const adminId = '51a86f36-a717-433a-b810-35b1c0d6c4fe';

// Nouveau mot de passe souhaité
const newPassword = 'AdminUrbanFoot2025!';

async function resetPasswordNoHooks() {
  try {
    console.log('=== RÉINITIALISATION DU MOT DE PASSE (SANS HOOKS) ===');
    console.log(`ID administrateur: ${adminId}`);
    console.log(`Email administrateur: ${adminEmail}`);
    
    // Création du hash du nouveau mot de passe
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log(`Hash généré: ${passwordHash}`);
    
    // Recherche de l'utilisateur
    const user = await User.findByPk(adminId);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé avec cet ID');
      return;
    }
    
    console.log(`✅ Utilisateur trouvé: ID=${user.id}, Email=${user.email}, Role=${user.role}`);
    
    // Mise à jour directe sans déclencher les hooks
    const result = await User.update(
      { password_hash: passwordHash },
      { 
        where: { id: adminId },
        individualHooks: false, // Ne pas déclencher les hooks
        hooks: false // Désactiver complètement les hooks
      }
    );
    
    console.log(`Résultat de la mise à jour:`, result);
    
    if (result && result[0] > 0) {
      console.log('✅ Mot de passe mis à jour avec succès');
      console.log(`📝 Nouveau mot de passe: ${newPassword}`);
      console.log('🔐 Vous pouvez maintenant vous connecter avec ce mot de passe');
      
      // Vérification finale
      const updatedUser = await User.findByPk(adminId);
      console.log(`Hash final stocké: ${updatedUser.password_hash.substring(0, 15)}...`);
      
      // Test manuel de vérification
      console.log('\n=== TEST DE VÉRIFICATION DU MOT DE PASSE ===');
      const isValid = await bcrypt.compare(newPassword, updatedUser.password_hash);
      console.log(`Le mot de passe "${newPassword}" est valide avec le hash stocké: ${isValid ? '✅ OUI' : '❌ NON'}`);
    } else {
      console.log('❌ Échec de la mise à jour du mot de passe');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Exécution de la fonction
resetPasswordNoHooks();
