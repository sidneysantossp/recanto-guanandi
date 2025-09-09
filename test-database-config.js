/**
 * Script para testar a configuração de banco de dados
 * Verifica se DATABASE_URL ou variáveis separadas estão funcionando
 */

require('dotenv').config();
const { testDatabaseConnection } = require('./config/database');

console.log('🔧 Testando configuração de banco de dados...\n');

// Mostrar variáveis de ambiente relevantes
console.log('📋 Variáveis de ambiente detectadas:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ definida' : '❌ não definida');
console.log('- DB_HOST:', process.env.DB_HOST || 'não definida');
console.log('- DB_PORT:', process.env.DB_PORT || 'não definida');
console.log('- DB_USER:', process.env.DB_USER ? '✅ definida' : '❌ não definida');
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ definida' : '❌ não definida');
console.log('- DB_NAME:', process.env.DB_NAME ? '✅ definida' : '❌ não definida');
console.log('- DB_SSL:', process.env.DB_SSL || 'não definida');
console.log('');

try {
  // Testar configuração
  const config = testDatabaseConnection();
  console.log('\n✅ Configuração de banco válida!');
  
  // Testar conexão com Prisma
  console.log('\n🔄 Testando conexão com Prisma...');
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  // Teste simples de conexão
  prisma.$connect()
    .then(() => {
      console.log('✅ Conexão com banco estabelecida com sucesso!');
      
      // Testar uma query simples
      return prisma.$queryRaw`SELECT 1 as test`;
    })
    .then((result) => {
      console.log('✅ Query de teste executada com sucesso:', result);
      console.log('\n🎉 Banco de dados configurado e funcionando perfeitamente!');
    })
    .catch((error) => {
      console.error('❌ Erro ao conectar com o banco:', error.message);
      console.log('\n🔍 Possíveis soluções:');
      console.log('1. Verifique se o servidor MySQL está rodando');
      console.log('2. Confirme as credenciais de acesso');
      console.log('3. Verifique se o banco de dados existe');
      console.log('4. Execute: npx prisma migrate dev');
    })
    .finally(() => {
      prisma.$disconnect();
    });
    
} catch (error) {
  console.error('❌ Erro na configuração:', error.message);
  console.log('\n🔧 Como corrigir:');
  console.log('\nOpção 1 - Configure DATABASE_URL:');
  console.log('DATABASE_URL=mysql://usuario:senha@host:porta/banco');
  console.log('\nOpção 2 - Configure variáveis separadas:');
  console.log('DB_HOST=localhost');
  console.log('DB_PORT=3306');
  console.log('DB_USER=seu_usuario');
  console.log('DB_PASSWORD=sua_senha');
  console.log('DB_NAME=nome_do_banco');
  console.log('DB_SSL=false');
}