const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Gestion des employés pour les admins de terrain
const createEmployee = async (req, res) => {
  try {
    console.log('🔍 createEmployee - Début création employé');
    console.log('📋 Données reçues:', {
      body: req.body,
      adminUser: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
        field_id: req.user?.field_id
      }
    });

    const {
      first_name,
      last_name,
      email,
      phone_number,
      password,
      role = 'employee'
    } = req.body;

    const adminUser = req.user;

    // Vérifier que l'utilisateur est un admin de terrain avec un field_id
    if (adminUser.role !== 'admin' || !adminUser.field_id) {
      console.log('❌ createEmployee - Accès refusé:', {
        role: adminUser.role,
        field_id: adminUser.field_id
      });
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs de terrain peuvent créer des employés'
      });
    }

    // Validation des champs obligatoires
    if (!first_name || !last_name || !email || !password) {
      console.log('❌ createEmployee - Champs manquants:', {
        first_name: !!first_name,
        last_name: !!last_name,
        email: !!email,
        password: !!password
      });
      return res.status(400).json({
        success: false,
        message: 'Les champs prénom, nom, email et mot de passe sont obligatoires'
      });
    }

    // Vérifier que l'email n'existe pas déjà
    console.log('🔍 createEmployee - Vérification email existant:', email);
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('❌ createEmployee - Email existe déjà:', email);
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // SOLUTION DÉFINITIVE : Création directe avec SQL pour éviter les hooks
    console.log('🔐 createEmployee - Hashage du mot de passe (méthode définitive)...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ createEmployee - Mot de passe hashé avec bcrypt.hash(password, 12)');

    // Utiliser une requête SQL directe pour éviter les problèmes de hooks Sequelize
    console.log('💾 createEmployee - Création via SQL direct pour garantir la cohérence...');
    
    const employeeId = require('uuid').v4();
    const now = new Date();
    
    const [newEmployee] = await User.sequelize.query(`
      INSERT INTO users (
        id, first_name, last_name, email, phone_number, password_hash, 
        role, field_id, is_active, is_verified, created_at, updated_at
      ) VALUES (
        :id, :first_name, :last_name, :email, :phone_number, :password_hash,
        :role, :field_id, :is_active, :is_verified, :created_at, :updated_at
      ) RETURNING *;
    `, {
      replacements: {
        id: employeeId,
        first_name,
        last_name,
        email,
        phone_number: phone_number || null,
        password_hash: hashedPassword,
        role: 'employee',
        field_id: adminUser.field_id,
        is_active: true,
        is_verified: true,
        created_at: now,
        updated_at: now
      },
      type: User.sequelize.QueryTypes.SELECT
    });

    console.log('✅ createEmployee - Employé créé via SQL direct avec ID:', employeeId);

    // Retourner l'employé créé sans le mot de passe
    const { password_hash: _, ...employeeData } = newEmployee[0];

    res.status(201).json({
      success: true,
      message: 'Employé créé avec succès',
      data: employeeData
    });

  } catch (error) {
    console.log('🚨 === ERREUR CRÉATION EMPLOYÉ ===');
    console.error('Erreur complète:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Erreurs spécifiques de base de données
    if (error.name === 'SequelizeValidationError') {
      console.log('❌ Erreur de validation Sequelize:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation des données',
        details: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('❌ Erreur contrainte unique:', error.fields);
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec ces informations existe déjà',
        field: Object.keys(error.fields)[0]
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      console.log('❌ Erreur base de données:', error.original?.message);
      return res.status(500).json({
        success: false,
        message: 'Erreur de base de données',
        details: process.env.NODE_ENV === 'development' ? error.original?.message : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de la création de l\'employé',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Récupérer tous les employés du terrain de l'admin
const getEmployees = async (req, res) => {
  try {
    const adminUser = req.user;

    // Vérifier que l'utilisateur est un admin de terrain avec un field_id
    if (adminUser.role !== 'admin' || !adminUser.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs de terrain peuvent voir leurs employés'
      });
    }

    // Récupérer les employés du terrain
    const employees = await User.findAll({
      where: {
        role: 'employee',
        field_id: adminUser.field_id
      },
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_password_token', 'reset_token_expires_at'] },
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: employees
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des employés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de la récupération des employés'
    });
  }
};

// Supprimer un employé
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    // Vérifier que l'utilisateur est un admin de terrain avec un field_id
    if (adminUser.role !== 'admin' || !adminUser.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs de terrain peuvent supprimer leurs employés'
      });
    }

    // Trouver l'employé
    const employee = await User.findOne({
      where: {
        id,
        role: 'employee',
        field_id: adminUser.field_id
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé ou vous n\'avez pas les droits pour le supprimer'
      });
    }

    // Supprimer l'employé
    await employee.destroy();

    res.status(200).json({
      success: true,
      message: 'Employé supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'employé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de la suppression de l\'employé'
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  deleteEmployee
};
