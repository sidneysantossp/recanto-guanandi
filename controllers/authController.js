const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registrar novo usuário (apenas administradores podem criar usuários)
const register = async (req, res) => {
  try {
    const { nome, email, senha, tipo, cpf } = req.body;

    if (req.prisma) {
      // Prisma path
      const prisma = req.prisma;
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) return res.status(400).json({ message: 'Usuário já existe com este email' });

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(senha, salt);
      const created = await prisma.user.create({
        data: {
          nome,
          email: email.toLowerCase(),
          senha: hashed,
          tipo: (tipo === 'admin' ? 'admin' : 'proprietario'),
          cpf: tipo === 'proprietario' ? cpf || null : null
        },
        select: { id: true, nome: true, email: true, tipo: true, cpf: true }
      });
      return res.status(201).json({ message: 'Usuário criado com sucesso', user: created });
    }

    // Mongoose path (legacy)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe com este email' });
    }

    const newUser = new User({
      nome,
      email,
      senha, // será hasheada no pre-save do modelo
      tipo,
      cpf: tipo === 'proprietario' ? cpf : undefined
    });

    await newUser.save();

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser._id,
        nome: newUser.nome,
        email: newUser.email,
        tipo: newUser.tipo,
        cpf: newUser.cpf
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Login do usuário
const login = async (req, res) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    const { email, senha, password } = req.body;
    const senhaFinal = senha || password;
    
    console.log(`[LOGIN] Tentativa de login para: ${email} | IP: ${clientIP}`);
    
    // Validação de entrada
    if (!email || !senhaFinal) {
      console.log(`[LOGIN] Erro de validação: email=${!!email}, senha=${!!senhaFinal}`);
      return res.status(400).json({ 
        success: false,
        message: 'Email e senha são obrigatórios',
        error_type: 'validation_error'
      });
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`[LOGIN] Email inválido: ${email}`);
      return res.status(400).json({ 
        success: false,
        message: 'Formato de email inválido',
        error_type: 'invalid_email'
      });
    }

    if (req.prisma) {
      console.log('[LOGIN] Usando Prisma (MySQL)');
      const prisma = req.prisma;
      
      try {
        // Buscar usuário
        const user = await prisma.user.findUnique({ 
          where: { email: email.toLowerCase() } 
        });
        
        if (!user) {
          console.log(`[LOGIN] Usuário não encontrado: ${email}`);
          return res.status(401).json({ 
            success: false,
            message: 'Email não encontrado no sistema',
            error_type: 'user_not_found'
          });
        }

        console.log(`[LOGIN] Usuário encontrado: ${user.nome} (${user.email}) | Tipo: ${user.tipo}`);
        
        // Verificar se usuário está ativo
        if (user.ativo === false) {
          console.log(`[LOGIN] Usuário inativo: ${email}`);
          return res.status(403).json({ 
            success: false,
            message: 'Usuário desativado. Entre em contato com o administrador.',
            error_type: 'user_inactive'
          });
        }

        // Verificar senha
        const isMatch = await bcrypt.compare(senhaFinal, user.senha);
        if (!isMatch) {
          console.log(`[LOGIN] Senha incorreta para: ${email}`);
          return res.status(401).json({ 
            success: false,
            message: 'Senha incorreta',
            error_type: 'wrong_password'
          });
        }

        console.log(`[LOGIN] Autenticação bem-sucedida para: ${email}`);

        // Gerar token JWT
        const payload = { user: { id: user.id, tipo: user.tipo } };
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
        
        if (jwtSecret === 'fallback_secret_key') {
          console.warn('[LOGIN] AVISO: Usando JWT_SECRET padrão. Configure uma chave segura!');
        }
        
        jwt.sign(
          payload,
          jwtSecret,
          { expiresIn: '24h' },
          (err, token) => {
            if (err) {
              console.error('[LOGIN] Erro ao gerar token JWT:', err);
              return res.status(500).json({ 
                success: false,
                message: 'Erro ao gerar token de autenticação',
                error_type: 'jwt_error'
              });
            }
            
            const loginTime = Date.now() - startTime;
            console.log(`[LOGIN] Login concluído com sucesso em ${loginTime}ms para: ${email}`);
            
            res.json({
              success: true,
              token,
              user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                tipo: user.tipo,
                apartamento: user.apartamento
              }
            });
          }
        );
        return;
        
      } catch (prismaError) {
        console.error('[LOGIN] Erro do Prisma:', prismaError);
        return res.status(500).json({ 
          success: false,
          message: 'Erro de conexão com o banco de dados',
          error_type: 'database_error',
          details: process.env.NODE_ENV === 'development' ? prismaError.message : undefined
        });
      }
    }

    // Fallback para MongoDB (caso não tenha Prisma)
    console.log('[LOGIN] Usando MongoDB (fallback)');
    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`[LOGIN] Usuário não encontrado (MongoDB): ${email}`);
        return res.status(401).json({ 
          success: false,
          message: 'Email não encontrado no sistema',
          error_type: 'user_not_found'
        });
      }

      const isMatch = await bcrypt.compare(senhaFinal, user.senha);
      if (!isMatch) {
        console.log(`[LOGIN] Senha incorreta (MongoDB): ${email}`);
        return res.status(401).json({ 
          success: false,
          message: 'Senha incorreta',
          error_type: 'wrong_password'
        });
      }

      const payload = {
        user: {
          id: user._id,
          tipo: user.tipo
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '24h' },
        (err, token) => {
          if (err) {
            console.error('[LOGIN] Erro ao gerar token JWT (MongoDB):', err);
            return res.status(500).json({ 
              success: false,
              message: 'Erro ao gerar token de autenticação',
              error_type: 'jwt_error'
            });
          }
          
          const loginTime = Date.now() - startTime;
          console.log(`[LOGIN] Login MongoDB concluído em ${loginTime}ms para: ${email}`);
          
          res.json({
            success: true,
            token,
            user: {
              id: user._id,
              nome: user.nome,
              email: user.email,
              tipo: user.tipo,
              apartamento: user.apartamento
            }
          });
        }
      );
    } catch (mongoError) {
      console.error('[LOGIN] Erro do MongoDB:', mongoError);
      return res.status(500).json({ 
        success: false,
        message: 'Erro de conexão com o banco de dados',
        error_type: 'database_error',
        details: process.env.NODE_ENV === 'development' ? mongoError.message : undefined
      });
    }
    
  } catch (error) {
    const loginTime = Date.now() - startTime;
    console.error(`[LOGIN] Erro geral após ${loginTime}ms:`, {
      message: error.message,
      stack: error.stack,
      email: req.body?.email,
      ip: clientIP
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error_type: 'server_error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obter perfil do usuário logado
const getProfile = async (req, res) => {
  try {
    if (req.prisma) {
      const prisma = req.prisma;
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
      const { senha, ...safe } = user;
      return res.json({ success: true, data: safe });
    }

    const user = await User.findById(req.user.id).select('-senha');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar perfil do usuário
const updateProfile = async (req, res) => {
  try {
    const { nome, email } = req.body;
    const userId = req.user.id;

    if (req.prisma) {
      const prisma = req.prisma;
      if (email) {
        const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (exists && exists.id !== userId) {
          return res.status(400).json({ message: 'Email já está em uso' });
        }
      }
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(nome !== undefined ? { nome } : {}),
          ...(email !== undefined ? { email: email.toLowerCase() } : {})
        },
      });
      const { senha, ...safe } = updated;
      return res.json({ message: 'Perfil atualizado com sucesso', user: safe });
    }

    // Mongo path
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { nome, email },
      { new: true, runValidators: true }
    ).select('-senha');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ message: 'Perfil atualizado com sucesso', user: updatedUser });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Alterar senha
const changePassword = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const userId = req.user.id;

    if (req.prisma) {
      const prisma = req.prisma;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
      const isMatch = await bcrypt.compare(senhaAtual, user.senha);
      if (!isMatch) return res.status(400).json({ message: 'Senha atual incorreta' });
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(novaSenha, salt);
      await prisma.user.update({ where: { id: userId }, data: { senha: hashed } });
      return res.json({ message: 'Senha alterada com sucesso' });
    }

    // Mongo path
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const isMatch = await bcrypt.compare(senhaAtual, user.senha);
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(novaSenha, salt);

    await User.findByIdAndUpdate(userId, { senha: hashedPassword });

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
