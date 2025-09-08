const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const where = search ? {
      OR: [
        { nome: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};
    
    const [items, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.company.count({ where })
    ]);
    
    res.json({ 
      success: true, 
      data: items, 
      pagination: { 
        current: pageNum, 
        pages: Math.ceil(total / limitNum), 
        total 
      } 
    });
  } catch (e) {
    console.error('Erro ao listar empresas:', e);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const novo = await prisma.company.create({
      data: req.body
    });
    res.status(201).json({ success: true, message: 'Empresa criada com sucesso', data: novo });
  } catch (e) {
    console.error('Erro ao criar empresa:', e);
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await prisma.company.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, message: 'Empresa atualizada', data: item });
  } catch (e) {
    console.error('Erro ao atualizar empresa:', e);
    if (e.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Empresa não encontrada' });
    }
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.company.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Empresa removida' });
  } catch (e) {
    console.error('Erro ao remover empresa:', e);
    if (e.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Empresa não encontrada' });
    }
    res.status(400).json({ success: false, message: e.message });
  }
};