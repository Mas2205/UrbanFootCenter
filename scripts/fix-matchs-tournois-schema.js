const { sequelize } = require('../backend/src/models');

async function fixMatchsTournoisSchema() {
  try {
    console.log('🔧 Correction du schéma de la table matchs_tournois...');

    const alterations = [
      {
        name: 'numero_match',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS numero_match INTEGER DEFAULT 1;'
      },
      {
        name: 'created_by',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS created_by UUID;'
      },
      {
        name: 'updated_by',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS updated_by UUID;'
      },
      {
        name: 'score1_prolongation',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS score1_prolongation INTEGER;'
      },
      {
        name: 'score2_prolongation',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS score2_prolongation INTEGER;'
      },
      {
        name: 'tirs_au_but_equipe1',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS tirs_au_but_equipe1 INTEGER;'
      },
      {
        name: 'tirs_au_but_equipe2',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS tirs_au_but_equipe2 INTEGER;'
      }
    ];

    for (const alteration of alterations) {
      try {
        await sequelize.query(alteration.sql);
        console.log(`✅ ${alteration.name} - OK`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  ${alteration.name} - Déjà existante`);
        } else {
          console.log(`❌ ${alteration.name} - Erreur: ${error.message}`);
        }
      }
    }

    // Vérifier le schéma final
    console.log('\n🔍 Vérification du schéma final...');
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'matchs_tournois' 
      ORDER BY ordinal_position;
    `);

    const columns = results.map(r => r.column_name);
    console.log('📋 Colonnes présentes:', columns.join(', '));

    const requiredColumns = [
      'id', 'tournoi_id', 'phase', 'groupe_poule', 'numero_match',
      'equipe1_id', 'equipe2_id', 'score1', 'score2', 'statut',
      'winner_id', 'date_match', 'terrain_id', 'created_by', 'updated_by',
      'score1_prolongation', 'score2_prolongation', 
      'tirs_au_but_equipe1', 'tirs_au_but_equipe2',
      'arbitre', 'notes', 'created_at', 'updated_at'
    ];

    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ Toutes les colonnes requises sont présentes');
    } else {
      console.log('⚠️  Colonnes encore manquantes:', missingColumns.join(', '));
    }

    console.log('\n🎉 Correction du schéma terminée');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Exécuter le script
fixMatchsTournoisSchema()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
