#!/usr/bin/env node
/**
 * Script para configurar DATABASE_URL na Vercel usando variáveis separadas
 * Este script deve ser executado durante o build na Vercel
 */

const fs = require('fs');
const path = require('path');

// Função para construir DATABASE_URL a partir de variáveis separadas
function buildDatabaseUrl() {
  const {
    DB_HOST,
    DB_PORT = '3306',
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_SSL = 'false'
  } = process.env;

  // Verifica se todas as variáveis necessárias estão presentes
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    console.error('❌ Variáveis de banco incompletas!');
    console.error('Necessário: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('Atual:');
    console.error(`- DB_HOST: ${DB_HOST || 'não definido'}`);
    console.error(`- DB_PORT: ${DB_PORT}`);
    console.error(`- DB_USER: ${DB_USER || 'não definido'}`);
    console.error(`- DB_PASSWORD: ${DB_PASSWORD ? 'definido' : 'não definido'}`);
    console.error(`- DB_NAME: ${DB_NAME || 'não definido'}`);
    console.error(`- DB_SSL: ${DB_SSL}`);
    process.exit(1);
  }

  // Constrói a URL do banco
  const sslParam = DB_SSL === 'true' ? '?ssl=true' : '';
  const databaseUrl = `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}${sslParam}`;
  
  console.log('✅ DATABASE_URL construída com sucesso');
  console.log(`📊 Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`📊 Banco: ${DB_NAME}`);
  console.log(`📊 Usuário: ${DB_USER}`);
  console.log(`📊 SSL: ${DB_SSL}`);
  
  return databaseUrl;
}

// Configura DATABASE_URL se não estiver definida
if (!process.env.DATABASE_URL) {
  try {
    const databaseUrl = buildDatabaseUrl();
    process.env.DATABASE_URL = databaseUrl;
    console.log('📊 DATABASE_URL configurada automaticamente');
    
    // Salva em arquivo .env para o Prisma
    const envContent = `DATABASE_URL="${databaseUrl}"\n`;
    fs.writeFileSync('.env', envContent);
    console.log('📊 Arquivo .env criado para o Prisma');
    
  } catch (error) {
    console.error('❌ Erro ao configurar DATABASE_URL:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ DATABASE_URL já está definida');
}

console.log('🚀 Configuração de banco concluída');