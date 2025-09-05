const express = require('express');
const Boleto = require('../models/Boleto');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Obter estatísticas gerais do dashboard
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const isAdmin = req.user.tipo === 'admin';
    const filtros = {};
    
    // Se não for admin, mostrar apenas dados do próprio usuário
    if (!isAdmin) {
      filtros.proprietario = req.user._id;
    }

    // Estatísticas de usuários (apenas para admin)
    let usuariosStats = null;
    if (isAdmin) {
      const totalUsuarios = await User.countDocuments({ tipo: 'proprietario' });
      const usuariosAtivos = await User.countDocuments({ tipo: 'proprietario', situacao: 'ativo' });
      const usuariosInativos = totalUsuarios - usuariosAtivos;
      
      // Usuários inadimplentes (com boletos vencidos)
      const usuariosInadimplentes = await Boleto.distinct('proprietario', {
        status: 'vencido'
      });
      
      // Novos usuários nos últimos 30 dias
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);
      const novosUsuarios = await User.countDocuments({
        tipo: 'proprietario',
        createdAt: { $gte: dataLimite }
      });

      usuariosStats = {
        total: totalUsuarios,
        ativos: usuariosAtivos,
        inativos: usuariosInativos,
        inadimplentes: usuariosInadimplentes.length,
        novosUltimos30Dias: novosUsuarios
      };
    }

    // Estatísticas de boletos
    const totalBoletos = await Boleto.countDocuments(filtros);
    const boletosPendentes = await Boleto.countDocuments({ ...filtros, status: 'pendente' });
    const boletosVencidos = await Boleto.countDocuments({ ...filtros, status: 'vencido' });
    const boletosPagos = await Boleto.countDocuments({ ...filtros, status: 'pago' });
    const boletosCancelados = await Boleto.countDocuments({ ...filtros, status: 'cancelado' });

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

    // Valor vencido
    const boletosVencidosValor = await Boleto.find({
      ...filtros,
      status: 'vencido'
    });

    const valorVencido = boletosVencidosValor.reduce((total, boleto) => {
      return total + boleto.calcularValorTotal();
    }, 0);

    // Estatísticas de notificações (apenas para admin)
    let notificacoesStats = null;
    if (isAdmin) {
      const totalNotificacoes = await Notification.countDocuments();
      const publicadas = await Notification.countDocuments({ status: 'publicado' });
      const rascunhos = await Notification.countDocuments({ status: 'rascunho' });
      const arquivadas = await Notification.countDocuments({ status: 'arquivado' });

      notificacoesStats = {
        total: totalNotificacoes,
        publicadas,
        rascunhos,
        arquivadas,
        naoLidas: 0 // Implementar lógica de leitura posteriormente
      };
    }

    // Dados para gráficos - últimos 6 meses
    const mesesAtras = new Date();
    mesesAtras.setMonth(mesesAtras.getMonth() - 6);
    
    const dadosGraficos = [];
    for (let i = 5; i >= 0; i--) {
      const inicioMesGrafico = new Date();
      inicioMesGrafico.setMonth(inicioMesGrafico.getMonth() - i);
      inicioMesGrafico.setDate(1);
      inicioMesGrafico.setHours(0, 0, 0, 0);
      
      const fimMesGrafico = new Date(inicioMesGrafico);
      fimMesGrafico.setMonth(fimMesGrafico.getMonth() + 1);
      fimMesGrafico.setDate(0);
      fimMesGrafico.setHours(23, 59, 59, 999);

      // Boletos emitidos no mês
      const boletosEmitidos = await Boleto.find({
        ...filtros,
        dataVencimento: { $gte: inicioMesGrafico, $lte: fimMesGrafico }
      });

      const valorEmitido = boletosEmitidos.reduce((total, boleto) => {
        return total + boleto.calcularValorTotal();
      }, 0);

      // Boletos pagos no mês
      const boletosPagosMesGrafico = await Boleto.find({
        ...filtros,
        status: 'pago',
        dataPagamento: { $gte: inicioMesGrafico, $lte: fimMesGrafico }
      });

      const valorArrecadado = boletosPagosMesGrafico.reduce((total, boleto) => {
        return total + boleto.calcularValorTotal();
      }, 0);

      dadosGraficos.push({
        mes: inicioMesGrafico.toLocaleDateString('pt-BR', { month: 'short' }),
        emitido: valorEmitido,
        arrecadado: valorArrecadado
      });
    }

    const dashboardStats = {
      usuarios: usuariosStats,
      boletos: {
        total: totalBoletos,
        pendentes: boletosPendentes,
        vencidos: boletosVencidos,
        pagos: boletosPagos,
        cancelados: boletosCancelados,
        valorArrecadadoMes,
        valorEmAberto,
        valorVencido,
        taxaArrecadacao: totalBoletos > 0 ? ((boletosPagos / totalBoletos) * 100).toFixed(1) : 0
      },
      notificacoes: notificacoesStats,
      graficos: {
        mensal: dadosGraficos,
        categorias: [
          { nome: 'Taxa Condomínio', valor: 65, cor: '#FF6B35' },
          { nome: 'Taxa Extra', valor: 20, cor: '#2C3E50' },
          { nome: 'Multas', valor: 10, cor: '#FFC107' },
          { nome: 'Outros', valor: 5, cor: '#28A745' }
        ]
      }
    };

    res.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;