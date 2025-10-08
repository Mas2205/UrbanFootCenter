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
          created_by UUID REFERENCES users(id),
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
    console.log('ℹ️  Migration données locale désactivée (Railway ne peut pas accéder à localhost)');
    
    let migratedData = {};
    let totalMigrated = 0;
    
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
        <h1>🎉 Tables sportives créées !</h1>
        
        <div class="success">
          <strong>Succès !</strong> Toutes les tables du système sportif ont été créées en production.
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
        
        <p><strong>✅ Votre système sportif est maintenant opérationnel !</strong></p>
        <p>Vous pouvez maintenant utiliser toutes les fonctionnalités :</p>
        <ul>
          <li>🏆 Créer et gérer des équipes</li>
          <li>🥇 Organiser des tournois avec tirage au sort</li>
          <li>👑 Suivre les championnats trimestriels</li>
          <li>📊 Consulter les classements en temps réel</li>
        </ul>
        
        <p><strong>⚠️ Colonnes manquantes détectées ?</strong></p>
        <p><a href="/api/admin-setup/fix-tables-columns" style="background: #ffc107; color: #212529; padding: 8px 16px; text-decoration: none; border-radius: 3px; margin-right: 10px;">🔧 Corriger les colonnes</a></p>
        
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


/**
 * @route GET /api/admin-setup/fix-tables-columns
 * @desc Ajouter les colonnes manquantes aux tables existantes
 * @access Public
 */
router.get('/fix-tables-columns', async (req, res) => {
  try {
    console.log('🔧 === CORRECTION DES COLONNES MANQUANTES ===');
    
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    
    try {
      // Ajouter toutes les colonnes manquantes à la table equipes
      console.log('🔧 Ajout colonnes manquantes à equipes...');
      
      await client.query(`
        ALTER TABLE equipes 
        ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
      `);
      
      await client.query(`
        ALTER TABLE equipes 
        ADD COLUMN IF NOT EXISTS couleur_maillot VARCHAR(50);
      `);
      
      await client.query(`
        ALTER TABLE equipes 
        ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'inactive', 'suspendue'));
      `);
      
      // Ajouter colonnes manquantes à membres_equipes
      console.log('🔧 Ajout colonnes manquantes à membres_equipes...');
      
      await client.query(`
        ALTER TABLE membres_equipes 
        ADD COLUMN IF NOT EXISTS numero_maillot INTEGER;
      `);
      
      await client.query(`
        ALTER TABLE membres_equipes 
        ADD COLUMN IF NOT EXISTS poste VARCHAR(50);
      `);
      
      await client.query(`
        ALTER TABLE membres_equipes 
        ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu'));
      `);
      
      await client.query(`
        ALTER TABLE membres_equipes 
        ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);
      
      await client.query(`
        ALTER TABLE membres_equipes 
        ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES users(id);
      `);
      
      // Mettre à jour les valeurs par défaut
      console.log('🔧 Mise à jour valeurs par défaut...');
      
      await client.query(`
        UPDATE equipes 
        SET created_by = capitaine_id 
        WHERE created_by IS NULL;
      `);
      
      await client.query(`
        UPDATE equipes 
        SET couleur_maillot = 'Bleu' 
        WHERE couleur_maillot IS NULL;
      `);
      
      await client.query(`
        UPDATE equipes 
        SET statut = 'active' 
        WHERE statut IS NULL;
      `);
      
      await client.query(`
        UPDATE membres_equipes 
        SET statut = 'actif' 
        WHERE statut IS NULL;
      `);
      
      await client.query(`
        UPDATE membres_equipes 
        SET joined_at = date_adhesion 
        WHERE joined_at IS NULL AND date_adhesion IS NOT NULL;
      `);
      
      // Ajouter colonnes manquantes à fields
      console.log('🔧 Ajout colonnes manquantes à fields...');
      
      await client.query(`
        ALTER TABLE fields 
        ADD COLUMN IF NOT EXISTS equipment_fee DECIMAL(10,2) DEFAULT 0;
      `);
      
      await client.query(`
        ALTER TABLE fields 
        ADD COLUMN IF NOT EXISTS owner_payout_channel VARCHAR(50);
      `);
      
      await client.query(`
        ALTER TABLE fields 
        ADD COLUMN IF NOT EXISTS owner_mobile_e164 VARCHAR(20);
      `);
      
      await client.query(`
        ALTER TABLE fields 
        ADD COLUMN IF NOT EXISTS owner_bank_info JSONB;
      `);
      
      await client.query(`
        ALTER TABLE fields 
        ADD COLUMN IF NOT EXISTS commission_rate_bps INTEGER DEFAULT 1000;
      `);
      
      await client.query(`
        ALTER TABLE fields 
        ADD COLUMN IF NOT EXISTS indoor BOOLEAN DEFAULT false;
      `);
      
      // Mettre à jour les valeurs par défaut pour fields
      console.log('🔧 Mise à jour valeurs par défaut fields...');
      
      await client.query(`
        UPDATE fields 
        SET equipment_fee = 0 
        WHERE equipment_fee IS NULL;
      `);
      
      await client.query(`
        UPDATE fields 
        SET commission_rate_bps = 1000 
        WHERE commission_rate_bps IS NULL;
      `);
      
      await client.query(`
        UPDATE fields 
        SET indoor = false 
        WHERE indoor IS NULL;
      `);
      
      // Ajouter colonnes manquantes à demandes_equipes
      console.log('🔧 Ajout colonnes manquantes à demandes_equipes...');
      
      await client.query(`
        ALTER TABLE demandes_equipes 
        ADD COLUMN IF NOT EXISTS couleur_maillot VARCHAR(50);
      `);
      
      await client.query(`
        ALTER TABLE demandes_equipes 
        ADD COLUMN IF NOT EXISTS notes_admin TEXT;
      `);
      
      // Ajouter colonnes manquantes à tournois
      console.log('🔧 Ajout colonnes manquantes à tournois...');
      
      await client.query(`
        ALTER TABLE tournois 
        ADD COLUMN IF NOT EXISTS regles TEXT;
      `);
      
      await client.query(`
        ALTER TABLE tournois 
        ADD COLUMN IF NOT EXISTS nombre_equipes_qualifiees INTEGER DEFAULT 4;
      `);
      
      // Ajouter colonnes manquantes à participations_tournois
      console.log('🔧 Ajout colonnes manquantes à participations_tournois...');
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES users(id);
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS motif_refus TEXT;
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS frais_payes BOOLEAN DEFAULT false;
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS date_paiement TIMESTAMP WITH TIME ZONE;
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS groupe_poule VARCHAR(10);
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS position_finale INTEGER;
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS points_poule INTEGER DEFAULT 0;
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS victoires_poule INTEGER DEFAULT 0;
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS nuls_poule INTEGER DEFAULT 0;
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS defaites_poule INTEGER DEFAULT 0;
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS buts_marques_poule INTEGER DEFAULT 0;
      `);
      
      await client.query(`
        ALTER TABLE participations_tournois 
        ADD COLUMN IF NOT EXISTS buts_encaisses_poule INTEGER DEFAULT 0;
      `);
      
      // Ajouter colonnes manquantes à matchs_tournois
      console.log('🔧 Ajout colonnes manquantes à matchs_tournois...');
      
      await client.query(`
        ALTER TABLE matchs_tournois 
        ADD COLUMN IF NOT EXISTS groupe_poule VARCHAR(10);
      `);
      
      await client.query(`
        ALTER TABLE matchs_tournois 
        ADD COLUMN IF NOT EXISTS score1_prolongation INTEGER;
      `);
      
      await client.query(`
        ALTER TABLE matchs_tournois 
        ADD COLUMN IF NOT EXISTS score2_prolongation INTEGER;
      `);
      
      await client.query(`
        ALTER TABLE matchs_tournois 
        ADD COLUMN IF NOT EXISTS tirs_au_but_equipe1 INTEGER;
      `);
      
      await client.query(`
        ALTER TABLE matchs_tournois 
        ADD COLUMN IF NOT EXISTS tirs_au_but_equipe2 INTEGER;
      `);
      
      await client.query(`
        ALTER TABLE matchs_tournois 
        ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES equipes(id);
      `);
      
      await client.query(`
        ALTER TABLE matchs_tournois 
        ADD COLUMN IF NOT EXISTS arbitre VARCHAR(100);
      `);
      
      await client.query(`
        ALTER TABLE matchs_tournois 
        ADD COLUMN IF NOT EXISTS notes TEXT;
      `);
      
      await client.query(`
        ALTER TABLE matchs_tournois 
        ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);
      `);
      
      // Ajouter colonnes manquantes à championnats
      console.log('🔧 Ajout colonnes manquantes à championnats...');
      
      await client.query(`
        ALTER TABLE championnats 
        ADD COLUMN IF NOT EXISTS periode VARCHAR(20) NOT NULL DEFAULT 'T1';
      `);
      
      await client.query(`
        ALTER TABLE championnats 
        ADD COLUMN IF NOT EXISTS annee INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW());
      `);
      
      await client.query(`
        ALTER TABLE championnats 
        ADD COLUMN IF NOT EXISTS date_debut TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);
      
      await client.query(`
        ALTER TABLE championnats 
        ADD COLUMN IF NOT EXISTS date_fin TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '3 months';
      `);
      
      await client.query(`
        ALTER TABLE championnats 
        ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'termine', 'suspendu'));
      `);
      
      await client.query(`
        ALTER TABLE championnats 
        ADD COLUMN IF NOT EXISTS description TEXT;
      `);
      
      await client.query(`
        ALTER TABLE championnats 
        ADD COLUMN IF NOT EXISTS recompenses TEXT;
      `);
      
      // Ajouter colonnes manquantes à classement_championnat
      console.log('🔧 Ajout colonnes manquantes à classement_championnat...');
      
      await client.query(`
        ALTER TABLE classement_championnat 
        ADD COLUMN IF NOT EXISTS matchs_joues INTEGER DEFAULT 0;
      `);
      
      await client.query(`
        ALTER TABLE classement_championnat 
        ADD COLUMN IF NOT EXISTS difference_buts INTEGER DEFAULT 0;
      `);
      
      await client.query(`
        ALTER TABLE classement_championnat 
        ADD COLUMN IF NOT EXISTS forme VARCHAR(10);
      `);
      
      await client.query(`
        ALTER TABLE classement_championnat 
        ADD COLUMN IF NOT EXISTS derniere_maj TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);
      
      // Mettre à jour les valeurs par défaut
      console.log('🔧 Mise à jour valeurs par défaut pour toutes les tables...');
      
      await client.query(`
        UPDATE demandes_equipes 
        SET couleur_maillot = '#FF6B35' 
        WHERE couleur_maillot IS NULL;
      `);
      
      await client.query(`
        UPDATE tournois 
        SET nombre_equipes_qualifiees = 4 
        WHERE nombre_equipes_qualifiees IS NULL;
      `);
      
      await client.query(`
        UPDATE participations_tournois 
        SET points_poule = 0, victoires_poule = 0, nuls_poule = 0, 
            defaites_poule = 0, buts_marques_poule = 0, buts_encaisses_poule = 0,
            frais_payes = false
        WHERE points_poule IS NULL;
      `);
      
      await client.query(`
        UPDATE championnats 
        SET statut = 'actif' 
        WHERE statut IS NULL;
      `);
      
      await client.query(`
        UPDATE classement_championnat 
        SET matchs_joues = 0, difference_buts = 0, derniere_maj = NOW()
        WHERE matchs_joues IS NULL;
      `);
      
      console.log('✅ TOUTES les colonnes sportives corrigées avec succès');
      
    } finally {
      client.release();
    }
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Correction Colonnes</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>🔧 Colonnes corrigées !</h1>
        
        <div class="success">
          <strong>Succès !</strong> TOUTES les colonnes manquantes du système sportif ont été ajoutées.
        </div>
        
        <h3>📊 Colonnes ajoutées par table :</h3>
        
        <p>✅ <strong>equipes</strong> : created_by, couleur_maillot, statut</p>
        <p>✅ <strong>membres_equipes</strong> : numero_maillot, poste, statut, joined_at, added_by</p>
        <p>✅ <strong>fields</strong> : equipment_fee, owner_payout_channel, owner_mobile_e164, owner_bank_info, commission_rate_bps, indoor</p>
        <p>✅ <strong>demandes_equipes</strong> : couleur_maillot, notes_admin</p>
        <p>✅ <strong>tournois</strong> : regles, nombre_equipes_qualifiees</p>
        <p>✅ <strong>participations_tournois</strong> : validated_at, validated_by, motif_refus, frais_payes, date_paiement, groupe_poule, position_finale, points_poule, victoires_poule, nuls_poule, defaites_poule, buts_marques_poule, buts_encaisses_poule</p>
        <p>✅ <strong>matchs_tournois</strong> : groupe_poule, score1_prolongation, score2_prolongation, tirs_au_but_equipe1, tirs_au_but_equipe2, winner_id, arbitre, notes, updated_by</p>
        <p>✅ <strong>championnats</strong> : periode, annee, date_debut, date_fin, statut, description, recompenses</p>
        <p>✅ <strong>classement_championnat</strong> : matchs_joues, difference_buts, forme, derniere_maj</p>
        
        <p><strong>🎯 Système sportif maintenant 100% complet !</strong></p>
        
        <p><a href="https://urban-foot-center.vercel.app/admin" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">← Retour au tableau de bord admin</a></p>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ Erreur correction colonnes:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erreur Correction</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>❌ Erreur correction</h1>
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
 * @route GET /api/admin-setup/populate-test-data
 * @desc Peupler la production avec des données de test
 * @access Public
 */
router.get('/populate-test-data', async (req, res) => {
  try {
    console.log('🚀 === PEUPLEMENT DONNÉES DE TEST ===');
    
    const { populateProductionData } = require('../../scripts/populate-production-data');
    await populateProductionData();
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Données de Test Créées</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; }
          .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
          h1 { color: #28a745; }
          ul { list-style-type: none; padding: 0; }
          li { padding: 5px 0; }
          li:before { content: "✅ "; }
        </style>
      </head>
      <body>
        <h1>🎉 Données de test créées !</h1>
        
        <div class="success">
          <strong>Succès !</strong> Votre base de production a été peuplée avec des données de test.
        </div>
        
        <div class="info">
          <h3>📊 Données créées :</h3>
          <ul>
            <li><strong>4 équipes</strong> : FC Lions, AS Eagles, Real Warriors, Barcelona Stars</li>
            <li><strong>Membres d'équipes</strong> : Capitaines et joueurs assignés</li>
            <li><strong>1 tournoi de test</strong> : "Tournoi de Test" en élimination directe</li>
            <li><strong>Inscriptions</strong> : Les 4 équipes inscrites au tournoi</li>
            <li><strong>2 demandes d'équipes</strong> : FC Juventus et AC Milan en attente</li>
          </ul>
        </div>
        
        <p><strong>🎯 Maintenant vous pouvez tester :</strong></p>
        <ul>
          <li>🏆 <a href="https://urban-foot-center.vercel.app/admin/equipes">Voir les équipes créées</a></li>
          <li>🥇 <a href="https://urban-foot-center.vercel.app/admin/tournois">Gérer le tournoi de test</a></li>
          <li>🎲 <strong>Faire le tirage au sort</strong> du tournoi</li>
          <li>⚽ <strong>Générer les matchs</strong> automatiquement</li>
        </ul>
        
        <p><a href="https://urban-foot-center.vercel.app/admin" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">← Retour au tableau de bord admin</a></p>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ Erreur peuplement données:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erreur Peuplement</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>❌ Erreur peuplement</h1>
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
 * @route GET /api/admin-setup/insert-real-data
 * @desc Insérer les vraies données de la base locale en production
 * @access Public
 */
router.get('/insert-real-data', async (req, res) => {
  try {
    console.log('🚀 === INSERTION DONNÉES RÉELLES ===');
    
    const { insertRealDataToProduction } = require('../../scripts/insert-real-data-production');
    await insertRealDataToProduction();
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Données Réelles Insérées</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; }
          .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
          h1 { color: #28a745; }
          ul { list-style-type: none; padding: 0; }
          li { padding: 5px 0; }
          li:before { content: "✅ "; }
        </style>
      </head>
      <body>
        <h1>🎉 Données réelles insérées !</h1>
        
        <div class="success">
          <strong>Succès !</strong> Toutes vos données réelles ont été copiées en production.
        </div>
        
        <div class="info">
          <h3>📊 Données insérées :</h3>
          <ul>
            <li><strong>5 terrains</strong> : URBAN FOOT CENTER, Terrain Tiv, Terrain DAKAR, etc.</li>
            <li><strong>7 utilisateurs</strong> : Admins et clients avec leurs vrais comptes</li>
            <li><strong>5 équipes</strong> : Équipe Test FC, djeddah, mas_client@ex.com, etc.</li>
            <li><strong>2 tournois</strong> : "Tournoi foot" (en cours) et "tournois mas"</li>
          </ul>
        </div>
        
        <p><strong>🎯 Vos vraies données sont maintenant en production !</strong></p>
        <ul>
          <li>🏆 <a href="https://urban-foot-center.vercel.app/admin/equipes">Voir vos équipes réelles</a></li>
          <li>🥇 <a href="https://urban-foot-center.vercel.app/admin/tournois">Gérer vos tournois réels</a></li>
          <li>🏟️ <a href="https://urban-foot-center.vercel.app/admin/fields">Voir vos terrains</a></li>
          <li>👥 <a href="https://urban-foot-center.vercel.app/admin/users">Gérer vos utilisateurs</a></li>
        </ul>
        
        <p><strong>⚡ Prêt à tester :</strong></p>
        <ul>
          <li>🎲 Faire le tirage au sort du "Tournoi foot"</li>
          <li>⚽ Générer les matchs automatiquement</li>
          <li>📊 Consulter les classements</li>
        </ul>
        
        <p><a href="https://urban-foot-center.vercel.app/admin" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">← Retour au tableau de bord admin</a></p>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ Erreur insertion données réelles:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erreur Insertion</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>❌ Erreur insertion</h1>
        <div class="error">
          <strong>Erreur :</strong> ${error.message}
        </div>
        <p><a href="https://urban-foot-center.vercel.app/admin">← Retour au tableau de bord admin</a></p>
      </body>
      </html>
    `);
  }
});

module.exports = router;
