const { sequelize } = require('../config/database');

async function assignFieldToAdmin() {
  try {
    console.log('🔄 Attribution d\'un terrain à l\'administrateur...');
    
    // ID de l'utilisateur qui a le problème
    const userId = 'e122f0b1-58f3-44de-831a-a014ced357ff';
    const email = 'admin_urban@ex.com';
    
    // Récupérer les terrains disponibles
    const [fields] = await sequelize.query(`
      SELECT id, name, city
      FROM fields 
      WHERE is_active = true
      ORDER BY name;
    `);
    
    console.log('📋 Terrains disponibles:');
    fields.forEach((field, index) => {
      console.log(`   ${index + 1}. ${field.name} (${field.city}) - ID: ${field.id}`);
    });
    
    if (fields.length === 0) {
      console.log('❌ Aucun terrain disponible');
      return;
    }
    
    // Utiliser le premier terrain disponible (URBAN FOOT CENTER)
    const selectedField = fields[0];
    console.log(`\n🎯 Attribution du terrain "${selectedField.name}" à l'utilisateur ${email}`);
    
    // Mettre à jour l'utilisateur
    await sequelize.query(`
      UPDATE users 
      SET field_id = :fieldId, updated_at = NOW()
      WHERE id = :userId;
    `, {
      replacements: {
        fieldId: selectedField.id,
        userId: userId
      }
    });
    
    console.log('✅ Terrain assigné avec succès !');
    
    // Vérifier la mise à jour
    const [updatedUser] = await sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.field_id,
        f.name as field_name
      FROM users u
      LEFT JOIN fields f ON u.field_id = f.id
      WHERE u.id = :userId;
    `, {
      replacements: { userId }
    });
    
    if (updatedUser.length > 0) {
      const user = updatedUser[0];
      console.log('\n📊 Utilisateur mis à jour:');
      console.log(`   👤 ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`   🏟️  Terrain assigné: ${user.field_name}`);
      console.log(`   🔑 Field ID: ${user.field_id}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
assignFieldToAdmin();
