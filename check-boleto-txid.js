const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBoletoTxid() {
  try {
    console.log('🔍 Verificando TXID do boleto...');
    
    const boleto = await prisma.boleto.findUnique({
      where: { id: '05b44f44-9df8-4765-ad6c-a56b48f5cbf0' },
      select: {
        id: true,
        numeroDocumento: true,
        descricao: true,
        valor: true,
        status: true,
        txidPix: true
      }
    });
    
    if (boleto) {
      console.log('✅ Boleto encontrado:');
      console.log('   ID:', boleto.id);
      console.log('   Número:', boleto.numeroDocumento);
      console.log('   Descrição:', boleto.descricao);
      console.log('   Valor:', boleto.valor);
      console.log('   Status:', boleto.status);
      console.log('   TXID PIX:', boleto.txidPix || 'NÃO DEFINIDO');
    } else {
      console.log('❌ Boleto não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar boleto:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBoletoTxid();