const { sequelize } = require('../config/database');

async function checkAndUpdatePaymentTypes() {
  try {
    console.log('🔄 Vérification de la structure de la base de données...');
    
    // Vérifier si la table payment_methods existe
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'payment_methods';
    `);
    
    if (tables.length === 0) {
      console.log('❌ La table payment_methods n\'existe pas. Synchronisation nécessaire...');
      
      // Synchroniser la base de données
      await sequelize.sync({ alter: true });
      console.log('✅ Base de données synchronisée');
      
      return;
    }
    
    console.log('✅ Table payment_methods trouvée');
    
    // Vérifier si l'ENUM existe
    const [enums] = await sequelize.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'enum_payment_methods_payment_type';
    `);
    
    if (enums.length === 0) {
      console.log('❌ ENUM payment_type n\'existe pas. Recréation de la table...');
      
      // Supprimer et recréer la table avec le nouveau type
      await sequelize.query('DROP TABLE IF EXISTS payment_methods CASCADE;');
      await sequelize.sync({ force: true });
      console.log('✅ Table payment_methods recréée avec les nouveaux types');
      
      return;
    }
    
    console.log('✅ ENUM payment_type trouvé');
    
    // Vérifier les valeurs actuelles de l'ENUM
    const [currentValues] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_payment_methods_payment_type)) as payment_type;
    `);
    
    const currentTypes = currentValues.map(row => row.payment_type);
    console.log('📋 Types actuels:', currentTypes);
    
    if (!currentTypes.includes('especes')) {
      console.log('🔄 Ajout du type "especes"...');
      
      await sequelize.query(`
        ALTER TYPE "enum_payment_methods_payment_type" 
        ADD VALUE 'especes';
      `);
      
      console.log('✅ Type "especes" ajouté avec succès !');
      
      // Vérifier à nouveau
      const [newValues] = await sequelize.query(`
        SELECT unnest(enum_range(NULL::enum_payment_methods_payment_type)) as payment_type;
      `);
      
      console.log('📋 Types mis à jour:', newValues.map(row => row.payment_type));
    } else {
      console.log('ℹ️  Le type "especes" existe déjà');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
checkAndUpdatePaymentTypes();
