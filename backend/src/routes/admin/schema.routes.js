const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

/**
 * @route GET /api/admin/schema/fix-matchs-tournois
 * @desc Corrige le schéma de la table matchs_tournois en ajoutant les colonnes manquantes
 * @access Private (Super Admin only)
 */
router.get('/fix-matchs-tournois', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  try {
    console.log('🔧 CORRECTION SCHÉMA - matchs_tournois');
    console.log('Utilisateur:', req.user.email, 'Role:', req.user.role);

    const results = [];
    
    // Liste des colonnes à ajouter
    const alterations = [
      {
        name: 'groupe_poule',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS groupe_poule VARCHAR(1);',
        description: 'Groupe de poule (A, B, C, D...)'
      },
      {
        name: 'numero_match',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS numero_match INTEGER DEFAULT 1;',
        description: 'Numéro du match dans la phase'
      },
      {
        name: 'created_by',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS created_by UUID;',
        description: 'Utilisateur qui a créé le match'
      },
      {
        name: 'updated_by',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS updated_by UUID;',
        description: 'Utilisateur qui a modifié le match'
      },
      {
        name: 'score1_prolongation',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS score1_prolongation INTEGER;',
        description: 'Score équipe 1 en prolongation'
      },
      {
        name: 'score2_prolongation',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS score2_prolongation INTEGER;',
        description: 'Score équipe 2 en prolongation'
      },
      {
        name: 'tirs_au_but_equipe1',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS tirs_au_but_equipe1 INTEGER;',
        description: 'Tirs au but équipe 1'
      },
      {
        name: 'tirs_au_but_equipe2',
        sql: 'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS tirs_au_but_equipe2 INTEGER;',
        description: 'Tirs au but équipe 2'
      }
    ];

    console.log('🔧 Ajout des colonnes manquantes...');
    
    for (const alteration of alterations) {
      try {
        await sequelize.query(alteration.sql);
        results.push({
          column: alteration.name,
          status: 'success',
          message: 'Colonne ajoutée avec succès',
          description: alteration.description
        });
        console.log(`✅ ${alteration.name} - OK`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          results.push({
            column: alteration.name,
            status: 'exists',
            message: 'Colonne déjà existante',
            description: alteration.description
          });
          console.log(`⚠️  ${alteration.name} - Déjà existante`);
        } else {
          results.push({
            column: alteration.name,
            status: 'error',
            message: error.message,
            description: alteration.description
          });
          console.log(`❌ ${alteration.name} - Erreur: ${error.message}`);
        }
      }
    }

    // Vérifier le schéma final
    console.log('🔍 Vérification du schéma final...');
    const [schemaResults] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'matchs_tournois' 
      ORDER BY ordinal_position;
    `);

    const columns = schemaResults.map(r => ({
      name: r.column_name,
      type: r.data_type,
      nullable: r.is_nullable,
      default: r.column_default
    }));

    const requiredColumns = [
      'id', 'tournoi_id', 'phase', 'groupe_poule', 'numero_match',
      'equipe1_id', 'equipe2_id', 'score1', 'score2', 'statut',
      'winner_id', 'date_match', 'terrain_id', 'created_by', 'updated_by',
      'score1_prolongation', 'score2_prolongation', 
      'tirs_au_but_equipe1', 'tirs_au_but_equipe2',
      'arbitre', 'notes', 'created_at', 'updated_at'
    ];

    const presentColumns = columns.map(c => c.name);
    const missingColumns = requiredColumns.filter(col => !presentColumns.includes(col));
    
    const summary = {
      total_columns: columns.length,
      required_columns: requiredColumns.length,
      missing_columns: missingColumns.length,
      is_complete: missingColumns.length === 0
    };

    console.log('🎉 Correction terminée');

    res.json({
      success: true,
      message: 'Correction du schéma terminée',
      data: {
        alterations: results,
        schema: {
          columns: columns,
          missing_columns: missingColumns,
          summary: summary
        },
        timestamp: new Date().toISOString(),
        executed_by: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction du schéma:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la correction du schéma',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/admin/schema/check-matchs-tournois
 * @desc Vérifie le schéma de la table matchs_tournois sans modification
 * @access Private (Super Admin only)
 */
router.get('/check-matchs-tournois', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  try {
    console.log('🔍 VÉRIFICATION SCHÉMA - matchs_tournois');
    
    // Vérifier le schéma actuel
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'matchs_tournois' 
      ORDER BY ordinal_position;
    `);

    const columns = results.map(r => ({
      name: r.column_name,
      type: r.data_type,
      nullable: r.is_nullable === 'YES',
      default: r.column_default
    }));

    const requiredColumns = [
      'id', 'tournoi_id', 'phase', 'groupe_poule', 'numero_match',
      'equipe1_id', 'equipe2_id', 'score1', 'score2', 'statut',
      'winner_id', 'date_match', 'terrain_id', 'created_by', 'updated_by',
      'score1_prolongation', 'score2_prolongation', 
      'tirs_au_but_equipe1', 'tirs_au_but_equipe2',
      'arbitre', 'notes', 'created_at', 'updated_at'
    ];

    const presentColumns = columns.map(c => c.name);
    const missingColumns = requiredColumns.filter(col => !presentColumns.includes(col));
    
    const summary = {
      total_columns: columns.length,
      required_columns: requiredColumns.length,
      missing_columns: missingColumns.length,
      is_complete: missingColumns.length === 0,
      needs_fix: missingColumns.length > 0
    };

    res.json({
      success: true,
      message: 'Vérification du schéma terminée',
      data: {
        table: 'matchs_tournois',
        columns: columns,
        missing_columns: missingColumns,
        summary: summary,
        fix_url: missingColumns.length > 0 ? '/api/admin/schema/fix-matchs-tournois' : null,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du schéma',
      error: error.message
    });
  }
});

module.exports = router;
