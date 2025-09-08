# Guia de Deploy - Guanandi Financial Platform

## 📋 Pré-requisitos

- Conta no GitHub
- Conta na Vercel
- Acesso ao cPanel para criar banco MySQL
- Node.js 16+ instalado localmente

## 🚀 Deploy no GitHub

### 1. Preparar o repositório

```bash
# Adicionar todos os arquivos
git add .

# Fazer commit das mudanças
git commit -m "feat: preparação para deploy em produção"

# Adicionar origin remoto (substitua pela sua URL)
git remote add origin https://github.com/SEU_USUARIO/guanandi-platform.git

# Push para o GitHub
git push -u origin main
```

## 🗄️ Configuração do Banco de Dados no cPanel

### 1. Criar banco MySQL

1. Acesse o cPanel da sua hospedagem
2. Vá em "Bancos de Dados MySQL"
3. Crie um novo banco: `cpanel_user_guanandi`
4. Crie um usuário para o banco
5. Associe o usuário ao banco com todas as permissões
6. Anote as credenciais:
   - Host: `localhost`
   - Porta: `3306`
   - Usuário: `cpanel_user_dbuser`
   - Senha: `sua_senha_segura`
   - Banco: `cpanel_user_guanandi`

### 2. String de conexão

```
DATABASE_URL="mysql://cpanel_user_dbuser:sua_senha_segura@localhost:3306/cpanel_user_guanandi"
```

## ☁️ Deploy na Vercel

### 1. Conectar repositório

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione o repositório `guanandi-platform`
5. Configure as seguintes opções:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/build`
   - **Install Command**: `npm install && npm install --prefix client`

### 2. Configurar variáveis de ambiente

Na Vercel, vá em Settings > Environment Variables e adicione:

```bash
# Banco de dados
DATABASE_URL=mysql://cpanel_user_dbuser:sua_senha_segura@localhost:3306/cpanel_user_guanandi

# JWT
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_produção
JWT_EXPIRE=30d

# Servidor
NODE_ENV=production
PORT=5000

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
SMTP_FROM=Condomínio Guanandi <noreply@guanandi.com>

# PIX (opcional)
PIX_CLIENT_ID=seu_client_id_pix
PIX_CLIENT_SECRET=seu_client_secret_pix
PIX_SANDBOX=false

# Boleto (opcional)
BOLETO_BANCO=341
BOLETO_AGENCIA=sua_agencia
BOLETO_CONTA=sua_conta
BOLETO_CARTEIRA=109
```

### 3. Configurar domínio (opcional)

1. Na Vercel, vá em Settings > Domains
2. Adicione seu domínio personalizado
3. Configure os DNS conforme instruções da Vercel

## 🔧 Executar migrações do banco

Após o deploy, execute as migrações:

```bash
# Via terminal da Vercel ou localmente com a string de produção
npx prisma migrate deploy
npx prisma generate
```

## ✅ Verificação do Deploy

1. **Frontend**: Acesse a URL da Vercel
2. **API**: Teste `https://sua-url.vercel.app/api/test`
3. **Banco**: Verifique se as tabelas foram criadas
4. **Login**: Teste o sistema de autenticação

## 🔍 Troubleshooting

### Erro de conexão com banco
- Verifique se o banco MySQL está ativo no cPanel
- Confirme as credenciais na variável `DATABASE_URL`
- Teste a conexão localmente primeiro

### Erro de build
- Verifique se todas as dependências estão no package.json
- Confirme se o comando de build está correto
- Veja os logs de build na Vercel

### Erro 404 nas rotas
- Verifique se o arquivo `vercel.json` está configurado corretamente
- Confirme se as rotas da API estão funcionando

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs na Vercel
2. Teste localmente com as mesmas variáveis de ambiente
3. Consulte a documentação da Vercel e Prisma