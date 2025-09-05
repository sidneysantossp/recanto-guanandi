'use strict';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Prisma Client (reuso em serverless)
let prisma;
try {
  if (!global.prisma) {
    const { PrismaClient } = require('@prisma/client');
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
} catch (e) {
  // prisma ainda não instalado/gerado ou DATABASE_URL ausente
}

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Flags de uso de banco
const hasPrisma = !!prisma && !!process.env.DATABASE_URL;
const MONGODB_URI = process.env.MONGODB_URI;
const useMongo = !!MONGODB_URI && !hasPrisma;

// Conectar ao MongoDB somente quando explicitamente configurado e não usando Prisma
if (useMongo && !global._mongooseConnected) {
  mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('MongoDB conectado com sucesso');
      global._mongooseConnected = true;
    })
    .catch((err) => console.log('Erro ao conectar MongoDB:', err));
}

// Injeta prisma no request para controllers já migrarem gradualmente
app.use((req, res, next) => {
  if (hasPrisma) req.prisma = prisma;
  next();
});

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
  res.json({ message: 'API da Plataforma Guanandi funcionando!', db: hasPrisma ? 'supabase-postgres' : (useMongo ? 'mongo' : 'none') });
});

module.exports = app;