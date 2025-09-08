const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Importar modelos Mongoose
const User = require('../models/User');
const Company = require('../models/Company');
const Provider = require('../models/Provider');
const Budget = require('../models/Budget');
const Boleto = require('../models/Boleto');

const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('🚀 Iniciando migração do MongoDB para MySQL...');
    
    // Conectar ao MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não configurado');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado ao MongoDB');
    
    // Verificar conexão com MySQL
    await prisma.$connect();
    console.log('✅ Conectado ao MySQL via Prisma');
    
    // Migrar Users
    console.log('\n📋 Migrando usuários...');
    const users = await User.find({});
    let userCount = 0;
    
    for (const user of users) {
      try {
        await prisma.user.create({
          data: {
            id: user._id.toString(),
            nome: user.nome,
            email: user.email,
            senha: user.senha,
            tipo: user.tipo,
            cpf: user.cpf,
            telefone: user.telefone,
            endereco: user.endereco || null,
            situacao: user.situacao,
            dataUltimoLogin: user.dataUltimoLogin,
            avatar: user.avatar || '',
            notificacoes: user.notificacoes || null,
            createdAt: user.createdAt || new Date(),
            updatedAt: user.updatedAt || new Date()
          }
        });
        userCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Usuário ${user.email} já existe, pulando...`);
        } else {
          console.error(`❌ Erro ao migrar usuário ${user.email}:`, error.message);
        }
      }
    }
    console.log(`✅ ${userCount} usuários migrados`);
    
    // Migrar Companies
    console.log('\n🏢 Migrando empresas...');
    const companies = await Company.find({});
    let companyCount = 0;
    
    for (const company of companies) {
      try {
        await prisma.company.create({
          data: {
            id: company._id.toString(),
            nome: company.nome,
            cnpj: company.cnpj,
            email: company.email,
            telefone: company.telefone,
            endereco: company.endereco || null,
            categorias: company.categorias || null,
            ativo: company.ativo,
            createdAt: company.createdAt || new Date(),
            updatedAt: company.updatedAt || new Date()
          }
        });
        companyCount++;
      } catch (error) {
        console.error(`❌ Erro ao migrar empresa ${company.nome}:`, error.message);
      }
    }
    console.log(`✅ ${companyCount} empresas migradas`);
    
    // Migrar Providers
    console.log('\n👷 Migrando prestadores...');
    const providers = await Provider.find({});
    let providerCount = 0;
    
    for (const provider of providers) {
      try {
        await prisma.provider.create({
          data: {
            id: provider._id.toString(),
            nome: provider.nome,
            cpfCnpj: provider.cpfCnpj,
            email: provider.email,
            telefone: provider.telefone,
            especialidades: provider.especialidades || null,
            empresaVinculada: provider.empresaVinculada?.toString() || null,
            endereco: provider.endereco || null,
            ativo: provider.ativo,
            createdAt: provider.createdAt || new Date(),
            updatedAt: provider.updatedAt || new Date()
          }
        });
        providerCount++;
      } catch (error) {
        console.error(`❌ Erro ao migrar prestador ${provider.nome}:`, error.message);
      }
    }
    console.log(`✅ ${providerCount} prestadores migrados`);
    
    // Migrar Budgets
    console.log('\n💰 Migrando orçamentos...');
    const budgets = await Budget.find({}).populate('solicitante');
    let budgetCount = 0;
    
    for (const budget of budgets) {
      try {
        // Criar o budget principal
        const newBudget = await prisma.budget.create({
          data: {
            id: budget._id.toString(),
            titulo: budget.titulo,
            descricao: budget.descricao,
            categoria: budget.categoria,
            valorEstimado: budget.valorEstimado,
            empresa: budget.empresa?.toString() || null,
            prestador: budget.prestador?.toString() || null,
            status: budget.status,
            solicitante: budget.solicitante._id.toString(),
            dataAbertura: budget.dataAbertura,
            dataFechamento: budget.dataFechamento,
            observacoes: budget.observacoes,
            createdAt: budget.createdAt || new Date(),
            updatedAt: budget.updatedAt || new Date()
          }
        });
        
        // Migrar arquivos do budget
        if (budget.arquivos && budget.arquivos.length > 0) {
          for (const arquivo of budget.arquivos) {
            await prisma.budgetArquivo.create({
              data: {
                budgetId: newBudget.id,
                nome: arquivo.nome,
                url: arquivo.url,
                tipo: arquivo.tipo,
                tamanho: arquivo.tamanho
              }
            });
          }
        }
        
        // Migrar comentários do budget
        if (budget.comentarios && budget.comentarios.length > 0) {
          for (const comentario of budget.comentarios) {
            await prisma.budgetComentario.create({
              data: {
                budgetId: newBudget.id,
                autor: comentario.autor.toString(),
                conteudo: comentario.conteudo,
                criadoEm: comentario.criadoEm
              }
            });
          }
        }
        
        // Migrar histórico do budget
        if (budget.historico && budget.historico.length > 0) {
          for (const hist of budget.historico) {
            await prisma.budgetHistorico.create({
              data: {
                budgetId: newBudget.id,
                tipo: hist.tipo,
                descricao: hist.descricao,
                usuario: hist.usuario.toString(),
                data: hist.data,
                metadados: hist.metadados || null
              }
            });
          }
        }
        
        budgetCount++;
      } catch (error) {
        console.error(`❌ Erro ao migrar orçamento ${budget.titulo}:`, error.message);
      }
    }
    console.log(`✅ ${budgetCount} orçamentos migrados`);
    
    // Migrar Boletos
    console.log('\n🧾 Migrando boletos...');
    const boletos = await Boleto.find({});
    let boletoCount = 0;
    
    for (const boleto of boletos) {
      try {
        await prisma.boleto.create({
          data: {
            id: boleto._id.toString(),
            numeroDocumento: boleto.numeroDocumento,
            proprietario: boleto.proprietario.toString(),
            descricao: boleto.descricao,
            valor: boleto.valor,
            dataVencimento: boleto.dataVencimento,
            dataEmissao: boleto.dataEmissao,
            dataPagamento: boleto.dataPagamento,
            status: boleto.status,
            tipoPagamento: boleto.tipoPagamento || 'boleto',
            codigoBarras: boleto.codigoBarras,
            linhaDigitavel: boleto.linhaDigitavel,
            chavePix: boleto.chavePix,
            qrCodePix: boleto.qrCodePix,
            txidPix: boleto.txidPix,
            metodoPagamento: boleto.metodoPagamento || boleto.tipoPagamento || 'boleto',
            categoria: boleto.categoria || 'taxa_condominio',
            observacoes: boleto.observacoes,
            valorJuros: boleto.valorJuros || 0,
            valorMulta: boleto.valorMulta || 0,
            valorDesconto: boleto.valorDesconto || 0,
            valorTotal: boleto.valorTotal,
            createdAt: boleto.createdAt || new Date(),
            updatedAt: boleto.updatedAt || new Date()
          }
        });
        boletoCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Boleto ${boleto.numeroDocumento} já existe, pulando...`);
        } else {
          console.error(`❌ Erro ao migrar boleto ${boleto.numeroDocumento}:`, error.message);
        }
      }
    }
    console.log(`✅ ${boletoCount} boletos migrados`);
    
    // Migrar Notifications
    console.log('\n🔔 Migrando notificações...');
    const notifications = await Notification.find({});
    let notificationCount = 0;
    
    for (const notification of notifications) {
      try {
        const newNotification = await prisma.notification.create({
          data: {
            id: notification._id.toString(),
            titulo: notification.titulo,
            conteudo: notification.conteudo,
            tipo: notification.tipo,
            prioridade: notification.prioridade,
            autor: notification.autor.toString(),
            dataPublicacao: notification.dataPublicacao,
            dataExpiracao: notification.dataExpiracao,
            status: notification.status,
            configuracoes: notification.configuracoes || null,
            createdAt: notification.createdAt || new Date(),
            updatedAt: notification.updatedAt || new Date()
          }
        });
        
        // Migrar anexos da notificação
        if (notification.anexos && notification.anexos.length > 0) {
          for (const anexo of notification.anexos) {
            await prisma.notificationAnexo.create({
              data: {
                notificationId: newNotification.id,
                nome: anexo.nome,
                url: anexo.url,
                tipo: anexo.tipo,
                tamanho: anexo.tamanho
              }
            });
          }
        }
        
        // Migrar destinatários
        if (notification.destinatarios) {
          await prisma.notificationDestinatario.create({
            data: {
              notificationId: newNotification.id,
              tipo: notification.destinatarios.tipo || 'todos',
              usuario: null // Será necessário ajustar conforme a estrutura específica
            }
          });
          
          // Se há usuários específicos
          if (notification.destinatarios.usuarios && notification.destinatarios.usuarios.length > 0) {
            for (const usuarioId of notification.destinatarios.usuarios) {
              await prisma.notificationDestinatario.create({
                data: {
                  notificationId: newNotification.id,
                  tipo: 'especificos',
                  usuario: usuarioId.toString()
                }
              });
            }
          }
        }
        
        notificationCount++;
      } catch (error) {
        console.error(`❌ Erro ao migrar notificação ${notification.titulo}:`, error.message);
      }
    }
    console.log(`✅ ${notificationCount} notificações migradas`);
    
    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('\n📊 Resumo da migração:');
    console.log(`   👥 Usuários: ${userCount}`);
    console.log(`   🏢 Empresas: ${companyCount}`);
    console.log(`   👷 Prestadores: ${providerCount}`);
    console.log(`   💰 Orçamentos: ${budgetCount}`);
    console.log(`   🧾 Boletos: ${boletoCount}`);
    console.log(`   🔔 Notificações: ${notificationCount}`);
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
    console.log('\n🔌 Conexões fechadas');
  }
}

// Executar migração
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('\n✅ Script de migração finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };