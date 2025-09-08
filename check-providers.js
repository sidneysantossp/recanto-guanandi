const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkProviders() {
  try {
    console.log('🔍 Verificando prestadores no banco de dados...');
    
    const providers = await prisma.provider.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n📊 Total de prestadores: ${providers.length}`);
    
    if (providers.length > 0) {
      console.log('\n📋 Lista de prestadores:');
      providers.forEach((provider, index) => {
        console.log(`\n${index + 1}. ${provider.nome}`);
        console.log(`   ID: ${provider.id}`);
        console.log(`   CPF/CNPJ: ${provider.cpfCnpj || 'Não informado'}`);
        console.log(`   Email: ${provider.email || 'Não informado'}`);
        console.log(`   Telefone: ${provider.telefone || 'Não informado'}`);
        console.log(`   Especialidades: ${provider.especialidades ? provider.especialidades.join(', ') : 'Nenhuma'}`);
        console.log(`   Ativo: ${provider.ativo ? 'Sim' : 'Não'}`);
        console.log(`   Criado em: ${provider.createdAt}`);
      });
    } else {
      console.log('\n❌ Nenhum prestador encontrado no banco de dados.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar prestadores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProviders();