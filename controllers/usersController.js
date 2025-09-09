const bcrypt = require('bcryptjs');

// Usar instância global do Prisma
const prisma = global.prisma;

// Listar todos os usuários (apenas administradores)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', tipo = '' } = req.query;
    
    // Construir filtro de busca para Prisma
    let where = {};
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (tipo) {
      where.tipo = tipo;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        cpf: true,
        telefone: true,
        situacao: true,
        dataUltimoLogin: true,
        endereco: true,
        createdAt: true,
        updatedAt: true
      },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: users.map(user => ({ ...user, _id: user.id })), // Compatibilidade com frontend
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Obter usuário por ID
const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        cpf: true,
        telefone: true,
        situacao: true,
        dataUltimoLogin: true,
        endereco: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json({ ...user, _id: user.id }); // Compatibilidade com frontend
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Criar novo usuário (apenas administradores)
const createUser = async (req, res) => {
  try {
    const { nome, email, senha, tipo, cpf, telefone, endereco } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe com este email' });
    }

    // Criar novo usuário
    const newUser = new User({
      nome,
      email,
      senha, // será hasheada no pre-save do modelo
      tipo,
      cpf: tipo === 'proprietario' ? cpf : undefined,
      telefone,
      endereco: endereco || {}
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        id: newUser._id,
        nome: newUser.nome,
        email: newUser.email,
        tipo: newUser.tipo,
        cpf: newUser.cpf,
        telefone: newUser.telefone,
        endereco: newUser.endereco,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email ou CPF já está em uso' });
    }
    res.status(500).json({ message: error.message || 'Erro interno do servidor' });
  }
};

// Atualizar usuário
const updateUser = async (req, res) => {
  try {
    const { nome, email, tipo, cpf, telefone, endereco, situacao } = req.body;
    const userId = req.params.id;

    // Verificar se o email já está em uso por outro usuário
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
    }

    // Montar apenas campos enviados para evitar sobrescrever indevidamente
    const updateData = {};
    if (nome !== undefined) updateData.nome = nome;
    if (email !== undefined) updateData.email = email;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (cpf !== undefined) updateData.cpf = cpf;
    if (telefone !== undefined) updateData.telefone = telefone;
    if (endereco !== undefined) updateData.endereco = endereco;
    if (situacao !== undefined) updateData.situacao = situacao;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-senha');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Deletar usuário
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Não permitir que o usuário delete a si mesmo
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Você não pode deletar sua própria conta' });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Resetar senha do usuário
const resetPassword = async (req, res) => {
  try {
    const { novaSenha } = req.body;
    const userId = req.params.id;

    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(novaSenha, salt);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { senha: hashedPassword },
      { new: true }
    ).select('-senha');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ message: 'Senha resetada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Ativar/Desativar usuário
const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Alternar status do usuário
    user.situacao = user.situacao === 'ativo' ? 'inativo' : 'ativo';
    await user.save();

    res.json({
      message: `Usuário ${user.situacao === 'ativo' ? 'ativado' : 'desativado'} com sucesso`,
      user: user.getDadosPublicos()
    });
  } catch (error) {
    console.error('Erro ao alternar status do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  toggleUserStatus
};
