#!/usr/bin/env node
/**
 * Seed opcional de usuário admin
 * Controlado por RUN_SEED_ADMIN=true
 * Variáveis opcionais:
 *  - ADMIN_EMAIL (default: admin@guanandi.com)
 *  - ADMIN_PASSWORD (default: 123456)
 *  - ADMIN_NAME (default: Administrador)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  if (process.env.RUN_SEED_ADMIN !== 'true') {
    console.log('⏭️  Seed admin ignorado (defina RUN_SEED_ADMIN=true para ativar)');
    return;
  }

  const prisma = new PrismaClient();
  const email = (process.env.ADMIN_EMAIL || 'admin@guanandi.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '123456';
  const name = process.env.ADMIN_NAME || 'Administrador';

  try {
    console.log('🔎 Verificando existência do usuário admin:', email);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('✅ Admin já existe. Nada a fazer.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const created = await prisma.user.create({
      data: {
        nome: name,
        email,
        senha: hashed,
        tipo: 'admin',
      },
      select: { id: true, nome: true, email: true, tipo: true }
    });

    console.log('🎉 Admin criado com sucesso:');
    console.log(`   ID: ${created.id}`);
    console.log(`   Nome: ${created.nome}`);
    console.log(`   Email: ${created.email}`);
    console.log('   Senha: (oculta)');
  } catch (err) {
    console.error('❌ Erro ao criar admin:', err.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

