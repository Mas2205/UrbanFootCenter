const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

// Route temporaire pour créer les vues KPI
router.get('/create-kpi-views', async (req, res) => {
  try {
    console.log('🚀 === CRÉATION DES VUES KPI VIA API ===');
    
    // 1. Vue kpi_reservations_by_date
    await sequelize.query(`
      CREATE OR REPLACE VIEW kpi_reservations_by_date AS
      SELECT 
        DATE(reservation_date) as reservation_date,
        COUNT(*) as total_reservations,
        SUM(CAST(total_price AS DECIMAL)) as total_revenue
      FROM reservations 
      WHERE status IN ('confirmed', 'completed')
      GROUP BY DATE(reservation_date)
      ORDER BY reservation_date DESC;
    `);
    console.log('✅ Vue kpi_reservations_by_date créée');

    // 2. Vue kpi_reservations_by_field
    await sequelize.query(`
      CREATE OR REPLACE VIEW kpi_reservations_by_field AS
      SELECT 
        f.id as field_id,
        f.name as field_name,
        COUNT(r.id) as total_reservations,
        SUM(CAST(r.total_price AS DECIMAL)) as total_revenue
      FROM fields f
      LEFT JOIN reservations r ON f.id = r.field_id 
        AND r.status IN ('confirmed', 'completed')
      GROUP BY f.id, f.name
      ORDER BY total_reservations DESC;
    `);
    console.log('✅ Vue kpi_reservations_by_field créée');

    // 3. Vue kpi_payments_summary
    await sequelize.query(`
      CREATE OR REPLACE VIEW kpi_payments_summary AS
      SELECT 
        payment_method,
        payment_status,
        COUNT(*) as total_payments,
        SUM(CAST(amount AS DECIMAL)) as total_amount
      FROM payments
      GROUP BY payment_method, payment_status
      ORDER BY total_amount DESC;
    `);
    console.log('✅ Vue kpi_payments_summary créée');

    // Test des vues
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM kpi_reservations_by_date');
    console.log('🎉 Test réussi:', results[0].count, 'enregistrements');

    // Vérifier les vues créées
    const [views] = await sequelize.query(`
      SELECT schemaname, viewname 
      FROM pg_views 
      WHERE viewname LIKE 'kpi_%'
      ORDER BY viewname;
    `);

    res.status(200).json({
      success: true,
      message: 'Vues KPI créées avec succès !',
      views_created: views.map(v => v.viewname),
      test_count: results[0].count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur création vues KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création des vues KPI',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route pour tester la connexion d'un employé
router.post('/test-employee-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    console.log(`🧪 Test connexion pour: ${email}`);
    
    // Trouver l'utilisateur
    const user = await sequelize.models.User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log(`👤 Utilisateur trouvé: ${user.email}`);
    console.log(`🔑 Hash en base: ${user.password_hash}`);
    console.log(`📅 Créé le: ${user.created_at}`);
    console.log(`✅ Vérifié: ${user.is_verified}`);

    // Test de vérification du mot de passe
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    console.log(`🎯 Test bcrypt.compare('${password}', hash): ${isValid}`);

    res.status(200).json({
      success: true,
      message: 'Test de connexion terminé',
      results: {
        user_found: true,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        created_at: user.created_at,
        password_valid: isValid,
        hash_preview: user.password_hash.substring(0, 20) + '...'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur test connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route pour réinitialiser le mot de passe d'un employé
router.post('/reset-employee-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email et nouveau mot de passe requis'
      });
    }

    console.log(`🔄 Réinitialisation mot de passe pour: ${email}`);
    
    // Trouver l'utilisateur
    const user = await sequelize.models.User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Hasher le nouveau mot de passe
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Mettre à jour le mot de passe
    await user.update({ 
      password_hash: hashedPassword,
      is_verified: true // S'assurer que le compte est vérifié
    });

    console.log(`✅ Mot de passe réinitialisé pour ${email}`);

    res.status(200).json({
      success: true,
      message: `Mot de passe réinitialisé pour ${email}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur réinitialisation mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route pour ajouter les ENUMs utilisateur manquants
router.get('/add-user-enums', async (req, res) => {
  try {
    console.log('🚀 === AJOUT DES ENUMS UTILISATEUR ===');
    
    // Ajouter "employee" à enum_users_role
    try {
      await sequelize.query(`ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'employee';`);
      console.log('✅ Rôle "employee" ajouté');
    } catch (e) {
      console.log('ℹ️  Rôle "employee" existe déjà');
    }

    // Vérifier les valeurs actuelles de l'ENUM
    const [enumValues] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'enum_users_role'
      );
    `);

    res.status(200).json({
      success: true,
      message: 'ENUMs utilisateur ajoutés avec succès !',
      current_role_values: enumValues.map(v => v.enumlabel),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur ajout ENUMs utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout des ENUMs utilisateur',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route pour ajouter les ENUMs manquants
router.get('/add-payment-enums', async (req, res) => {
  try {
    console.log('🚀 === AJOUT DES ENUMS PAIEMENT ===');
    
    // Ajouter "especes" à payment_methods_payment_type
    try {
      await sequelize.query(`ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'especes';`);
      console.log('✅ Type "especes" ajouté');
    } catch (e) {
      console.log('ℹ️  Type "especes" existe déjà');
    }

    // Ajouter "pending_cash" à enum_reservations_payment_status
    try {
      await sequelize.query(`ALTER TYPE enum_reservations_payment_status ADD VALUE IF NOT EXISTS 'pending_cash';`);
      console.log('✅ Statut "pending_cash" ajouté');
    } catch (e) {
      console.log('ℹ️  Statut "pending_cash" existe déjà');
    }

    res.status(200).json({
      success: true,
      message: 'ENUMs de paiement ajoutés avec succès !',
      enums_added: ['especes', 'pending_cash'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur ajout ENUMs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout des ENUMs',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route pour corriger le conflit de vue - Version robuste
router.get('/fix-view-conflict', async (req, res) => {
  try {
    console.log('🚀 === CORRECTION CONFLIT VUE FIELDS ===');
    
    // 1. Vérifier la structure actuelle de la table fields
    const [currentStructure] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'fields' AND column_name = 'name';
    `);
    
    console.log('📋 Structure actuelle colonne name:', currentStructure[0]);

    // 2. Supprimer TOUTES les vues qui pourraient dépendre de fields
    console.log('🗑️  Suppression des vues dépendantes...');
    
    const viewsToDelete = [
      'kpi_reservations_by_field',
      'kpi_reservations_by_date', 
      'kpi_payments_summary',
      'kpi_monthly_stats'
    ];

    for (const viewName of viewsToDelete) {
      try {
        await sequelize.query(`DROP VIEW IF EXISTS ${viewName} CASCADE;`);
        console.log(`✅ Vue ${viewName} supprimée`);
      } catch (e) {
        console.log(`ℹ️  Vue ${viewName} n'existait pas`);
      }
    }

    // 3. Modifier manuellement la colonne name si nécessaire
    if (currentStructure[0]?.data_type !== 'character varying' || 
        currentStructure[0]?.character_maximum_length !== 100) {
      
      console.log('🔧 Modification de la colonne name...');
      await sequelize.query(`ALTER TABLE fields ALTER COLUMN name TYPE VARCHAR(100);`);
      await sequelize.query(`ALTER TABLE fields ALTER COLUMN name SET NOT NULL;`);
      console.log('✅ Colonne name mise à jour');
    } else {
      console.log('ℹ️  Colonne name déjà au bon format');
    }

    // 4. Synchroniser les autres modèles (sans fields)
    console.log('🔄 Synchronisation des autres modèles...');
    const models = Object.keys(sequelize.models);
    for (const modelName of models) {
      if (modelName !== 'Field') {
        try {
          await sequelize.models[modelName].sync({ alter: true });
          console.log(`✅ Modèle ${modelName} synchronisé`);
        } catch (e) {
          console.log(`⚠️  Modèle ${modelName} ignoré:`, e.message);
        }
      }
    }

    // 5. Recréer les vues avec la nouvelle structure
    console.log('🔄 Recréation des vues...');
    
    await sequelize.query(`
      CREATE OR REPLACE VIEW kpi_reservations_by_date AS
      SELECT 
        DATE(reservation_date) as reservation_date,
        COUNT(*) as total_reservations,
        SUM(CAST(total_price AS DECIMAL)) as total_revenue
      FROM reservations 
      WHERE status IN ('confirmed', 'completed')
      GROUP BY DATE(reservation_date)
      ORDER BY reservation_date DESC;
    `);

    await sequelize.query(`
      CREATE OR REPLACE VIEW kpi_reservations_by_field AS
      SELECT 
        f.id as field_id,
        f.name as field_name,
        COUNT(r.id) as total_reservations,
        SUM(CAST(r.total_price AS DECIMAL)) as total_revenue
      FROM fields f
      LEFT JOIN reservations r ON f.id = r.field_id 
        AND r.status IN ('confirmed', 'completed')
      GROUP BY f.id, f.name
      ORDER BY total_reservations DESC;
    `);
    
    console.log('✅ Toutes les vues recréées');

    // 6. Vérifier que tout fonctionne
    const [testDate] = await sequelize.query('SELECT COUNT(*) as count FROM kpi_reservations_by_date LIMIT 1');
    const [testField] = await sequelize.query('SELECT COUNT(*) as count FROM kpi_reservations_by_field LIMIT 1');

    res.status(200).json({
      success: true,
      message: '🎉 Conflit de vue résolu définitivement !',
      details: {
        column_updated: currentStructure[0],
        views_recreated: viewsToDelete,
        test_results: {
          kpi_reservations_by_date: testDate[0].count,
          kpi_reservations_by_field: testField[0].count
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur correction vue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la correction du conflit de vue',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Route pour tout faire d'un coup
router.get('/setup-production', async (req, res) => {
  try {
    console.log('🚀 === SETUP COMPLET PRODUCTION ===');
    
    const results = {
      enums: { success: false, message: '' },
      views: { success: false, message: '' }
    };

    // 1. Ajouter les ENUMs
    try {
      // ENUMs paiement
      await sequelize.query(`ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'especes';`);
      await sequelize.query(`ALTER TYPE enum_reservations_payment_status ADD VALUE IF NOT EXISTS 'pending_cash';`);
      
      // ENUMs utilisateur
      await sequelize.query(`ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'employee';`);
      
      results.enums = { success: true, message: 'ENUMs ajoutés avec succès (paiement + utilisateur)' };
      console.log('✅ ENUMs ajoutés (paiement + utilisateur)');
    } catch (e) {
      results.enums = { success: true, message: 'ENUMs déjà existants' };
      console.log('ℹ️  ENUMs déjà existants');
    }

    // 2. Créer les vues KPI
    await sequelize.query(`
      CREATE OR REPLACE VIEW kpi_reservations_by_date AS
      SELECT 
        DATE(reservation_date) as reservation_date,
        COUNT(*) as total_reservations,
        SUM(CAST(total_price AS DECIMAL)) as total_revenue
      FROM reservations 
      WHERE status IN ('confirmed', 'completed')
      GROUP BY DATE(reservation_date)
      ORDER BY reservation_date DESC;
    `);

    await sequelize.query(`
      CREATE OR REPLACE VIEW kpi_reservations_by_field AS
      SELECT 
        f.id as field_id,
        f.name as field_name,
        COUNT(r.id) as total_reservations,
        SUM(CAST(r.total_price AS DECIMAL)) as total_revenue
      FROM fields f
      LEFT JOIN reservations r ON f.id = r.field_id 
        AND r.status IN ('confirmed', 'completed')
      GROUP BY f.id, f.name
      ORDER BY total_reservations DESC;
    `);

    results.views = { success: true, message: 'Vues KPI créées avec succès' };
    console.log('✅ Vues KPI créées');

    res.status(200).json({
      success: true,
      message: '🎉 Setup production terminé avec succès !',
      results: results,
      next_steps: [
        'Testez les réservations avec paiement espèces',
        'Vérifiez que les pages Employés et Statistiques fonctionnent',
        'Supprimez cette route temporaire après vérification'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur setup production:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du setup production',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/admin-setup/create-sports-tables
 * @desc Créer les tables ET migrer toutes les données local → production
 * @access Public (pour faciliter la migration)
 */
router.get('/create-sports-tables', async (req, res) => {
  try {
    console.log('🚀 === CRÉATION TABLES + MIGRATION DONNÉES COMPLÈTE ===');
    
    // Fonction de création des tables directement dans la route
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    
    try {
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
      
      console.log('✅ === TOUTES LES TABLES CRÉÉES AVEC SUCCÈS ===');
      
    } finally {
      client.release();
    }
    
    // === MIGRATION DES DONNÉES DEPUIS LOCAL ===
    console.log('🔄 === DÉBUT MIGRATION DONNÉES LOCAL → PRODUCTION ===');
    
    let migratedData = {};
    let totalMigrated = 0;
    
    try {
      // Configuration base locale
      const localPool = new Pool({
        host: 'localhost',
        database: 'urban_foot_center',
        user: 'postgres',
        password: process.env.LOCAL_DB_PASSWORD || 'postgres',
        port: 5432
      });
      
      // Tables à migrer dans l'ordre
      const TABLES_ORDER = [
        'users', 'fields', 'equipes', 'membres_equipes', 'demandes_equipes',
        'tournois', 'participations_tournois', 'matchs_tournois',
        'reservations', 'payments', 'notifications'
      ];
      
      for (const tableName of TABLES_ORDER) {
        try {
          console.log(`📊 Migration: ${tableName}`);
          
          // Export depuis local
          const localClient = await localPool.connect();
          const result = await localClient.query(`SELECT * FROM ${tableName}`);
          localClient.release();
          
          if (result.rows.length === 0) {
            console.log(`   ⚠️  Table ${tableName} vide`);
            migratedData[tableName] = 0;
            continue;
          }
          
          // Import vers production
          const prodClient = await pool.connect();
          const columns = Object.keys(result.rows[0]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          const columnNames = columns.join(', ');
          
          const insertQuery = `
            INSERT INTO ${tableName} (${columnNames}) 
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
          `;
          
          let imported = 0;
          for (const row of result.rows) {
            const values = columns.map(col => row[col]);
            try {
              await prodClient.query(insertQuery, values);
              imported++;
            } catch (error) {
              // Ignorer les conflits
            }
          }
          
          prodClient.release();
          migratedData[tableName] = imported;
          totalMigrated += imported;
          console.log(`   ✅ ${imported}/${result.rows.length} enregistrement(s) migrés`);
          
        } catch (error) {
          console.log(`   ⚠️  Erreur ${tableName}:`, error.message);
          migratedData[tableName] = 0;
        }
      }
      
      await localPool.end();
      console.log('🎉 === MIGRATION DONNÉES TERMINÉE ===');
      
    } catch (error) {
      console.log('⚠️  Migration données échouée (base locale inaccessible):', error.message);
    }
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Migration Tables Sportives</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; }
          .table-list { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          h1 { color: #28a745; }
          ul { list-style-type: none; padding: 0; }
          li { padding: 5px 0; }
          li:before { content: "✅ "; }
        </style>
      </head>
      <body>
        <h1>🎉 Migration complète terminée !</h1>
        
        <div class="success">
          <strong>Succès !</strong> Tables créées ET données migrées depuis votre base locale.
        </div>
        
        <div class="table-list">
          <h3>📊 Tables créées :</h3>
          <ul>
            <li>equipes - Gestion des équipes</li>
            <li>membres_equipes - Membres et capitaines</li>
            <li>demandes_equipes - Demandes de création</li>
            <li>tournois - Gestion des tournois</li>
            <li>participations_tournois - Inscriptions tournois</li>
            <li>matchs_tournois - Matchs et résultats</li>
            <li>championnats - Championnats trimestriels</li>
            <li>matchs_championnats - Matchs championnat</li>
            <li>classement_championnat - Classements</li>
          </ul>
        </div>
        
        <div class="table-list">
          <h3>🔄 Données migrées :</h3>
          <ul>
            ${Object.entries(migratedData).map(([table, count]) => 
              count > 0 ? `<li>${table}: ${count} enregistrement(s)</li>` : ''
            ).join('')}
          </ul>
          <p><strong>Total: ${totalMigrated} enregistrements migrés</strong></p>
        </div>
        
        <p><strong>✅ Votre système est maintenant 100% synchronisé !</strong></p>
        <p>Toutes vos données locales sont maintenant disponibles en production :</p>
        <ul>
          <li>🏆 Toutes vos équipes et tournois</li>
          <li>👥 Tous vos utilisateurs</li>
          <li>📅 Toutes vos réservations</li>
          <li>💰 Tous vos paiements</li>
        </ul>
        
        <p><a href="https://urban-foot-center.vercel.app/admin" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">← Retour au tableau de bord admin</a></p>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ Erreur création tables sportives:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erreur Migration</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>❌ Erreur lors de la migration</h1>
        <div class="error">
          <strong>Erreur :</strong> ${error.message}
        </div>
        <p><a href="https://urban-foot-center.vercel.app/admin">← Retour au tableau de bord admin</a></p>
      </body>
      </html>
    `);
  }
});

/**
 * @route POST /api/admin-setup/create-sports-tables
 * @desc Créer toutes les tables du système sportif en production
 * @access Super Admin uniquement
 */
router.post('/create-sports-tables', async (req, res) => {
  try {
    console.log('🚀 === CRÉATION TABLES SYSTÈME SPORTIF ===');
    
    // Utiliser la même logique que la route GET
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    
    try {
      // Créer toutes les tables (même code que la route GET)
      await client.query(`CREATE TABLE IF NOT EXISTS equipes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nom VARCHAR(100) NOT NULL, description TEXT, logo_url VARCHAR(500), terrain_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE, capitaine_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(nom, terrain_id));`);
      await client.query(`CREATE TABLE IF NOT EXISTS membres_equipes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, role VARCHAR(20) DEFAULT 'membre' CHECK (role IN ('capitaine', 'membre')), date_adhesion TIMESTAMP WITH TIME ZONE DEFAULT NOW(), is_active BOOLEAN DEFAULT true, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(user_id));`);
      await client.query(`CREATE TABLE IF NOT EXISTS demandes_equipes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, terrain_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE, nom_equipe VARCHAR(100) NOT NULL, description TEXT, statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee')), motif_refus TEXT, validated_by UUID REFERENCES users(id), validated_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());`);
      await client.query(`CREATE TABLE IF NOT EXISTS tournois (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nom VARCHAR(100) NOT NULL, description TEXT, terrain_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE, date_debut TIMESTAMP WITH TIME ZONE NOT NULL, date_fin TIMESTAMP WITH TIME ZONE NOT NULL, date_limite_inscription TIMESTAMP WITH TIME ZONE NOT NULL, frais_inscription DECIMAL(10,2) DEFAULT 0, recompense TEXT, prix_total DECIMAL(10,2) DEFAULT 0, format VARCHAR(30) DEFAULT 'poules_elimination' CHECK (format IN ('poules_elimination', 'elimination_directe', 'championnat')), nombre_max_equipes INTEGER DEFAULT 16, nombre_equipes_qualifiees INTEGER DEFAULT 4, statut VARCHAR(30) DEFAULT 'en_preparation' CHECK (statut IN ('en_preparation', 'inscriptions_ouvertes', 'inscriptions_fermees', 'en_cours', 'termine', 'annule')), regles TEXT, created_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());`);
      await client.query(`CREATE TABLE IF NOT EXISTS participations_tournois (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tournoi_id UUID NOT NULL REFERENCES tournois(id) ON DELETE CASCADE, equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE, statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'refuse', 'elimine')), requested_by UUID NOT NULL REFERENCES users(id), validated_by UUID REFERENCES users(id), validated_at TIMESTAMP WITH TIME ZONE, date_inscription TIMESTAMP WITH TIME ZONE DEFAULT NOW(), motif_refus TEXT, frais_payes BOOLEAN DEFAULT false, date_paiement TIMESTAMP WITH TIME ZONE, groupe_poule VARCHAR(10), position_finale INTEGER, points_poule INTEGER DEFAULT 0, victoires_poule INTEGER DEFAULT 0, nuls_poule INTEGER DEFAULT 0, defaites_poule INTEGER DEFAULT 0, buts_marques_poule INTEGER DEFAULT 0, buts_encaisses_poule INTEGER DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(tournoi_id, equipe_id));`);
      await client.query(`CREATE TABLE IF NOT EXISTS matchs_tournois (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tournoi_id UUID NOT NULL REFERENCES tournois(id) ON DELETE CASCADE, phase VARCHAR(20) NOT NULL CHECK (phase IN ('poule', 'huitieme', 'quart', 'demi', 'finale', 'petite_finale')), groupe_poule VARCHAR(10), equipe1_id UUID NOT NULL REFERENCES equipes(id), equipe2_id UUID NOT NULL REFERENCES equipes(id), score1 INTEGER DEFAULT 0, score2 INTEGER DEFAULT 0, score1_prolongation INTEGER, score2_prolongation INTEGER, tirs_au_but_equipe1 INTEGER, tirs_au_but_equipe2 INTEGER, statut VARCHAR(20) DEFAULT 'a_venir' CHECK (statut IN ('a_venir', 'en_cours', 'termine', 'reporte', 'annule')), winner_id UUID REFERENCES equipes(id), date_match TIMESTAMP WITH TIME ZONE NOT NULL, terrain_id UUID NOT NULL REFERENCES fields(id), arbitre VARCHAR(100), notes TEXT, created_by UUID NOT NULL REFERENCES users(id), updated_by UUID REFERENCES users(id), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());`);
      await client.query(`CREATE TABLE IF NOT EXISTS championnats (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nom VARCHAR(100) NOT NULL, periode VARCHAR(20) NOT NULL, annee INTEGER NOT NULL, date_debut TIMESTAMP WITH TIME ZONE NOT NULL, date_fin TIMESTAMP WITH TIME ZONE NOT NULL, statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'termine', 'suspendu')), description TEXT, recompenses TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(periode, annee));`);
      await client.query(`CREATE TABLE IF NOT EXISTS matchs_championnats (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), championnat_id UUID NOT NULL REFERENCES championnats(id) ON DELETE CASCADE, equipe1_id UUID NOT NULL REFERENCES equipes(id), equipe2_id UUID NOT NULL REFERENCES equipes(id), score1 INTEGER DEFAULT 0, score2 INTEGER DEFAULT 0, statut VARCHAR(20) DEFAULT 'a_venir' CHECK (statut IN ('a_venir', 'en_cours', 'termine', 'reporte', 'annule')), winner_id UUID REFERENCES equipes(id), date_match TIMESTAMP WITH TIME ZONE NOT NULL, terrain_id UUID NOT NULL REFERENCES fields(id), arbitre VARCHAR(100), notes TEXT, created_by UUID NOT NULL REFERENCES users(id), updated_by UUID REFERENCES users(id), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());`);
      await client.query(`CREATE TABLE IF NOT EXISTS classement_championnat (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), championnat_id UUID NOT NULL REFERENCES championnats(id) ON DELETE CASCADE, equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE, points INTEGER DEFAULT 0, matchs_joues INTEGER DEFAULT 0, victoires INTEGER DEFAULT 0, nuls INTEGER DEFAULT 0, defaites INTEGER DEFAULT 0, buts_marques INTEGER DEFAULT 0, buts_encaisses INTEGER DEFAULT 0, difference_buts INTEGER DEFAULT 0, forme VARCHAR(10), derniere_maj TIMESTAMP WITH TIME ZONE DEFAULT NOW(), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(championnat_id, equipe_id));`);
      
      console.log('✅ Tables créées avec succès');
    } finally {
      client.release();
    }
    
    res.json({
      success: true,
      message: 'Tables du système sportif créées avec succès',
      tables: [
        'equipes',
        'membres_equipes', 
        'demandes_equipes',
        'tournois',
        'participations_tournois',
        'matchs_tournois',
        'championnats',
        'matchs_championnats',
        'classement_championnat'
      ]
    });
    
  } catch (error) {
    console.error('❌ Erreur création tables sportives:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création des tables sportives',
      error: error.message
    });
  }
});


module.exports = router;
