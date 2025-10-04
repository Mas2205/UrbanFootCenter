const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { 
  createEmployee,
  getEmployees,
  deleteEmployee
} = require('../controllers/employee.controller');

/**
 * @route POST /api/admin/employees
 * @desc Créer un nouvel employé (admin de terrain uniquement)
 * @access Private (Admin)
 */
router.post('/', authMiddleware, adminMiddleware, createEmployee);

/**
 * @route GET /api/admin/employees
 * @desc Récupérer tous les employés du terrain de l'admin
 * @access Private (Admin)
 */
router.get('/', authMiddleware, adminMiddleware, getEmployees);

/**
 * @route DELETE /api/admin/employees/:id
 * @desc Supprimer un employé
 * @access Private (Admin)
 */
router.delete('/:id', authMiddleware, adminMiddleware, deleteEmployee);

module.exports = router;
