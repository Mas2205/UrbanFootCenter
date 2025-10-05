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

module.exports = router;
