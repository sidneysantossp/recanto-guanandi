const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createDemoNotification() {
  try {
    console.log('🔔 Criando notificação demo...');
    
    // Verificar se há usuários no banco
    const users = await prisma.user.findMany({
      take: 1
    });
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados');
      return;
    }
    
    const autorId = users[0].id;
    console.log(`👤 Usando usuário: ${users[0].nome} (${users[0].email})`);
    
    // Criar a notificação demo
    const notification = await prisma.notification.create({
      data: {
        titulo: 'Notificação Demo - Sistema Funcionando! 🎉',
        conteudo: 'Esta é uma notificação de demonstração criada para testar o sistema de notificações migrado para MySQL/Prisma. O sistema está funcionando corretamente!',
        tipo: 'comunicado',
        prioridade: 'alta',
        status: 'publicado',
        autor: autorId,
        dataPublicacao: new Date(),
        destinatarios: {
          create: {
            tipo: 'todos'
          }
        }
      },
      include: {
        destinatarios: true
      }
    });
    
    console.log('✅ Notificação demo criada com sucesso!');
    console.log('📋 Detalhes:');
    console.log(`   ID: ${notification.id}`);
    console.log(`   Título: ${notification.titulo}`);
    console.log(`   Tipo: ${notification.tipo}`);
    console.log(`   Prioridade: ${notification.prioridade}`);
    console.log(`   Status: ${notification.status}`);
    console.log(`   Data: ${notification.dataPublicacao}`);
    
    console.log('\n🌐 Acesse http://localhost:3001/notificacoes para ver a notificação!');
    
  } catch (error) {
    console.error('❌ Erro ao criar notificação demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoNotification();