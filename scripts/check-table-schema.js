const { sequelize } = require('../backend/src/models');

async function checkTableSchema() {
  try {
    console.log('🔍 Vérification du schéma de la table matchs_tournois...');

    // Vérifier si la table existe
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'matchs_tournois' 
      ORDER BY ordinal_position;
    `);

    if (results.length === 0) {
      console.log('❌ Table matchs_tournois non trouvée');
      return;
    }

    console.log('✅ Table matchs_tournois trouvée avec les colonnes :');
    console.log('┌─────────────────────────┬─────────────────┬─────────────┬─────────────────┐');
    console.log('│ Colonne                 │ Type            │ Nullable    │ Défaut          │');
    console.log('├─────────────────────────┼─────────────────┼─────────────┼─────────────────┤');
    
    results.forEach(col => {
      const name = col.column_name.padEnd(23);
      const type = col.data_type.padEnd(15);
      const nullable = col.is_nullable.padEnd(11);
      const defaultVal = (col.column_default || 'NULL').padEnd(15);
      console.log(`│ ${name} │ ${type} │ ${nullable} │ ${defaultVal} │`);
    });
    
    console.log('└─────────────────────────┴─────────────────┴─────────────┴─────────────────┘');

    // Vérifier spécifiquement la colonne groupe_poule
    const groupePouleExists = results.find(col => col.column_name === 'groupe_poule');
    
    if (groupePouleExists) {
      console.log('✅ Colonne groupe_poule existe');
    } else {
      console.log('❌ Colonne groupe_poule manquante !');
      console.log('🔧 Ajout de la colonne groupe_poule...');
      
      try {
        await sequelize.query(`
          ALTER TABLE matchs_tournois 
          ADD COLUMN groupe_poule VARCHAR(1);
        `);
        console.log('✅ Colonne groupe_poule ajoutée avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de la colonne:', error.message);
      }
    }

    // Vérifier d'autres colonnes potentiellement manquantes
    const requiredColumns = [
      'id', 'tournoi_id', 'phase', 'groupe_poule', 'numero_match',
      'equipe1_id', 'equipe2_id', 'score1', 'score2', 'statut',
      'winner_id', 'date_match', 'terrain_id', 'created_by', 'created_at', 'updated_at'
    ];

    const missingColumns = requiredColumns.filter(col => 
      !results.find(r => r.column_name === col)
    );

    if (missingColumns.length > 0) {
      console.log('⚠️  Colonnes manquantes:', missingColumns.join(', '));
    } else {
      console.log('✅ Toutes les colonnes requises sont présentes');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter le script
checkTableSchema()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
