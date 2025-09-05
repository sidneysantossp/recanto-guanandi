const Provider = require('../models/Provider');

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const filtros = search ? { $text: { $search: search } } : {};
    const items = await Provider.find(filtros)
      .populate('empresaVinculada', 'nome')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Provider.countDocuments(filtros);
    res.json({ success: true, data: items, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const novo = await Provider.create(req.body);
    res.status(201).json({ success: true, message: 'Prestador criado com sucesso', data: novo });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Provider.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Prestador não encontrado' });
    res.json({ success: true, message: 'Prestador atualizado', data: item });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Provider.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Prestador não encontrado' });
    res.json({ success: true, message: 'Prestador removido' });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};