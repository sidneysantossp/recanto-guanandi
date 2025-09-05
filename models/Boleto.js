const mongoose = require('mongoose');

const BoletoSchema = new mongoose.Schema({
  numeroDocumento: {
    type: String,
    required: true,
    unique: true
  },
  proprietario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  descricao: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true
  },
  valor: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: 0
  },
  dataVencimento: {
    type: Date,
    required: [true, 'Data de vencimento é obrigatória']
  },
  dataEmissao: {
    type: Date,
    default: Date.now
  },
  dataPagamento: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pendente', 'pago', 'vencido', 'cancelado'],
    default: 'pendente'
  },
  tipoPagamento: {
    type: String,
    enum: ['boleto', 'pix', 'dinheiro', 'transferencia'],
    default: 'boleto'
  },
  codigoBarras: {
    type: String
  },
  linhaDigitavel: {
    type: String
  },
  chavePix: {
    type: String
  },
  qrCodePix: {
    type: String
  },
  txidPix: {
    type: String
  },
  metodoPagamento: {
    type: String,
    enum: ['boleto', 'pix', 'dinheiro', 'transferencia', 'cartao'],
    default: 'boleto'
  },
  categoria: {
    type: String,
    enum: ['taxa_condominio', 'taxa_extra', 'multa', 'obra', 'manutencao', 'outros'],
    default: 'taxa_condominio'
  },
  observacoes: {
    type: String,
    trim: true
  },
  valorJuros: {
    type: Number,
    default: 0
  },
  valorMulta: {
    type: Number,
    default: 0
  },
  valorDesconto: {
    type: Number,
    default: 0
  },
  nossoNumero: {
    type: String
  },
  comprovantePagamento: {
    type: String // URL do arquivo
  },
  emailEnviado: {
    type: Boolean,
    default: false
  },
  dataEnvioEmail: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices para melhor performance
BoletoSchema.index({ proprietario: 1, status: 1 });
BoletoSchema.index({ dataVencimento: 1 });
BoletoSchema.index({ numeroDocumento: 1 });

// Middleware para atualizar status baseado na data de vencimento
BoletoSchema.pre('find', function() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Atualizar boletos vencidos
  this.model.updateMany(
    {
      dataVencimento: { $lt: hoje },
      status: 'pendente'
    },
    {
      $set: { status: 'vencido' }
    }
  ).exec();
});

// Método para calcular valor total com juros e multa
BoletoSchema.methods.calcularValorTotal = function() {
  return this.valor + this.valorJuros + this.valorMulta - this.valorDesconto;
};

// Método para verificar se está vencido
BoletoSchema.methods.estaVencido = function() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return this.dataVencimento < hoje && this.status === 'pendente';
};

// Método para gerar número do documento
BoletoSchema.statics.gerarNumeroDocumento = async function() {
  const ultimoBoleto = await this.findOne({}, {}, { sort: { 'numeroDocumento': -1 } });
  
  if (!ultimoBoleto) {
    return '000001';
  }
  
  const ultimoNumero = parseInt(ultimoBoleto.numeroDocumento);
  const novoNumero = ultimoNumero + 1;
  
  return novoNumero.toString().padStart(6, '0');
};

module.exports = mongoose.model('Boleto', BoletoSchema);