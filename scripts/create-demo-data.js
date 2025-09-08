const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createDemoData() {
  try {
    console.log('🚀 Criando dados demo...');
    
    // Verificar se há usuários no banco
    const users = await prisma.user.findMany({
      take: 1
    });
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados');
      return;
    }
    
    const solicitanteId = users[0].id;
    console.log(`👤 Usando usuário: ${users[0].nome} (${users[0].email})`);
    
    // 1. Criar prestador pessoa física
    console.log('\n👷 Criando prestador pessoa física...');
    const prestadorFisico = await prisma.provider.create({
      data: {
        nome: 'João Silva - Eletricista',
        cpfCnpj: '123.456.789-00',
        email: 'joao.silva@email.com',
        telefone: '(11) 99999-1234',
        especialidades: ['Elétrica', 'Instalações', 'Manutenção'],
        endereco: {
          rua: 'Rua das Flores, 123',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567'
        },
        ativo: true
      }
    });
    
    console.log(`✅ Prestador físico criado: ${prestadorFisico.nome} (ID: ${prestadorFisico.id})`);
    
    // 2. Criar prestador pessoa jurídica
    console.log('\n🏢 Criando prestador pessoa jurídica...');
    const prestadorJuridico = await prisma.provider.create({
      data: {
        nome: 'TechServ Soluções Ltda',
        cpfCnpj: '12.345.678/0001-90',
        email: 'contato@techserv.com.br',
        telefone: '(11) 3333-5678',
        especialidades: ['Tecnologia', 'Segurança', 'Automação', 'Redes'],
        endereco: {
          rua: 'Av. Paulista, 1000',
          numero: '1000',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01310-100'
        },
        ativo: true
      }
    });
    
    console.log(`✅ Prestador jurídico criado: ${prestadorJuridico.nome} (ID: ${prestadorJuridico.id})`);
    
    // 3. Criar orçamento
    console.log('\n💰 Criando orçamento demo...');
    const orcamento = await prisma.budget.create({
      data: {
        titulo: 'Modernização do Sistema Elétrico do Condomínio',
        descricao: 'Projeto para modernização completa do sistema elétrico do condomínio, incluindo troca de quadros, instalação de sistema de automação e upgrade da rede elétrica para suportar carregadores de veículos elétricos.',
        categoria: 'Elétrica',
        valorEstimado: 45000.00,
        status: 'aberto',
        solicitante: solicitanteId,
        dataAbertura: new Date(),
        observacoes: 'Projeto prioritário para 2025. Necessário orçamento detalhado com cronograma de execução.',
        comentarios: {
          create: [
            {
              autor: solicitanteId,
              conteudo: 'Projeto aprovado pela assembleia. Aguardando orçamentos dos prestadores.',
              criadoEm: new Date()
            }
          ]
        },
        historico: {
          create: [
            {
              tipo: 'criado',
              descricao: 'Orçamento criado pelo administrador',
              usuario: solicitanteId,
              data: new Date(),
              metadados: {
                categoria: 'Elétrica',
                valorEstimado: 45000.00
              }
            }
          ]
        }
      },
      include: {
        comentarios: true,
        historico: true
      }
    });
    
    console.log(`✅ Orçamento criado: ${orcamento.titulo} (ID: ${orcamento.id})`);
    
    console.log('\n🎉 Dados demo criados com sucesso!');
    console.log('\n📋 Resumo:');
    console.log(`   👷 Prestador Físico: ${prestadorFisico.nome}`);
    console.log(`   🏢 Prestador Jurídico: ${prestadorJuridico.nome}`);
    console.log(`   💰 Orçamento: ${orcamento.titulo}`);
    console.log(`   💵 Valor Estimado: R$ ${orcamento.valorEstimado.toLocaleString('pt-BR')}`);
    
    console.log('\n🌐 Acesse as páginas para visualizar:');
    console.log('   • Prestadores: http://localhost:3001/prestadores');
    console.log('   • Orçamentos: http://localhost:3001/orcamentos');
    
  } catch (error) {
    console.error('❌ Erro ao criar dados demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoData();