const { Pool } = require('pg');

// Configuration de la base de données production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createSportsTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 === CRÉATION DES TABLES SYSTÈME SPORTIF ===');
    
    // 1. Table equipes
    console.log('📊 Création table equipes...');
    await client.query(`
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
    
    // 2. Table membres_equipes
    console.log('👥 Création table membres_equipes...');
    await client.query(`
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
    
    // 3. Table demandes_equipes
    console.log('📝 Création table demandes_equipes...');
    await client.query(`
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
    
    // 4. Table tournois
    console.log('🏆 Création table tournois...');
    await client.query(`
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
    
    // 5. Table participations_tournois
    console.log('🎯 Création table participations_tournois...');
    await client.query(`
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
    
    // 6. Table matchs_tournois
    console.log('⚽ Création table matchs_tournois...');
    await client.query(`
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
    
    // 7. Table championnats
    console.log('🏅 Création table championnats...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS championnats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom VARCHAR(100) NOT NULL,
        periode VARCHAR(20) NOT NULL,
        annee INTEGER NOT NULL,
        date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
        date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
        statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'termine', 'suspendu')),
        description TEXT,
        recompenses TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(periode, annee)
      );
    `);
    
    // 8. Table matchs_championnats
    console.log('🥅 Création table matchs_championnats...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS matchs_championnats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        championnat_id UUID NOT NULL REFERENCES championnats(id) ON DELETE CASCADE,
        equipe1_id UUID NOT NULL REFERENCES equipes(id),
        equipe2_id UUID NOT NULL REFERENCES equipes(id),
        score1 INTEGER DEFAULT 0,
        score2 INTEGER DEFAULT 0,
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
    
    // 9. Table classement_championnat
    console.log('📊 Création table classement_championnat...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS classement_championnat (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        championnat_id UUID NOT NULL REFERENCES championnats(id) ON DELETE CASCADE,
        equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
        points INTEGER DEFAULT 0,
        matchs_joues INTEGER DEFAULT 0,
        victoires INTEGER DEFAULT 0,
        nuls INTEGER DEFAULT 0,
        defaites INTEGER DEFAULT 0,
        buts_marques INTEGER DEFAULT 0,
        buts_encaisses INTEGER DEFAULT 0,
        difference_buts INTEGER DEFAULT 0,
        forme VARCHAR(10),
        derniere_maj TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(championnat_id, equipe_id)
      );
    `);
    
    // 10. Créer les index pour les performances
    console.log('🔍 Création des index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_equipes_terrain ON equipes(terrain_id);
      CREATE INDEX IF NOT EXISTS idx_equipes_capitaine ON equipes(capitaine_id);
      CREATE INDEX IF NOT EXISTS idx_membres_equipes_user ON membres_equipes(user_id);
      CREATE INDEX IF NOT EXISTS idx_membres_equipes_equipe ON membres_equipes(equipe_id);
      CREATE INDEX IF NOT EXISTS idx_demandes_equipes_user ON demandes_equipes(user_id);
      CREATE INDEX IF NOT EXISTS idx_demandes_equipes_statut ON demandes_equipes(statut);
      CREATE INDEX IF NOT EXISTS idx_tournois_terrain ON tournois(terrain_id);
      CREATE INDEX IF NOT EXISTS idx_tournois_statut ON tournois(statut);
      CREATE INDEX IF NOT EXISTS idx_participations_tournoi ON participations_tournois(tournoi_id);
      CREATE INDEX IF NOT EXISTS idx_participations_equipe ON participations_tournois(equipe_id);
      CREATE INDEX IF NOT EXISTS idx_participations_statut ON participations_tournois(statut);
      CREATE INDEX IF NOT EXISTS idx_matchs_tournois_tournoi ON matchs_tournois(tournoi_id);
      CREATE INDEX IF NOT EXISTS idx_matchs_tournois_date ON matchs_tournois(date_match);
      CREATE INDEX IF NOT EXISTS idx_matchs_tournois_statut ON matchs_tournois(statut);
      CREATE INDEX IF NOT EXISTS idx_matchs_championnats_championnat ON matchs_championnats(championnat_id);
      CREATE INDEX IF NOT EXISTS idx_matchs_championnats_date ON matchs_championnats(date_match);
      CREATE INDEX IF NOT EXISTS idx_classement_championnat ON classement_championnat(championnat_id);
      CREATE INDEX IF NOT EXISTS idx_classement_points ON classement_championnat(points DESC);
    `);
    
    console.log('✅ === TOUTES LES TABLES CRÉÉES AVEC SUCCÈS ===');
    console.log('🎉 Système sportif prêt en production !');
    
  } catch (error) {
    console.error('❌ Erreur création tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createSportsTables()
    .then(() => {
      console.log('🎯 Migration terminée avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur migration:', error);
      process.exit(1);
    });
}

module.exports = { createSportsTables };
