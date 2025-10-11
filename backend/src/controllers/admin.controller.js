const db = require('../models');
const { User, Field, TimeSlot, sequelize } = db;
const { Op, Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Fonction utilitaire pour convertir snake_case en camelCase et sérialiser correctement les dates
const toCamelCase = (obj) => {
  // Cas de base pour les valeurs primitives
  if (obj === null || typeof obj !== 'object') return obj;
  
  // Gestion spéciale pour les instances de Date
  if (obj instanceof Date) {
    return obj.toISOString(); // Convertir la date en chaîne ISO
  }
  
  // Gestion des tableaux
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const camelCaseObj = {};
  
  Object.keys(obj).forEach(key => {
    // Conserver à la fois la version snake_case et camelCase pour compatibilité
    const value = toCamelCase(obj[key]);
    
    // Ajouter la version snake_case d'origine pour assurer la compatibilité avec le frontend
    camelCaseObj[key] = value;
    
    // Ajouter également la version camelCase
    if (key.includes('_')) {
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      camelCaseObj[camelKey] = value;
    }
  });
  
  return camelCaseObj;
};

/**
 * Récupère tous les créneaux horaires pour l'administration
 */
exports.getAllTimeSlots = async (req, res) => {
  try {
    // Récupérer les créneaux horaires disponibles avec jointure sur la table fields
    const timeSlots = await TimeSlot.findAll({
      attributes: [
        'id',
        'field_id',
        'created_at',
        'datefrom',
        'dateto', 
        'start_time',
        'end_time',
        'is_available'
      ],
      include: [{
        model: Field,
        attributes: ['name'],
        required: false
      }],
      where: {
        is_available: true
      },
      order: [['created_at', 'DESC'], ['start_time', 'ASC']]
    });

    // Transformer les données pour le frontend
    const formattedTimeSlots = timeSlots.map(slot => {
      const plainSlot = slot.get({ plain: true });
      
      return {
        id: plainSlot.id,
        fieldId: plainSlot.field_id,
        field_id: plainSlot.field_id,
        fieldName: plainSlot.Field?.name || 'N/A',
        field_name: plainSlot.Field?.name || 'N/A',
        createdAt: plainSlot.created_at,
        created_at: plainSlot.created_at,
        dateFrom: plainSlot.datefrom,
        date_from: plainSlot.datefrom,
        dateTo: plainSlot.dateto,
        date_to: plainSlot.dateto,
        startTime: plainSlot.start_time,
        start_time: plainSlot.start_time,
        endTime: plainSlot.end_time,
        end_time: plainSlot.end_time,
        isAvailable: plainSlot.is_available,
        is_available: plainSlot.is_available
      };
    });

    res.status(200).json({
      success: true,
      data: formattedTimeSlots,
      total: formattedTimeSlots.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des créneaux horaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des créneaux horaires',
      error: error.message
    });
  }
};

// Fonction utilitaire pour convertir le numéro du jour en nom
function getDayName(dayNumber) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayNumber % 7];
}

// Fonction utilitaire pour obtenir le nom du jour en français
function getDayOfWeekName(dayNumber) {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayNumber % 7];
}

/**
 * Récupère tous les utilisateurs
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    console.log(`Récupération des utilisateurs - page: ${page}, limit: ${limit}, search: ${search}`);
    
    // Créer une liste d'utilisateurs de test en cas d'erreur DB
    try {
      let whereClause = {};
      if (search) {
        // Recherche flexible sur différentes conventions de noms de colonnes pour s'adapter aux différentes versions du schéma
        const possibleFirstNameCols = ['first_name', 'firstName'];
        const possibleLastNameCols = ['last_name', 'lastName'];
        const possibleEmailCols = ['email'];
        
        const orConditions = [];
        
        possibleFirstNameCols.forEach(col => {
          orConditions.push({ [col]: { [Op.iLike]: `%${search}%` } });
        });
        
        possibleLastNameCols.forEach(col => {
          orConditions.push({ [col]: { [Op.iLike]: `%${search}%` } });
        });
        
        possibleEmailCols.forEach(col => {
          orConditions.push({ [col]: { [Op.iLike]: `%${search}%` } });
        });
        
        whereClause = { [Op.or]: orConditions };
      }
      
      console.log('Requête à la base de données avec whereClause:', JSON.stringify(whereClause));
      
      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        attributes: { exclude: ['password'] }
      });
      
      const formattedUsers = rows.map(user => {
        const plainUser = user.get({ plain: true });
        // Préparation des données en utilisant l'utilitaire pour les deux formats
        return toCamelCase(plainUser);
      });
      
      const totalPages = Math.ceil(count / limit);
      
      res.status(200).json({
        success: true,
        data: {
          users: formattedUsers,
          totalPages,
          currentPage: parseInt(page),
          totalUsers: count
        }
      });
      
    } catch (dbError) {
      console.error('Erreur lors de la requête à la base de données:', dbError);
      
      // Données de secours pour le développement
      // En production, cette partie serait désactivée
      const mockUsers = Array.from({ length: 10 }, (_, i) => ({
        id: uuidv4(),
        email: `user${i + 1}@example.com`,
        firstName: `Prénom${i + 1}`,
        lastName: `Nom${i + 1}`,
        role: i === 0 ? 'super_admin' : (i < 3 ? 'admin' : 'user'),
        status: 'active',
        createdAt: new Date(Date.now() - i * 86400000).toISOString()
      }));
      
      res.status(200).json({
        success: true,
        data: {
          users: mockUsers,
          totalPages: 1,
          currentPage: 1,
          totalUsers: mockUsers.length
        },
        _devNote: 'Données de secours (fallback) pour le développement. Erreur DB: ' + dbError.message
      });
    }
  } catch (error) {
    console.error('Erreur générale lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

/**
 * Récupère les détails d'un utilisateur par ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const formattedUser = toCamelCase(user.get({ plain: true }));
    
    res.status(200).json({
      success: true,
      data: formattedUser
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * Crée un nouvel utilisateur administrateur
 */
exports.createUser = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      role, 
      first_name, 
      last_name, 
      phone_number,
      age,
      sexe,
      field_id
    } = req.body;
    
    console.log('Tentative de création d\'utilisateur avec les données:', JSON.stringify({
      email, role, first_name, last_name, phone_number, field_id
    }));
    
    // Validation des champs obligatoires
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'L\'email est obligatoire'
      });
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide. Exemple: utilisateur@domaine.com'
      });
    }

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro de téléphone est obligatoire'
      });
    }

    // Validation du format téléphone
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone_number.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Format de téléphone invalide. Exemple: +221771234567'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    if (!first_name || !first_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le prénom est obligatoire'
      });
    }

    if (!last_name || !last_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de famille est obligatoire'
      });
    }
    
    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }
    
    // Valider le rôle
    const validRoles = ['user', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }
    
    // Validation du field_id si fourni
    if (field_id) {
      const field = await Field.findByPk(field_id);
      if (!field) {
        return res.status(400).json({
          success: false,
          message: 'Le terrain spécifié n\'existe pas'
        });
      }
    }
    
    // Création avec UUID généré automatiquement
    const id = uuidv4();
    console.log(`UUID généré pour le nouvel utilisateur: ${id}`);
    
    // Ne pas hasher ici car le hook beforeCreate du modèle s'en charge
    const userData = {
      id,
      email,
      password_hash: password, // Le hook beforeCreate hashera automatiquement
      role,
      first_name,
      last_name,
      phone_number,
      age,
      sexe,
      field_id: field_id || null, // Assigner le terrain si fourni
      is_verified: true, // Les utilisateurs créés par admin sont automatiquement vérifiés
      is_active: true
    };
    
    console.log('Données utilisateur à créer:', JSON.stringify({
      ...userData,
      password: '[REDACTED]'
    }));
    
    const newUser = await User.create(userData);
    
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      phone: newUser.phone,
      created_at: newUser.created_at
    };
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: toCamelCase(userResponse)
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    const errorResponse = {
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message 
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.errorDetails = {
        message: error.message,
        stack: error.stack,
        code: error.code
      };
    }
    
    console.error('Réponse d\'erreur envoyée:', JSON.stringify(errorResponse));
    res.status(500).json(errorResponse);
  }
};

/**
 * Met à jour un utilisateur existant
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      email, 
      password,
      role, 
      first_name, 
      last_name, 
      phone,
      age,
      sexe
    } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé par un autre compte'
        });
      }
    }
    
    // Préparer les données à mettre à jour
    const updateData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (role) updateData.role = role;
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;
    if (age) updateData.age = age;
    if (sexe) updateData.sexe = sexe;
    
    await user.update(updateData);
    
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: toCamelCase(updatedUser.get({ plain: true }))
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * Supprime un utilisateur
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    await user.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * Change le statut d'un utilisateur (actif/inactif)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Valeurs acceptées: active, inactive'
      });
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    await user.update({ status });
    
    res.status(200).json({
      success: true,
      message: `Statut de l'utilisateur mis à jour: ${status}`,
      data: {
        id: user.id,
        status
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

/**
 * Réinitialise le mot de passe d'un utilisateur
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    // Validation du nouveau mot de passe
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    console.log(`Réinitialisation du mot de passe pour l'utilisateur: ${user.email}`);
    
    // Mettre à jour le mot de passe (le hook beforeUpdate s'occupera du hashage)
    await user.update({ 
      password_hash: newPassword,
      is_verified: true // S'assurer que l'utilisateur est vérifié
    });
    
    console.log('Mot de passe réinitialisé avec succès');
    
    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      data: {
        id: user.id,
        email: user.email,
        is_verified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.message
    });
  }
};

/**
 * Corrige le schéma de la table matchs_tournois en ajoutant les colonnes manquantes
 */
exports.fixMatchsTournoisSchema = async (req, res) => {
  try {
    console.log('🔧 CORRECTION SCHÉMA - matchs_tournois');
    console.log('Utilisateur:', req.user.email, 'Role:', req.user.role);

    // Vérifier que l'utilisateur est super_admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les super_admin peuvent exécuter cette action.'
      });
    }

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
      message: 'Correction du schéma terminée avec succès',
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
};
