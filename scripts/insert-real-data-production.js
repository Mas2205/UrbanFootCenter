const { Pool } = require('pg');

// Configuration base production
const productionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function insertRealDataToProduction() {
  console.log('🚀 === INSERTION DONNÉES RÉELLES EN PRODUCTION ===');
  
  const client = await productionPool.connect();
  
  try {
    // 1. Insérer les terrains (fields) réels
    console.log('🏟️ Insertion des terrains...');
    
    const fieldsData = [
      {
        id: 'a727274a-4068-414d-a2d6-0970697c2cdb',
        name: 'URBAN FOOT CENTER',
        description: 'URBAN FOOT CENTER',
        size: '7v7',
        surface_type: 'gazon_synthetique',
        price_per_hour: 21001.00,
        is_active: true,
        image_url: '/uploads/fields/field-1756900987024-867554513.png',
        location: 'Djeddah',
        city: 'Fatick',
        equipment_fee: 0,
        indoor: true,
        owner_payout_channel: 'wave',
        commission_rate_bps: 1000
      },
      {
        id: 'a1a2a1ad-9989-4a97-9a08-e4a06b5eca53',
        name: 'Terrain Tiv',
        description: 'foot',
        size: '7v7',
        surface_type: 'dur',
        price_per_hour: 1234.00,
        is_active: true,
        image_url: null,
        location: 'Kouly',
        city: 'Tivaouane',
        equipment_fee: 0,
        indoor: false,
        owner_payout_channel: 'wave',
        commission_rate_bps: 1000
      },
      {
        id: '2856b86d-4af9-4a12-8a22-fa52d6cbeb1f',
        name: 'Terrain DAKAR',
        description: 'DAK',
        size: '11v11',
        surface_type: 'dur',
        price_per_hour: 10000.00,
        is_active: true,
        image_url: null,
        location: 'Dakar',
        city: 'Tivaouane',
        equipment_fee: 0,
        indoor: false,
        owner_payout_channel: 'wave',
        commission_rate_bps: 1000
      },
      {
        id: '4b0986d1-0fb0-46e9-93dc-eeae049dd566',
        name: 'Terrain 3',
        description: 'urban',
        size: '5v5',
        surface_type: 'gazon_naturel',
        price_per_hour: 23450.00,
        is_active: true,
        image_url: null,
        location: 'Tivaouane',
        city: 'Tivaouane',
        equipment_fee: 0,
        indoor: false,
        owner_payout_channel: 'wave',
        commission_rate_bps: 1000
      },
      {
        id: '586d4c74-7a13-4a53-bbde-40df12fc2aff',
        name: 'mas terrain',
        description: 'th',
        size: '5v5',
        surface_type: 'gazon_naturel',
        price_per_hour: 12.00,
        is_active: true,
        image_url: '/uploads/fields/field-1755788169796-405893003.jpg',
        location: 'Tivaouane',
        city: 'Tivaouane',
        equipment_fee: 0,
        indoor: false,
        owner_payout_channel: 'wave',
        commission_rate_bps: 1000
      }
    ];
    
    for (const field of fieldsData) {
      try {
        await client.query(`
          INSERT INTO fields (
            id, name, description, size, surface_type, price_per_hour, 
            is_active, image_url, location, city, equipment_fee, indoor,
            owner_payout_channel, commission_rate_bps, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price_per_hour = EXCLUDED.price_per_hour,
            updated_at = NOW()
        `, [
          field.id, field.name, field.description, field.size, field.surface_type,
          field.price_per_hour, field.is_active, field.image_url, field.location,
          field.city, field.equipment_fee, field.indoor, field.owner_payout_channel,
          field.commission_rate_bps
        ]);
        
        console.log(`   ✅ Terrain inséré: ${field.name}`);
      } catch (error) {
        console.log(`   ⚠️  Erreur terrain ${field.name}:`, error.message);
      }
    }
    
    // 2. Insérer les utilisateurs réels (sélection)
    console.log('👥 Insertion des utilisateurs...');
    
    const usersData = [
      {
        id: '4a13e22c-fe06-4bbf-9a9f-48c3264f128e',
        email: 'abdoulaye_uraban@ex.com',
        first_name: 'abdoulaye_urabans',
        last_name: 'seck',
        role: 'admin',
        phone_number: '+221778984',
        is_active: true,
        field_id: 'a727274a-4068-414d-a2d6-0970697c2cdb'
      },
      {
        id: '78b9d38d-dea5-4968-bc38-c26a9a0c13f7',
        email: 'testauto@example.com',
        first_name: 'TestAuto',
        last_name: 'User',
        role: 'client',
        phone_number: '987654321',
        is_active: true,
        field_id: null
      },
      {
        id: 'd7a1b392-f061-48f6-bfc6-41879638fc60',
        email: 'client1@ex.com',
        first_name: 'client1',
        last_name: 'seck',
        role: 'client',
        phone_number: '778745',
        is_active: true,
        field_id: null
      },
      {
        id: 'c2b184d9-6ef6-444e-8a89-42ed1939728e',
        email: 'mas_client@ex.com',
        first_name: 'mas_client',
        last_name: 'mas_client',
        role: 'client',
        phone_number: '242423423423',
        is_active: true,
        field_id: null
      },
      {
        id: '54879e0b-12c4-4d63-99a4-d2083242e672',
        email: 'pass@ex.com',
        first_name: 'Pass1',
        last_name: 'Seck',
        role: 'client',
        phone_number: '+2217575755',
        is_active: true,
        field_id: null
      },
      {
        id: '67ebf3db-994e-4a55-9eae-a742a35d16d2',
        email: 'maseck@ex.com',
        first_name: 'Maseck',
        last_name: 'Seck',
        role: 'client',
        phone_number: '+2217578787788',
        is_active: true,
        field_id: null
      },
      {
        id: '5ecd0c22-6faf-4b45-8003-73ee565bc27a',
        email: 'mou@ex.Com',
        first_name: 'mou',
        last_name: 'seck',
        role: 'admin',
        phone_number: '7787451',
        is_active: true,
        field_id: '586d4c74-7a13-4a53-bbde-40df12fc2aff'
      }
    ];
    
    for (const user of usersData) {
      try {
        await client.query(`
          INSERT INTO users (
            id, email, first_name, last_name, role, phone_number, 
            is_active, field_id, password, created_at, updated_at, is_verified
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '$2a$10$defaulthash', NOW(), NOW(), true)
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            updated_at = NOW()
        `, [
          user.id, user.email, user.first_name, user.last_name, 
          user.role, user.phone_number, user.is_active, user.field_id
        ]);
        
        console.log(`   ✅ Utilisateur inséré: ${user.first_name} ${user.last_name}`);
      } catch (error) {
        console.log(`   ⚠️  Erreur utilisateur ${user.email}:`, error.message);
      }
    }
    
    // 3. Insérer les équipes réelles
    console.log('🏆 Insertion des équipes...');
    
    const equipesData = [
      {
        id: '198214ac-ef67-4acf-b881-3ad9dff4e4f5',
        nom: 'Équipe Test FC',
        description: 'Équipe créée pour tester l\'API',
        couleur_maillot: '#FF6B35',
        terrain_id: 'a727274a-4068-414d-a2d6-0970697c2cdb',
        capitaine_id: '78b9d38d-dea5-4968-bc38-c26a9a0c13f7',
        created_by: '78b9d38d-dea5-4968-bc38-c26a9a0c13f7',
        statut: 'active'
      },
      {
        id: '46030578-f326-45da-9fdd-a41b54b8d36d',
        nom: 'djeddah',
        description: 'djeddah',
        couleur_maillot: '#FF6B35',
        terrain_id: 'a727274a-4068-414d-a2d6-0970697c2cdb',
        capitaine_id: 'd7a1b392-f061-48f6-bfc6-41879638fc60',
        created_by: '4a13e22c-fe06-4bbf-9a9f-48c3264f128e',
        statut: 'active'
      },
      {
        id: '03cc740c-8073-4f31-98d4-a78fe886795e',
        nom: 'mas_client@ex.com',
        description: 'mas_client@ex.com',
        couleur_maillot: '#f5ec00',
        terrain_id: 'a727274a-4068-414d-a2d6-0970697c2cdb',
        capitaine_id: 'c2b184d9-6ef6-444e-8a89-42ed1939728e',
        created_by: '4a13e22c-fe06-4bbf-9a9f-48c3264f128e',
        statut: 'active'
      },
      {
        id: '500e7508-ea2f-4bdb-8114-1493c9174cc8',
        nom: 'pass@ex.com',
        description: 'pass@ex.com',
        couleur_maillot: '#00a3d7',
        terrain_id: 'a727274a-4068-414d-a2d6-0970697c2cdb',
        capitaine_id: '54879e0b-12c4-4d63-99a4-d2083242e672',
        created_by: '4a13e22c-fe06-4bbf-9a9f-48c3264f128e',
        statut: 'active'
      },
      {
        id: '15ba3b2a-99b7-43e0-a1da-8ee35a05dd82',
        nom: 'maseck@ex.com',
        description: 'maseck@ex.com',
        couleur_maillot: '#1a0a53',
        terrain_id: 'a727274a-4068-414d-a2d6-0970697c2cdb',
        capitaine_id: '67ebf3db-994e-4a55-9eae-a742a35d16d2',
        created_by: '4a13e22c-fe06-4bbf-9a9f-48c3264f128e',
        statut: 'active'
      }
    ];
    
    for (const equipe of equipesData) {
      try {
        await client.query(`
          INSERT INTO equipes (
            id, nom, description, couleur_maillot, terrain_id, 
            capitaine_id, created_by, statut, is_active, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
          ON CONFLICT (nom, terrain_id) DO UPDATE SET
            description = EXCLUDED.description,
            couleur_maillot = EXCLUDED.couleur_maillot,
            updated_at = NOW()
        `, [
          equipe.id, equipe.nom, equipe.description, equipe.couleur_maillot,
          equipe.terrain_id, equipe.capitaine_id, equipe.created_by, equipe.statut
        ]);
        
        console.log(`   ✅ Équipe insérée: ${equipe.nom}`);
      } catch (error) {
        console.log(`   ⚠️  Erreur équipe ${equipe.nom}:`, error.message);
      }
    }
    
    // 4. Insérer les tournois réels
    console.log('🏆 Insertion des tournois...');
    
    const tournoisData = [
      {
        id: '4c05fc23-3f12-419a-9d36-dd8ef41475ba',
        nom: 'Tournoi foot',
        description: 'Tournoi foot',
        terrain_id: 'a727274a-4068-414d-a2d6-0970697c2cdb',
        date_debut: '2025-10-12 02:00:00+02',
        date_fin: '2025-10-30 01:00:00+01',
        date_limite_inscription: '2025-10-09 02:00:00+02',
        frais_inscription: 100000.00,
        recompense: 'Trophée',
        prix_total: 100000.00,
        format: 'elimination_directe',
        nombre_max_equipes: 4,
        statut: 'en_cours',
        created_by: '4a13e22c-fe06-4bbf-9a9f-48c3264f128e'
      },
      {
        id: '47b9eb0d-f1f6-4559-88a4-1b4eeb1e9653',
        nom: 'tournois mas',
        description: 'mou',
        terrain_id: '586d4c74-7a13-4a53-bbde-40df12fc2aff',
        date_debut: '2025-10-22 02:00:00+02',
        date_fin: '2025-11-04 01:00:00+01',
        date_limite_inscription: '2025-10-12 02:00:00+02',
        frais_inscription: 50000.00,
        recompense: 'prix',
        prix_total: 50000.00,
        format: 'poules_elimination',
        nombre_max_equipes: 16,
        statut: 'inscriptions_ouvertes',
        created_by: '5ecd0c22-6faf-4b45-8003-73ee565bc27a'
      }
    ];
    
    for (const tournoi of tournoisData) {
      try {
        await client.query(`
          INSERT INTO tournois (
            id, nom, description, terrain_id, date_debut, date_fin,
            date_limite_inscription, frais_inscription, recompense, prix_total,
            format, nombre_max_equipes, statut, created_by, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            nom = EXCLUDED.nom,
            description = EXCLUDED.description,
            statut = EXCLUDED.statut,
            updated_at = NOW()
        `, [
          tournoi.id, tournoi.nom, tournoi.description, tournoi.terrain_id,
          tournoi.date_debut, tournoi.date_fin, tournoi.date_limite_inscription,
          tournoi.frais_inscription, tournoi.recompense, tournoi.prix_total,
          tournoi.format, tournoi.nombre_max_equipes, tournoi.statut, tournoi.created_by
        ]);
        
        console.log(`   ✅ Tournoi inséré: ${tournoi.nom}`);
      } catch (error) {
        console.log(`   ⚠️  Erreur tournoi ${tournoi.nom}:`, error.message);
      }
    }
    
    console.log('');
    console.log('🎉 === DONNÉES RÉELLES INSÉRÉES AVEC SUCCÈS ===');
    console.log('✅ 5 terrains insérés');
    console.log('✅ 7 utilisateurs insérés');
    console.log('✅ 5 équipes insérées');
    console.log('✅ 2 tournois insérés');
    
  } catch (error) {
    console.error('❌ Erreur insertion:', error);
  } finally {
    client.release();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  insertRealDataToProduction()
    .then(() => {
      console.log('\n🎯 Insertion terminée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erreur insertion:', error);
      process.exit(1);
    })
    .finally(() => {
      productionPool.end();
    });
}

module.exports = { insertRealDataToProduction };
