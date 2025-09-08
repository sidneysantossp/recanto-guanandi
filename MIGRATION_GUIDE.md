# Guia de Migração: MongoDB para MySQL

Este guia detalha o processo de migração do banco de dados MongoDB para MySQL usando Prisma ORM.

## 📋 Pré-requisitos

1. **MySQL Server** instalado e rodando
2. **Banco de dados MySQL** criado para o projeto
3. **Backup dos dados MongoDB** (recomendado)
4. **Acesso ao cPanel** da sua hospedagem

## 🔧 Configuração do MySQL

### 1. Criar Banco de Dados no cPanel

1. Acesse o **MySQL Databases** no cPanel
2. Crie um novo banco de dados (ex: `guanandi_db`)
3. Crie um usuário MySQL e associe ao banco
4. Anote as credenciais:
   - Host (geralmente `localhost`)
   - Nome do banco
   - Usuário
   - Senha
   - Porta (geralmente `3306`)

### 2. Configurar Variáveis de Ambiente

Crie ou atualize o arquivo `.env` na raiz do projeto:

```env
# MySQL Configuration (Prisma)
DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco"

# MongoDB Configuration (para migração)
MONGODB_URI="mongodb://localhost:27017/guanandi"

# Outras configurações...
JWT_SECRET=seu_jwt_secret
SMTP_HOST=seu_smtp_host
SMTP_PORT=587
SMTP_USER=seu_email
SMTP_PASS=sua_senha
```

**Formato da DATABASE_URL:**
```
mysql://[usuario]:[senha]@[host]:[porta]/[nome_do_banco]
```

**Exemplo para cPanel:**
```
DATABASE_URL="mysql://cpanel_user:password123@localhost:3306/cpanel_user_guanandi"
```

## 🚀 Processo de Migração

### Passo 1: Instalar Dependências

```bash
npm install
```

### Passo 2: Gerar Cliente Prisma

```bash
npm run prisma:generate
```

### Passo 3: Criar Estrutura do Banco MySQL

```bash
npm run prisma:push
```

Este comando criará todas as tabelas no MySQL baseadas no schema Prisma.

### Passo 4: Migrar Dados do MongoDB

```bash
npm run db:migrate
```

Este script irá:
- Conectar ao MongoDB
- Conectar ao MySQL
- Migrar todos os dados preservando relacionamentos
- Exibir relatório de migração

### Passo 5: Verificar Migração

```bash
npm run prisma:studio
```

Abre interface web para visualizar os dados migrados.

## 📊 Estrutura Migrada

O script migra as seguintes entidades:

### 👥 Usuários (`users`)
- Dados pessoais
- Credenciais
- Configurações

### 🏢 Empresas (`companies`)
- Informações corporativas
- Endereços
- Categorias

### 👷 Prestadores (`providers`)
- Dados profissionais
- Especialidades
- Vínculos empresariais

### 💰 Orçamentos (`budgets`)
- Solicitações
- Arquivos anexos
- Comentários
- Histórico de alterações

### 🧾 Boletos (`boletos`)
- Dados financeiros
- Informações PIX
- Status de pagamento

### 🔔 Notificações (`notifications`)
- Conteúdo
- Destinatários
- Anexos
- Visualizações

## 🔄 Rollback (se necessário)

Caso precise voltar ao MongoDB:

1. Comente a linha `DATABASE_URL` no `.env`
2. Descomente `MONGODB_URI`
3. Reinicie a aplicação

```bash
npm restart
```

## 🧪 Testes

### Verificar Conexão MySQL

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✅ MySQL conectado')).catch(e => console.error('❌ Erro:', e))"
```

### Contar Registros

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); Promise.all([prisma.user.count(), prisma.boleto.count(), prisma.budget.count()]).then(([users, boletos, budgets]) => console.log('Usuários:', users, 'Boletos:', boletos, 'Orçamentos:', budgets))"
```

## 🚨 Troubleshooting

### Erro de Conexão MySQL

```
Error: P1001: Can't reach database server
```

**Soluções:**
1. Verificar se MySQL está rodando
2. Confirmar credenciais no `.env`
3. Verificar firewall/porta
4. Testar conexão direta ao MySQL

### Erro de Permissões

```
Error: P1010: User does not have permission
```

**Soluções:**
1. Verificar permissões do usuário MySQL
2. Garantir que o usuário pode CREATE/ALTER tables
3. No cPanel, verificar privilégios do usuário

### Erro de Charset

```
Error: Unknown charset
```

**Solução:**
Adicionar charset na DATABASE_URL:
```
DATABASE_URL="mysql://user:pass@host:3306/db?charset=utf8mb4"
```

### Dados Duplicados

```
Error: P2002: Unique constraint failed
```

**Solução:**
O script já trata duplicatas. Se persistir:
1. Limpar banco MySQL: `npm run prisma:reset`
2. Executar migração novamente: `npm run db:migrate`

## 📈 Performance

### Otimizações Aplicadas

1. **Índices automáticos** em chaves primárias e estrangeiras
2. **Tipos otimizados** (TEXT para conteúdo longo)
3. **Relacionamentos eficientes** com CASCADE DELETE
4. **UUIDs** para compatibilidade

### Monitoramento

```bash
# Ver queries lentas
npm run prisma:studio

# Logs de performance
tail -f logs/mysql.log
```

## 🔒 Segurança

### Backup Antes da Migração

```bash
# MongoDB
mongodump --db guanandi --out backup/mongodb/

# MySQL (após migração)
mysqldump -u usuario -p nome_do_banco > backup/mysql/guanandi.sql
```

### Variáveis Sensíveis

- ✅ Usar `.env` para credenciais
- ✅ Adicionar `.env` ao `.gitignore`
- ✅ Usar conexões SSL em produção
- ✅ Rotacionar senhas regularmente

## 📞 Suporte

Em caso de problemas:

1. Verificar logs: `tail -f logs/app.log`
2. Testar conexões individualmente
3. Consultar documentação Prisma
4. Verificar configurações do cPanel

---

**✅ Migração Concluída!**

Após seguir este guia, sua aplicação estará rodando com MySQL, otimizada para hospedagem cPanel.