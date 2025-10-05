// Script à exécuter dans la console Railway après déploiement
// Copier-coller ce code dans la console Railway backend

const { Client } = require('pg');

async function runProductionMigrations() {
  console.log('🚀 === MIGRATIONS PRODUCTION URBAN FOOT CENTER ===');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connexion à la base de données Railway établie');
    
    // Migration 1: Ajouter "especes" à payment_methods_payment_type
    try {
      await client.query(`ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'especes';`);
      console.log('✅ Type "especes" ajouté à payment_methods_payment_type');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Type "especes" existe déjà dans payment_methods_payment_type');
      } else {
        console.error('❌ Erreur ajout especes:', error.message);
        throw error;
      }
    }

    // Migration 2: Ajouter "pending_cash" à enum_reservations_payment_status
    try {
      await client.query(`ALTER TYPE enum_reservations_payment_status ADD VALUE IF NOT EXISTS 'pending_cash';`);
      console.log('✅ Statut "pending_cash" ajouté à enum_reservations_payment_status');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Statut "pending_cash" existe déjà dans enum_reservations_payment_status');
      } else {
        console.error('❌ Erreur ajout pending_cash:', error.message);
        throw error;
      }
    }

    // Vérification des ENUMs
    console.log('\n🔍 Vérification des ENUMs...');
    
    const enumsResult = await client.query(`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname IN ('payment_methods_payment_type', 'enum_reservations_payment_status')
      AND e.enumlabel IN ('especes', 'pending_cash')
      ORDER BY t.typname, e.enumlabel;
    `);

    console.log('📋 ENUMs vérifiés:');
    enumsResult.rows.forEach(row => {
      console.log(`   ✅ ${row.enum_name}: ${row.enum_value}`);
    });

    if (enumsResult.rows.length >= 2) {
      console.log('\n🎉 === MIGRATIONS TERMINÉES AVEC SUCCÈS ! ===');
      console.log('✅ Le système de paiement en espèces est maintenant actif en production');
    } else {
      console.log('\n⚠️  Attention: Certains ENUMs pourraient être manquants');
    }

  } catch (error) {
    console.error('\n❌ === ERREUR LORS DES MIGRATIONS ===');
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécuter les migrations
runProductionMigrations().catch(console.error);
