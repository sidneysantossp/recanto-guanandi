'use strict';
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Configuração flexível de banco de dados
const { getPrismaConfig } = require('./config/database');

// Prisma Client (reuso em serverless)
let prisma;
try {
  // Configura o banco de dados (DATABASE_URL ou variáveis separadas)
  getPrismaConfig();
  
  if (!global.prisma) {
    const { PrismaClient } = require('@prisma/client');
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
} catch (e) {
  console.error('❌ Erro na configuração do banco:', e.message);
  // prisma ainda não instalado/gerado ou configuração de banco ausente
}

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Flags de uso de banco - Usa apenas MySQL/Prisma
const hasPrisma = !!prisma && (!!process.env.DATABASE_URL || !!process.env.PRISMA_DATABASE_URL);

// Log da configuração de banco
if (hasPrisma) {
  console.log('✅ Usando MySQL com Prisma');
} else {
  console.log('❌ Nenhum banco de dados configurado - verifique configuração do banco');
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
  res.json({ message: 'API da Plataforma Guanandi funcionando!', db: hasPrisma ? 'mysql-prisma' : 'none' });
});

module.exports = app;
