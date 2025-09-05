const axios = require('axios');

/**
 * Simulador de pagamentos PIX para demonstração
 * Em produção, isso seria substituído por webhooks reais da instituição financeira
 */
class PixSimulator {
  constructor() {
    this.simulationInterval = null;
    this.baseUrl = 'http://localhost:5001/api/pix';
  }

  /**
   * Inicia a simulação de pagamentos PIX
   * @param {number} intervalMs - Intervalo em milissegundos para verificar pagamentos
   */
  startSimulation(intervalMs = 30000) { // 30 segundos por padrão
    console.log('🔄 Iniciando simulador de pagamentos PIX...');
    
    this.simulationInterval = setInterval(async () => {
      await this.simulateRandomPayment();
    }, intervalMs);
  }

  /**
   * Para a simulação de pagamentos PIX
   */
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      console.log('⏹️ Simulador de pagamentos PIX parado.');
    }
  }

  /**
   * Simula um pagamento PIX aleatório
   */
  async simulateRandomPayment() {
    try {
      // Buscar boletos pendentes com PIX gerado
      const Boleto = require('../models/Boleto');
      
      const boletosComPix = await Boleto.find({
        status: { $in: ['pendente', 'vencido'] },
        txidPix: { $exists: true, $ne: null }
      }).limit(10);

      if (boletosComPix.length === 0) {
        return;
      }

      // Selecionar um boleto aleatório para "pagar"
      const randomIndex = Math.floor(Math.random() * boletosComPix.length);
      const boleto = boletosComPix[randomIndex];

      // 20% de chance de simular um pagamento
      if (Math.random() < 0.2) {
        await this.simulatePayment(boleto);
      }
    } catch (error) {
      console.error('Erro na simulação de pagamento PIX:', error);
    }
  }

  /**
   * Simula o pagamento de um boleto específico
   * @param {Object} boleto - Objeto do boleto
   */
  async simulatePayment(boleto) {
    try {
      const webhookData = {
        txid: boleto.txidPix,
        status: 'PAGO',
        valor: boleto.valor,
        dataPagamento: new Date().toISOString(),
        boletoId: boleto._id.toString()
      };

      // Enviar webhook simulado
      await axios.post(`${this.baseUrl}/webhook`, webhookData);
      
      console.log(`💰 Pagamento PIX simulado para boleto ${boleto.numeroDocumento} (TXID: ${boleto.txidPix})`);
    } catch (error) {
      console.error('Erro ao simular pagamento:', error.message);
    }
  }

  /**
   * Simula o pagamento de um boleto específico por ID
   * @param {string} boletoId - ID do boleto
   */
  async simulatePaymentById(boletoId) {
    try {
      const Boleto = require('../models/Boleto');
      const boleto = await Boleto.findById(boletoId);
      
      if (!boleto) {
        throw new Error('Boleto não encontrado');
      }

      if (!boleto.txidPix) {
        throw new Error('Boleto não possui TXID PIX');
      }

      if (boleto.status === 'pago') {
        throw new Error('Boleto já está pago');
      }

      await this.simulatePayment(boleto);
      return true;
    } catch (error) {
      console.error('Erro ao simular pagamento por ID:', error.message);
      return false;
    }
  }
}

module.exports = new PixSimulator();