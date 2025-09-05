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
  try {
    const { email, senha } = req.body;

    if (req.prisma) {
      const prisma = req.prisma;
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user) return res.status(400).json({ message: 'Credenciais inválidas' });

      const isMatch = await bcrypt.compare(senha, user.senha);
      if (!isMatch) return res.status(400).json({ message: 'Credenciais inválidas' });

      const payload = { user: { id: user.id, tipo: user.tipo } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
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
    }

    // Mongo path
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
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
        if (err) throw err;
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
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
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
