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
    const details = [
      `- DB_HOST: ${DB_HOST || 'não definido'}`,
      `- DB_PORT: ${DB_PORT}`,
      `- DB_USER: ${DB_USER || 'não definido'}`,
      `- DB_PASSWORD: ${DB_PASSWORD ? 'definido' : 'não definido'}`,
      `- DB_NAME: ${DB_NAME || 'não definido'}`,
      `- DB_SSL: ${DB_SSL}`,
    ].join('\n');
    throw new Error(`Variáveis de banco incompletas!\nNecessário: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME\nAtual:\n${details}`);
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

// Normaliza variáveis para ambientes gerenciados (Supabase, etc.)
// Aceita também POSTGRES_PRISMA_URL / POSTGRES_URL e promove para PRISMA_DATABASE_URL
(() => {
  const pgPrisma = process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
  const pgUrl = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

  // Se não houver PRISMA_DATABASE_URL mas houver uma das alternativas, promova
  if (!process.env.PRISMA_DATABASE_URL && (pgPrisma || pgUrl)) {
    process.env.PRISMA_DATABASE_URL = pgPrisma || pgUrl;
    console.log('✅ PRISMA_DATABASE_URL derivada de variáveis POSTGRES_*');
  }

  // Se PRISMA_DATABASE_URL existir, também defina DATABASE_URL (para libs que esperam esta var)
  if (process.env.PRISMA_DATABASE_URL && !process.env.DATABASE_URL) {
    // Para MySQL manter normalize; para Postgres deixar como está
    const val = process.env.PRISMA_DATABASE_URL;
    const normalized = val.startsWith('mysql') ? normalizeToPrismaMysql(val) : val;
    process.env.DATABASE_URL = normalized;
    try {
      let envContent = `PRISMA_DATABASE_URL=\"${val}\"\nDATABASE_URL=\"${normalized}\"\n`;
      if (process.env.POSTGRES_URL_NON_POOLING) {
        envContent += `DIRECT_URL=\"${process.env.POSTGRES_URL_NON_POOLING}\"\n`;
      }
      fs.writeFileSync('.env', envContent);
      console.log('✅ PRISMA_DATABASE_URL detectada/promovida. .env escrito com PRISMA_DATABASE_URL/DATABASE_URL');
    } catch (err) {
      console.warn('⚠️  Não foi possível escrever .env a partir de PRISMA_DATABASE_URL');
    }
  }
})();

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
    console.warn('⚠️  DATABASE_URL definida, porém não inicia com mysql:// e não pôde ser normalizada. Tentando variáveis DB_*...');
    try {
      const built = buildDatabaseUrl();
      const prismaUrl = normalizeToPrismaMysql(built);
      // Mantemos DATABASE_URL original e usamos PRISMA_DATABASE_URL para o Prisma
      const envContent = `DATABASE_URL=\"${original}\"\nPRISMA_DATABASE_URL=\"${prismaUrl}\"\n`;
      fs.writeFileSync('.env', envContent);
      console.log('✅ Usando PRISMA_DATABASE_URL construído a partir de DB_* variáveis');
    } catch (e) {
      console.error('❌ DATABASE_URL inválida e variáveis DB_* insuficientes para construir a URL.');
      console.error('   Valor atual de DATABASE_URL:', original);
      console.error('   Erro ao montar via DB_*:', e.message);
      console.error('   Dica: defina DATABASE_URL no formato mysql://... ou configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.');
      process.exit(1);
    }
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
