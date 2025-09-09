/**
 * Teste da Opção 2 - Variáveis Separadas
 * Este script testa se a configuração com variáveis separadas funciona
 */

// Limpar DATABASE_URL para forçar uso das variáveis separadas
delete process.env.DATABASE_URL;

// Configurar variáveis separadas para teste
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '8889';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'root';
process.env.DB_NAME = 'guanandi';
process.env.DB_SSL = 'false';

console.log('🧪 Testando Opção 2 - Variáveis Separadas\n');

// Carregar configuração
const { getPrismaConfig, testDatabaseConnection } = require('./config/database');

console.log('📋 Variáveis configuradas para teste:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL || '❌ removida (correto)');
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_PORT:', process.env.DB_PORT);
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ definida' : '❌ não definida');
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- DB_SSL:', process.env.DB_SSL);
console.log('');

try {
  // Testar configuração
  const config = testDatabaseConnection();
  console.log('✅ Configuração válida!');
  console.log('📊 Método usado:', config.method);
  console.log('📊 URL gerada:', config.url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
  
  // Testar Prisma
  console.log('\n🔄 Testando conexão com Prisma...');
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  prisma.$connect()
    .then(() => {
      console.log('✅ Conexão estabelecida!');
      return prisma.$queryRaw`SELECT 1 as test`;
    })
    .then((result) => {
      console.log('✅ Query executada:', result);
      console.log('\n🎉 Opção 2 funcionando perfeitamente!');
      console.log('\n📝 Para usar na Vercel:');
      console.log('1. Configure as variáveis separadas');
      console.log('2. REMOVA a variável DATABASE_URL');
      console.log('3. Faça redeploy');
    })
    .catch((error) => {
      console.error('❌ Erro na conexão:', error.message);
    })
    .finally(() => {
      prisma.$disconnect();
    });
    
} catch (error) {
  console.error('❌ Erro na configuração:', error.message);
}