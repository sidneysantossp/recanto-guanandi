#!/usr/bin/env node
/**
 * Script para configurar DATABASE_URL na Vercel usando variáveis separadas
 * Este script deve ser executado durante o build na Vercel
 */

const fs = require('fs');
const path = require('path');

// Normaliza uma URL para o formato aceito pelo Prisma (precisa iniciar com mysql://)
function normalizeToPrismaMysql(url) {
  if (!url) return url;

  // Aceito: mysql://
  if (url.startsWith('mysql://')) return url;

  // Comum em drivers node: mysql2://
  if (url.startsWith('mysql2://')) {
    return 'mysql://' + url.slice('mysql2://'.length);
  }

  // Alguns provedores podem expor outros esquemas; tentamos normalizar
  const knownPrefixes = ['vercel-mysql://', 'planetscale://'];
  for (const prefix of knownPrefixes) {
    if (url.startsWith(prefix)) {
      return 'mysql://' + url.slice(prefix.length);
    }
  }

  return url; // Retorna como está; validaremos mais adiante
}

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
    
    // Salva em arquivo .env para o Prisma (também PRISMA_DATABASE_URL)
    const prismaUrl = normalizeToPrismaMysql(databaseUrl);
    const envContent = `DATABASE_URL="${databaseUrl}"\nPRISMA_DATABASE_URL="${prismaUrl}"\n`;
    fs.writeFileSync('.env', envContent);
    console.log('📊 Arquivo .env criado para o Prisma (PRISMA_DATABASE_URL)');
    
  } catch (error) {
    console.error('❌ Erro ao configurar DATABASE_URL:', error.message);
    process.exit(1);
  }
} else {
  // Quando já definida, garantimos compatibilidade com o Prisma
  const original = process.env.DATABASE_URL;
  const normalized = normalizeToPrismaMysql(original);

  if (normalized !== original) {
    console.log('⚠️  Ajustando DATABASE_URL para o formato aceito pelo Prisma (mysql://)');
    process.env.DATABASE_URL = normalized;
    try {
      const envContent = `DATABASE_URL=\"${normalized}\"\nPRISMA_DATABASE_URL=\"${normalized}\"\n`;
      fs.writeFileSync('.env', envContent);
      console.log('📊 Arquivo .env atualizado com DATABASE_URL e PRISMA_DATABASE_URL');
    } catch (err) {
      console.warn('⚠️  Não foi possível escrever .env, seguindo com variável de ambiente atual');
    }
  } else if (!normalized.startsWith('mysql://')) {
    console.error('❌ DATABASE_URL definida, porém não inicia com mysql:// e não pôde ser normalizada.');
    console.error('   Valor atual (ocultando senha):');
    const safe = original.replace(/:\\S+@/, ':***@');
    console.error(`   ${safe}`);
    console.error('   Dica: Use o formato: mysql://usuario:senha@host:porta/banco');
    process.exit(1);
  } else {
    // Está compatível: ainda assim garantimos PRISMA_DATABASE_URL para o Prisma CLI
    try {
      const envContent = `DATABASE_URL=\"${normalized}\"\nPRISMA_DATABASE_URL=\"${normalized}\"\n`;
      fs.writeFileSync('.env', envContent);
      console.log('✅ DATABASE_URL compatível. PRISMA_DATABASE_URL escrito em .env');
    } catch (err) {
      console.warn('⚠️  Não foi possível escrever .env, mas DATABASE_URL já é compatível');
    }
  }
}

console.log('🚀 Configuração de banco concluída');
