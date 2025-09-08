const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar notificações
const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, tipo, status } = req.query;
    
    // Construir filtros para Prisma
    const where = {};
    
    // Se não for admin, mostrar apenas notificações destinadas ao usuário
    if (req.user.tipo !== 'admin') {
      where.OR = [
        {
          destinatarios: {
            some: {
              tipo: 'todos'
            }
          }
        },
        {
          destinatarios: {
            some: {
              usuario: req.user.id
            }
          }
        },
        {
          destinatarios: {
            some: {
              tipo: req.user.situacao === 'inadimplente' ? 'inadimplentes' : 'ativos'
            }
          }
        }
      ];
      where.status = 'publicado';
    }
    
    if (tipo) where.tipo = tipo;
    if (status && req.user.tipo === 'admin') where.status = status;
    
    const notificacoes = await prisma.notification.findMany({
      where,
      include: {
        autorRel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        destinatarios: {
          include: {
            usuarioRel: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        },
        visualizacoes: true,
        comentarios: {
          include: {
            autorRel: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy: { dataPublicacao: 'desc' }
    });
    
    // Marcar visualizações para proprietários
    if (req.user.tipo === 'proprietario') {
      for (let notificacao of notificacoes) {
        const jaVisualizou = notificacao.visualizacoes.some(
          v => v.usuario === req.user.id
        );
        
        if (!jaVisualizou) {
          await prisma.notificationVisualizacao.create({
            data: {
              notificationId: notificacao.id,
              usuario: req.user.id
            }
          });
        }
      }
    }
    
    const total = await prisma.notification.count({ where });
    
    // Adaptar resposta para compatibilidade com frontend
    const notificacoesAdaptadas = notificacoes.map(notificacao => ({
      ...notificacao,
      _id: notificacao.id,
      autor: notificacao.autorRel ? {
        ...notificacao.autorRel,
        _id: notificacao.autorRel.id
      } : null
    }));
    
    res.json({
      success: true,
      data: notificacoesAdaptadas,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
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
};

// Obter notificação por ID
const getNotificationById = async (req, res) => {
  try {
    const notificacao = await prisma.notification.findUnique({
      where: { id: req.params.id },
      include: {
        autorRel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        destinatarios: {
          include: {
            usuarioRel: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        },
        visualizacoes: {
          include: {
            usuarioRel: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        },
        comentarios: {
          include: {
            autorRel: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    });
    
    if (!notificacao) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }
    
    // Verificar se proprietário pode acessar esta notificação
    if (req.user.tipo === 'proprietario') {
      const podeAcessar = 
        notificacao.destinatarios.some(d => d.tipo === 'todos') ||
        notificacao.destinatarios.some(d => d.usuario === req.user.id) ||
        (notificacao.destinatarios.some(d => d.tipo === 'inadimplentes') && req.user.situacao === 'inadimplente') ||
        (notificacao.destinatarios.some(d => d.tipo === 'ativos') && req.user.situacao === 'ativo');
      
      if (!podeAcessar || notificacao.status !== 'publicado') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }
      
      // Marcar como lida
      const jaVisualizou = notificacao.visualizacoes.some(
        v => v.usuario === req.user.id
      );
      
      if (!jaVisualizou) {
        await prisma.notificationVisualizacao.create({
          data: {
            notificationId: notificacao.id,
            usuario: req.user.id
          }
        });
      }
    }
    
    // Adaptar resposta para compatibilidade com frontend
    const notificacaoAdaptada = {
      ...notificacao,
      _id: notificacao.id,
      autor: notificacao.autorRel ? {
        ...notificacao.autorRel,
        _id: notificacao.autorRel.id
      } : null
    };
    
    res.json({
      success: true,
      data: notificacaoAdaptada
    });
    
  } catch (error) {
    console.error('Erro ao obter notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Criar nova notificação (apenas admin)
const createNotification = async (req, res) => {
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
    
    const novaNotificacao = await prisma.notification.create({
      data: {
        titulo,
        conteudo,
        tipo,
        prioridade: prioridade || 'media',
        autor: req.user.id,
        dataExpiracao: dataExpiracao ? new Date(dataExpiracao) : null,
        configuracoes: configuracoes || null
      },
      include: {
        autorRel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });
    
    // Criar destinatários
    if (destinatarios) {
      if (destinatarios.tipo === 'especificos' && destinatarios.usuarios) {
        for (const usuarioId of destinatarios.usuarios) {
          await prisma.notificationDestinatario.create({
            data: {
              notificationId: novaNotificacao.id,
              tipo: 'especificos',
              usuario: usuarioId
            }
          });
        }
      } else {
        await prisma.notificationDestinatario.create({
          data: {
            notificationId: novaNotificacao.id,
            tipo: destinatarios.tipo || 'todos'
          }
        });
      }
    }
    
    // Adaptar resposta para compatibilidade com frontend
    const notificacaoAdaptada = {
      ...novaNotificacao,
      _id: novaNotificacao.id,
      autor: novaNotificacao.autorRel ? {
        ...novaNotificacao.autorRel,
        _id: novaNotificacao.autorRel.id
      } : null
    };
    
    res.status(201).json({
      success: true,
      message: 'Notificação criada com sucesso',
      data: notificacaoAdaptada
    });
    
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// Atualizar notificação (apenas admin)
const updateNotification = async (req, res) => {
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
    
    const notificacao = await prisma.notification.findUnique({
      where: { id: req.params.id }
    });
    
    if (!notificacao) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }
    
    const updateData = {};
    if (titulo) updateData.titulo = titulo;
    if (conteudo) updateData.conteudo = conteudo;
    if (tipo) updateData.tipo = tipo;
    if (prioridade) updateData.prioridade = prioridade;
    if (dataExpiracao) updateData.dataExpiracao = new Date(dataExpiracao);
    if (configuracoes) updateData.configuracoes = configuracoes;
    
    const notificacaoAtualizada = await prisma.notification.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        autorRel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });
    
    // Atualizar destinatários se fornecido
    if (destinatarios) {
      // Remover destinatários existentes
      await prisma.notificationDestinatario.deleteMany({
        where: { notificationId: req.params.id }
      });
      
      // Criar novos destinatários
      if (destinatarios.tipo === 'especificos' && destinatarios.usuarios) {
        for (const usuarioId of destinatarios.usuarios) {
          await prisma.notificationDestinatario.create({
            data: {
              notificationId: req.params.id,
              tipo: 'especificos',
              usuario: usuarioId
            }
          });
        }
      } else {
        await prisma.notificationDestinatario.create({
          data: {
            notificationId: req.params.id,
            tipo: destinatarios.tipo || 'todos'
          }
        });
      }
    }
    
    // Adaptar resposta para compatibilidade com frontend
    const notificacaoAdaptada = {
      ...notificacaoAtualizada,
      _id: notificacaoAtualizada.id,
      autor: notificacaoAtualizada.autorRel ? {
        ...notificacaoAtualizada.autorRel,
        _id: notificacaoAtualizada.autorRel.id
      } : null
    };
    
    res.json({
      success: true,
      message: 'Notificação atualizada com sucesso',
      data: notificacaoAdaptada
    });
    
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Publicar notificação
const publishNotification = async (req, res) => {
  try {
    const notificacao = await prisma.notification.findUnique({
      where: { id: req.params.id }
    });
    
    if (!notificacao) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }
    
    const notificacaoAtualizada = await prisma.notification.update({
      where: { id: req.params.id },
      data: {
        status: 'publicado',
        dataPublicacao: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Notificação publicada com sucesso',
      data: notificacaoAtualizada
    });
    
  } catch (error) {
    console.error('Erro ao publicar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Adicionar comentário
const addComment = async (req, res) => {
  try {
    const { conteudo } = req.body;
    
    if (!conteudo || conteudo.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Conteúdo do comentário é obrigatório'
      });
    }
    
    const notificacao = await prisma.notification.findUnique({
      where: { id: req.params.id }
    });
    
    if (!notificacao) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }
    
    await prisma.notificationComentario.create({
      data: {
        notificationId: req.params.id,
        autor: req.user.id,
        conteudo
      }
    });
    
    const comentarios = await prisma.notificationComentario.findMany({
      where: { notificationId: req.params.id },
      include: {
        autorRel: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });
    
    res.json({
      success: true,
      message: 'Comentário adicionado com sucesso',
      data: comentarios
    });
    
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

// Arquivar notificação
const archiveNotification = async (req, res) => {
  try {
    const notificacao = await prisma.notification.findUnique({
      where: { id: req.params.id }
    });
    
    if (!notificacao) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }
    
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { status: 'arquivado' }
    });
    
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
};

// Obter estatísticas
const getNotificationStats = async (req, res) => {
  try {
    const totalNotificacoes = await prisma.notification.count();
    const publicadas = await prisma.notification.count({ where: { status: 'publicado' } });
    const rascunhos = await prisma.notification.count({ where: { status: 'rascunho' } });
    const arquivadas = await prisma.notification.count({ where: { status: 'arquivado' } });
    
    // Notificações por tipo
    const porTipo = await prisma.notification.groupBy({
      by: ['tipo'],
      _count: {
        id: true
      }
    });
    
    // Total de visualizações
    const totalVisualizacoes = await prisma.notificationVisualizacao.count();
    
    // Taxa de leitura média
    const taxaLeituraMedia = totalNotificacoes > 0 ? 
      (totalVisualizacoes / totalNotificacoes).toFixed(1) : 0;
    
    res.json({
      success: true,
      data: {
        total: totalNotificacoes,
        publicadas,
        rascunhos,
        arquivadas,
        porTipo: porTipo.map(item => ({ _id: item.tipo, count: item._count.id })),
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
};

module.exports = {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  publishNotification,
  addComment,
  archiveNotification,
  getNotificationStats
};