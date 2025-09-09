/**
 * Configuração de Banco de Dados
 * Suporta tanto DATABASE_URL quanto variáveis separadas
 */

function getDatabaseConfig() {
  // Primeiro, tenta usar DATABASE_URL (formato completo)
  if (process.env.DATABASE_URL) {
    console.log('📊 Usando DATABASE_URL para conexão');
    return {
      url: process.env.DATABASE_URL
    };
  }

  // Se não tiver DATABASE_URL, constrói a partir de variáveis separadas
  const {
    DB_HOST = 'localhost',
    DB_PORT = '3306',
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_SSL = 'false'
  } = process.env;

  // Verifica se todas as variáveis necessárias estão presentes
  if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
    throw new Error(`
❌ Configuração de banco incompleta!

Opção 1 - Use DATABASE_URL (recomendado):
DATABASE_URL=mysql://usuario:senha@host:porta/banco

Opção 2 - Use variáveis separadas:
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=nome_do_banco
DB_SSL=false

Variáveis atuais:
- DB_HOST: ${DB_HOST}
- DB_PORT: ${DB_PORT}
- DB_USER: ${DB_USER ? '✅ definido' : '❌ não definido'}
- DB_PASSWORD: ${DB_PASSWORD ? '✅ definido' : '❌ não definido'}
- DB_NAME: ${DB_NAME ? '✅ definido' : '❌ não definido'}
`);
  }

  // Constrói a URL do banco
  const sslParam = DB_SSL === 'true' ? '?ssl=true' : '';
  const databaseUrl = `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}${sslParam}`;
  
  console.log(`📊 Construindo DATABASE_URL a partir de variáveis separadas`);
  console.log(`📊 Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`📊 Banco: ${DB_NAME}`);
  console.log(`📊 Usuário: ${DB_USER}`);
  console.log(`📊 SSL: ${DB_SSL}`);

  return {
    url: databaseUrl
  };
}

// Função para testar a conexão
function testDatabaseConnection() {
  try {
    const config = getDatabaseConfig();
    console.log('✅ Configuração de banco válida');
    
    // Mascarar a senha na URL para log seguro
    const safeUrl = config.url.replace(/:([^:@]+)@/, ':***@');
    console.log(`📊 URL de conexão: ${safeUrl}`);
    
    return config;
  } catch (error) {
    console.error('❌ Erro na configuração do banco:', error.message);
    throw error;
  }
}

// Função para obter configuração do Prisma
function getPrismaConfig() {
  const config = getDatabaseConfig();
  
  // Define a DATABASE_URL para o Prisma se não estiver definida
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = config.url;
    console.log('📊 DATABASE_URL definida automaticamente para o Prisma');
  }
  
  return config;
}

module.exports = {
  getDatabaseConfig,
  testDatabaseConnection,
  getPrismaConfig
};