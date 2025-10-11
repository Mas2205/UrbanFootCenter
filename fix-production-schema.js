// Script pour corriger le schéma en production via Railway
console.log('🔧 CORRECTION SCHÉMA PRODUCTION - matchs_tournois');
console.log('================================================');

// Ce script doit être exécuté avec: railway run node fix-production-schema.js

const { Pool } = require('pg');

async function fixProductionSchema() {
  let client;
  
  try {
    // Utiliser la variable d'environnement DATABASE_URL de Railway
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    client = await pool.connect();
    console.log('✅ Connexion à la base de données établie');

    // Liste des colonnes à ajouter
    const alterations = [
      {
        name: 'groupe_poule',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS groupe_poule VARCHAR(1);'
      },
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

    console.log('\n🔧 Ajout des colonnes manquantes...');
    
    for (const alteration of alterations) {
      try {
        await client.query(alteration.sql);
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
    const result = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'matchs_tournois' 
      ORDER BY ordinal_position;
    `);

    const columns = result.rows.map(r => r.column_name);
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

    console.log('\n🎉 Correction du schéma terminée avec succès !');
    console.log('🔄 Redémarrez l\'application pour prendre en compte les changements');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Exécuter le script
fixProductionSchema()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
