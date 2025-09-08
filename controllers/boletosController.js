const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar boletos (admin vê todos, proprietário vê apenas os seus)
const getAllBoletos = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, categoria, dataInicio, dataFim } = req.query;
    
    // Construir filtros para Prisma
    const where = {};
    
    // Se não for admin, mostrar apenas boletos do próprio usuário
    if (req.user.tipo !== 'admin') {
      where.proprietario = req.user.id;
    }
    
    if (status) {
      // Se status contém vírgulas, tratar como múltiplos valores
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }
    if (categoria) where.categoria = categoria;
    
    // Filtro por data
    if (dataInicio || dataFim) {
      where.dataVencimento = {};
      if (dataInicio) where.dataVencimento.gte = new Date(dataInicio);
      if (dataFim) where.dataVencimento.lte = new Date(dataFim);
    }
    
    const boletos = await prisma.boleto.findMany({
      where,
      include: {
      proprietarioRel: {
        select: {
          id: true,
          nome: true,
          email: true,
          cpf: true,
          endereco: true
        }
      }
      },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy: { dataVencimento: 'desc' }
    });
    
    const total = await prisma.boleto.count({ where });
    
    // Adaptar resposta para compatibilidade com frontend
    const boletosAdaptados = boletos.map(boleto => ({
      ...boleto,
      _id: boleto.id,
      proprietario: boleto.proprietarioRel ? {
        ...boleto.proprietarioRel,
        _id: boleto.proprietarioRel.id
      } : null
    }));
    
    res.json({
      success: true,
      data: boletosAdaptados,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar boletos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Obter boleto por ID
const getBoletoById = async (req, res) => {
  try {
    const boleto = await prisma.boleto.findUnique({
      where: { id: req.params.id },
      include: {
      proprietarioRel: {
        select: {
          id: true,
          nome: true,
          email: true,
          cpf: true,
          telefone: true,
          endereco: true
        }
      }
    }
    });
    
    if (!boleto) {
      return res.status(404).json({
        success: false,
        message: 'Boleto não encontrado'
      });
    }
    
    // Verificar se o usuário pode acessar este boleto
    if (req.user.tipo !== 'admin' && boleto.proprietario !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    // Adaptar resposta para compatibilidade com frontend
    const boletoAdaptado = {
      ...boleto,
      _id: boleto.id,
      proprietario: {
        ...boleto.proprietarioRel,
        _id: boleto.proprietarioRel.id
      }
    };
    
    res.json({
      success: true,
      data: boletoAdaptado
    });
    
  } catch (error) {
    console.error('Erro ao obter boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Criar novo boleto (apenas admin)
const createBoleto = async (req, res) => {
  try {
    const {
      proprietarioId,
      descricao,
      valor,
      dataVencimento,
      categoria,
      observacoes,
      tipoPagamento
    } = req.body;
    
    // Verificar se proprietário existe
    const proprietario = await prisma.user.findUnique({
      where: { id: proprietarioId }
    });
    
    if (!proprietario || proprietario.tipo !== 'proprietario') {
      return res.status(404).json({
        success: false,
        message: 'Proprietário não encontrado'
      });
    }
    
    // Gerar número do documento
    const ultimoBoleto = await prisma.boleto.findFirst({
      orderBy: { numeroDocumento: 'desc' }
    });
    
    let numeroDocumento = '000001';
    if (ultimoBoleto) {
      const ultimoNumero = parseInt(ultimoBoleto.numeroDocumento);
      const novoNumero = ultimoNumero + 1;
      numeroDocumento = novoNumero.toString().padStart(6, '0');
    }
    
    const novoBoleto = await prisma.boleto.create({
      data: {
        numeroDocumento,
        proprietario: proprietarioId,
        descricao,
        valor: parseFloat(valor),
        dataVencimento: new Date(dataVencimento),
        categoria: categoria || 'taxa_condominio',
        observacoes,
        tipoPagamento: tipoPagamento || 'boleto'
      },
      include: {
        proprietarioRel: {
          select: {
            id: true,
            nome: true,
            email: true,
            cpf: true,
            telefone: true,
            endereco: true
          }
        }
      }
    });
    
    // Adaptar resposta para compatibilidade com frontend
    const boletoAdaptado = {
      ...novoBoleto,
      _id: novoBoleto.id,
      proprietario: {
        ...novoBoleto.proprietarioRel,
        _id: novoBoleto.proprietarioRel.id
      }
    };
    
    res.status(201).json({
      success: true,
      message: 'Boleto criado com sucesso',
      data: boletoAdaptado
    });
    
  } catch (error) {
    console.error('Erro ao criar boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// Atualizar boleto (apenas admin)
const updateBoleto = async (req, res) => {
  try {
    const {
      descricao,
      valor,
      dataVencimento,
      categoria,
      observacoes,
      valorJuros,
      valorMulta,
      valorDesconto
    } = req.body;
    
    const boleto = await prisma.boleto.findUnique({
      where: { id: req.params.id }
    });
    
    if (!boleto) {
      return res.status(404).json({
        success: false,
        message: 'Boleto não encontrado'
      });
    }
    
    // Não permitir editar boletos já pagos
    if (boleto.status === 'pago') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível editar boletos já pagos'
      });
    }
    
    const updateData = {};
    if (descricao !== undefined) updateData.descricao = descricao;
    if (valor !== undefined) updateData.valor = parseFloat(valor);
    if (dataVencimento !== undefined) updateData.dataVencimento = new Date(dataVencimento);
    if (categoria !== undefined) updateData.categoria = categoria;
    if (observacoes !== undefined) updateData.observacoes = observacoes;
    if (valorJuros !== undefined) updateData.valorJuros = parseFloat(valorJuros);
    if (valorMulta !== undefined) updateData.valorMulta = parseFloat(valorMulta);
    if (valorDesconto !== undefined) updateData.valorDesconto = parseFloat(valorDesconto);
    
    const boletoAtualizado = await prisma.boleto.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        proprietarioRel: {
          select: {
            id: true,
            nome: true,
            email: true,
            cpf: true,
            telefone: true,
            endereco: true
          }
        }
      }
    });
    
    // Adaptar resposta para compatibilidade com frontend
    const boletoAdaptadoResponse = {
      ...boletoAtualizado,
      _id: boletoAtualizado.id,
      proprietario: {
        ...boletoAtualizado.proprietarioRel,
        _id: boletoAtualizado.proprietarioRel.id
      }
    };
    
    res.json({
      success: true,
      message: 'Boleto atualizado com sucesso',
      data: boletoAdaptadoResponse
    });
    
  } catch (error) {
    console.error('Erro ao atualizar boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Marcar boleto como pago
const payBoleto = async (req, res) => {
  try {
    const { dataPagamento, tipoPagamento, comprovante } = req.body;
    
    const boleto = await prisma.boleto.findUnique({
      where: { id: req.params.id }
    });
    
    if (!boleto) {
      return res.status(404).json({
        success: false,
        message: 'Boleto não encontrado'
      });
    }
    
    if (boleto.status === 'pago') {
      return res.status(400).json({
        success: false,
        message: 'Boleto já está pago'
      });
    }
    
    const updateData = {
      status: 'pago',
      dataPagamento: dataPagamento ? new Date(dataPagamento) : new Date()
    };
    
    if (tipoPagamento) updateData.tipoPagamento = tipoPagamento;
    if (comprovante) updateData.comprovantePagamento = comprovante;
    
    const boletoAtualizado = await prisma.boleto.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        proprietarioRel: {
          select: {
            id: true,
            nome: true,
            email: true,
            cpf: true,
            telefone: true,
            endereco: true
          }
        }
      }
    });
    
    // Atualizar situação do proprietário se necessário
    const proprietario = await prisma.user.findUnique({
      where: { id: boleto.proprietario }
    });
    
    if (proprietario && proprietario.situacao === 'inadimplente') {
      // Verificar se ainda tem boletos em aberto
      const boletosEmAberto = await prisma.boleto.count({
        where: {
          proprietario: boleto.proprietario,
          status: { in: ['pendente', 'vencido'] }
        }
      });
      
      if (boletosEmAberto === 0) {
        await prisma.user.update({
          where: { id: boleto.proprietario },
          data: { situacao: 'ativo' }
        });
      }
    }
    
    // Adaptar resposta para compatibilidade com frontend
    const boletoAdaptado = {
      ...boletoAtualizado,
      _id: boletoAtualizado.id,
      proprietario: {
        ...boletoAtualizado.proprietarioRel,
        _id: boletoAtualizado.proprietarioRel.id
      }
    };
    
    res.json({
      success: true,
      message: 'Boleto marcado como pago',
      data: boletoAdaptado
    });
    
  } catch (error) {
    console.error('Erro ao marcar boleto como pago:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Cancelar boleto
const cancelBoleto = async (req, res) => {
  try {
    const boleto = await prisma.boleto.findUnique({
      where: { id: req.params.id }
    });
    
    if (!boleto) {
      return res.status(404).json({
        success: false,
        message: 'Boleto não encontrado'
      });
    }
    
    if (boleto.status === 'pago') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível cancelar boletos já pagos'
      });
    }
    
    const boletoAtualizado = await prisma.boleto.update({
      where: { id: req.params.id },
      data: { status: 'cancelado' },
      include: {
        proprietarioRel: {
          select: {
            id: true,
            nome: true,
            email: true,
            cpf: true,
            telefone: true,
            endereco: true
          }
        }
      }
    });
    
    // Adaptar resposta para compatibilidade com frontend
    const boletoAdaptado = {
      ...boletoAtualizado,
      _id: boletoAtualizado.id,
      proprietario: {
        ...boletoAtualizado.proprietarioRel,
        _id: boletoAtualizado.proprietarioRel.id
      }
    };
    
    res.json({
      success: true,
      message: 'Boleto cancelado com sucesso',
      data: boletoAdaptado
    });
    
  } catch (error) {
    console.error('Erro ao cancelar boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Obter estatísticas dos boletos para dashboard
const getBoletoStats = async (req, res) => {
  try {
    const where = {};
    
    // Se não for admin, mostrar apenas estatísticas do próprio usuário
    if (req.user.tipo !== 'admin') {
      where.proprietario = req.user.id;
    }
    
    const totalBoletos = await prisma.boleto.count({ where });
    const boletosPendentes = await prisma.boleto.count({ where: { ...where, status: 'pendente' } });
    const boletosVencidos = await prisma.boleto.count({ where: { ...where, status: 'vencido' } });
    const boletosPagos = await prisma.boleto.count({ where: { ...where, status: 'pago' } });
    
    // Valor total arrecadado no mês atual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const fimMes = new Date(inicioMes);
    fimMes.setMonth(fimMes.getMonth() + 1);
    fimMes.setDate(0);
    fimMes.setHours(23, 59, 59, 999);
    
    const boletosPagosMes = await prisma.boleto.findMany({
      where: {
        ...where,
        status: 'pago',
        dataPagamento: { gte: inicioMes, lte: fimMes }
      }
    });
    
    const valorArrecadadoMes = boletosPagosMes.reduce((total, boleto) => {
      return total + (boleto.valor + (boleto.valorJuros || 0) + (boleto.valorMulta || 0) - (boleto.valorDesconto || 0));
    }, 0);
    
    // Valor em aberto (pendentes + vencidos)
    const boletosEmAberto = await prisma.boleto.findMany({
      where: {
        ...where,
        status: { in: ['pendente', 'vencido'] }
      }
    });
    
    const valorEmAberto = boletosEmAberto.reduce((total, boleto) => {
      return total + (boleto.valor + (boleto.valorJuros || 0) + (boleto.valorMulta || 0) - (boleto.valorDesconto || 0));
    }, 0);
    
    res.json({
      success: true,
      data: {
        total: totalBoletos,
        pendentes: boletosPendentes,
        vencidos: boletosVencidos,
        pagos: boletosPagos,
        valorArrecadadoMes: valorArrecadadoMes.toFixed(2),
        valorEmAberto: valorEmAberto.toFixed(2),
        taxaAdimplencia: totalBoletos > 0 ? 
          ((boletosPagos / totalBoletos) * 100).toFixed(1) : 0
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter estatísticas de boletos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Criar boletos em lote (apenas admin)
const createBulkBoletos = async (req, res) => {
  try {
    const { proprietarios, descricao, valor, dataVencimento, categoria, observacoes, tipoPagamento } = req.body;
    
    if (!Array.isArray(proprietarios) || proprietarios.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de proprietários é obrigatória'
      });
    }
    
    const boletosCreated = [];
    const errors = [];
    
    for (const proprietarioId of proprietarios) {
      try {
        const proprietario = await prisma.user.findUnique({
          where: { id: proprietarioId }
        });
        
        if (!proprietario || proprietario.tipo !== 'proprietario') {
          errors.push(`Proprietário ${proprietarioId} não encontrado`);
          continue;
        }
        
        // Gerar número do documento
        const ultimoBoleto = await prisma.boleto.findFirst({
          orderBy: { numeroDocumento: 'desc' }
        });
        
        let numeroDocumento = '000001';
        if (ultimoBoleto) {
          const ultimoNumero = parseInt(ultimoBoleto.numeroDocumento);
          const novoNumero = ultimoNumero + 1;
          numeroDocumento = novoNumero.toString().padStart(6, '0');
        }
        
        const novoBoleto = await prisma.boleto.create({
          data: {
            numeroDocumento,
            proprietario: proprietarioId,
            descricao,
            valor: parseFloat(valor),
            dataVencimento: new Date(dataVencimento),
            categoria: categoria || 'taxa_condominio',
            observacoes,
            tipoPagamento: tipoPagamento || 'boleto'
          }
        });
        
        boletosCreated.push(novoBoleto);
        
      } catch (error) {
        errors.push(`Erro ao criar boleto para ${proprietarioId}: ${error.message}`);
      }
    }
    
    res.status(201).json({
      success: true,
      message: `${boletosCreated.length} boletos criados com sucesso`,
      data: {
        created: boletosCreated.length,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar boletos em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getAllBoletos,
  getBoletoById,
  createBoleto,
  updateBoleto,
  payBoleto,
  cancelBoleto,
  getBoletoStats,
  createBulkBoletos
};