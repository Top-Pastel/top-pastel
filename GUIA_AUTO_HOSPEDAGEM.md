# 🚀 Guia Completo de Auto-Hospedagem

Este guia explica como preparar o projeto Top Pastel para funcionar num servidor externo (fora da plataforma Manus).

---

## ⚠️ Problema: Dependência Manus

O projeto foi criado na plataforma Manus e tem uma dependência do plugin `vite-plugin-manus-runtime` que **não funciona fora da plataforma**.

### Solução: Remover a Dependência

**Passo 1: Substituir o ficheiro de configuração Vite**

O projeto inclui dois ficheiros de configuração:
- `vite.config.ts` - Para Manus (com plugin específico)
- `vite.config.standalone.ts` - Para auto-hospedagem (sem plugin)

Quando extrair o ZIP, execute:

```bash
# Remover o ficheiro original
rm vite.config.ts

# Renomear o ficheiro standalone
mv vite.config.standalone.ts vite.config.ts
```

**Passo 2: Remover a dependência do package.json**

No ficheiro `package.json`, remova a linha:
```json
"vite-plugin-manus-runtime": "^0.0.57",
```

Ou execute:
```bash
pnpm remove vite-plugin-manus-runtime
```

---

## 📋 Checklist de Configuração

### 1. Extrair e Preparar

```bash
# Extrair o ZIP
unzip top-pastel-complete-v2.zip
cd top-pastel

# Remover dependência Manus
rm vite.config.ts
mv vite.config.standalone.ts vite.config.ts
pnpm remove vite-plugin-manus-runtime

# Instalar dependências
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Crie um ficheiro `.env` na raiz do projeto:

```env
# ============ BASE DE DADOS ============
DATABASE_URL=mysql://username:password@host:3306/top_pastel

# ============ STRIPE ============
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ============ OAUTH ============
VITE_APP_ID=app_...
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# ============ SEGURANÇA ============
JWT_SECRET=seu_jwt_secret_aleatorio

# ============ INFORMAÇÕES ============
OWNER_NAME=Top Pastel
VITE_APP_TITLE=Top Pastel - Massa de Pastel Brasileira
VITE_APP_LOGO=/logo.png
```

### 3. Preparar Base de Dados

```bash
# Gerar migrações e aplicar ao banco de dados
pnpm db:push
```

### 4. Build para Produção

```bash
pnpm build
```

### 5. Iniciar o Servidor

```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm start
# ou
node dist/index.js
```

---

## 🔧 Configuração Detalhada

### Base de Dados (DATABASE_URL)

**Exemplos:**

**MySQL Local:**
```
DATABASE_URL=mysql://root:senha123@localhost:3306/top_pastel
```

**MySQL Remoto (AWS RDS):**
```
DATABASE_URL=mysql://admin:senha_segura@top-pastel-db.c123456.us-east-1.rds.amazonaws.com:3306/top_pastel
```

**TiDB Cloud:**
```
DATABASE_URL=mysql://root:senha@tidb-cluster.tidbcloud.com:4000/top_pastel
```

**Passos:**
1. Crie uma base de dados vazia
2. Copie a string de conexão
3. Defina em `.env`
4. Execute `pnpm db:push`

---

### Stripe

**1. Obter Chaves:**
- Aceda a https://dashboard.stripe.com/apikeys
- Copie `Secret key` → `STRIPE_SECRET_KEY`
- Copie `Publishable key` → `VITE_STRIPE_PUBLISHABLE_KEY`

**2. Configurar Webhook:**
- Aceda a https://dashboard.stripe.com/webhooks
- Clique em "Add endpoint"
- URL: `https://seu-dominio.com/api/stripe/webhook`
- Eventos: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- Copie o "Signing secret" → `STRIPE_WEBHOOK_SECRET`

---

### OAuth (Manus ou Custom)

**Se usar Manus OAuth:**
```env
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

**Se usar OAuth customizado:**
```env
VITE_APP_ID=seu_client_id
OAUTH_SERVER_URL=https://seu-oauth-server.com
VITE_OAUTH_PORTAL_URL=https://seu-oauth-portal.com
```

---

### JWT Secret

Gere um valor seguro:

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Copie o resultado para `JWT_SECRET` no `.env`

---

## 🌐 Configuração do Servidor

### Nginx (Exemplo)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Apache (Exemplo)

```apache
<VirtualHost *:80>
    ServerName seu-dominio.com
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

### PM2 (Manter Servidor Ativo)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start dist/index.js --name "top-pastel"

# Configurar para iniciar ao reiniciar
pm2 startup
pm2 save
```

---

## 🔐 Segurança em Produção

- [ ] Use HTTPS/SSL (Let's Encrypt)
- [ ] Configure firewall
- [ ] Use chaves LIVE do Stripe (sk_live_, pk_live_)
- [ ] Mantenha JWT_SECRET seguro
- [ ] Configure backups automáticos
- [ ] Use variáveis de ambiente do servidor
- [ ] Não commit `.env` com valores reais
- [ ] Configure CORS para seu domínio
- [ ] Teste webhooks antes de ir ao vivo

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'vite-plugin-manus-runtime'"

**Solução:** Você esqueceu de remover o plugin. Execute:
```bash
rm vite.config.ts
mv vite.config.standalone.ts vite.config.ts
pnpm remove vite-plugin-manus-runtime
```

### Erro: "DATABASE_URL not set"

**Solução:** Crie o ficheiro `.env` com as variáveis de ambiente

### Erro: "Stripe webhook failed"

**Solução:** Verifique:
1. URL do webhook está correto
2. Signing secret está correto
3. Firewall permite conexões de Stripe

### Erro: "OAuth login não funciona"

**Solução:** Verifique:
1. `VITE_APP_ID` está correto
2. `OAUTH_SERVER_URL` está acessível
3. Domínio está registado no OAuth provider

---

## 📞 Suporte

- **Stripe:** https://stripe.com/docs
- **Drizzle ORM:** https://orm.drizzle.team
- **Express:** https://expressjs.com
- **Vite:** https://vitejs.dev

---

## 📝 Ficheiros Importantes

Depois de extrair o ZIP, leia estes ficheiros **nesta ordem**:

1. **Este ficheiro** - Guia geral
2. **CONFIGURACAO_DEPLOYMENT.md** - Detalhes de cada variável
3. **VARIAVEIS_AMBIENTE.md** - Referência técnica
4. **package.json** - Scripts disponíveis
5. **drizzle.config.ts** - Configuração do banco de dados

---

**Pronto para auto-hospedar!** 🎉
