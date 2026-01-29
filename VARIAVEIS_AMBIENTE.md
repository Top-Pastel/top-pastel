# 📝 Localização das Variáveis de Ambiente no Código

Este documento mostra exatamente onde cada variável de ambiente é usada no código.

---

## 🗄️ BASE DE DADOS

### `DATABASE_URL`
**Descrição:** String de conexão para MySQL/TiDB

**Usada em:**
- `drizzle.config.ts` - Configuração do Drizzle ORM
- `server/db.ts` - Inicialização da conexão com banco de dados

**Formato:**
```
mysql://username:password@host:port/database_name
```

**Exemplo:**
```
DATABASE_URL=mysql://root:senha123@localhost:3306/top_pastel
```

---

## 💳 STRIPE

### `STRIPE_SECRET_KEY`
**Descrição:** Chave secreta do Stripe para operações no servidor

**Usada em:**
- `server/routers/checkout.ts` - Criação de checkout sessions
- `server/webhooks/stripe.ts` - Processamento de webhooks
- `server/stripe.ts` - Operações gerais do Stripe

**Formato:**
```
sk_test_51Ssxm7FpZLuOvGpTKQi8V6CJ... (teste)
sk_live_... (produção)
```

**Como obter:**
1. Aceda a https://dashboard.stripe.com/apikeys
2. Copie a "Secret key"

---

### `VITE_STRIPE_PUBLISHABLE_KEY`
**Descrição:** Chave pública do Stripe para o frontend

**Usada em:**
- `client/src/pages/Checkout.tsx` - Inicialização do Stripe no cliente
- Variável de ambiente do Vite (prefixo `VITE_`)

**Formato:**
```
pk_test_51Ssxm7FpZLuOvGpTKQi8V6CJ... (teste)
pk_live_... (produção)
```

**Como obter:**
1. Aceda a https://dashboard.stripe.com/apikeys
2. Copie a "Publishable key"

---

### `STRIPE_WEBHOOK_SECRET`
**Descrição:** Secret para verificar assinatura de webhooks do Stripe

**Usada em:**
- `server/webhooks/stripe.ts` - Verificação de webhooks

**Formato:**
```
whsec_1234567890abcdef...
```

**Como obter:**
1. Aceda a https://dashboard.stripe.com/webhooks
2. Crie um webhook endpoint para: `https://seu-dominio.com/api/stripe/webhook`
3. Copie o "Signing secret"

---

## 🔐 OAUTH

### `VITE_APP_ID`
**Descrição:** ID da aplicação OAuth

**Usada em:**
- `server/_core/oauth.ts` - Inicialização do OAuth
- `client/src/const.ts` - URL de login

**Formato:**
```
app_1234567890abcdef
```

**Como obter:**
- Se usar Manus: https://manus.im/settings
- Se usar OAuth customizado: seu provedor OAuth

---

### `OAUTH_SERVER_URL`
**Descrição:** URL base do servidor OAuth

**Usada em:**
- `server/_core/oauth.ts` - Endpoints do OAuth
- `server/_core/env.ts` - Configuração de ambiente

**Formato:**
```
https://api.manus.im (Manus)
https://seu-oauth-server.com (Custom)
```

---

### `VITE_OAUTH_PORTAL_URL`
**Descrição:** URL do portal de login OAuth

**Usada em:**
- `client/src/const.ts` - Redirecionamento para login
- `client/src/pages/Home.tsx` - Link de login

**Formato:**
```
https://portal.manus.im (Manus)
https://seu-oauth-portal.com (Custom)
```

---

## 🔑 SEGURANÇA

### `JWT_SECRET`
**Descrição:** Secret para assinar cookies de sessão JWT

**Usada em:**
- `server/_core/cookies.ts` - Assinatura de cookies
- `server/_core/context.ts` - Verificação de tokens

**Formato:**
```
aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/==
```

**Como gerar:**
```bash
openssl rand -base64 32
```

---

## 👤 INFORMAÇÕES DO PROPRIETÁRIO

### `OWNER_NAME`
**Descrição:** Nome do proprietário da aplicação

**Usada em:**
- `server/_core/notification.ts` - Notificações
- `server/_core/env.ts` - Configuração

**Exemplo:**
```
Top Pastel
```

---

### `OWNER_OPEN_ID`
**Descrição:** OpenID do proprietário (se usar Manus OAuth)

**Usada em:**
- `server/_core/notification.ts` - Envio de notificações

**Formato:**
```
user_1234567890abcdef
```

---

## 🎨 CONFIGURAÇÃO DA APLICAÇÃO

### `VITE_APP_TITLE`
**Descrição:** Título da aplicação (exibido no browser)

**Usada em:**
- `client/index.html` - Meta tag title
- `client/src/App.tsx` - Título da página

**Exemplo:**
```
Top Pastel - Massa de Pastel Brasileira
```

---

### `VITE_APP_LOGO`
**Descrição:** URL ou caminho do logo

**Usada em:**
- `client/src/components/Navbar.tsx` - Logo na navbar
- `client/index.html` - Favicon

**Exemplo:**
```
/logo.png
https://seu-dominio.com/logo.png
```

---

## 🌐 APIS EXTERNAS (Opcional)

### `BUILT_IN_FORGE_API_URL`
**Descrição:** URL base da API Forge (Manus)

**Usada em:**
- `server/_core/llm.ts` - Chamadas LLM
- `server/_core/imageGeneration.ts` - Geração de imagens

**Formato:**
```
https://api.manus.im/forge
```

---

### `BUILT_IN_FORGE_API_KEY`
**Descrição:** Chave de API Forge (server-side)

**Usada em:**
- `server/_core/llm.ts`
- `server/_core/imageGeneration.ts`
- `server/_core/voiceTranscription.ts`

**Formato:**
```
Bearer token aqui
```

---

### `VITE_FRONTEND_FORGE_API_KEY`
**Descrição:** Chave de API Forge (frontend)

**Usada em:**
- `client/src/lib/trpc.ts` - Configuração de headers

**Formato:**
```
Bearer token aqui
```

---

### `VITE_FRONTEND_FORGE_API_URL`
**Descrição:** URL da API Forge (frontend)

**Usada em:**
- `client/src/lib/trpc.ts`

**Formato:**
```
https://api.manus.im/forge
```

---

## 📊 ANALYTICS (Opcional)

### `VITE_ANALYTICS_ENDPOINT`
**Descrição:** Endpoint de analytics

**Usada em:**
- `client/src/main.tsx` - Inicialização de analytics

---

### `VITE_ANALYTICS_WEBSITE_ID`
**Descrição:** ID do website para analytics

**Usada em:**
- `client/src/main.tsx`

---

## 📄 Ficheiro `.env` Completo

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
OWNER_OPEN_ID=user_...
VITE_APP_TITLE=Top Pastel - Massa de Pastel Brasileira
VITE_APP_LOGO=/logo.png

# ============ APIS EXTERNAS ============
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=seu_forge_key
VITE_FRONTEND_FORGE_API_KEY=seu_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge

# ============ ANALYTICS ============
VITE_ANALYTICS_ENDPOINT=https://analytics.seu-dominio.com
VITE_ANALYTICS_WEBSITE_ID=seu_website_id
```

---

## ⚠️ Notas Importantes

1. **Nunca commit `.env`** com valores reais
2. **Prefixo `VITE_`** = variáveis expostas ao frontend (não use secrets aqui)
3. **Sem prefixo** = variáveis server-side (seguras)
4. **Teste localmente** antes de fazer deploy
5. **Use variáveis de ambiente do servidor** em produção, não ficheiros `.env`
