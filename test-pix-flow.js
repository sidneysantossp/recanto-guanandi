const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const baseUrl = 'http://localhost:5001/api';

// Token de admin para testes (você pode pegar um token real do localStorage)
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5ZjQyZGY4Zi1hNzJkLTQ5YzMtYjU4Zi1mNzE4ZTcwNzQwNzEiLCJ0aXBvIjoiYWRtaW4iLCJpYXQiOjE3MzY4NzI4NzIsImV4cCI6MTczNjk1OTI3Mn0.Zt8Ow_Zt8Ow_example'; // Token de exemplo

async function testPixFlow(token) {
  try {
    console.log('🧪 Testando fluxo completo de PIX...');
    
    // 1. Buscar um boleto pendente
    console.log('\n1️⃣ Buscando boleto pendente...');
    const boletos = await prisma.boleto.findMany({
      where: {
        status: { in: ['pendente', 'vencido'] }
      },
      take: 1
    });
    
    if (boletos.length === 0) {
      console.log('❌ Nenhum boleto pendente encontrado');
      return;
    }
    
    const boleto = boletos[0];
    console.log(`✅ Boleto encontrado: ${boleto.numeroDocumento} - ${boleto.descricao}`);
    console.log(`   ID: ${boleto.id}`);
    console.log(`   Valor: R$ ${boleto.valor}`);
    console.log(`   Status: ${boleto.status}`);
    
    // 2. Gerar PIX para o boleto
    console.log('\n2️⃣ Gerando PIX para o boleto...');
    try {
      const pixResponse = await axios.post(`${baseUrl}/pix/generate`, {
        boletoId: boleto.id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (pixResponse.data.success) {
        console.log('✅ PIX gerado com sucesso!');
        console.log(`   TXID: ${pixResponse.data.data.txid}`);
        console.log(`   Chave PIX: ${pixResponse.data.data.chavePix}`);
        console.log(`   Valor: R$ ${pixResponse.data.data.valor}`);
        
        // 3. Aguardar um pouco e simular pagamento
        console.log('\n3️⃣ Aguardando 2 segundos antes de simular pagamento...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n4️⃣ Simulando pagamento PIX...');
        const paymentResponse = await axios.post(`${baseUrl}/pix/simulate-payment/${boleto.id}`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (paymentResponse.data.success) {
          console.log('✅ Pagamento simulado com sucesso!');
          console.log(`   Mensagem: ${paymentResponse.data.message}`);
          
          // 5. Verificar se o boleto foi atualizado
          console.log('\n5️⃣ Verificando status do boleto após pagamento...');
          const boletoAtualizado = await prisma.boleto.findUnique({
            where: { id: boleto.id }
          });
          
          console.log(`   Status anterior: ${boleto.status}`);
          console.log(`   Status atual: ${boletoAtualizado.status}`);
          console.log(`   Data de pagamento: ${boletoAtualizado.dataPagamento || 'Não definida'}`);
          console.log(`   TXID PIX: ${boletoAtualizado.txidPix || 'Não definido'}`);
          
          if (boletoAtualizado.status === 'pago') {
            console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
            console.log('   O fluxo completo de PIX está funcionando corretamente.');
          } else {
            console.log('\n⚠️ ATENÇÃO: Boleto não foi marcado como pago.');
          }
        } else {
          console.log('❌ Erro ao simular pagamento:', paymentResponse.data.message);
        }
      } else {
        console.log('❌ Erro ao gerar PIX:', pixResponse.data.message);
      }
    } catch (error) {
      if (error.response) {
        console.log('❌ Erro na API:', error.response.data.message || error.response.statusText);
        console.log(`   Status: ${error.response.status}`);
      } else {
        console.log('❌ Erro de conexão:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Função para obter token de admin real
async function getAdminToken() {
  try {
    console.log('🔑 Fazendo login como admin...');
    const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
      email: 'admin@guanandi.com',
      senha: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login realizado com sucesso!');
      return loginResponse.data.token;
    } else {
      console.log('❌ Erro no login:', loginResponse.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro ao fazer login:', error.response?.data?.message || error.message);
    return null;
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando teste do fluxo PIX...');
  
  // Primeiro, obter token de admin real
  const token = await getAdminToken();
  if (!token) {
    console.log('❌ Não foi possível obter token de admin. Abortando teste.');
    return;
  }
  
  // Executar teste com o token obtido
  await testPixFlow(token);
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { testPixFlow, getAdminToken };