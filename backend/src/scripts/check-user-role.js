const { sequelize } = require('../config/database');

async function checkUserRoles() {
  try {
    console.log('🔄 Vérification des rôles utilisateurs...');
    
    // Récupérer tous les utilisateurs avec leurs rôles
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
      WHERE role IN ('admin', 'super_admin', 'field_admin', 'employee')
      ORDER BY role, email;
    `);
    
    console.log('📋 Utilisateurs avec rôles administratifs:');
    
    const roleGroups = {};
    users.forEach(user => {
      if (!roleGroups[user.role]) {
        roleGroups[user.role] = [];
      }
      roleGroups[user.role].push(user);
    });
    
    Object.keys(roleGroups).forEach(role => {
      console.log(`\n🔹 Rôle: ${role.toUpperCase()}`);
      roleGroups[role].forEach(user => {
        console.log(`   👤 ${user.first_name} ${user.last_name} (${user.email})`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Terrain assigné: ${user.field_id || 'Aucun'}`);
        console.log(`      Actif: ${user.is_active ? 'Oui' : 'Non'}`);
        console.log('');
      });
    });
    
    // Vérifier les valeurs d'ENUM pour les rôles
    console.log('🔍 Vérification des valeurs ENUM pour les rôles...');
    const [roleEnums] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_users_role)) as role_value;
    `);
    
    console.log('📋 Rôles disponibles dans l\'ENUM:');
    roleEnums.forEach(role => {
      console.log(`   - ${role.role_value}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
checkUserRoles();
