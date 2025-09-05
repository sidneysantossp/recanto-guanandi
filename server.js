const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/guanandi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB conectado com sucesso'))
.catch(err => console.log('Erro ao conectar MongoDB:', err));

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

// Servir arquivos estáticos do React em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API da Plataforma Guanandi funcionando!' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  
  // Iniciar simulador PIX em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    const pixSimulator = require('./utils/pixSimulator');
    // Iniciar simulação com intervalo de 45 segundos
    setTimeout(() => {
      pixSimulator.startSimulation(45000);
    }, 5000); // Aguardar 5 segundos para o servidor inicializar completamente
  }
});