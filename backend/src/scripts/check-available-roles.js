const { sequelize } = require('../config/database');

async function checkAvailableRoles() {
  try {
    console.log('🔄 Vérification des rôles disponibles...');
    
    // Vérifier les valeurs d'ENUM pour les rôles
    const [roleEnums] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_users_role)) as role_value;
    `);
    
    console.log('📋 Rôles disponibles dans l\'ENUM:');
    roleEnums.forEach(role => {
      console.log(`   - ${role.role_value}`);
    });
    
    // Récupérer tous les utilisateurs avec leurs rôles réels
    const [users] = await sequelize.query(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        role,
        field_id,
        is_active
      FROM users 
      ORDER BY role, email;
    `);
    
    console.log('\n📋 Tous les utilisateurs par rôle:');
    
    const roleGroups = {};
    users.forEach(user => {
      if (!roleGroups[user.role]) {
        roleGroups[user.role] = [];
      }
      roleGroups[user.role].push(user);
    });
    
    Object.keys(roleGroups).forEach(role => {
      console.log(`\n🔹 Rôle: ${role.toUpperCase()} (${roleGroups[role].length} utilisateur(s))`);
      roleGroups[role].forEach(user => {
        console.log(`   👤 ${user.first_name} ${user.last_name} (${user.email})`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Terrain assigné: ${user.field_id || 'Aucun'}`);
        console.log(`      Actif: ${user.is_active ? 'Oui' : 'Non'}`);
        console.log('');
      });
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
checkAvailableRoles();
