const express = require('express');
const Boleto = require('../models/Boleto');
const User = require('../models/User');
const { auth, adminAuth, proprietarioAuth, ownerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/boletos
// @desc    Listar boletos (admin vê todos, proprietário vê apenas os seus)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, categoria, dataInicio, dataFim } = req.query;
    
    // Construir filtros
    const filtros = {};
    
    // Se não for admin, mostrar apenas boletos do próprio usuário
    if (req.user.tipo !== 'admin') {
      filtros.proprietario = req.user._id;
    }
    
    if (status) {
      // Se status contém vírgulas, tratar como múltiplos valores
      if (status.includes(',')) {
        filtros.status = { $in: status.split(',') };
      } else {
        filtros.status = status;
      }
    }
    if (categoria) filtros.categoria = categoria;
    
    // Filtro por data
    if (dataInicio || dataFim) {
      filtros.dataVencimento = {};
      if (dataInicio) filtros.dataVencimento.$gte = new Date(dataInicio);
      if (dataFim) filtros.dataVencimento.$lte = new Date(dataFim);
    }
    
    const boletos = await Boleto.find(filtros)
      .populate('proprietario', 'nome email cpf endereco')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dataVencimento: -1 });
    
    const total = await Boleto.countDocuments(filtros);
    
    res.json({
      success: true,
      data: boletos,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
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
});

// @route   GET /api/boletos/:id
// @desc    Obter boleto por ID
// @access  Private (proprietário do boleto ou admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const boleto = await Boleto.findById(req.params.id)
      .populate('proprietario', 'nome email cpf telefone endereco');
    
    if (!boleto) {
      return res.status(404).json({
        success: false,
        message: 'Boleto não encontrado'
      });
    }
    
    // Verificar se o usuário pode acessar este boleto
    if (req.user.tipo !== 'admin' && boleto.proprietario._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    res.json({
      success: true,
      data: boleto
    });
    
  } catch (error) {
    console.error('Erro ao obter boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/boletos
// @desc    Criar novo boleto (apenas admin)
// @access  Private/Admin
router.post('/', auth, adminAuth, async (req, res) => {
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
    const proprietario = await User.findById(proprietarioId);
    if (!proprietario || proprietario.tipo !== 'proprietario') {
      return res.status(404).json({
        success: false,
        message: 'Proprietário não encontrado'
      });
    }
    
    // Gerar número do documento
    const numeroDocumento = await Boleto.gerarNumeroDocumento();
    
    const novoBoleto = new Boleto({
      numeroDocumento,
      proprietario: proprietarioId,
      descricao,
      valor,
      dataVencimento: new Date(dataVencimento),
      categoria,
      observacoes,
      tipoPagamento: tipoPagamento || 'boleto'
    });
    
    // TODO: Gerar código de barras e linha digitável para boleto bancário
    // TODO: Gerar QR Code PIX se tipoPagamento for 'pix'
    
    await novoBoleto.save();
    
    const boletoCompleto = await Boleto.findById(novoBoleto._id)
      .populate('proprietario', 'nome email cpf telefone endereco');
    
    res.status(201).json({
      success: true,
      message: 'Boleto criado com sucesso',
      data: boletoCompleto
    });
    
  } catch (error) {
    console.error('Erro ao criar boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// @route   PUT /api/boletos/:id
// @desc    Atualizar boleto (apenas admin)
// @access  Private/Admin
router.put('/:id', auth, adminAuth, async (req, res) => {
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
    
    const boleto = await Boleto.findById(req.params.id);
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
    
    if (descricao) boleto.descricao = descricao;
    if (valor) boleto.valor = valor;
    if (dataVencimento) boleto.dataVencimento = new Date(dataVencimento);
    if (categoria) boleto.categoria = categoria;
    if (observacoes !== undefined) boleto.observacoes = observacoes;
    if (valorJuros !== undefined) boleto.valorJuros = valorJuros;
    if (valorMulta !== undefined) boleto.valorMulta = valorMulta;
    if (valorDesconto !== undefined) boleto.valorDesconto = valorDesconto;
    
    await boleto.save();
    
    const boletoAtualizado = await Boleto.findById(boleto._id)
      .populate('proprietario', 'nome email cpf telefone endereco');
    
    res.json({
      success: true,
      message: 'Boleto atualizado com sucesso',
      data: boletoAtualizado
    });
    
  } catch (error) {
    console.error('Erro ao atualizar boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/boletos/:id/pay
// @desc    Marcar boleto como pago
// @access  Private/Admin
router.put('/:id/pay', auth, adminAuth, async (req, res) => {
  try {
    const { dataPagamento, tipoPagamento, comprovante } = req.body;
    
    const boleto = await Boleto.findById(req.params.id);
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
    
    boleto.status = 'pago';
    boleto.dataPagamento = dataPagamento ? new Date(dataPagamento) : new Date();
    if (tipoPagamento) boleto.tipoPagamento = tipoPagamento;
    if (comprovante) boleto.comprovantePagamento = comprovante;
    
    await boleto.save();
    
    // Atualizar situação do proprietário se necessário
    const proprietario = await User.findById(boleto.proprietario);
    if (proprietario && proprietario.situacao === 'inadimplente') {
      // Verificar se ainda tem boletos em aberto
      const boletosEmAberto = await Boleto.countDocuments({
        proprietario: proprietario._id,
        status: { $in: ['pendente', 'vencido'] }
      });
      
      if (boletosEmAberto === 0) {
        proprietario.situacao = 'ativo';
        await proprietario.save();
      }
    }
    
    const boletoAtualizado = await Boleto.findById(boleto._id)
      .populate('proprietario', 'nome email cpf telefone endereco');
    
    res.json({
      success: true,
      message: 'Boleto marcado como pago',
      data: boletoAtualizado
    });
    
  } catch (error) {
    console.error('Erro ao marcar boleto como pago:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/boletos/:id
// @desc    Cancelar boleto (apenas admin)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const boleto = await Boleto.findById(req.params.id);
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
    
    boleto.status = 'cancelado';
    await boleto.save();
    
    res.json({
      success: true,
      message: 'Boleto cancelado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao cancelar boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/boletos/stats/dashboard
// @desc    Obter estatísticas dos boletos para dashboard
// @access  Private
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const filtros = {};
    
    // Se não for admin, mostrar apenas estatísticas do próprio usuário
    if (req.user.tipo !== 'admin') {
      filtros.proprietario = req.user._id;
    }
    
    const totalBoletos = await Boleto.countDocuments(filtros);
    const boletosPendentes = await Boleto.countDocuments({ ...filtros, status: 'pendente' });
    const boletosVencidos = await Boleto.countDocuments({ ...filtros, status: 'vencido' });
    const boletosPagos = await Boleto.countDocuments({ ...filtros, status: 'pago' });
    
    // Valor total arrecadado no mês atual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const fimMes = new Date(inicioMes);
    fimMes.setMonth(fimMes.getMonth() + 1);
    fimMes.setDate(0);
    fimMes.setHours(23, 59, 59, 999);
    
    const boletosPagosMes = await Boleto.find({
      ...filtros,
      status: 'pago',
      dataPagamento: { $gte: inicioMes, $lte: fimMes }
    });
    
    const valorArrecadadoMes = boletosPagosMes.reduce((total, boleto) => {
      return total + boleto.calcularValorTotal();
    }, 0);
    
    // Valor em aberto (pendentes + vencidos)
    const boletosEmAberto = await Boleto.find({
      ...filtros,
      status: { $in: ['pendente', 'vencido'] }
    });
    
    const valorEmAberto = boletosEmAberto.reduce((total, boleto) => {
      return total + boleto.calcularValorTotal();
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
});

// @route   POST /api/boletos/bulk-create
// @desc    Criar boletos em lote (apenas admin)
// @access  Private/Admin
router.post('/bulk-create', auth, adminAuth, async (req, res) => {
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
        const proprietario = await User.findById(proprietarioId);
        if (!proprietario || proprietario.tipo !== 'proprietario') {
          errors.push(`Proprietário ${proprietarioId} não encontrado`);
          continue;
        }
        
        const numeroDocumento = await Boleto.gerarNumeroDocumento();
        
        const novoBoleto = new Boleto({
          numeroDocumento,
          proprietario: proprietarioId,
          descricao,
          valor,
          dataVencimento: new Date(dataVencimento),
          categoria,
          observacoes,
          tipoPagamento
        });
        
        await novoBoleto.save();
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
});

module.exports = router;