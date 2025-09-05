const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  cpfCnpj: { type: String, required: false, trim: true },
  email: { type: String, required: false, trim: true },
  telefone: { type: String, required: false, trim: true },
  especialidades: [{ type: String }],
  empresaVinculada: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  endereco: {
    rua: String,
    numero: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String,
  },
  ativo: { type: Boolean, default: true },
}, { timestamps: true });

ProviderSchema.index({ nome: 'text', cpfCnpj: 'text' });

module.exports = mongoose.model('Provider', ProviderSchema);