const express = require('express');
const Notification = require('../models/Notification');
const { auth, adminAuth } = require('../middleware/auth');
const { isConfigured: mailerConfigured, sendMail } = require('../utils/mailer');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Listar notificações (admin vê todas, proprietário vê as destinadas a ele)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, tipo, status } = req.query;
    
    let filtros = {};
    
    // Se não for admin, mostrar apenas notificações destinadas ao usuário
    if (req.user.tipo !== 'admin') {
      filtros = {
        $or: [
          { 'destinatarios.tipo': 'todos' },
          { 'destinatarios.usuarios': req.user._id },
          { 
            'destinatarios.tipo': req.user.situacao === 'inadimplente' ? 'inadimplentes' : 'ativos'
          }
        ],
        status: 'publicado'
      };
    }
    
    if (tipo) filtros.tipo = tipo;
    if (status && req.user.tipo === 'admin') filtros.status = status;
    
    const notificacoes = await Notification.find(filtros)
      .populate('autor', 'nome')
      .populate('destinatarios.usuarios', 'nome email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dataPublicacao: -1 });
    
    // Marcar visualizações para proprietários
    if (req.user.tipo === 'proprietario') {
      for (let notificacao of notificacoes) {
        if (!notificacao.foiLidaPor(req.user._id)) {
          await notificacao.marcarComoLida(req.user._id);
        }
      }
    }
    
    const total = await Notification.countDocuments(filtros);
    
    res.json({
      success: true,
      data: notificacoes,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/notifications/:id
// @desc    Obter notificação por ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const notificacao = await Notification.findById(req.params.id)
      .populate('autor', 'nome email')
      .populate('destinatarios.usuarios', 'nome email')
      .populate('leituras.usuario', 'nome')
      .populate('comentarios.usuario', 'nome');
    
    if (!notificacao) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }
    
    // Verificar se proprietário pode acessar esta notificação
    if (req.user.tipo === 'proprietario') {
      const podeAcessar = 
        notificacao.destinatarios.tipo === 'todos' ||
        notificacao.destinatarios.usuarios.some(u => u._id.toString() === req.user._id.toString()) ||
        (notificacao.destinatarios.tipo === 'inadimplentes' && req.user.situacao === 'inadimplente') ||
        (notificacao.destinatarios.tipo === 'ativos' && req.user.situacao === 'ativo');
      
      if (!podeAcessar || notificacao.status !== 'publicado') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }
      
      // Marcar como lida
      if (!notificacao.foiLidaPor(req.user._id)) {
        await notificacao.marcarComoLida(req.user._id);
      }
    }
    
    res.json({
      success: true,
      data: notificacao
    });
    
  } catch (error) {
    console.error('Erro ao obter notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/notifications
// @desc    Criar nova notificação (apenas admin)
// @access  Private/Admin
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const {
      titulo,
      conteudo,
      tipo,
      prioridade,
      destinatarios,
      dataExpiracao,
      configuracoes
    } = req.body;
    
    const novaNotificacao = new Notification({
      titulo,
      conteudo,
      tipo,
      prioridade,
      destinatarios,
      autor: req.user._id,
      dataExpiracao: dataExpiracao ? new Date(dataExpiracao) : null,
      configuracoes
    });
    
    await novaNotificacao.save();
    
    const notificacaoCompleta = await Notification.findById(novaNotificacao._id)
      .populate('autor', 'nome email')
      .populate('destinatarios.usuarios', 'nome email');
    
    res.status(201).json({
      success: true,
      message: 'Notificação criada com sucesso',
      data: notificacaoCompleta
    });
    
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// @route   PUT /api/notifications/:id
// @desc    Atualizar notificação (apenas admin)
// @access  Private/Admin
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const {
      titulo,
      conteudo,
      tipo,
      prioridade,
      destinatarios,
      dataExpiracao,
      configuracoes
    } = req.body;
    
    const notificacao = await Notification.findById(req.params.id);
    if (!notificacao) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }
    
    if (titulo) notificacao.titulo = titulo;
    if (conteudo) notificacao.conteudo = conteudo;
    if (tipo) notificacao.tipo = tipo;
    if (prioridade) notificacao.prioridade = prioridade;
    if (destinatarios) notificacao.destinatarios = destinatarios;
    if (dataExpiracao) notificacao.dataExpiracao = new Date(dataExpiracao);
    if (configuracoes) notificacao.configuracoes = { ...notificacao.configuracoes, ...configuracoes };
    
    await notificacao.save();
    
    const notificacaoAtualizada = await Notification.findById(notificacao._id)
      .populate('autor', 'nome email')
      .populate('destinatarios.usuarios', 'nome email');
    
    res.json({
      success: true,
      message: 'Notificação atualizada com sucesso',
      data: notificacaoAtualizada
    });
    
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/notifications/:id/publish
// @desc    Publicar notificação (apenas admin)
// @access  Private/Admin
// Utilitário simples para dividir array em lotes
function chunk(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}
router.put('/:id/publish', auth, adminAuth, async (req, res) => {
  try {
    const notificacao = await Notification.findById(req.params.id);
    if (!notificacao) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    notificacao.status = 'publicado';
    notificacao.dataPublicacao = new Date();

    await notificacao.save();

    // Enviar emails se configurado
    if (notificacao.configuracoes?.enviarEmail) {
      if (!mailerConfigured()) {
        console.warn('Mailer não configurado. Defina SMTP_* no .env para habilitar envio de emails.');
      } else {
        try {
          const destinatarios = await notificacao.obterDestinatarios();
          const emails = destinatarios
            .filter(u => !!u.email && (u.notificacoes?.email ?? true))
            .map(u => ({ address: u.email, name: u.nome }));

          if (emails.length > 0) {
            const subject = `[Guanandi] ${notificacao.titulo}`;
            const text = `${notificacao.conteudo}\n\nVocê recebeu este comunicado via plataforma Guanandi.`;
            const html = `
              <div style="font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto; padding: 16px;">
                <h2 style="margin: 0 0 12px 0;">${notificacao.titulo}</h2>
                <p style="white-space: pre-line; line-height: 1.5;">${notificacao.conteudo}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #666;">Você recebeu este comunicado pois está cadastrado como proprietário e habilitou o recebimento por e-mail nas preferências.</p>
              </div>`;

            let enviados = 0;
            // Enviar em lotes de 20 para não sobrecarregar o SMTP
            for (const grupo of chunk(emails, 20)) {
              const resultados = await Promise.allSettled(
                grupo.map(({ address, name }) =>
                  sendMail({ to: `${name ? '"' + name + '" ' : ''}<${address}>`, subject, text, html })
                )
              );
              enviados += resultados.filter(r => r.status === 'fulfilled').length;
            }

            if (enviados > 0) {
              notificacao.estatisticas.emailsEnviados += enviados;
              await notificacao.save();
            }
          }
        } catch (emailErr) {
          console.error('Erro ao enviar emails de notificação:', emailErr);
        }
      }
    }

    res.json({
      success: true,
      message: 'Notificação publicada com sucesso',
      data: notificacao
    });

  } catch (error) {
    console.error('Erro ao publicar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/notifications/:id/comments
// @desc    Adicionar comentário à notificação
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { conteudo } = req.body;
    
    if (!conteudo || conteudo.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Conteúdo do comentário é obrigatório'
      });
    }
    
    const notificacao = await Notification.findById(req.params.id);
    if (!notificacao) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }
    
    await notificacao.adicionarComentario(req.user._id, conteudo);
    
    const notificacaoAtualizada = await Notification.findById(notificacao._id)
      .populate('comentarios.usuario', 'nome');
    
    res.json({
      success: true,
      message: 'Comentário adicionado com sucesso',
      data: notificacaoAtualizada.comentarios
    });
    
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Arquivar notificação (apenas admin)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const notificacao = await Notification.findById(req.params.id);
    if (!notificacao) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }
    
    notificacao.status = 'arquivado';
    await notificacao.save();
    
    res.json({
      success: true,
      message: 'Notificação arquivada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao arquivar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/notifications/stats/dashboard
// @desc    Obter estatísticas das notificações para dashboard
// @access  Private/Admin
router.get('/stats/dashboard', auth, adminAuth, async (req, res) => {
  try {
    const totalNotificacoes = await Notification.countDocuments();
    const publicadas = await Notification.countDocuments({ status: 'publicado' });
    const rascunhos = await Notification.countDocuments({ status: 'rascunho' });
    const arquivadas = await Notification.countDocuments({ status: 'arquivado' });
    
    // Notificações por tipo
    const porTipo = await Notification.aggregate([
      { $group: { _id: '$tipo', count: { $sum: 1 } } }
    ]);
    
    // Taxa de leitura média
    const notificacoesComLeituras = await Notification.find({ status: 'publicado' });
    let totalVisualizacoes = 0;
    let totalNotificacoesPublicadas = notificacoesComLeituras.length;
    
    notificacoesComLeituras.forEach(notif => {
      totalVisualizacoes += notif.estatisticas.visualizacoes;
    });
    
    const taxaLeituraMedia = totalNotificacoesPublicadas > 0 ? 
      (totalVisualizacoes / totalNotificacoesPublicadas).toFixed(1) : 0;
    
    res.json({
      success: true,
      data: {
        total: totalNotificacoes,
        publicadas,
        rascunhos,
        arquivadas,
        porTipo,
        taxaLeituraMedia,
        totalVisualizacoes
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter estatísticas de notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;