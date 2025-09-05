'use strict';

// Função serverless simples para validar /api/test na Vercel
module.exports = (req, res) => {
  res.status(200).json({ ok: true, route: '/api/test', runtime: 'vercel-node', timestamp: Date.now() });
};