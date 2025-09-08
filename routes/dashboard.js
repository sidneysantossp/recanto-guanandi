const express = require('express');
const { auth } = require('../middleware/auth');

// Usar instância global do Prisma
const prisma = global.prisma;

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
      const totalUsuarios = await prisma.user.count({ 
        where: { tipo: 'proprietario' } 
      });
      
      // Para simplificar, vamos considerar todos os usuários como ativos por enquanto
      const usuariosAtivos = totalUsuarios;
      const usuariosInativos = 0;
      
      // Usuários inadimplentes (com boletos vencidos)
      let usuariosInadimplentes = 0;
      try {
        const boletosVencidos = await prisma.boleto.findMany({
          where: { status: 'vencido' },
          select: { proprietario: true },
        distinct: ['proprietario']
        });
        usuariosInadimplentes = boletosVencidos.length;
      } catch (error) {
        console.log('Erro ao buscar boletos vencidos:', error.message);
      }
      
      // Novos usuários nos últimos 30 dias
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);
      const novosUsuarios = await prisma.user.count({
        where: {
          tipo: 'proprietario',
          createdAt: { gte: dataLimite }
        }
      });

      usuariosStats = {
        total: totalUsuarios,
        ativos: usuariosAtivos,
        inativos: usuariosInativos,
        inadimplentes: usuariosInadimplentes,
        novosUltimos30Dias: novosUsuarios
      };
    }

    // Estatísticas de boletos
    let totalBoletos = 0;
    let boletosPendentes = 0;
    let boletosVencidos = 0;
    let boletosPagos = 0;
    let boletosCancelados = 0;
    
    try {
      // Filtros para Prisma (convertendo de MongoDB para MySQL)
      const whereClause = isAdmin ? {} : { proprietario: req.user.id };
      
      totalBoletos = await prisma.boleto.count({ where: whereClause });
      boletosPendentes = await prisma.boleto.count({ where: { ...whereClause, status: 'pendente' } });
      boletosVencidos = await prisma.boleto.count({ where: { ...whereClause, status: 'vencido' } });
      boletosPagos = await prisma.boleto.count({ where: { ...whereClause, status: 'pago' } });
      boletosCancelados = await prisma.boleto.count({ where: { ...whereClause, status: 'cancelado' } });
    } catch (error) {
      console.log('Erro ao buscar estatísticas de boletos:', error.message);
    }

    // Valor total arrecadado no mês atual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const fimMes = new Date(inicioMes);
    fimMes.setMonth(fimMes.getMonth() + 1);
    fimMes.setDate(0);
    fimMes.setHours(23, 59, 59, 999);

    let valorArrecadadoMes = 0;
    let valorEmAberto = 0;
    let valorVencido = 0;
    
    try {
      const whereClause = isAdmin ? {} : { proprietario: req.user.id };
      
      // Boletos pagos no mês atual
      const boletosPagosMes = await prisma.boleto.findMany({
        where: {
          ...whereClause,
          status: 'pago',
          dataPagamento: {
            gte: inicioMes,
            lte: fimMes
          }
        },
        select: { valor: true, valorJuros: true, valorMulta: true }
      });

      valorArrecadadoMes = boletosPagosMes.reduce((total, boleto) => {
        return total + (boleto.valor + (boleto.valorJuros || 0) + (boleto.valorMulta || 0));
      }, 0);

      // Valor em aberto (pendentes + vencidos)
      const boletosEmAberto = await prisma.boleto.findMany({
        where: {
          ...whereClause,
          status: { in: ['pendente', 'vencido'] }
        },
        select: { valor: true, valorJuros: true, valorMulta: true }
      });

      valorEmAberto = boletosEmAberto.reduce((total, boleto) => {
        return total + (boleto.valor + (boleto.valorJuros || 0) + (boleto.valorMulta || 0));
      }, 0);

      // Valor vencido
      const boletosVencidosValor = await prisma.boleto.findMany({
        where: {
          ...whereClause,
          status: 'vencido'
        },
        select: { valor: true, valorJuros: true, valorMulta: true }
      });

      valorVencido = boletosVencidosValor.reduce((total, boleto) => {
        return total + (boleto.valor + (boleto.valorJuros || 0) + (boleto.valorMulta || 0));
      }, 0);
    } catch (error) {
      console.log('Erro ao calcular valores:', error.message);
    }

    // Estatísticas de notificações (apenas para admin)
    let notificacoesStats = null;
    if (isAdmin) {
      try {
        const totalNotificacoes = await prisma.notification.count();
        const publicadas = await prisma.notification.count({ where: { status: 'publicado' } });
        const rascunhos = await prisma.notification.count({ where: { status: 'rascunho' } });
        const arquivadas = await prisma.notification.count({ where: { status: 'arquivado' } });

        notificacoesStats = {
          total: totalNotificacoes,
          publicadas,
          rascunhos,
          arquivadas,
          naoLidas: 0 // Implementar lógica de leitura posteriormente
        };
      } catch (error) {
        console.log('Erro ao buscar estatísticas de notificações:', error.message);
        notificacoesStats = {
          total: 0,
          publicadas: 0,
          rascunhos: 0,
          arquivadas: 0,
          naoLidas: 0
        };
      }
    }

    // Dados para gráficos - últimos 6 meses
    const mesesAtras = new Date();
    mesesAtras.setMonth(mesesAtras.getMonth() - 6);
    
    const dadosGraficos = [];
    const whereClause = isAdmin ? {} : { proprietario: req.user.id };
    
    for (let i = 5; i >= 0; i--) {
      const inicioMesGrafico = new Date();
      inicioMesGrafico.setMonth(inicioMesGrafico.getMonth() - i);
      inicioMesGrafico.setDate(1);
      inicioMesGrafico.setHours(0, 0, 0, 0);
      
      const fimMesGrafico = new Date(inicioMesGrafico);
      fimMesGrafico.setMonth(fimMesGrafico.getMonth() + 1);
      fimMesGrafico.setDate(0);
      fimMesGrafico.setHours(23, 59, 59, 999);

      let valorEmitido = 0;
      let valorArrecadado = 0;
      
      try {
        // Boletos emitidos no mês
        const boletosEmitidos = await prisma.boleto.findMany({
          where: {
            ...whereClause,
            dataVencimento: {
              gte: inicioMesGrafico,
              lte: fimMesGrafico
            }
          },
          select: {
            valor: true,
            valorJuros: true,
            valorMulta: true
          }
        });

        valorEmitido = boletosEmitidos.reduce((total, boleto) => {
          return total + (boleto.valor + (boleto.valorJuros || 0) + (boleto.valorMulta || 0));
        }, 0);

        // Boletos pagos no mês
        const boletosPagosMesGrafico = await prisma.boleto.findMany({
          where: {
            ...whereClause,
            status: 'pago',
            dataPagamento: {
              gte: inicioMesGrafico,
              lte: fimMesGrafico
            }
          },
          select: { valor: true, valorJuros: true, valorMulta: true }
        });

        valorArrecadado = boletosPagosMesGrafico.reduce((total, boleto) => {
          return total + (boleto.valor + (boleto.valorJuros || 0) + (boleto.valorMulta || 0));
        }, 0);
      } catch (error) {
        console.log(`Erro ao buscar dados do gráfico para o mês ${i}:`, error.message);
      }

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