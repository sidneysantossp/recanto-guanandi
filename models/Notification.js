const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true
  },
  conteudo: {
    type: String,
    required: [true, 'Conteúdo é obrigatório']
  },
  tipo: {
    type: String,
    enum: ['comunicado', 'ata', 'assembleia', 'cobranca', 'manutencao', 'urgente'],
    required: true
  },
  prioridade: {
    type: String,
    enum: ['baixa', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  destinatarios: {
    tipo: {
      type: String,
      enum: ['todos', 'especificos', 'inadimplentes', 'ativos'],
      default: 'todos'
    },
    usuarios: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dataPublicacao: {
    type: Date,
    default: Date.now
  },
  dataExpiracao: {
    type: Date
  },
  anexos: [{
    nome: String,
    url: String,
    tipo: String,
    tamanho: Number
  }],
  status: {
    type: String,
    enum: ['rascunho', 'publicado', 'arquivado'],
    default: 'rascunho'
  },
  configuracoes: {
    enviarEmail: {
      type: Boolean,
      default: true
    },
    enviarSMS: {
      type: Boolean,
      default: false
    },
    exibirDashboard: {
      type: Boolean,
      default: true
    },
    permitirComentarios: {
      type: Boolean,
      default: false
    }
  },
  estatisticas: {
    visualizacoes: {
      type: Number,
      default: 0
    },
    emailsEnviados: {
      type: Number,
      default: 0
    },
    emailsAbertos: {
      type: Number,
      default: 0
    },
    smsEnviados: {
      type: Number,
      default: 0
    }
  },
  leituras: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dataLeitura: {
      type: Date,
      default: Date.now
    },
    via: {
      type: String,
      enum: ['dashboard', 'email', 'sms'],
      default: 'dashboard'
    }
  }],
  comentarios: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    conteudo: {
      type: String,
      required: true
    },
    dataComentario: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Índices para melhor performance
NotificationSchema.index({ tipo: 1, status: 1 });
NotificationSchema.index({ dataPublicacao: -1 });
NotificationSchema.index({ 'destinatarios.usuarios': 1 });

// Método para marcar como lida por um usuário
NotificationSchema.methods.marcarComoLida = function(usuarioId, via = 'dashboard') {
  const jaLeu = this.leituras.some(leitura => 
    leitura.usuario.toString() === usuarioId.toString()
  );
  
  if (!jaLeu) {
    this.leituras.push({
      usuario: usuarioId,
      via: via
    });
    this.estatisticas.visualizacoes += 1;
  }
  
  return this.save();
};

// Método para verificar se usuário já leu
NotificationSchema.methods.foiLidaPor = function(usuarioId) {
  return this.leituras.some(leitura => 
    leitura.usuario.toString() === usuarioId.toString()
  );
};

// Método para adicionar comentário
NotificationSchema.methods.adicionarComentario = function(usuarioId, conteudo) {
  if (!this.configuracoes.permitirComentarios) {
    throw new Error('Comentários não são permitidos nesta notificação');
  }
  
  this.comentarios.push({
    usuario: usuarioId,
    conteudo: conteudo
  });
  
  return this.save();
};

// Método para obter destinatários baseado no tipo
NotificationSchema.methods.obterDestinatarios = async function() {
  const User = mongoose.model('User');
  
  switch (this.destinatarios.tipo) {
    case 'todos':
      return await User.find({ tipo: 'proprietario', situacao: 'ativo' });
    
    case 'especificos':
      return await User.find({ 
        _id: { $in: this.destinatarios.usuarios },
        situacao: 'ativo'
      });
    
    case 'inadimplentes':
      return await User.find({ 
        tipo: 'proprietario',
        situacao: 'inadimplente'
      });
    
    case 'ativos':
      return await User.find({ 
        tipo: 'proprietario',
        situacao: 'ativo'
      });
    
    default:
      return [];
  }
};

module.exports = mongoose.model('Notification', NotificationSchema);