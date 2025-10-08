const { Pool } = require('pg');

// Configuration base production
const productionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function populateProductionData() {
  console.log('🚀 === PEUPLEMENT BASE PRODUCTION AVEC DONNÉES FICTIVES ===');
  
  const client = await productionPool.connect();
  
  try {
    // 1. Créer des équipes fictives
    console.log('🏆 Création équipes fictives...');
    
    // Récupérer les terrains et utilisateurs existants
    const fields = await client.query('SELECT id, name FROM fields LIMIT 3');
    const users = await client.query('SELECT id, first_name, last_name FROM users WHERE role IN (\'client\', \'admin\') LIMIT 10');
    
    if (fields.rows.length === 0 || users.rows.length === 0) {
      console.log('⚠️  Pas assez de terrains ou d\'utilisateurs pour créer des équipes');
      return;
    }
    
    const equipesData = [
      {
        nom: 'FC Lions',
        description: 'Équipe de football passionnée et déterminée',
        couleur_maillot: 'Rouge et Blanc',
        terrain_id: fields.rows[0].id,
        capitaine_id: users.rows[0].id,
        created_by: users.rows[0].id
      },
      {
        nom: 'AS Eagles',
        description: 'Les aigles du terrain, rapides et précis',
        couleur_maillot: 'Bleu et Jaune',
        terrain_id: fields.rows[0].id,
        capitaine_id: users.rows[1].id,
        created_by: users.rows[1].id
      },
      {
        nom: 'Real Warriors',
        description: 'Guerriers du ballon rond',
        couleur_maillot: 'Vert et Noir',
        terrain_id: fields.rows[1] ? fields.rows[1].id : fields.rows[0].id,
        capitaine_id: users.rows[2].id,
        created_by: users.rows[2].id
      },
      {
        nom: 'Barcelona Stars',
        description: 'Étoiles montantes du football',
        couleur_maillot: 'Bleu et Rouge',
        terrain_id: fields.rows[1] ? fields.rows[1].id : fields.rows[0].id,
        capitaine_id: users.rows[3].id,
        created_by: users.rows[3].id
      }
    ];
    
    const equipesCreees = [];
    
    for (const equipe of equipesData) {
      try {
        const result = await client.query(`
          INSERT INTO equipes (nom, description, couleur_maillot, terrain_id, capitaine_id, created_by, statut, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, 'active', true)
          ON CONFLICT (nom, terrain_id) DO NOTHING
          RETURNING id, nom
        `, [equipe.nom, equipe.description, equipe.couleur_maillot, equipe.terrain_id, equipe.capitaine_id, equipe.created_by]);
        
        if (result.rows.length > 0) {
          equipesCreees.push(result.rows[0]);
          console.log(`   ✅ Équipe créée: ${result.rows[0].nom}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Erreur équipe ${equipe.nom}:`, error.message);
      }
    }
    
    // 2. Ajouter des membres aux équipes
    console.log('👥 Ajout membres aux équipes...');
    
    for (let i = 0; i < equipesCreees.length && i < users.rows.length - 1; i++) {
      const equipe = equipesCreees[i];
      
      // Ajouter le capitaine comme membre
      try {
        await client.query(`
          INSERT INTO membres_equipes (equipe_id, user_id, role, statut, date_adhesion, joined_at)
          VALUES ($1, $2, 'capitaine', 'actif', NOW(), NOW())
          ON CONFLICT (user_id) DO NOTHING
        `, [equipe.id, users.rows[i].id]);
        
        console.log(`   ✅ Capitaine ajouté à ${equipe.nom}`);
      } catch (error) {
        console.log(`   ⚠️  Erreur membre capitaine:`, error.message);
      }
      
      // Ajouter 2-3 membres supplémentaires
      for (let j = 1; j <= 3 && (i * 4 + j) < users.rows.length; j++) {
        try {
          await client.query(`
            INSERT INTO membres_equipes (equipe_id, user_id, role, statut, numero_maillot, date_adhesion, joined_at)
            VALUES ($1, $2, 'membre', 'actif', $3, NOW(), NOW())
            ON CONFLICT (user_id) DO NOTHING
          `, [equipe.id, users.rows[i * 4 + j].id, j + 1]);
          
          console.log(`   ✅ Membre #${j + 1} ajouté à ${equipe.nom}`);
        } catch (error) {
          console.log(`   ⚠️  Erreur membre:`, error.message);
        }
      }
    }
    
    // 3. Créer un tournoi de test
    console.log('🏆 Création tournoi de test...');
    
    if (equipesCreees.length >= 4) {
      try {
        const tournoi = await client.query(`
          INSERT INTO tournois (
            nom, description, terrain_id, format, nombre_max_equipes,
            date_debut, date_fin, date_limite_inscription,
            frais_inscription, statut, created_by
          )
          VALUES (
            'Tournoi de Test', 
            'Premier tournoi de démonstration avec 4 équipes',
            $1, 
            'elimination_directe', 
            4,
            NOW() + INTERVAL '7 days',
            NOW() + INTERVAL '14 days', 
            NOW() + INTERVAL '5 days',
            25000,
            'inscriptions_ouvertes',
            $2
          )
          RETURNING id, nom
        `, [fields.rows[0].id, users.rows[0].id]);
        
        console.log(`   ✅ Tournoi créé: ${tournoi.rows[0].nom}`);
        
        // 4. Inscrire les équipes au tournoi
        console.log('📝 Inscription équipes au tournoi...');
        
        for (let i = 0; i < Math.min(4, equipesCreees.length); i++) {
          try {
            await client.query(`
              INSERT INTO participations_tournois (
                tournoi_id, equipe_id, statut, requested_by, 
                validated_by, validated_at, date_inscription
              )
              VALUES ($1, $2, 'valide', $3, $4, NOW(), NOW())
            `, [
              tournoi.rows[0].id, 
              equipesCreees[i].id, 
              users.rows[i].id,
              users.rows[0].id
            ]);
            
            console.log(`   ✅ ${equipesCreees[i].nom} inscrite au tournoi`);
          } catch (error) {
            console.log(`   ⚠️  Erreur inscription:`, error.message);
          }
        }
        
      } catch (error) {
        console.log('   ⚠️  Erreur création tournoi:', error.message);
      }
    }
    
    // 5. Créer quelques demandes d'équipes
    console.log('📋 Création demandes d\'équipes...');
    
    const demandesData = [
      {
        nom_equipe: 'FC Juventus',
        description: 'Nouvelle équipe ambitieuse',
        user_id: users.rows[users.rows.length - 1].id,
        terrain_id: fields.rows[0].id
      },
      {
        nom_equipe: 'AC Milan',
        description: 'Équipe technique et rapide',
        user_id: users.rows[users.rows.length - 2].id,
        terrain_id: fields.rows[1] ? fields.rows[1].id : fields.rows[0].id
      }
    ];
    
    for (const demande of demandesData) {
      try {
        await client.query(`
          INSERT INTO demandes_equipes (user_id, terrain_id, nom_equipe, description, statut)
          VALUES ($1, $2, $3, $4, 'en_attente')
        `, [demande.user_id, demande.terrain_id, demande.nom_equipe, demande.description]);
        
        console.log(`   ✅ Demande créée: ${demande.nom_equipe}`);
      } catch (error) {
        console.log(`   ⚠️  Erreur demande:`, error.message);
      }
    }
    
    console.log('');
    console.log('🎉 === DONNÉES FICTIVES CRÉÉES AVEC SUCCÈS ===');
    console.log(`✅ ${equipesCreees.length} équipe(s) créée(s)`);
    console.log('✅ Membres ajoutés aux équipes');
    console.log('✅ 1 tournoi de test créé');
    console.log('✅ Équipes inscrites au tournoi');
    console.log('✅ 2 demandes d\'équipes en attente');
    
  } catch (error) {
    console.error('❌ Erreur peuplement:', error);
  } finally {
    client.release();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  populateProductionData()
    .then(() => {
      console.log('\n🎯 Peuplement terminé avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erreur peuplement:', error);
      process.exit(1);
    })
    .finally(() => {
      productionPool.end();
    });
}

module.exports = { populateProductionData };
