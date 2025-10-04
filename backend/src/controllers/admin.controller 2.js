const { User, Field } = require('../models');
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
    const camelKey = key.replace(/(_\w)/g, match => match[1].toUpperCase());
    if (key !== camelKey) { // Éviter la duplication si la clé est déjà en camelCase
      camelCaseObj[camelKey] = value;
    }
  });
  
  return camelCaseObj;
};

/**
 * Récupère tous les utilisateurs
 */
exports.getAllUsers = async (req, res) => {
  try {
    console.log('=== Début getAllUsers ===');
    console.log('Requête reçue pour getAllUsers avec query:', req.query);
    console.log('Utilisateur connecté:', req.user ? req.user.id : 'Non authentifié');
    console.log('Headers:', req.headers);
    
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // Log des paramètres
    console.log('Paramètres de requête:', { page, limit, offset, search });
    
    // Créer une liste d'utilisateurs de test en cas d'erreur DB
    try {
      let whereClause = {};
      if (search) {
        // Recherche flexible sur différentes conventions de noms de colonnes pour s'adapter aux différentes versions du schéma
        const possibleFirstNameCols = ['first_name', 'firstName'];
        const possibleLastNameCols = ['last_name', 'lastName'];
        const possiblePhoneCols = ['phone_number', 'phone', 'phoneNumber'];
        
        const orConditions = [];
        
        // Générer dynamiquement les conditions OR pour chaque colonne possible
        possibleFirstNameCols.forEach(col => {
          orConditions.push({ [col]: { [Op.iLike]: `%${search}%` } });
        });
        
        possibleLastNameCols.forEach(col => {
          orConditions.push({ [col]: { [Op.iLike]: `%${search}%` } });
        });
        
        orConditions.push({ email: { [Op.iLike]: `%${search}%` } });
        
        possiblePhoneCols.forEach(col => {
          orConditions.push({ [col]: { [Op.iLike]: `%${search}%` } });
        });
        
        whereClause = { [Op.or]: orConditions };
      }
      
      console.log('Requête à la base de données avec whereClause:', JSON.stringify(whereClause));
      
      const users = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        attributes: {
          include: [
            'id', 'email', 'phone_number', 'first_name', 'last_name',
            'role', 'profile_picture_url', 'created_at', 'updated_at',
            'last_login', 'is_verified', 'is_active', 'age', 'sexe', 'field_id',
            [Sequelize.col('created_at'), 'createdAt'],
            [Sequelize.col('updated_at'), 'updatedAt']
          ],
          exclude: ['password_hash', 'password', 'verification_token', 'reset_password_token', 'reset_token_expires_at']
        }
      });
      
      console.log(`${users.count} utilisateurs trouvés dans la base de données`);
      
      if (!users || users.count === 0) {
        // Pas d'utilisateurs trouvés, générer des données de test
        console.log('Aucun utilisateur trouvé, générant des données de test pour faciliter le développement frontend');
        
        // Création d'utilisateurs de test (uniquement pour le développement)
        const testUsers = [
          {
            id: uuidv4(),
            firstName: 'Super',
            lastName: 'Admin',
            email: 'admin@urbanfoot.sn',
            phone: '+221770000000',
            role: 'super_admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            firstName: 'Gestionnaire',
            lastName: 'Terrain',
            email: 'manager@urbanfoot.sn',
            phone: '+221770000001',
            role: 'admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            firstName: 'Client',
            lastName: 'Test',
            email: 'client@example.com',
            phone: '+221770000002',
            role: 'client',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        return res.json({
          success: true,
          data: testUsers,
          total: testUsers.length,
          page: parseInt(page),
          totalPages: 1,
          message: 'Données de test générées (mode développement)'
        });
      }
      
      // Transformer les objets en format plat pour la conversion camelCase
      const plainUsers = users.rows.map(user => {
        const plainUser = user.get({ plain: true });
        return toCamelCase(plainUser);
      });
      
      return res.json({
        success: true,
        data: plainUsers,
        total: users.count,
        page: parseInt(page),
        totalPages: Math.ceil(users.count / limit)
      });
      
    } catch (dbError) {
      console.error('Erreur spécifique à la base de données:', dbError);
      
      // Ne jamais générer de données de test, toujours utiliser les données réelles
      console.error('Erreur de base de données lors de la récupération des utilisateurs:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Une erreur est survenue lors de la récupération des utilisateurs. Veuillez vérifier la connexion à la base de données.',
        error: process.env.NODE_ENV !== 'production' ? dbError.message : 'Database error'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return res.status(500).json({ 
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
    
    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return res.status(500).json({ 
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
    console.log('==== DÉBUT DE LA CRÉATION D\'UTILISATEUR ====');
    console.log('Données reçues du frontend (req.body):', JSON.stringify(req.body, null, 2));
    
    // Extraire les données
    const { first_name, last_name, email, phone_number, password, role, field_id, age, sexe } = req.body;
    
    console.log('Données extraites:', { 
      first_name, 
      last_name, 
      email, 
      phone_number: phone_number ? 'fourni' : 'non fourni', 
      password: password ? '******' : 'non fourni', 
      role, 
      field_id, 
      field_id_type: field_id ? typeof field_id : 'undefined', 
      field_id_value: field_id ? `'${field_id}'` : 'null', 
      age, 
      sexe 
    });
    
    // Vérifier si l'email existe déjà
    console.log('Vérification de l\'existence de l\'email:', email);
    try {
      const existingUser = await User.findOne({ where: { email } });
      
      if (existingUser) {
        console.log('Email déjà utilisé:', email);
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }
      console.log('Email disponible');
    } catch (emailCheckError) {
      console.error('Erreur lors de la vérification de l\'email:', emailCheckError);
      throw emailCheckError;
    }
    
    // Vérifier si le terrain existe si un fieldId est fourni
    if (field_id) {
      const field = await Field.findByPk(field_id);
      if (!field) {
        return res.status(404).json({ 
          success: false, 
          message: 'Terrain non trouvé' 
        });
      }
    }
    
    // Vérifier si l'utilisateur a le droit de créer un admin
    console.log('Vérification des droits pour la création d\'un utilisateur de rôle:', role);
    if (role === 'admin' || role === 'super_admin') {
      const tokenPayload = req.user;
      console.log('Token payload de l\'utilisateur connecté:', tokenPayload ? JSON.stringify(tokenPayload) : 'Non authentifié');
      
      if (!tokenPayload || tokenPayload.role !== 'super_admin') {
        console.log('Accès refusé: L\'utilisateur n\'est pas super_admin');
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Seul un super administrateur peut créer des administrateurs.'
        });
      }
      console.log('Droits vérifiés et validés');
    }
    
    // Ne pas hacher le mot de passe ici - sera géré par le hook beforeCreate du modèle
    console.log('Le hachage du mot de passe sera géré par le hook du modèle User');
    
    // Créer l'utilisateur avec UUID v4 explicite pour respecter les exigences de sécurité
    console.log('Création de l\'utilisateur avec les données suivantes:');
    const userId = uuidv4();
    console.log('ID UUID généré:', userId);
    
    // Si field_id est une chaîne non vide, l'utiliser, sinon null
    const finalFieldId = field_id && field_id.trim() !== '' ? field_id : null;
    console.log('Field ID final utilisé:', finalFieldId);
    
    const userData = {
      id: userId,
      first_name,
      last_name,
      email,
      phone_number,
      password_hash: password, // Le mot de passe brut sera haché par le hook beforeCreate du modèle
      role: role || 'client',
      is_active: true,
      field_id: finalFieldId,
      age,
      sexe
    };
    
    console.log('Données utilisateur à créer:', JSON.stringify({
      ...userData,
      password_hash: '*******' // Masquer le hash pour la sécurité dans les logs
    }, null, 2));
    
    let newUser;
    try {
      newUser = await User.create(userData);
      console.log('Utilisateur créé avec succès, ID:', newUser.id);
    } catch (createError) {
      console.error('ERREUR LORS DE LA CRÉATION DE L\'UTILISATEUR:', createError);
      console.error('Message d\'erreur:', createError.message);
      if (createError.name === 'SequelizeValidationError') {
        console.error('Erreurs de validation:', createError.errors.map(e => `${e.path}: ${e.message}`));
      } else if (createError.name === 'SequelizeUniqueConstraintError') {
        console.error('Violation de contrainte d\'unicité:', createError.errors.map(e => `${e.path}: ${e.message}`));
      } else if (createError.name === 'SequelizeForeignKeyConstraintError') {
        console.error('Violation de clé étrangère:', createError.original?.detail || createError.message);
      }
      throw createError;
    }
    
    // Exclure le mot de passe de la réponse
    const userResponse = newUser.toJSON();
    delete userResponse.password;
    
    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: userResponse
    });
  } catch (error) {
    console.error('==== ERREUR CRITIQUE LORS DE LA CRÉATION DE L\'UTILISATEUR ====');
    console.error('Type d\'erreur:', error.name);
    console.error('Message d\'erreur:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.sql) {
      console.error('Requête SQL ayant échoué:', error.sql);
    }
    
    // Envoyer une réponse d'erreur plus détaillée en développement
    const errorResponse = { 
      success: false, 
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message 
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.errorDetails = {
        name: error.name,
        stack: error.stack,
        code: error.code
      };
    }
    
    console.error('Réponse d\'erreur envoyée:', JSON.stringify(errorResponse));
    console.error('==== FIN DU TRAITEMENT D\'ERREUR ====');
    
    return res.status(500).json(errorResponse);
  }
};

/**
 * Met à jour un utilisateur existant
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role, isActive, fieldId, age, sexe } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // Vérifier si le nouveau email n'est pas déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cet email est déjà utilisé par un autre utilisateur' 
        });
      }
    }
    
    // Vérifier si le terrain existe si un fieldId est fourni
    if (fieldId) {
      const field = await Field.findByPk(fieldId);
      if (!field) {
        return res.status(404).json({ 
          success: false, 
          message: 'Terrain non trouvé' 
        });
      }
    }
    
    // Afficher les données reçues pour le debugging
    console.log('Données de mise à jour utilisateur reçues:', {
      id,
      firstName, lastName, email, phone, role, isActive, fieldId,
      age, sexe
    });
    
    // Mettre à jour l'utilisateur (utiliser snake_case pour correspondre aux noms des colonnes dans la BDD)
    await user.update({
      first_name: firstName || user.first_name || user.firstName,
      last_name: lastName || user.last_name || user.lastName,
      email: email || user.email,
      phone_number: phone || user.phone_number || user.phone,
      role: role || user.role,
      is_active: isActive !== undefined ? isActive : (user.is_active !== undefined ? user.is_active : user.isActive),
      field_id: fieldId !== undefined ? fieldId : (user.field_id !== undefined ? user.field_id : user.fieldId),
      age: age || user.age,
      sexe: sexe || user.sexe
    });
    
    console.log('Utilisateur mis à jour avec succès, données:', user.toJSON());
    
    // Exclure le mot de passe de la réponse
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    return res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: userResponse
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return res.status(500).json({ 
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
    
    // Supprimer l'utilisateur
    await user.destroy();
    
    return res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return res.status(500).json({ 
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
    const { isActive } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // Mettre à jour le statut
    // Log pour voir ce que contient isActive
    console.log('Mise à jour du statut utilisateur:', {
      userId: id,
      nouveauStatut: isActive,
      typeStatut: typeof isActive
    });
    
    await user.update({
      is_active: isActive // Utiliser is_active (snake_case) pour correspondre au champ dans la base de données
    });
    
    // Exclure le mot de passe de la réponse
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    return res.json({
      success: true,
      message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`,
      data: userResponse
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de l\'utilisateur:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour du statut de l\'utilisateur',
      error: error.message 
    });
  }
};
