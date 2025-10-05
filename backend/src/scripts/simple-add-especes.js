const { sequelize } = require('../config/database');

async function addEspecesType() {
  try {
    console.log('🔄 Ajout simple du type "especes"...');
    
    // Créer l'ENUM s'il n'existe pas
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_payment_methods_payment_type AS ENUM ('wave', 'orange_money', 'carte_bancaire', 'especes');
      EXCEPTION
        WHEN duplicate_object THEN
          -- L'ENUM existe déjà, ajouter juste la valeur 'especes'
          BEGIN
            ALTER TYPE enum_payment_methods_payment_type ADD VALUE IF NOT EXISTS 'especes';
          EXCEPTION
            WHEN OTHERS THEN
              -- Ignorer si la valeur existe déjà
              NULL;
          END;
      END $$;
    `);
    
    console.log('✅ Type "especes" ajouté avec succès !');
    
    // Vérifier les types disponibles
    const [result] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_payment_methods_payment_type)) as payment_type;
    `);
    
    console.log('📋 Types de paiement disponibles:', result.map(row => row.payment_type));
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
addEspecesType();
