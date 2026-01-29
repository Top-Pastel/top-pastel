# Variáveis de Ambiente - Top Pastel

## Configuração Necessária para Deployment Externo

Copie e configure estas variáveis no seu servidor/plataforma de hosting:

```
# ========== DATABASE ==========
DATABASE_URL=mysql://username:password@host:3306/database_name

# ========== JWT ==========
JWT_SECRET=gere_uma_string_aleatoria_segura_com_32_caracteres_minimo

# ========== STRIPE ==========
STRIPE_SECRET_KEY=sk_test_xxxxx_ou_sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx_ou_pk_live_xxxxx

# ========== CTT (FRETE) ==========
CTT_API_URL=https://enviosecommerce.ctt.pt/api
CTT_PUBLIC_KEY=TOPPASTEL
CTT_SECRET_KEY=TOPPASTEL

# ========== OAUTH (OPCIONAL) ==========
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_NAME=Seu Nome
OWNER_OPEN_ID=seu_open_id

# ========== APIS EXTERNAS ==========
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua_frontend_api_key

# ========== ANALYTICS (OPCIONAL) ==========
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=seu_website_id

# ========== APP INFO ==========
VITE_APP_TITLE=Top Pastel - Massa de Pastel Brasileira
VITE_APP_LOGO=/logo.png
```

## Descrição de Cada Variável

### DATABASE_URL
- **Descrição**: String de conexão para o banco de dados MySQL/TiDB
- **Formato**: `mysql://username:password@host:port/database`
- **Exemplo**: `mysql://root:password123@localhost:3306/top_pastel`
- **Obrigatório**: Sim

### JWT_SECRET
- **Descrição**: Chave secreta para assinar tokens JWT
- **Recomendação**: Gere uma string aleatória segura com pelo menos 32 caracteres
- **Comando para gerar**: `openssl rand -base64 32`
- **Obrigatório**: Sim

### STRIPE_SECRET_KEY
- **Descrição**: Chave secreta do Stripe (nunca compartilhe!)
- **Onde obter**: Dashboard Stripe → Developers → API Keys
- **Formato**: Começa com `sk_test_` (teste) ou `sk_live_` (produção)
- **Obrigatório**: Sim

### STRIPE_WEBHOOK_SECRET
- **Descrição**: Secret do webhook do Stripe
- **Onde obter**: Dashboard Stripe → Developers → Webhooks
- **Formato**: Começa com `whsec_`
- **Obrigatório**: Sim

### VITE_STRIPE_PUBLISHABLE_KEY
- **Descrição**: Chave pública do Stripe (pode ser compartilhada)
- **Onde obter**: Dashboard Stripe → Developers → API Keys
- **Formato**: Começa com `pk_test_` (teste) ou `pk_live_` (produção)
- **Obrigatório**: Sim

### CTT_PUBLIC_KEY e CTT_SECRET_KEY
- **Descrição**: Credenciais da API da CTT para cálculo de frete
- **Valor**: TOPPASTEL (conforme fornecido)
- **Obrigatório**: Sim

### VITE_APP_TITLE
- **Descrição**: Título da aplicação (exibido no navegador)
- **Valor**: Top Pastel - Massa de Pastel Brasileira
- **Obrigatório**: Não (tem padrão)

### VITE_APP_LOGO
- **Descrição**: URL do logo da aplicação
- **Valor**: /logo.png (arquivo em client/public/logo.png)
- **Obrigatório**: Não (tem padrão)

## Checklist de Deployment

- [ ] DATABASE_URL configurado e testado
- [ ] JWT_SECRET gerado e configurado
- [ ] STRIPE_SECRET_KEY configurado
- [ ] STRIPE_WEBHOOK_SECRET configurado
- [ ] VITE_STRIPE_PUBLISHABLE_KEY configurado
- [ ] CTT_PUBLIC_KEY e CTT_SECRET_KEY configurados
- [ ] Banco de dados migrado (`pnpm db:push`)
- [ ] Testes executados e passando (`pnpm test`)
- [ ] Build gerado sem erros (`pnpm build`)
- [ ] Servidor iniciado e respondendo

## Plataformas de Hosting Recomendadas

### Railway
- Suporte nativo para Node.js
- Integração com GitHub
- Variáveis de ambiente no painel
- URL: https://railway.app

### Render
- Deploy gratuito com plano free
- Integração com GitHub
- Variáveis de ambiente no painel
- URL: https://render.com

### Vercel
- Otimizado para Next.js/Vite
- Deploy automático com Git
- Variáveis de ambiente no painel
- URL: https://vercel.com

### DigitalOcean App Platform
- Suporte para Docker
- Integração com GitHub
- Variáveis de ambiente no painel
- URL: https://www.digitalocean.com/products/app-platform

## Teste de Conexão

Após configurar as variáveis, teste a conexão:

```bash
# Teste de banco de dados
pnpm db:push

# Teste de build
pnpm build

# Teste de servidor
pnpm dev
```

Se tudo funcionar, seu projeto está pronto para deployment!
