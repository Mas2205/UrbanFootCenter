const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// Email de l'administrateur
const adminEmail = 'mas@exemple.com';
// ID de l'utilisateur (utilisation de l'ID au lieu de l'email pour être sûr)
const adminId = '51a86f36-a717-433a-b810-35b1c0d6c4fe';

// Nouveau mot de passe souhaité
const newPassword = 'AdminUrbanFoot2025!';

async function resetPasswordById() {
  try {
    console.log('=== RÉINITIALISATION DU MOT DE PASSE PAR ID ===');
    console.log(`ID administrateur: ${adminId}`);
    console.log(`Email administrateur: ${adminEmail}`);
    
    // Création du hash du nouveau mot de passe
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log(`Hash généré: ${passwordHash}`);
    
    // 1. Vérification de l'utilisateur
    const [users] = await sequelize.query(
      `SELECT id, email, role FROM users WHERE id = :id`,
      {
        replacements: { id: adminId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!users || users.length === 0) {
      console.log('❌ Utilisateur non trouvé avec cet ID');
      return;
    }
    
    console.log(`✅ Utilisateur trouvé: ID=${users.id}, Email=${users.email}, Role=${users.role}`);
    
    // 2. Mise à jour directe du mot de passe
    const [affectedRows] = await sequelize.query(
      `UPDATE users SET password_hash = :passwordHash WHERE id = :id`,
      {
        replacements: { passwordHash, id: adminId },
        type: sequelize.QueryTypes.UPDATE
      }
    );
    
    console.log(`Nombre de lignes affectées: ${affectedRows}`);
    
    if (affectedRows > 0) {
      console.log('✅ Mot de passe mis à jour avec succès');
      console.log(`📝 Nouveau mot de passe: ${newPassword}`);
      console.log('🔐 Vous pouvez maintenant vous connecter avec ce mot de passe');
      
      // 3. Vérification finale
      const [verifyUser] = await sequelize.query(
        `SELECT id, email, password_hash FROM users WHERE id = :id`,
        {
          replacements: { id: adminId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      console.log(`Hash final stocké: ${verifyUser.password_hash.substring(0, 15)}...`);
    } else {
      console.log('❌ Échec de la mise à jour du mot de passe');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécution de la fonction
resetPasswordById();
