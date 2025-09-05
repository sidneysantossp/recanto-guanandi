const express = require('express');
const { auth, adminAuth, ownerOrAdmin } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  toggleUserStatus
} = require('../controllers/usersController');

const router = express.Router();

// @route   GET /api/users
// @desc    Listar todos os usuários (apenas admin)
// @access  Private/Admin
router.get('/', auth, adminAuth, getAllUsers);

// @route   GET /api/users/:id
// @desc    Obter usuário por ID
// @access  Private (próprio usuário ou admin)
router.get('/:id', auth, ownerOrAdmin, getUserById);

// @route   POST /api/users
// @desc    Criar novo usuário (apenas admin)
// @access  Private/Admin
router.post('/', auth, adminAuth, createUser);

// @route   PUT /api/users/:id
// @desc    Atualizar usuário
// @access  Private (próprio usuário ou admin)
router.put('/:id', auth, ownerOrAdmin, updateUser);

// @route   DELETE /api/users/:id
// @desc    Deletar usuário (apenas admin)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, deleteUser);

// @route   PUT /api/users/:id/reset-password
// @desc    Resetar senha do usuário (apenas admin)
// @access  Private/Admin
router.put('/:id/reset-password', auth, adminAuth, resetPassword);

// @route   PUT /api/users/:id/toggle-status
// @desc    Ativar/Desativar usuário (apenas admin)
// @access  Private/Admin
router.put('/:id/toggle-status', auth, adminAuth, toggleUserStatus);

module.exports = router;