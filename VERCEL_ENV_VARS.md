# 🔧 Variáveis de Ambiente para Vercel

## Configuração Obrigatória

Copie e cole estas variáveis na Vercel (Settings > Environment Variables):

### 🗄️ Banco de Dados (OBRIGATÓRIO)
```bash
# Substitua pelas suas credenciais do cPanel
DATABASE_URL=mysql://canticosccb_guanandifinance:KmSs147258!@localhost:3306/canticosccb_guanandifinance
```

### 🔐 Autenticação (OBRIGATÓRIO)
```bash
# Gere uma chave JWT forte para produção
JWT_SECRET=sua_chave_jwt_super_secreta_producao_2024
JWT_EXPIRE=30d
```

### ⚙️ Servidor (OBRIGATÓRIO)
```bash
NODE_ENV=production
PORT=5000
```

## Configuração Opcional

### 📧 Email (Recomendado)
```bash
# Para envio de notificações por email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app_gmail
SMTP_FROM=Condomínio Guanandi <noreply@guanandi.com>
```

### 💳 PIX (Opcional)
```bash
# Para integração com PIX em produção
PIX_CLIENT_ID=seu_client_id_pix_producao
PIX_CLIENT_SECRET=seu_client_secret_pix_producao
PIX_SANDBOX=false
PIX_CERTIFICATE_PATH=./certificates/
```

### 🧾 Boleto (Opcional)
```bash
# Para geração de boletos
BOLETO_BANCO=341
BOLETO_AGENCIA=sua_agencia
BOLETO_CONTA=sua_conta
BOLETO_CARTEIRA=109
```

### 🌐 URLs (Opcional)
```bash
# URL base da aplicação (será definida automaticamente pela Vercel)
BASE_URL=https://seu-projeto.vercel.app
```

## 📋 Checklist de Configuração

### Antes do Deploy:
- [ ] Banco MySQL criado no cPanel
- [ ] Usuário do banco criado com privilégios
- [ ] String de conexão testada
- [ ] Chave JWT gerada (forte e única)
- [ ] Email configurado (se necessário)

### Na Vercel:
- [ ] `DATABASE_URL` configurada
- [ ] `JWT_SECRET` configurada
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] Variáveis de email (se aplicável)
- [ ] Variáveis PIX/Boleto (se aplicável)

### Após Deploy:
- [ ] Testar conexão com banco
- [ ] Verificar se as migrações rodaram
- [ ] Testar login na aplicação
- [ ] Verificar logs da Vercel

## 🔒 Segurança

### Chaves Fortes:
```bash
# Exemplo de JWT_SECRET forte (NÃO use este):
JWT_SECRET=Gd8$mK9#pL2@vN5!qR7*tY4&uI6^wE3+zX1-cV0~bM8

# Gere sua própria chave com:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Boas Práticas:
- ✅ Use senhas únicas para cada ambiente
- ✅ Nunca commite credenciais no código
- ✅ Rotacione chaves periodicamente
- ✅ Use HTTPS em produção (automático na Vercel)
- ❌ Não use credenciais de desenvolvimento em produção

## 🚀 Deploy Automático

Após configurar as variáveis:

1. **Push para GitHub** (já feito)
2. **Conectar na Vercel**:
   - Acesse [vercel.com](https://vercel.com)
   - Import do GitHub: `sidneysantossp/recanto-guanandi`
   - Configure as variáveis de ambiente
   - Deploy automático

3. **Verificar Deploy**:
   - Acesse a URL gerada
   - Teste o login
   - Verifique os logs

## 🔍 Troubleshooting

### Erro de Banco:
```
PrismaClientInitializationError: Can't reach database server
```
**Solução**: Verifique `DATABASE_URL`

### Erro de JWT:
```
JsonWebTokenError: invalid signature
```
**Solução**: Verifique `JWT_SECRET`

### Erro de Build:
```
Error: Command "npm run build" exited with 1
```
**Solução**: Verifique logs de build na Vercel

### Erro 500:
```
Internal Server Error
```
**Solução**: Verifique logs da função na Vercel

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs na Vercel Dashboard
2. Teste localmente com as mesmas variáveis
3. Consulte a documentação da Vercel
4. Verifique se todas as variáveis obrigatórias estão configuradas