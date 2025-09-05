const express = require('express');
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Registrar novo usuário
// @access  Public (apenas para admins criarem proprietários)
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login do usuário
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/login
// @desc    Informativo: rota aceita apenas POST para login
// @access  Public
router.get('/login', (req, res) => {
  res.status(405).json({
    success: false,
    message: 'Use POST para /api/auth/login',
    method: 'POST',
  });
});

// @route   GET /api/auth/me
// @desc    Obter perfil do usuário logado
// @access  Private
router.get('/me', auth, getProfile);

// @route   PUT /api/auth/update-profile
// @desc    Atualizar perfil do usuário
// @access  Private
router.put('/update-profile', auth, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Alterar senha do usuário
// @access  Private
router.put('/change-password', auth, changePassword);

module.exports = router;