# 🚀 Configuração Vercel - Opção 2 (Variáveis Separadas)

## 📋 Passo a Passo para Configurar na Vercel

### 1. Acesse o Dashboard da Vercel
- Vá para [vercel.com](https://vercel.com)
- Faça login na sua conta
- Selecione o projeto **recanto-guanandi**

### 2. Configure as Variáveis de Ambiente

#### 🗄️ Banco de Dados (OBRIGATÓRIO)
```bash
# NÃO configure DATABASE_URL - deixe em branco ou remova
# Configure apenas estas variáveis:
DB_HOST=localhost
DB_PORT=3306
DB_USER=canticosccb_guanandifinance
DB_PASSWORD=KmSs147258!
DB_NAME=canticosccb_guanandifinance
DB_SSL=false
```

#### 🔐 Autenticação (OBRIGATÓRIO)
```bash
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_minimo_32_caracteres
```

#### ⚙️ Configurações da Aplicação (OBRIGATÓRIO)
```bash
NODE_ENV=production
PORT=5000
BASE_URL=https://seu-dominio.vercel.app
```

#### 📧 Email (OPCIONAL)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
SMTP_FROM=Condomínio Guanandi <noreply@guanandi.com>
```

### 3. Como Adicionar as Variáveis

1. **No Dashboard da Vercel:**
   - Vá em **Settings** → **Environment Variables**
   - Clique em **Add New**
   - Digite o **Name** (ex: `DB_HOST`)
   - Digite o **Value** (ex: `localhost`)
   - Selecione **Production**, **Preview** e **Development**
   - Clique em **Save**

2. **Repita para cada variável:**
   - `DB_HOST` = `localhost`
   - `DB_PORT` = `3306`
   - `DB_USER` = `canticosccb_guanandifinance`
   - `DB_PASSWORD` = `KmSs147258!`
   - `DB_NAME` = `canticosccb_guanandifinance`
   - `DB_SSL` = `false`
   - `JWT_SECRET` = (sua chave secreta)
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `BASE_URL` = (sua URL da Vercel)

### 4. ⚠️ IMPORTANTE - Remover DATABASE_URL

**Se você tinha DATABASE_URL configurada antes:**
1. Vá em **Settings** → **Environment Variables**
2. Encontre a variável `DATABASE_URL`
3. Clique nos **3 pontos** → **Delete**
4. Confirme a remoção

> ⚠️ **Atenção**: O sistema só funciona com UMA opção por vez. Se DATABASE_URL existir, ela terá prioridade sobre as variáveis separadas.

### 5. 🔄 Redeploy

Após configurar todas as variáveis:
1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deploy
3. Selecione **Redeploy**
4. Aguarde o processo terminar

### 6. ✅ Verificar se Funcionou

1. **Acesse sua aplicação na Vercel**
2. **Teste o login** com:
   - Email: `admin@guanandi.com`
   - Senha: `123456`

3. **Se der erro**, verifique os logs:
   - Vá em **Functions** → **View Function Logs**
   - Procure por erros de conexão com banco

### 🔍 Troubleshooting

#### Erro: "Cannot connect to database"
- ✅ Verifique se todas as 6 variáveis de banco estão configuradas
- ✅ Confirme que DATABASE_URL foi removida
- ✅ Verifique se as credenciais estão corretas

#### Erro: "JWT_SECRET is required"
- ✅ Configure JWT_SECRET com pelo menos 32 caracteres

#### Erro 500 na aplicação
- ✅ Verifique os logs da função na Vercel
- ✅ Confirme que NODE_ENV=production

### 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs da Vercel
2. Execute `node test-database-config.js` localmente
3. Compare as variáveis locais com as da Vercel

---

**✨ Vantagens da Opção 2:**
- Maior flexibilidade na configuração
- Fácil de debugar problemas específicos
- Melhor organização das credenciais
- Compatível com diferentes provedores de hosting