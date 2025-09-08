const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const where = {};
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) where.status = status;
    
    const [items, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          companyRel: { select: { nome: true } },
          providerRel: { select: { nome: true } },
          solicitanteRel: { select: { nome: true, email: true } }
        }
      }),
      prisma.budget.count({ where })
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
    console.error('Erro ao listar orçamentos:', e);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const item = await prisma.budget.findUnique({
      where: { id: req.params.id },
      include: {
        companyRel: { select: { nome: true } },
        providerRel: { select: { nome: true } },
        solicitanteRel: { select: { nome: true, email: true } },
        comentarios: {
          include: {
            autorRel: { select: { nome: true, email: true } }
          }
        },
        historico: {
          include: {
            usuarioRel: { select: { nome: true, email: true } }
          }
        }
      }
    });
    if (!item) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    res.json({ success: true, data: item });
  } catch (e) {
    console.error('Erro ao buscar orçamento:', e);
    res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = { ...req.body, solicitante: req.user && req.user.id };
    const novo = await prisma.budget.create({
      data: {
        ...payload,
        historico: {
          create: [{ tipo: 'criado', descricao: 'Orçamento criado', usuario: req.user && req.user.id }]
        }
      }
    });
    res.status(201).json({ success: true, message: 'Orçamento criado com sucesso', data: novo });
  } catch (e) {
    console.error('Erro ao criar orçamento:', e);
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    // registra atualização
    await Budget.findByIdAndUpdate(req.params.id, { 
      $push: { historico: { tipo: 'atualizado', descricao: 'Dados do orçamento atualizados', usuario: req.user && req.user._id } } 
    });
    res.json({ success: true, message: 'Orçamento atualizado', data: item });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const item = await Budget.findByIdAndUpdate(req.params.id, { status, dataFechamento: status === 'concluido' ? new Date() : undefined }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    await Budget.findByIdAndUpdate(req.params.id, {
      $push: { historico: { tipo: 'status_alterado', descricao: `Status alterado para ${status}`, usuario: req.user && req.user._id, metadados: { status } } }
    });
    res.json({ success: true, message: 'Status atualizado', data: item });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { conteudo } = req.body;
    if (!conteudo || !conteudo.trim()) {
      return res.status(400).json({ success: false, message: 'Conteúdo do comentário é obrigatório' });
    }
    const update = await Budget.findByIdAndUpdate(req.params.id, {
      $push: { 
        comentarios: { autor: req.user && req.user._id, conteudo },
        historico: { tipo: 'comentario_adicionado', descricao: 'Comentário adicionado', usuario: req.user && req.user._id }
      }
    }, { new: true })
      .populate('comentarios.autor', 'name email')
      .populate('historico.usuario', 'name email');
    if (!update) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    res.json({ success: true, message: 'Comentário adicionado', data: update });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const item = await Budget.findById(req.params.id)
      .select('historico')
      .populate('historico.usuario', 'name email');
    if (!item) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    res.json({ success: true, data: item.historico || [] });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Budget.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    res.json({ success: true, message: 'Orçamento removido' });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};