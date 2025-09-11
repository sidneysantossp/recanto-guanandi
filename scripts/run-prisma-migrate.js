#!/usr/bin/env node
// Executa `prisma migrate deploy` apenas se RUN_PRISMA_MIGRATIONS=true
// Útil para permitir o build do frontend na Vercel quando o banco não está acessível.

const { spawnSync } = require('child_process');

const shouldRun = process.env.RUN_PRISMA_MIGRATIONS === 'true';

if (!shouldRun) {
  console.log('⏭️  Skipping prisma migrate deploy (set RUN_PRISMA_MIGRATIONS=true to enable)');
  process.exit(0);
}

console.log('🟢 Running prisma migrate deploy...');
const res = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: true,
});

process.exit(res.status ?? 1);

