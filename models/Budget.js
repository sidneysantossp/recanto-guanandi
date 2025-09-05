const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descricao: { type: String, required: true },
  categoria: { type: String, required: true },
  valorEstimado: { type: Number, required: false },
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  prestador: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  arquivos: [{
    nome: String,
    url: String,
    tipo: String,
    tamanho: Number,
  }],
  // Comentários adicionados pelos usuários/admins
  comentarios: [{
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    conteudo: { type: String, required: true },
    criadoEm: { type: Date, default: Date.now },
  }],
  // Histórico/timeline de eventos relevantes
  historico: [{
    tipo: { type: String, enum: ['criado', 'status_alterado', 'comentario_adicionado', 'anexo_adicionado', 'atualizado'], default: 'atualizado' },
    descricao: String,
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    data: { type: Date, default: Date.now },
    metadados: { type: mongoose.Schema.Types.Mixed },
  }],
  status: { type: String, enum: ['aberto', 'em_analise', 'aprovado', 'rejeitado', 'concluido'], default: 'aberto' },
  solicitante: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dataAbertura: { type: Date, default: Date.now },
  dataFechamento: { type: Date },
  observacoes: String,
}, { timestamps: true });

BudgetSchema.index({ titulo: 'text', descricao: 'text' });

module.exports = mongoose.model('Budget', BudgetSchema);