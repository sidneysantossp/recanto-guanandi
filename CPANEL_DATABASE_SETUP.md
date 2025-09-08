# 🗄️ Configuração do Banco MySQL no cPanel

## Passo a Passo Detalhado

### 1. Acessar o cPanel

1. Faça login no cPanel da sua hospedagem
2. Procure pela seção **"Bancos de Dados"**
3. Clique em **"Bancos de Dados MySQL"**

### 2. Criar o Banco de Dados

1. Na seção **"Criar Novo Banco de Dados"**:
   - **Nome do Banco**: `canticosccb_guanandifinance` (será criado como `cpanel_user_canticosccb_guanandifinance`)
   - Clique em **"Criar Banco de Dados"**

2. Anote o nome completo do banco criado:
   ```
   Exemplo: cpanel123_guanandi
   ```

### 3. Criar Usuário do Banco

1. Na seção **"Adicionar Novo Usuário"**:
   - **Nome de Usuário**: `canticosccb_guanandifinance`
   - **Senha**: `KmSs147258!`
   - Clique em **"Criar Usuário"**

2. Anote as credenciais:
   ```
   Usuário: cpanel123_guanandi_user
   Senha: [sua_senha_forte]
   ```

### 4. Associar Usuário ao Banco

1. Na seção **"Adicionar Usuário ao Banco de Dados"**:
   - **Usuário**: Selecione o usuário criado
   - **Banco de Dados**: Selecione o banco criado
   - Clique em **"Adicionar"**

2. Na tela de privilégios:
   - Marque **"TODOS OS PRIVILÉGIOS"**
   - Clique em **"Fazer Mudanças"**

### 5. Obter Informações de Conexão

#### Informações necessárias:

```bash
# Informações do servidor (geralmente)
Host: localhost
Porta: 3306

# Suas credenciais específicas
Banco: cpanel123_guanandi
Usuário: cpanel123_guanandi_user
Senha: [sua_senha_forte]
```

#### String de conexão final:

```bash
DATABASE_URL="mysql://cpanel123_guanandi_user:sua_senha_forte@localhost:3306/cpanel123_guanandi"
```

### 6. Testar a Conexão (Opcional)

Se o cPanel oferece **phpMyAdmin**:

1. Acesse o phpMyAdmin
2. Faça login com as credenciais criadas
3. Verifique se consegue acessar o banco `cpanel123_guanandi`

### 7. Configurar na Vercel

Após criar o banco, adicione a variável de ambiente na Vercel:

1. Acesse seu projeto na Vercel
2. Vá em **Settings > Environment Variables**
3. Adicione:
   - **Name**: `DATABASE_URL`
   - **Value**: `mysql://cpanel123_guanandi_user:sua_senha_forte@localhost:3306/cpanel123_guanandi`
   - **Environment**: Production, Preview, Development

### 8. Executar Migrações

Após o deploy na Vercel, execute as migrações do Prisma:

```bash
# Via terminal local (com a string de produção)
npx prisma migrate deploy --schema=./prisma/schema.prisma
npx prisma generate
```

Ou use a função de deploy da Vercel que executará automaticamente.

## ⚠️ Pontos Importantes

### Segurança
- **NUNCA** compartilhe as credenciais do banco
- Use senhas fortes (mínimo 12 caracteres)
- Anote as credenciais em local seguro

### Nomenclatura
- O cPanel adiciona automaticamente seu prefixo de usuário
- Exemplo: se seu usuário cPanel é `hosting123`, o banco será `hosting123_guanandi`

### Limitações Comuns
- Alguns provedores limitam o número de bancos
- Verifique se há restrições de conexões simultâneas
- Confirme se o MySQL está na versão 5.7+ ou 8.0+

## 🔧 Troubleshooting

### Erro de Conexão
```
Error: P1001: Can't reach database server
```
**Solução**: Verifique host, porta e credenciais

### Erro de Autenticação
```
Error: P1000: Authentication failed
```
**Solução**: Confirme usuário e senha

### Erro de Banco Não Encontrado
```
Error: P1003: Database does not exist
```
**Solução**: Verifique o nome exato do banco (com prefixo)

### Erro de Privilégios
```
Error: P1010: User does not have permission
```
**Solução**: Verifique se o usuário tem todos os privilégios no banco

## 📞 Suporte

Se encontrar problemas:
1. Verifique a documentação do seu provedor de hospedagem
2. Entre em contato com o suporte técnico
3. Teste a conexão via phpMyAdmin primeiro
4. Confirme se o MySQL está ativo no plano de hospedagem