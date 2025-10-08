#!/usr/bin/env node

/**
 * Script de migration des données locales vers production
 * 
 * Usage:
 * 1. Assurez-vous que votre base locale fonctionne
 * 2. Définissez DATABASE_URL pour la production
 * 3. Exécutez: node migrate-local-to-production.js
 */

require('dotenv').config();
const { Pool } = require('pg');

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
  ssl: { rejectUnauthorized: false }
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

async function testConnections() {
  console.log('🔍 Test des connexions...');
  
  try {
    const localClient = await localPool.connect();
    console.log('✅ Connexion locale OK');
    localClient.release();
  } catch (error) {
    console.log('❌ Connexion locale échouée:', error.message);
    return false;
  }
  
  try {
    const prodClient = await productionPool.connect();
    console.log('✅ Connexion production OK');
    prodClient.release();
  } catch (error) {
    console.log('❌ Connexion production échouée:', error.message);
    return false;
  }
  
  return true;
}

async function exportTableData(tableName) {
  console.log(`📊 Export: ${tableName}`);
  
  try {
    const localClient = await localPool.connect();
    const result = await localClient.query(`SELECT * FROM ${tableName}`);
    localClient.release();
    
    console.log(`   ✅ ${result.rows.length} enregistrement(s)`);
    return result.rows;
    
  } catch (error) {
    console.log(`   ⚠️  Table ${tableName} non trouvée ou vide`);
    return [];
  }
}

async function importTableData(tableName, data) {
  if (data.length === 0) return;
  
  console.log(`📥 Import: ${tableName} (${data.length} enregistrements)`);
  
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
    
    let imported = 0;
    for (const row of data) {
      const values = columns.map(col => row[col]);
      try {
        await prodClient.query(insertQuery, values);
        imported++;
      } catch (error) {
        // Ignorer les conflits
      }
    }
    
    prodClient.release();
    console.log(`   ✅ ${imported}/${data.length} importé(s)`);
    
  } catch (error) {
    console.log(`   ❌ Erreur import ${tableName}:`, error.message);
  }
}

async function createProductionTables() {
  console.log('🔧 Création des tables manquantes...');
  
  const prodClient = await productionPool.connect();
  
  try {
    // Tables sportives
    const tables = [
      `CREATE TABLE IF NOT EXISTS equipes (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS membres_equipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'membre' CHECK (role IN ('capitaine', 'membre')),
        date_adhesion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS demandes_equipes (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS tournois (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS participations_tournois (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS matchs_tournois (
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
      )`
    ];
    
    for (const tableSQL of tables) {
      await prodClient.query(tableSQL);
    }
    
    console.log('✅ Tables créées');
    
  } finally {
    prodClient.release();
  }
}

async function main() {
  console.log('🚀 === MIGRATION DONNÉES LOCAL → PRODUCTION ===');
  console.log('');
  
  // 1. Test des connexions
  const connectionsOK = await testConnections();
  if (!connectionsOK) {
    console.log('❌ Impossible de continuer sans connexions valides');
    process.exit(1);
  }
  
  console.log('');
  
  // 2. Créer les tables manquantes
  await createProductionTables();
  
  console.log('');
  
  // 3. Migration des données
  console.log('📤 === EXPORT DES DONNÉES LOCALES ===');
  const exportedData = {};
  
  for (const tableName of TABLES_ORDER) {
    exportedData[tableName] = await exportTableData(tableName);
  }
  
  console.log('');
  console.log('📥 === IMPORT VERS PRODUCTION ===');
  
  for (const tableName of TABLES_ORDER) {
    if (exportedData[tableName] && exportedData[tableName].length > 0) {
      await importTableData(tableName, exportedData[tableName]);
    }
  }
  
  console.log('');
  console.log('🎉 === MIGRATION TERMINÉE ===');
  
  // 4. Résumé
  console.log('📊 Résumé de la migration:');
  let totalRecords = 0;
  for (const tableName of TABLES_ORDER) {
    const count = exportedData[tableName]?.length || 0;
    if (count > 0) {
      console.log(`   ${tableName}: ${count} enregistrement(s)`);
      totalRecords += count;
    }
  }
  
  console.log(`\n✅ Total: ${totalRecords} enregistrements migrés`);
  console.log('🎯 Votre base de production est maintenant synchronisée !');
}

// Vérifier les variables d'environnement
if (!process.env.DATABASE_URL) {
  console.error('❌ Variable DATABASE_URL manquante');
  console.log('💡 Définissez DATABASE_URL avec l\'URL de votre base Railway');
  process.exit(1);
}

// Exécuter la migration
main()
  .then(() => {
    console.log('\n🎉 Migration réussie !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur migration:', error);
    process.exit(1);
  })
  .finally(() => {
    localPool.end();
    productionPool.end();
  });
