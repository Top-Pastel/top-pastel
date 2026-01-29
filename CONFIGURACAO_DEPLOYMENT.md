# 🚀 Guia de Configuração para Auto-Hospedagem

Este guia explica como configurar todas as variáveis de ambiente necessárias para hospedar o Top Pastel num servidor externo.

---

## 📋 Variáveis de Ambiente Obrigatórias

### 1️⃣ BASE DE DADOS (DATABASE_URL)

**Onde configurar:** Ficheiro `.env` ou variáveis de ambiente do servidor

**Formato:**
```
DATABASE_URL=mysql://username:password@host:port/database_name
```

**Exemplos:**

**MySQL Local:**
```
DATABASE_URL=mysql://root:senha123@localhost:3306/top_pastel
```

**MySQL Remoto (ex: AWS RDS):**
```
DATABASE_URL=mysql://admin:senha_segura@top-pastel-db.c123456.us-east-1.rds.amazonaws.com:3306/top_pastel
```

**TiDB Cloud:**
```
DATABASE_URL=mysql://root:senha@tidb-cluster.tidbcloud.com:4000/top_pastel
```

**Passos:**
1. Crie uma base de dados vazia no seu servidor MySQL/TiDB
2. Copie a string de conexão
3. Defina a variável `DATABASE_URL`
4. Execute `pnpm db:push` para criar as tabelas

---

### 2️⃣ STRIPE - Chave Secreta (STRIPE_SECRET_KEY)

**Onde configurar:** Ficheiro `.env` ou variáveis de ambiente do servidor

**Formato:**
```
STRIPE_SECRET_KEY=sk_test_... (desenvolvimento) ou sk_live_... (produção)
```

**Como obter:**
1. Aceda a https://dashboard.stripe.com/apikeys
2. Copie a chave secreta (começa com `sk_test_` ou `sk_live_`)
3. Defina a variável `STRIPE_SECRET_KEY`

**Exemplo:**
```
STRIPE_SECRET_KEY=sk_test_51Ssxm7FpZLuOvGpTKQi8V6CJ...
```

---

### 3️⃣ STRIPE - Chave Pública (VITE_STRIPE_PUBLISHABLE_KEY)

**Onde configurar:** Ficheiro `.env` ou variáveis de ambiente do servidor

**Formato:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (desenvolvimento) ou pk_live_... (produção)
```

**Como obter:**
1. Aceda a https://dashboard.stripe.com/apikeys
2. Copie a chave pública (começa com `pk_test_` ou `pk_live_`)
3. Defina a variável `VITE_STRIPE_PUBLISHABLE_KEY`

**Exemplo:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Ssxm7FpZLuOvGpTKQi8V6CJ...
```

---

### 4️⃣ STRIPE - Webhook Secret (STRIPE_WEBHOOK_SECRET)

**Onde configurar:** Ficheiro `.env` ou variáveis de ambiente do servidor

**Formato:**
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Como obter:**
1. Aceda a https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. Configure o URL do webhook: `https://seu-dominio.com/api/stripe/webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copie o "Signing secret" (começa com `whsec_`)
6. Defina a variável `STRIPE_WEBHOOK_SECRET`

**Exemplo:**
```
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

---

### 5️⃣ OAUTH - ID da Aplicação (VITE_APP_ID)

**Onde configurar:** Ficheiro `.env` ou variáveis de ambiente do servidor

**Se usar Manus OAuth:**
1. Aceda a https://manus.im/settings
2. Copie o "App ID"
3. Defina a variável `VITE_APP_ID`

**Se usar OAuth customizado:**
1. Configure seu próprio servidor OAuth
2. Obtenha o "Client ID"
3. Defina a variável `VITE_APP_ID`

**Exemplo:**
```
VITE_APP_ID=app_1234567890abcdef
```

---

### 6️⃣ OAUTH - URL do Servidor (OAUTH_SERVER_URL)

**Onde configurar:** Ficheiro `.env` ou variáveis de ambiente do servidor

**Se usar Manus OAuth:**
```
OAUTH_SERVER_URL=https://api.manus.im
```

**Se usar OAuth customizado:**
```
OAUTH_SERVER_URL=https://seu-oauth-server.com
```

---

### 7️⃣ OAUTH - URL do Portal (VITE_OAUTH_PORTAL_URL)

**Onde configurar:** Ficheiro `.env` ou variáveis de ambiente do servidor

**Se usar Manus OAuth:**
```
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

**Se usar OAuth customizado:**
```
VITE_OAUTH_PORTAL_URL=https://seu-oauth-portal.com
```

---

### 8️⃣ JWT Secret (JWT_SECRET)

**Onde configurar:** Ficheiro `.env` ou variáveis de ambiente do servidor

**Como gerar:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Exemplo:**
```
JWT_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/==
```

---

## 🔧 Ficheiro `.env` Completo

Crie um ficheiro `.env` na raiz do projeto com todas as variáveis:

```env
# Base de Dados
DATABASE_URL=mysql://username:password@host:3306/top_pastel

# Stripe
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth
VITE_APP_ID=app_...
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Segurança
JWT_SECRET=seu_jwt_secret_aleatorio

# Informações
OWNER_NAME=Top Pastel
VITE_APP_TITLE=Top Pastel - Massa de Pastel Brasileira
```

---

## 🚀 Passos de Deployment

### 1. Preparar o servidor

```bash
# Clonar/extrair o projeto
unzip top-pastel-complete.zip
cd top-pastel

# Instalar dependências
pnpm install

# Criar ficheiro .env com as variáveis
nano .env  # ou use seu editor favorito
```

### 2. Configurar base de dados

```bash
# Executar migrações
pnpm db:push
```

### 3. Build para produção

```bash
pnpm build
```

### 4. Iniciar o servidor

```bash
# Desenvolvimento
pnpm dev

# Produção
node dist/index.js
```

---

## 🔐 Checklist de Segurança

- [ ] Nunca commit `.env` com valores reais
- [ ] Use chaves LIVE do Stripe em produção (sk_live_, pk_live_)
- [ ] Configure HTTPS/SSL no seu servidor
- [ ] Mantenha JWT_SECRET seguro e único
- [ ] Configure CORS corretamente para seu domínio
- [ ] Teste webhooks do Stripe antes de ir ao vivo
- [ ] Configure backups automáticos da base de dados
- [ ] Use variáveis de ambiente do servidor, não ficheiros `.env`

---

## 📞 Suporte

Se tiver dúvidas sobre a configuração:
- Stripe: https://stripe.com/docs
- Manus OAuth: https://manus.im/docs
- Drizzle ORM: https://orm.drizzle.team
