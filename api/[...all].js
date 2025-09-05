'use strict';
const app = require('../app');

// Vercel Node.js Serverless Function entrypoint
// Normaliza a URL para manter o prefixo /api nas rotas do Express
module.exports = (req, res) => {
  // Quando a função é montada em /api, Vercel encaminha /api/test como req.url === '/test'
  // Nosso app Express define rotas começando com '/api', então reanexamos o prefixo quando faltar
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  return app(req, res);
};