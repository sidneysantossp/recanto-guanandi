const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: 6
  },
  tipo: {
    type: String,
    enum: ['admin', 'proprietario'],
    required: true,
    default: 'proprietario'
  },
  cpf: {
    type: String,
    required: function() { return this.tipo === 'proprietario'; },
    unique: true,
    sparse: true
  },
  telefone: {
    type: String,
    trim: true
  },
  endereco: {
    lote: String,
    quadra: String,
    rua: String,
    cep: String
  },
  situacao: {
    type: String,
    enum: ['ativo', 'inativo', 'inadimplente'],
    default: 'ativo'
  },
  dataUltimoLogin: {
    type: Date
  },
  avatar: {
    type: String,
    default: ''
  },
  notificacoes: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Hash da senha antes de salvar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
UserSchema.methods.compararSenha = async function(senhaInformada) {
  return await bcrypt.compare(senhaInformada, this.senha);
};

// Método para obter dados públicos do usuário
UserSchema.methods.getDadosPublicos = function() {
  const user = this.toObject();
  delete user.senha;
  return user;
};

module.exports = mongoose.model('User', UserSchema);