const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Lista de senhas comuns para testar
const commonPasswords = [
  '123456',
  'admin',
  'password',
  'guanandi',
  'admin123',
  '123456789',
  'qwerty',
  'abc123',
  'senha123',
  'admin@123'
];

async function testPasswords() {
  try {
    console.log('🔍 Testando senhas comuns para admin@guanandi.com...');
    
    // Buscar o usuário admin
    const user = await prisma.user.findUnique({
      where: { email: 'admin@guanandi.com' }
    });
    
    if (!user) {
      console.log('❌ Usuário admin@guanandi.com não encontrado');
      return;
    }
    
    console.log(`👤 Usuário encontrado: ${user.nome}`);
    console.log(`🔐 Hash da senha: ${user.senha}`);
    
    // Testar cada senha
    for (const password of commonPasswords) {
      const isMatch = await bcrypt.compare(password, user.senha);
      if (isMatch) {
        console.log(`✅ SENHA ENCONTRADA: ${password}`);
        return password;
      } else {
        console.log(`❌ Senha incorreta: ${password}`);
      }
    }
    
    console.log('❌ Nenhuma senha comum funcionou');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswords();