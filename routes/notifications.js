const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  publishNotification,
  addComment,
  archiveNotification,
  getNotificationStats
} = require('../controllers/notificationsController');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Listar notificações (admin vê todas, proprietário vê as destinadas a ele)
// @access  Private
router.get('/', auth, getAllNotifications);

// @route   GET /api/notifications/:id
// @desc    Obter notificação por ID
// @access  Private
router.get('/:id', auth, getNotificationById);

// @route   POST /api/notifications
// @desc    Criar nova notificação (apenas admin)
// @access  Private/Admin
router.post('/', auth, adminAuth, createNotification);

// @route   PUT /api/notifications/:id
// @desc    Atualizar notificação (apenas admin)
// @access  Private/Admin
router.put('/:id', auth, adminAuth, updateNotification);

// @route   PUT /api/notifications/:id/publish
// @desc    Publicar notificação (apenas admin)
// @access  Private/Admin
router.put('/:id/publish', auth, adminAuth, publishNotification);

// @route   POST /api/notifications/:id/comments
// @desc    Adicionar comentário à notificação
// @access  Private
router.post('/:id/comments', auth, addComment);

// @route   DELETE /api/notifications/:id
// @desc    Arquivar notificação (apenas admin)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, archiveNotification);

// @route   GET /api/notifications/stats/dashboard
// @desc    Obter estatísticas de notificações para dashboard
// @access  Private/Admin
router.get('/stats/dashboard', auth, adminAuth, getNotificationStats);

module.exports = router;