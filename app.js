'use strict';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar ao MongoDB (reuso entre invocações)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guanandi';
if (!global._mongooseConnected) {
  mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('MongoDB conectado com sucesso');
      global._mongooseConnected = true;
    })
    .catch((err) => console.log('Erro ao conectar MongoDB:', err));
}

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/boletos', require('./routes/boletos'));
app.use('/api/pix', require('./routes/pix'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
const budgetsRoutes = require('./routes/budgets');
const companiesRoutes = require('./routes/companies');
const providersRoutes = require('./routes/providers');
app.use('/api/budgets', budgetsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/providers', providersRoutes);

// Rota de teste/healthcheck
app.get('/api/test', (req, res) => {
  res.json({ message: 'API da Plataforma Guanandi funcionando!' });
});

module.exports = app;