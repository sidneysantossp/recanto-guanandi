// Usar instância global do Prisma
const prisma = global.prisma;

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = search ? {
      OR: [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cpfCnpj: { contains: search, mode: 'insensitive' } }
      ]
    } : {};
    
    const [items, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.provider.count({ where })
    ]);
    
    res.json({ 
      success: true, 
      data: items, 
      pagination: { 
        current: parseInt(page), 
        pages: Math.ceil(total / parseInt(limit)), 
        total 
      } 
    });
  } catch (e) {
    console.error('Erro ao listar prestadores:', e);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nome, cpfCnpj, email, telefone, especialidades, endereco, empresaVinculada } = req.body;
    
    const novo = await prisma.provider.create({
      data: {
        nome,
        cpfCnpj,
        email,
        telefone,
        especialidades: especialidades || [],
        endereco: endereco || null,
        empresaVinculada,
        ativo: true
      }
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Prestador criado com sucesso', 
      data: novo 
    });
  } catch (e) {
    console.error('Erro ao criar prestador:', e);
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nome, cpfCnpj, email, telefone, especialidades, endereco, empresaVinculada, ativo } = req.body;
    
    const item = await prisma.provider.update({
      where: { id: req.params.id },
      data: {
        nome,
        cpfCnpj,
        email,
        telefone,
        especialidades: especialidades || [],
        endereco: endereco || null,
        empresaVinculada,
        ativo
      }
    });
    
    res.json({ success: true, message: 'Prestador atualizado', data: item });
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Prestador não encontrado' });
    }
    console.error('Erro ao atualizar prestador:', e);
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await prisma.provider.delete({
      where: { id: req.params.id }
    });
    
    res.json({ success: true, message: 'Prestador removido' });
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Prestador não encontrado' });
    }
    console.error('Erro ao remover prestador:', e);
    res.status(400).json({ success: false, message: e.message });
  }
};