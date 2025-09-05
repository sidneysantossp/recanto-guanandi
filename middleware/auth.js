const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar token JWT
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acesso não fornecido' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    const user = await User.findById(decoded.user.id).select('-senha');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido - usuário não encontrado' 
      });
    }

    if (user.situacao === 'inativo') {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário inativo' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
};

// Middleware para verificar se é administrador
const adminAuth = (req, res, next) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado - apenas administradores' 
    });
  }
  next();
};

// Middleware para verificar se é proprietário ou admin
const proprietarioAuth = (req, res, next) => {
  if (req.user.tipo !== 'proprietario' && req.user.tipo !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado - apenas proprietários ou administradores' 
    });
  }
  next();
};

// Middleware para verificar se pode acessar dados de um usuário específico
const ownerOrAdmin = (req, res, next) => {
  const userId = req.params.id || req.params.userId;
  
  if (req.user.tipo === 'admin' || req.user._id.toString() === userId) {
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Acesso negado - você só pode acessar seus próprios dados' 
  });
};

// Middleware para log de atividades
const logActivity = (action) => {
  return (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.user.nome} (${req.user.tipo}) - ${action}`);
    next();
  };
};

module.exports = {
  auth,
  adminAuth,
  proprietarioAuth,
  ownerOrAdmin,
  logActivity
};