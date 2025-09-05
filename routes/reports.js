const express = require('express');
const Boleto = require('../models/Boleto');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/financial
// @desc    Relatório financeiro geral
// @access  Private/Admin
router.get('/financial', auth, adminAuth, async (req, res) => {
  try {
    const { mes, ano } = req.query;
    
    // Definir período (mês atual se não especificado)
    const dataAtual = new Date();
    const anoConsulta = ano ? parseInt(ano) : dataAtual.getFullYear();
    const mesConsulta = mes ? parseInt(mes) - 1 : dataAtual.getMonth();
    
    const inicioMes = new Date(anoConsulta, mesConsulta, 1);
    const fimMes = new Date(anoConsulta, mesConsulta + 1, 0, 23, 59, 59, 999);
    
    // Boletos do período
    const boletosPeriodo = await Boleto.find({
      dataVencimento: { $gte: inicioMes, $lte: fimMes }
    }).populate('proprietario', 'nome email situacao');
    
    // Boletos pagos no período
    const boletosPagos = await Boleto.find({
      status: 'pago',
      dataPagamento: { $gte: inicioMes, $lte: fimMes }
    }).populate('proprietario', 'nome email');
    
    // Cálculos
    const valorTotalEmitido = boletosPeriodo.reduce((total, boleto) => {
      return total + boleto.calcularValorTotal();
    }, 0);
    
    const valorTotalArrecadado = boletosPagos.reduce((total, boleto) => {
      return total + boleto.calcularValorTotal();
    }, 0);
    
    const valorEmAberto = boletosPeriodo
      .filter(b => ['pendente', 'vencido'].includes(b.status))
      .reduce((total, boleto) => total + boleto.calcularValorTotal(), 0);
    
    const valorVencido = boletosPeriodo
      .filter(b => b.status === 'vencido')
      .reduce((total, boleto) => total + boleto.calcularValorTotal(), 0);
    
    // Estatísticas por categoria
    const porCategoria = {};
    boletosPeriodo.forEach(boleto => {
      if (!porCategoria[boleto.categoria]) {
        porCategoria[boleto.categoria] = {
          emitido: 0,
          arrecadado: 0,
          quantidade: 0
        };
      }
      porCategoria[boleto.categoria].emitido += boleto.calcularValorTotal();
      porCategoria[boleto.categoria].quantidade += 1;
      
      if (boleto.status === 'pago') {
        porCategoria[boleto.categoria].arrecadado += boleto.calcularValorTotal();
      }
    });
    
    // Taxa de inadimplência
    const totalProprietarios = await User.countDocuments({ tipo: 'proprietario' });
    const proprietariosInadimplentes = await User.countDocuments({ 
      tipo: 'proprietario', 
      situacao: 'inadimplente' 
    });
    
    const taxaInadimplencia = totalProprietarios > 0 ? 
      ((proprietariosInadimplentes / totalProprietarios) * 100).toFixed(1) : 0;
    
    res.json({
      success: true,
      data: {
        periodo: {
          mes: mesConsulta + 1,
          ano: anoConsulta,
          inicio: inicioMes,
          fim: fimMes
        },
        resumo: {
          valorTotalEmitido: valorTotalEmitido.toFixed(2),
          valorTotalArrecadado: valorTotalArrecadado.toFixed(2),
          valorEmAberto: valorEmAberto.toFixed(2),
          valorVencido: valorVencido.toFixed(2),
          taxaArrecadacao: valorTotalEmitido > 0 ? 
            ((valorTotalArrecadado / valorTotalEmitido) * 100).toFixed(1) : 0,
          taxaInadimplencia
        },
        quantidades: {
          totalBoletos: boletosPeriodo.length,
          boletosPagos: boletosPagos.length,
          boletosEmAberto: boletosPeriodo.filter(b => ['pendente', 'vencido'].includes(b.status)).length,
          boletosVencidos: boletosPeriodo.filter(b => b.status === 'vencido').length
        },
        porCategoria,
        proprietarios: {
          total: totalProprietarios,
          inadimplentes: proprietariosInadimplentes,
          ativos: totalProprietarios - proprietariosInadimplentes
        }
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/reports/inadimplencia
// @desc    Relatório de inadimplência
// @access  Private/Admin
router.get('/inadimplencia', auth, adminAuth, async (req, res) => {
  try {
    // Proprietários inadimplentes
    const proprietariosInadimplentes = await User.find({
      tipo: 'proprietario',
      situacao: 'inadimplente'
    }).select('nome email cpf telefone endereco');
    
    // Boletos em aberto por proprietário
    const relatorioInadimplencia = [];
    
    for (const proprietario of proprietariosInadimplentes) {
      const boletosEmAberto = await Boleto.find({
        proprietario: proprietario._id,
        status: { $in: ['pendente', 'vencido'] }
      }).sort({ dataVencimento: 1 });
      
      const valorTotal = boletosEmAberto.reduce((total, boleto) => {
        return total + boleto.calcularValorTotal();
      }, 0);
      
      const maisAntigo = boletosEmAberto.length > 0 ? boletosEmAberto[0].dataVencimento : null;
      const diasAtraso = maisAntigo ? Math.floor((new Date() - maisAntigo) / (1000 * 60 * 60 * 24)) : 0;
      
      relatorioInadimplencia.push({
        proprietario: proprietario,
        boletos: boletosEmAberto,
        valorTotal: valorTotal.toFixed(2),
        quantidadeBoletos: boletosEmAberto.length,
        diasAtraso: Math.max(0, diasAtraso),
        vencimentoMaisAntigo: maisAntigo
      });
    }
    
    // Ordenar por valor total decrescente
    relatorioInadimplencia.sort((a, b) => parseFloat(b.valorTotal) - parseFloat(a.valorTotal));
    
    // Resumo geral
    const valorTotalInadimplencia = relatorioInadimplencia.reduce((total, item) => {
      return total + parseFloat(item.valorTotal);
    }, 0);
    
    const totalBoletosVencidos = relatorioInadimplencia.reduce((total, item) => {
      return total + item.quantidadeBoletos;
    }, 0);
    
    res.json({
      success: true,
      data: {
        resumo: {
          totalProprietariosInadimplentes: proprietariosInadimplentes.length,
          valorTotalInadimplencia: valorTotalInadimplencia.toFixed(2),
          totalBoletosVencidos,
          ticketMedio: proprietariosInadimplentes.length > 0 ? 
            (valorTotalInadimplencia / proprietariosInadimplentes.length).toFixed(2) : 0
        },
        detalhes: relatorioInadimplencia
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório de inadimplência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/reports/arrecadacao
// @desc    Relatório de arrecadação por período
// @access  Private/Admin
router.get('/arrecadacao', auth, adminAuth, async (req, res) => {
  try {
    const { dataInicio, dataFim, agrupamento = 'mes' } = req.query;
    
    // Definir período padrão (últimos 12 meses)
    const fimPeriodo = dataFim ? new Date(dataFim) : new Date();
    const inicioPeriodo = dataInicio ? new Date(dataInicio) : new Date();
    
    if (!dataInicio) {
      inicioPeriodo.setMonth(inicioPeriodo.getMonth() - 12);
    }
    
    // Buscar boletos pagos no período
    const boletosPagos = await Boleto.find({
      status: 'pago',
      dataPagamento: { $gte: inicioPeriodo, $lte: fimPeriodo }
    }).populate('proprietario', 'nome');
    
    // Agrupar por período
    const arrecadacaoPorPeriodo = {};
    
    boletosPagos.forEach(boleto => {
      let chave;
      const data = new Date(boleto.dataPagamento);
      
      if (agrupamento === 'mes') {
        chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      } else if (agrupamento === 'ano') {
        chave = data.getFullYear().toString();
      } else {
        chave = data.toISOString().split('T')[0]; // dia
      }
      
      if (!arrecadacaoPorPeriodo[chave]) {
        arrecadacaoPorPeriodo[chave] = {
          periodo: chave,
          valor: 0,
          quantidade: 0,
          porCategoria: {}
        };
      }
      
      const valorBoleto = boleto.calcularValorTotal();
      arrecadacaoPorPeriodo[chave].valor += valorBoleto;
      arrecadacaoPorPeriodo[chave].quantidade += 1;
      
      // Agrupar por categoria
      if (!arrecadacaoPorPeriodo[chave].porCategoria[boleto.categoria]) {
        arrecadacaoPorPeriodo[chave].porCategoria[boleto.categoria] = {
          valor: 0,
          quantidade: 0
        };
      }
      
      arrecadacaoPorPeriodo[chave].porCategoria[boleto.categoria].valor += valorBoleto;
      arrecadacaoPorPeriodo[chave].porCategoria[boleto.categoria].quantidade += 1;
    });
    
    // Converter para array e ordenar
    const dadosOrdenados = Object.values(arrecadacaoPorPeriodo)
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map(item => ({
        ...item,
        valor: parseFloat(item.valor.toFixed(2))
      }));
    
    // Calcular totais
    const valorTotal = dadosOrdenados.reduce((total, item) => total + item.valor, 0);
    const quantidadeTotal = dadosOrdenados.reduce((total, item) => total + item.quantidade, 0);
    
    res.json({
      success: true,
      data: {
        periodo: {
          inicio: inicioPeriodo,
          fim: fimPeriodo,
          agrupamento
        },
        resumo: {
          valorTotal: valorTotal.toFixed(2),
          quantidadeTotal,
          ticketMedio: quantidadeTotal > 0 ? (valorTotal / quantidadeTotal).toFixed(2) : 0
        },
        detalhes: dadosOrdenados
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório de arrecadação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/reports/proprietario/:id
// @desc    Relatório individual do proprietário
// @access  Private (próprio proprietário ou admin)
router.get('/proprietario/:id', auth, async (req, res) => {
  try {
    const proprietarioId = req.params.id;
    
    // Verificar permissão
    if (req.user.tipo !== 'admin' && req.user._id.toString() !== proprietarioId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const proprietario = await User.findById(proprietarioId);
    if (!proprietario || proprietario.tipo !== 'proprietario') {
      return res.status(404).json({
        success: false,
        message: 'Proprietário não encontrado'
      });
    }
    
    // Buscar todos os boletos do proprietário
    const todosBoletos = await Boleto.find({ proprietario: proprietarioId })
      .sort({ dataVencimento: -1 });
    
    // Separar por status
    const boletosPagos = todosBoletos.filter(b => b.status === 'pago');
    const boletosEmAberto = todosBoletos.filter(b => ['pendente', 'vencido'].includes(b.status));
    const boletosVencidos = todosBoletos.filter(b => b.status === 'vencido');
    
    // Calcular valores
    const valorTotalPago = boletosPagos.reduce((total, boleto) => {
      return total + boleto.calcularValorTotal();
    }, 0);
    
    const valorEmAberto = boletosEmAberto.reduce((total, boleto) => {
      return total + boleto.calcularValorTotal();
    }, 0);
    
    const valorVencido = boletosVencidos.reduce((total, boleto) => {
      return total + boleto.calcularValorTotal();
    }, 0);
    
    // Histórico de pagamentos (últimos 12 meses)
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - 12);
    
    const pagamentosRecentes = boletosPagos
      .filter(b => b.dataPagamento >= dataLimite)
      .sort((a, b) => b.dataPagamento - a.dataPagamento);
    
    res.json({
      success: true,
      data: {
        proprietario: proprietario.getDadosPublicos(),
        resumo: {
          totalBoletos: todosBoletos.length,
          boletosPagos: boletosPagos.length,
          boletosEmAberto: boletosEmAberto.length,
          boletosVencidos: boletosVencidos.length,
          valorTotalPago: valorTotalPago.toFixed(2),
          valorEmAberto: valorEmAberto.toFixed(2),
          valorVencido: valorVencido.toFixed(2),
          situacao: proprietario.situacao
        },
        boletosEmAberto: boletosEmAberto,
        ultimosPagamentos: pagamentosRecentes.slice(0, 10),
        historicoCompleto: todosBoletos
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório do proprietário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;