# Guia de Deployment - Top Pastel

## Pré-requisitos

- Node.js 18+ e pnpm
- MySQL/TiDB database
- Conta Stripe (para pagamentos)
- Chaves de API da CTT (para cálculo de frete)

## Instalação Local

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd top-pastel
```

2. **Instale as dependências**
```bash
pnpm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

4. **Configure o banco de dados**
```bash
pnpm db:push
```

5. **Inicie o servidor de desenvolvimento**
```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`

## Variáveis de Ambiente Essenciais

### Database
- `DATABASE_URL`: String de conexão MySQL/TiDB (ex: mysql://user:password@host:3306/database)

### Stripe
- `STRIPE_SECRET_KEY`: Chave secreta do Stripe (sk_test_...)
- `STRIPE_WEBHOOK_SECRET`: Secret do webhook do Stripe (whsec_...)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Chave pública do Stripe (pk_test_...)

### CTT (Cálculo de Frete)
- `CTT_API_URL`: URL da API da CTT (https://enviosecommerce.ctt.pt/api)
- `CTT_PUBLIC_KEY`: Chave pública CTT (TOPPASTEL)
- `CTT_SECRET_KEY`: Chave secreta CTT (TOPPASTEL)

### Autenticação
- `JWT_SECRET`: Chave para assinar JWTs (gere uma string aleatória segura com 32+ caracteres)

### OAuth (opcional)
- `VITE_APP_ID`: ID da aplicação OAuth
- `OAUTH_SERVER_URL`: URL do servidor OAuth
- `VITE_OAUTH_PORTAL_URL`: URL do portal OAuth

### App Info
- `VITE_APP_TITLE`: Título da aplicação
- `VITE_APP_LOGO`: URL do logo

## Deployment em Produção

### Opção 1: Vercel

```bash
# Build
pnpm build

# Deploy
vercel deploy --prod
```

### Opção 2: Railway

1. Conecte seu repositório Git no Railway
2. Configure as variáveis de ambiente no painel
3. Deploy automático

### Opção 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Opção 4: Render

1. Conecte seu repositório Git
2. Configure as variáveis de ambiente
3. Deploy automático

## Estrutura do Projeto

```
top-pastel/
├── client/              # Frontend React + Vite
│   ├── src/
│   │   ├── pages/       # Páginas (Home, Checkout, Success, AdminDashboard)
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── lib/         # Utilitários (tRPC client, etc)
│   │   └── App.tsx      # Roteamento principal
│   └── public/          # Assets estáticos
├── server/              # Backend Express + tRPC
│   ├── routers/         # Rotas tRPC
│   ├── db.ts            # Funções de banco de dados
│   ├── products.ts      # Configuração de produtos
│   ├── shippingRates.ts # Tabela de fretes
│   └── _core/           # Código core (OAuth, webhooks, etc)
├── drizzle/             # Migrações de banco de dados
├── shared/              # Código compartilhado
└── package.json         # Dependências
```

## Testes

```bash
# Executar testes
pnpm test

# Cobertura de testes
pnpm test:coverage
```

## Troubleshooting

### Erro: "Unknown column 'nan' in field list"
- Verifique se o `shippingCost` está sendo calculado corretamente
- Certifique-se de que o CEP é válido

### Erro: Stripe webhook não funciona
- Verifique se `STRIPE_WEBHOOK_SECRET` está correto
- Teste com `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Erro: Database connection failed
- Verifique se `DATABASE_URL` está correto
- Certifique-se de que o servidor MySQL está rodando

### Erro: Frete não é calculado
- Verifique se o CEP está preenchido
- Certifique-se de que a rota `trpc.shipping.calculateShipping` está funcionando

## Recursos Importantes

- **Produto Stripe**: prod_Tqf6bUth39m5Y5 (Massa de Pastel 1kg - €10.00)
- **Webhook Stripe**: POST /api/stripe/webhook
- **Cálculo de Frete**: Baseado em CEP (Portugal Continental, Açores, Madeira, Espanha)
- **Banco de Dados**: Tabelas de pedidos, itens de pedido, usuários

## Suporte

Para mais informações sobre o projeto, consulte:
- [Documentação do tRPC](https://trpc.io)
- [Documentação do Stripe](https://stripe.com/docs)
- [Documentação da CTT](https://www.ctt.pt)
- [Documentação do Drizzle ORM](https://orm.drizzle.team)
