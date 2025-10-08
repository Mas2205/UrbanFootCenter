const { Pool } = require('pg');
const fs = require('fs');

// Configuration base locale
const localPool = new Pool({
  host: 'localhost',
  database: 'urban_foot_center',
  user: 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || 'postgres',
  port: 5432
});

// Configuration base production
const productionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Tables à migrer dans l'ordre (respecter les dépendances)
const TABLES_ORDER = [
  'users',
  'fields', 
  'equipes',
  'membres_equipes',
  'demandes_equipes',
  'tournois',
  'participations_tournois',
  'matchs_tournois',
  'championnats',
  'matchs_championnats',
  'classement_championnat',
  'reservations',
  'payments',
  'notifications'
];

async function exportTableData(tableName) {
  console.log(`📊 Export table: ${tableName}`);
  
  try {
    const localClient = await localPool.connect();
    
    // Récupérer les données
    const result = await localClient.query(`SELECT * FROM ${tableName}`);
    localClient.release();
    
    if (result.rows.length === 0) {
      console.log(`   ⚠️  Table ${tableName} vide`);
      return [];
    }
    
    console.log(`   ✅ ${result.rows.length} enregistrement(s) trouvé(s)`);
    return result.rows;
    
  } catch (error) {
    console.log(`   ❌ Erreur export ${tableName}:`, error.message);
    return [];
  }
}

async function importTableData(tableName, data) {
  if (data.length === 0) return;
  
  console.log(`📥 Import table: ${tableName} (${data.length} enregistrements)`);
  
  try {
    const prodClient = await productionPool.connect();
    
    // Construire la requête INSERT
    const columns = Object.keys(data[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = columns.join(', ');
    
    const insertQuery = `
      INSERT INTO ${tableName} (${columnNames}) 
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING
    `;
    
    // Insérer chaque ligne
    for (const row of data) {
      const values = columns.map(col => row[col]);
      try {
        await prodClient.query(insertQuery, values);
      } catch (error) {
        console.log(`     ⚠️  Erreur ligne:`, error.message);
      }
    }
    
    prodClient.release();
    console.log(`   ✅ Import ${tableName} terminé`);
    
  } catch (error) {
    console.log(`   ❌ Erreur import ${tableName}:`, error.message);
  }
}

async function migrateAllData() {
  console.log('🚀 === MIGRATION COMPLÈTE DES DONNÉES ===');
  console.log('📤 Export depuis base locale...');
  console.log('📥 Import vers base production...');
  console.log('');
  
  const exportedData = {};
  
  // 1. Export de toutes les tables
  for (const tableName of TABLES_ORDER) {
    exportedData[tableName] = await exportTableData(tableName);
  }
  
  console.log('');
  console.log('📥 === IMPORT VERS PRODUCTION ===');
  
  // 2. Import vers production
  for (const tableName of TABLES_ORDER) {
    if (exportedData[tableName]) {
      await importTableData(tableName, exportedData[tableName]);
    }
  }
  
  console.log('');
  console.log('🎉 === MIGRATION TERMINÉE ===');
  
  // 3. Statistiques finales
  console.log('📊 Résumé:');
  for (const tableName of TABLES_ORDER) {
    const count = exportedData[tableName]?.length || 0;
    if (count > 0) {
      console.log(`   ${tableName}: ${count} enregistrement(s)`);
    }
  }
}

async function createProductionTables() {
  console.log('🔧 Création des tables en production...');
  
  const prodClient = await productionPool.connect();
  
  try {
    // Créer les tables sportives si elles n'existent pas
    await prodClient.query(`
      CREATE TABLE IF NOT EXISTS equipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom VARCHAR(100) NOT NULL,
        description TEXT,
        logo_url VARCHAR(500),
        terrain_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
        capitaine_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(nom, terrain_id)
      );
    `);
    
    await prodClient.query(`
      CREATE TABLE IF NOT EXISTS membres_equipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'membre' CHECK (role IN ('capitaine', 'membre')),
        date_adhesion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);
    
    await prodClient.query(`
      CREATE TABLE IF NOT EXISTS demandes_equipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        terrain_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
        nom_equipe VARCHAR(100) NOT NULL,
        description TEXT,
        statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee')),
        motif_refus TEXT,
        validated_by UUID REFERENCES users(id),
        validated_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    await prodClient.query(`
      CREATE TABLE IF NOT EXISTS tournois (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom VARCHAR(100) NOT NULL,
        description TEXT,
        terrain_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
        date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
        date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
        date_limite_inscription TIMESTAMP WITH TIME ZONE NOT NULL,
        frais_inscription DECIMAL(10,2) DEFAULT 0,
        recompense TEXT,
        prix_total DECIMAL(10,2) DEFAULT 0,
        format VARCHAR(30) DEFAULT 'poules_elimination' CHECK (format IN ('poules_elimination', 'elimination_directe', 'championnat')),
        nombre_max_equipes INTEGER DEFAULT 16,
        nombre_equipes_qualifiees INTEGER DEFAULT 4,
        statut VARCHAR(30) DEFAULT 'en_preparation' CHECK (statut IN ('en_preparation', 'inscriptions_ouvertes', 'inscriptions_fermees', 'en_cours', 'termine', 'annule')),
        regles TEXT,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    await prodClient.query(`
      CREATE TABLE IF NOT EXISTS participations_tournois (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tournoi_id UUID NOT NULL REFERENCES tournois(id) ON DELETE CASCADE,
        equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
        statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'refuse', 'elimine')),
        requested_by UUID NOT NULL REFERENCES users(id),
        validated_by UUID REFERENCES users(id),
        validated_at TIMESTAMP WITH TIME ZONE,
        date_inscription TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        motif_refus TEXT,
        frais_payes BOOLEAN DEFAULT false,
        date_paiement TIMESTAMP WITH TIME ZONE,
        groupe_poule VARCHAR(10),
        position_finale INTEGER,
        points_poule INTEGER DEFAULT 0,
        victoires_poule INTEGER DEFAULT 0,
        nuls_poule INTEGER DEFAULT 0,
        defaites_poule INTEGER DEFAULT 0,
        buts_marques_poule INTEGER DEFAULT 0,
        buts_encaisses_poule INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tournoi_id, equipe_id)
      );
    `);
    
    await prodClient.query(`
      CREATE TABLE IF NOT EXISTS matchs_tournois (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tournoi_id UUID NOT NULL REFERENCES tournois(id) ON DELETE CASCADE,
        phase VARCHAR(20) NOT NULL CHECK (phase IN ('poule', 'huitieme', 'quart', 'demi', 'finale', 'petite_finale')),
        groupe_poule VARCHAR(10),
        equipe1_id UUID NOT NULL REFERENCES equipes(id),
        equipe2_id UUID NOT NULL REFERENCES equipes(id),
        score1 INTEGER DEFAULT 0,
        score2 INTEGER DEFAULT 0,
        score1_prolongation INTEGER,
        score2_prolongation INTEGER,
        tirs_au_but_equipe1 INTEGER,
        tirs_au_but_equipe2 INTEGER,
        statut VARCHAR(20) DEFAULT 'a_venir' CHECK (statut IN ('a_venir', 'en_cours', 'termine', 'reporte', 'annule')),
        winner_id UUID REFERENCES equipes(id),
        date_match TIMESTAMP WITH TIME ZONE NOT NULL,
        terrain_id UUID NOT NULL REFERENCES fields(id),
        arbitre VARCHAR(100),
        notes TEXT,
        created_by UUID NOT NULL REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log('✅ Tables créées en production');
    
  } finally {
    prodClient.release();
  }
}

// Fonction principale
async function main() {
  try {
    // 1. Créer les tables en production
    await createProductionTables();
    
    // 2. Migrer les données
    await migrateAllData();
    
    console.log('🎉 Migration complète terminée avec succès !');
    
  } catch (error) {
    console.error('💥 Erreur migration:', error);
  } finally {
    await localPool.end();
    await productionPool.end();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { migrateAllData, createProductionTables };
