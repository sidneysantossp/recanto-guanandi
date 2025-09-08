const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('Usuários encontrados:', users.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      tipo: u.tipo
    })));
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();