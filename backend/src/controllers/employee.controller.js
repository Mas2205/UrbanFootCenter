const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Gestion des employés pour les admins de terrain
const createEmployee = async (req, res) => {
  try {
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
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs de terrain peuvent créer des employés'
      });
    }

    // Validation des champs obligatoires
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Les champs prénom, nom, email et mot de passe sont obligatoires'
      });
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer l'employé avec le field_id de l'admin
    // Le mot de passe sera hashé automatiquement par le hook beforeCreate du modèle User
    const newEmployee = await User.create({
      first_name,
      last_name,
      email,
      phone_number: phone_number || null,
      password_hash: password, // Passer le mot de passe en clair, il sera hashé par le hook
      role: 'employee',
      field_id: adminUser.field_id,
      is_active: true,
      is_verified: true
    });

    // Retourner l'employé créé sans le mot de passe
    const { password_hash: _, ...employeeData } = newEmployee.toJSON();

    res.status(201).json({
      success: true,
      message: 'Employé créé avec succès',
      data: employeeData
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'employé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de la création de l\'employé'
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
