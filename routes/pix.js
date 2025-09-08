const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, adminAuth } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// @route   POST /api/pix/generate
// @desc    Gerar chave PIX para boleto
// @access  Private/Admin
router.post('/generate', auth, adminAuth, async (req, res) => {
  try {
    const { boletoId } = req.body;
    
    // Buscar dados do boleto
    const boleto = await prisma.boleto.findUnique({
      where: { id: parseInt(boletoId) },
      include: {
        proprietario: {
          select: { nome: true, email: true }
        }
      }
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
    
    // Gerar TXID único
    const txid = `GUANANDI${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Dados do PIX
    const chavePix = 'pix@guanandi.com.br';
    const valor = boleto.valor;
    const descricao = `Boleto ${boleto.descricao} - ${boleto.proprietario.nome}`;
    
    // Gerar código PIX (formato simplificado)
    const codigoPix = `00020126580014BR.GOV.BCB.PIX0136${chavePix}520400005303986540${valor.toFixed(2)}5802BR5913GUANANDI COND6009SAO PAULO62${('0' + txid.length).slice(-2)}${txid}6304`;
    
    // QR Code mockado (em produção, usar biblioteca de QR Code)
    const qrCodeBase64 = 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <rect x="20" y="20" width="160" height="160" fill="none" stroke="black" stroke-width="2"/>
        <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="black">QR CODE PIX</text>
        <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="10" fill="black">R$ ${valor.toFixed(2)}</text>
        <text x="100" y="140" text-anchor="middle" font-family="Arial" font-size="8" fill="black">${txid}</text>
      </svg>
    `).toString('base64');
    
    const pixData = {
      boletoId: boleto._id,
      chavePix: chavePix,
      qrCode: qrCodeBase64,
      codigoPix: codigoPix,
      valor: valor,
      descricao: descricao,
      vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      txid: txid,
      status: 'PENDENTE',
      proprietario: {
        nome: boleto.proprietario.nome,
        email: boleto.proprietario.email
      }
    };
    
    res.json({
      success: true,
      message: 'PIX gerado com sucesso',
      data: pixData
    });
    
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/pix/webhook
// @desc    Webhook para receber notificações de pagamento PIX
// @access  Public (mas deve ser validado)
router.post('/webhook', async (req, res) => {
  try {
    const { txid, status, valor, dataPagamento, boletoId } = req.body;
    
    // TODO: Validar assinatura do webhook em produção
    
    console.log('Webhook PIX recebido:', { txid, status, valor, dataPagamento, boletoId });
    
    // Se o pagamento foi confirmado, atualizar o boleto
    if (status === 'PAGO' && boletoId) {
      // Buscar o boleto
      const boleto = await prisma.boleto.findUnique({
        where: { id: parseInt(boletoId) },
        include: {
          proprietario: true
        }
      });
      if (!boleto) {
        return res.status(404).json({
          success: false,
          message: 'Boleto não encontrado'
        });
      }
      
      // Verificar se o boleto já não foi pago
      if (boleto.status === 'pago') {
        return res.json({
          success: true,
          message: 'Boleto já estava marcado como pago'
        });
      }
      
      // Atualizar o boleto como pago
      await prisma.boleto.update({
        where: { id: boleto.id },
        data: {
          status: 'pago',
          dataPagamento: new Date(dataPagamento || Date.now()),
          metodoPagamento: 'pix',
          txidPix: txid
        }
      });
      
      // Verificar se todos os boletos do proprietário foram pagos
      const boletosRestantes = await prisma.boleto.count({
        where: {
          proprietarioId: boleto.proprietarioId,
          status: { not: 'pago' }
        }
      });
      
      if (boletosRestantes === 0) {
        await prisma.user.update({
          where: { id: boleto.proprietarioId },
          data: { situacao: 'adimplente' }
        });
      }
      
      console.log(`Boleto ${boleto.numeroDocumento} marcado como pago via PIX (TXID: ${txid})`);
    }
    
    res.json({
      success: true,
      message: 'Webhook processado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao processar webhook PIX:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/pix/status/:txid
// @desc    Consultar status de pagamento PIX
// @access  Private
router.get('/status/:txid', auth, async (req, res) => {
  try {
    const { txid } = req.params;
    
    // TODO: Implementar consulta real à API PIX
    // Por enquanto, simular diferentes estados baseado no TXID
    
    let status = 'PENDENTE';
    let dataPagamento = null;
    let valor = 100.00;
    
    // Simular diferentes estados para demonstração
    const now = new Date();
    const txidNumber = parseInt(txid.replace(/\D/g, '')) || 0;
    
    if (txidNumber % 3 === 0) {
      // 1/3 dos TXIDs simulam pagamento realizado
      status = 'PAGO';
      dataPagamento = new Date(now.getTime() - Math.random() * 60 * 60 * 1000); // Pago nas últimas horas
    } else if (txidNumber % 7 === 0) {
      // Alguns TXIDs simulam expiração
      status = 'EXPIRADO';
    }
    
    // Em uma implementação real, buscar dados do banco ou API PIX
    const pixData = {
      txid: txid,
      status: status,
      valor: valor,
      dataPagamento: dataPagamento,
      dataConsulta: now
    };
    
    res.json({
      success: true,
      data: pixData
    });
    
  } catch (error) {
    console.error('Erro ao consultar status PIX:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/pix/simulate-payment/:boletoId
// @desc    Simular pagamento PIX para teste (apenas desenvolvimento)
// @access  Private
router.post('/simulate-payment/:boletoId', auth, async (req, res) => {
  try {
    // Apenas permitir em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Simulação não disponível em produção'
      });
    }

    const { boletoId } = req.params;
    const pixSimulator = require('../utils/pixSimulator');
    
    const success = await pixSimulator.simulatePaymentById(boletoId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Pagamento PIX simulado com sucesso'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erro ao simular pagamento PIX'
      });
    }
    
  } catch (error) {
    console.error('Erro ao simular pagamento PIX:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;