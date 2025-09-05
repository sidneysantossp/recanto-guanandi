const app = require('./app');

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);

  // Iniciar simulador PIX em desenvolvimento somente quando rodando localmente
  if (process.env.NODE_ENV !== 'production') {
    const pixSimulator = require('./utils/pixSimulator');
    setTimeout(() => {
      pixSimulator.startSimulation(45000);
    }, 5000);
  }
});