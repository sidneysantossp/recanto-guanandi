const express = require('express');
const { auth, adminAuth, proprietarioAuth, ownerOrAdmin } = require('../middleware/auth');
const {
  getAllBoletos,
  getBoletoById,
  createBoleto,
  updateBoleto,
  payBoleto,
  cancelBoleto,
  getBoletoStats,
  createBulkBoletos
} = require('../controllers/boletosController');

const router = express.Router();

// @route   GET /api/boletos
// @desc    Listar boletos (admin vê todos, proprietário vê apenas os seus)
// @access  Private
router.get('/', auth, getAllBoletos);

// @route   GET /api/boletos/:id
// @desc    Obter boleto por ID
// @access  Private (proprietário do boleto ou admin)
router.get('/:id', auth, getBoletoById);

// @route   POST /api/boletos
// @desc    Criar novo boleto (apenas admin)
// @access  Private/Admin
router.post('/', auth, adminAuth, createBoleto);

// @route   PUT /api/boletos/:id
// @desc    Atualizar boleto (apenas admin)
// @access  Private/Admin
router.put('/:id', auth, adminAuth, updateBoleto);

// @route   PUT /api/boletos/:id/pay
// @desc    Marcar boleto como pago
// @access  Private/Admin
router.put('/:id/pay', auth, adminAuth, payBoleto);


// @route   DELETE /api/boletos/:id
// @desc    Cancelar boleto (apenas admin)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, cancelBoleto);

// @route   GET /api/boletos/stats/dashboard
// @desc    Obter estatísticas dos boletos para dashboard
// @access  Private
router.get('/stats/dashboard', auth, getBoletoStats);

// @route   POST /api/boletos/bulk-create
// @desc    Criar boletos em lote (apenas admin)
// @access  Private/Admin
router.post('/bulk-create', auth, adminAuth, createBulkBoletos);

module.exports = router;