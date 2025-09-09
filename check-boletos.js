const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBoletos() {
  try {
    console.log('🔍 Verificando boletos no banco de dados...');
    
    const boletos = await prisma.boleto.findMany({
      select: {
        id: true,
        numeroDocumento: true,
        proprietario: true,
        descricao: true,
        valor: true,
        status: true,
        txidPix: true,
        chavePix: true,
        qrCodePix: true
      },
      take: 10
    });
    
    console.log(`📊 Total de boletos encontrados: ${boletos.length}`);
    
    if (boletos.length === 0) {
      console.log('❌ Nenhum boleto encontrado no banco de dados');
      return;
    }
    
    console.log('\n📋 Detalhes dos boletos:');
    boletos.forEach((boleto, index) => {
      console.log(`\n${index + 1}. Boleto ${boleto.numeroDocumento}`);
      console.log(`   ID: ${boleto.id}`);
      console.log(`   Descrição: ${boleto.descricao}`);
      console.log(`   Valor: R$ ${boleto.valor}`);
      console.log(`   Status: ${boleto.status}`);
      console.log(`   TXID PIX: ${boleto.txidPix || 'NÃO POSSUI'}`);
      console.log(`   Chave PIX: ${boleto.chavePix || 'NÃO POSSUI'}`);
      console.log(`   QR Code PIX: ${boleto.qrCodePix ? 'POSSUI' : 'NÃO POSSUI'}`);
    });
    
    const boletosComTxid = boletos.filter(b => b.txidPix);
    const boletosSemTxid = boletos.filter(b => !b.txidPix);
    
    console.log(`\n📈 Resumo:`);
    console.log(`   ✅ Boletos com TXID PIX: ${boletosComTxid.length}`);
    console.log(`   ❌ Boletos sem TXID PIX: ${boletosSemTxid.length}`);
    
    if (boletosSemTxid.length > 0) {
      console.log('\n💡 Para simular pagamento PIX, é necessário primeiro gerar o PIX para o boleto.');
      console.log('   Use a página de Gerenciamento PIX para gerar o PIX antes de simular o pagamento.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar boletos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBoletos();