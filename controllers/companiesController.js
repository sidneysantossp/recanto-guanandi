const Company = require('../models/Company');

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const filtros = search ? { $text: { $search: search } } : {};
    const items = await Company.find(filtros)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Company.countDocuments(filtros);
    res.json({ success: true, data: items, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const novo = await Company.create(req.body);
    res.status(201).json({ success: true, message: 'Empresa criada com sucesso', data: novo });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Empresa não encontrada' });
    res.json({ success: true, message: 'Empresa atualizada', data: item });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Company.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Empresa não encontrada' });
    res.json({ success: true, message: 'Empresa removida' });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};