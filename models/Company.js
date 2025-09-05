const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  cnpj: { type: String, required: false, trim: true },
  email: { type: String, required: false, trim: true },
  telefone: { type: String, required: false, trim: true },
  endereco: {
    rua: String,
    numero: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String,
  },
  categorias: [{ type: String }],
  ativo: { type: Boolean, default: true },
}, { timestamps: true });

CompanySchema.index({ nome: 'text', cnpj: 'text' });

module.exports = mongoose.model('Company', CompanySchema);