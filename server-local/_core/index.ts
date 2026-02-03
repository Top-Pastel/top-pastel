import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.error('!!! ERRO AO CARREGAR O ARQUIVO .env !!!');
  console.error(result.error);
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
} else {
  console.log('**********************************************');
  console.log('*** Arquivo .env carregado com sucesso! ***');
  console.log('*** Variáveis encontradas:');
  console.log(result.parsed);
  console.log('**********************************************');
}

// O resto do seu código continua aqui...
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe-webhook";

const app = express();

// Stripe webhook MUST be registered BEFORE express.json()
registerStripeWebhook(app);

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerOAuthRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

async function setup() {
  if (process.env.NODE_ENV === "development") {
    const server = createServer(app);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
}

setup();

export default app;

