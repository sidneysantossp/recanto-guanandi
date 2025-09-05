const Budget = require('../models/Budget');

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const filtros = {};
    if (search) filtros.$text = { $search: search };
    if (status) filtros.status = status;

    const items = await Budget.find(filtros)
      .populate('empresa', 'nome')
      .populate('prestador', 'nome')
      .populate('solicitante', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Budget.countDocuments(filtros);
    res.json({ success: true, data: items, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const item = await Budget.findById(req.params.id)
      .populate('empresa', 'nome')
      .populate('prestador', 'nome')
      .populate('solicitante', 'name email')
      .populate('comentarios.autor', 'name email')
      .populate('historico.usuario', 'name email');
    if (!item) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    res.json({ success: true, data: item });
  } catch (e) {
    res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = { ...req.body, solicitante: req.user && req.user._id };
    const novo = await Budget.create({
      ...payload,
      historico: [{ tipo: 'criado', descricao: 'Orçamento criado', usuario: req.user && req.user._id }]
    });
    res.status(201).json({ success: true, message: 'Orçamento criado com sucesso', data: novo });
  } catch (e) {
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