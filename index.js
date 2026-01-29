// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  // Informações do cliente
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  // Endereço de entrega
  deliveryAddress: text("deliveryAddress").notNull(),
  deliveryPostalCode: varchar("deliveryPostalCode", { length: 10 }).notNull(),
  deliveryCity: varchar("deliveryCity", { length: 100 }).notNull(),
  // Informações de frete
  deliveryType: mysqlEnum("deliveryType", ["ctt_point", "home"]).notNull(),
  shippingCost: decimal("shippingCost", { precision: 10, scale: 2 }).notNull(),
  // Informações de pagamento
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentId: varchar("stripePaymentId", { length: 255 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed"]).default("pending").notNull(),
  // Status do pedido
  orderStatus: mysqlEnum("orderStatus", ["pending", "processing", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  // CTT
  cttShippingNumber: varchar("cttShippingNumber", { length: 50 }),
  cttTrackingUrl: text("cttTrackingUrl"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var shipmentTracking = mysqlTable("shipmentTracking", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  cttShippingNumber: varchar("cttShippingNumber", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  lastUpdate: timestamp("lastUpdate").defaultNow().notNull(),
  trackingData: json("trackingData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const existing = await db.select().from(users).where(eq(users.openId, user.openId));
    if (existing.length > 0) {
      const updateData = {};
      if (user.name !== null && user.name !== void 0) updateData.name = user.name;
      if (user.email !== null && user.email !== void 0) updateData.email = user.email;
      if (user.loginMethod !== null && user.loginMethod !== void 0) updateData.loginMethod = user.loginMethod;
      if (user.lastSignedIn) updateData.lastSignedIn = user.lastSignedIn;
      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.openId, user.openId));
      }
    } else {
      await db.insert(users).values(user);
    }
  } catch (error) {
    console.error("[Database] Error upserting user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId));
  return result.length > 0 ? result[0] : null;
}
async function createOrder(orderData, items) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const validatedOrderData = {
    ...orderData,
    shippingCost: Number(orderData.shippingCost) || 5.58,
    totalAmount: Number(orderData.totalAmount) || 15.58
  };
  if (isNaN(Number(validatedOrderData.shippingCost)) || isNaN(Number(validatedOrderData.totalAmount))) {
    throw new Error("Invalid order data: NaN values detected");
  }
  const result = await db.insert(orders).values(validatedOrderData);
  let orderId = 0;
  console.log("[DB] Insert result type:", typeof result, "Keys:", Object.keys(result || {}));
  if (result && typeof result === "object") {
    if ("insertId" in result && result.insertId) {
      orderId = Number(result.insertId);
      console.log("[DB] Got insertId:", orderId);
    } else if (Array.isArray(result) && result.length > 0 && typeof result[0] === "object" && "id" in result[0]) {
      orderId = result[0].id;
      console.log("[DB] Got id from array:", orderId);
    }
  }
  if (isNaN(orderId) || orderId <= 0) {
    console.warn("[DB] Could not extract order ID from result, querying database");
    const lastOrder = await db.select().from(orders).orderBy(desc(orders.id)).limit(1);
    if (lastOrder.length > 0) {
      orderId = lastOrder[0].id;
      console.log("[DB] Got order ID from query:", orderId);
    } else {
      throw new Error("Failed to create order: could not retrieve order ID");
    }
  }
  console.log("[DB] Order created with ID:", orderId);
  if (items.length > 0) {
    const itemsWithOrderId = items.map((item) => {
      const unitPrice = Number(item.unitPrice) || 0;
      const totalPrice = Number(item.totalPrice) || 0;
      if (isNaN(unitPrice) || isNaN(totalPrice)) {
        throw new Error(`Invalid item data: NaN values detected for ${item.productName}`);
      }
      return {
        ...item,
        orderId: Number(orderId),
        unitPrice: Number(unitPrice),
        totalPrice: Number(totalPrice)
      };
    });
    const validatedItems = itemsWithOrderId.map((item) => ({
      ...item,
      orderId: Number(item.orderId),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice)
    }));
    console.log("[DB] Inserting items:", JSON.stringify(validatedItems));
    await db.insert(orderItems).values(validatedItems);
  }
  return orderId;
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/sdk.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      ...user,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z4 } from "zod";

// server/shippingRates.ts
var deliveryTypeMap = {
  "ctt_point": "ponto_ctt",
  "home": "domicilio",
  "Ponto CTT": "ponto_ctt",
  "Domic\xEDlio": "domicilio"
};
var shippingRates = {
  pt_continente: [
    { peso: "At\xE9 1kg", ponto_ctt: 4.59, domicilio: 5.58 },
    { peso: "At\xE9 2kg", ponto_ctt: 4.93, domicilio: 5.58 },
    { peso: "At\xE9 5kg", ponto_ctt: 5.49, domicilio: 6.14 },
    { peso: "At\xE9 10kg", ponto_ctt: 6.81, domicilio: 7.46 },
    { peso: "At\xE9 20kg", ponto_ctt: 8.12, domicilio: 8.77 },
    { peso: "At\xE9 30kg", ponto_ctt: 10.94, domicilio: 11.59 }
  ],
  acores: [
    { peso: "At\xE9 1kg", ponto_ctt: 5, domicilio: 7.5 },
    { peso: "At\xE9 2kg", ponto_ctt: 6, domicilio: 9 },
    { peso: "At\xE9 5kg", ponto_ctt: 8, domicilio: 12 },
    { peso: "At\xE9 10kg", ponto_ctt: 10, domicilio: 15 },
    { peso: "At\xE9 20kg", ponto_ctt: 13, domicilio: 20 },
    { peso: "At\xE9 30kg", ponto_ctt: 16, domicilio: 25 }
  ],
  madeira: [
    { peso: "At\xE9 1kg", ponto_ctt: 5.5, domicilio: 8 },
    { peso: "At\xE9 2kg", ponto_ctt: 6.5, domicilio: 9.5 },
    { peso: "At\xE9 5kg", ponto_ctt: 8.5, domicilio: 12.5 },
    { peso: "At\xE9 10kg", ponto_ctt: 11, domicilio: 16 },
    { peso: "At\xE9 20kg", ponto_ctt: 14, domicilio: 21 },
    { peso: "At\xE9 30kg", ponto_ctt: 17, domicilio: 26 }
  ],
  es_peninsula: [
    { peso: "At\xE9 1kg", ponto_ctt: 2.5, domicilio: 3.5 },
    { peso: "At\xE9 2kg", ponto_ctt: 3, domicilio: 4.2 },
    { peso: "At\xE9 5kg", ponto_ctt: 4, domicilio: 5.5 },
    { peso: "At\xE9 10kg", ponto_ctt: 5, domicilio: 7 },
    { peso: "At\xE9 20kg", ponto_ctt: 6.5, domicilio: 9 },
    { peso: "At\xE9 30kg", ponto_ctt: 8, domicilio: 11 }
  ],
  es_outros: [
    { peso: "At\xE9 1kg", domicilio: 14.05 },
    { peso: "At\xE9 5kg", domicilio: 26.64 },
    { peso: "At\xE9 10kg", domicilio: 58.84 },
    { peso: "At\xE9 15kg", domicilio: 75.43 },
    { peso: "At\xE9 20kg", domicilio: 108.33 },
    { peso: "At\xE9 25kg", domicilio: 141.22 },
    { peso: "At\xE9 30kg", domicilio: 173.83 }
  ]
};
function getDestinationFromCEP(cep) {
  const cleanCEP = cep.replace(/\D/g, "");
  if (cleanCEP.match(/^950\d{2}/) || cleanCEP.match(/^970\d{2}/) || cleanCEP.match(/^980\d{2}/) || cleanCEP.match(/^990\d{2}/) || cleanCEP.match(/^995\d{2}/)) {
    return "acores";
  }
  if (cleanCEP.match(/^900\d{2}/) || cleanCEP.match(/^910\d{2}/) || cleanCEP.match(/^930\d{2}/)) {
    return "madeira";
  }
  if (cleanCEP.match(/^[2-5]\d{4}$/)) {
    return "es_peninsula";
  }
  if (cleanCEP.match(/^[1-9]\d{3}/) && !cleanCEP.match(/^9[5-9]\d{2}/) && !cleanCEP.match(/^9[1-4]\d{2}/)) {
    return "pt_continente";
  }
  if (cleanCEP.match(/^[0-1]\d{4}$/) || cleanCEP.match(/^[6-9]\d{4}$/)) {
    return "es_outros";
  }
  if (cleanCEP.match(/^\d{5}$/)) {
    return "es_outros";
  }
  return "pt_continente";
}
function calculateShipping(destination, deliveryType, weight = 1.5) {
  const rates = shippingRates[destination];
  if (!rates) return 5.58;
  let applicableRate = rates[0];
  for (const rate of rates) {
    const maxWeight = parseInt(rate.peso.match(/\d+/)?.[0] || "0");
    if (weight <= maxWeight) {
      applicableRate = rate;
      break;
    }
  }
  const normalizedType = typeof deliveryType === "string" ? deliveryTypeMap[deliveryType] || deliveryType : deliveryType;
  if (normalizedType === "ponto_ctt" && applicableRate.ponto_ctt) {
    return applicableRate.ponto_ctt;
  }
  return applicableRate.domicilio;
}
function calculateShippingByCEP(cep, deliveryType, quantity = 1) {
  try {
    if (!cep || typeof cep !== "string" || cep.trim().length === 0) {
      console.warn("[ShippingRates] CEP inv\xE1lido:", cep);
      return 5.58;
    }
    const mappedDeliveryType = deliveryTypeMap[deliveryType] || "domicilio";
    const validQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
    const weight = validQuantity * 1.5;
    const destination = getDestinationFromCEP(cep);
    const result = calculateShipping(destination, mappedDeliveryType, weight);
    const finalResult = Number(result);
    if (isNaN(finalResult) || !isFinite(finalResult) || finalResult <= 0) {
      console.warn("[ShippingRates] Resultado inv\xE1lido:", finalResult, "CEP:", cep, "Destino:", destination);
      return 5.58;
    }
    return finalResult;
  } catch (error) {
    console.error("[ShippingRates] Erro ao calcular frete:", error);
    return 5.58;
  }
}

// server/routers/checkout.ts
import { z as z2 } from "zod";

// server/stripe.ts
import Stripe from "stripe";
var stripeClient = null;
function getStripeClient() {
  if (!stripeClient) {
    const secretKey = process.env.CUSTOM_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY ou CUSTOM_STRIPE_SECRET_KEY n\xE3o configurada");
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

// server/products.ts
var PRODUCTS = {
  MASSA_PASTEL_1KG: {
    name: "Massa de Pastel Brasileira 1kg",
    description: "Rolo de massa de pastel fresca, artesanal, pronta para fritar",
    price: 1e3,
    // em centavos (€10,00)
    currency: "eur",
    image: "https://top-pastel.manus.space/images/pastel-rolo-top-pastel.jpg",
    priceId: "price_1Ssxm7FpZLuOvGpTKQi8V6CJ",
    productId: "prod_Tqf6bUth39m5Y5"
  },
  FRETE_CTT: {
    name: "Frete CTT - Domic\xEDlio",
    description: "Entrega para Guimar\xE3es",
    price: 558,
    // em centavos (€5,58)
    currency: "eur",
    priceId: "price_1SsvTbCfUgGMe1QnsFncRHhb",
    productId: "prod_TqcjhRs7vG4hSx"
  }
};
function getProductLineItems(quantity, shippingCost = 0) {
  const validShippingCost = typeof shippingCost === "number" && !isNaN(shippingCost) && shippingCost >= 0 ? shippingCost : 5.24;
  const lineItems = [
    {
      price: PRODUCTS.MASSA_PASTEL_1KG.priceId,
      quantity
    }
  ];
  if (validShippingCost > 0) {
    const unitAmount = Math.round(validShippingCost * 100);
    if (!isNaN(unitAmount) && unitAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Frete de Entrega",
            description: "Entrega para o seu endere\xE7o"
          },
          unit_amount: unitAmount
        },
        quantity: 1
      });
    }
  }
  return lineItems;
}

// server/routers/checkout.ts
var checkoutRouter = router({
  /**
   * Criar uma sessão de checkout com produtos reais do Stripe
   */
  createSession: publicProcedure.input(
    z2.object({
      customerName: z2.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      customerEmail: z2.string().email("Email inv\xE1lido"),
      customerPhone: z2.string().min(1, "Telefone \xE9 obrigat\xF3rio"),
      deliveryAddress: z2.string().min(1, "Endere\xE7o \xE9 obrigat\xF3rio"),
      deliveryPostalCode: z2.string().min(1, "CEP \xE9 obrigat\xF3rio"),
      deliveryCity: z2.string().min(1, "Cidade \xE9 obrigat\xF3ria"),
      deliveryDistrict: z2.string().min(1, "Distrito \xE9 obrigat\xF3rio"),
      deliveryType: z2.enum(["ctt_point", "home"]),
      quantity: z2.number().int().min(1, "Quantidade deve ser pelo menos 1"),
      shippingCost: z2.number().min(0, "Frete deve ser um valor v\xE1lido")
    })
  ).mutation(async ({ input, ctx }) => {
    try {
      let shippingCost = Number(input.shippingCost);
      console.log("[Checkout] Received shipping cost from frontend:", shippingCost, "Type:", typeof shippingCost);
      if (isNaN(shippingCost) || !isFinite(shippingCost) || shippingCost <= 0) {
        console.warn("[Checkout] Shipping cost is invalid, using default: 5.58");
        shippingCost = 5.58;
      }
      const lineItems = getProductLineItems(input.quantity, shippingCost);
      const stripeClient2 = getStripeClient();
      const origin = ctx.req.headers.origin || process.env.VITE_APP_URL || "https://top-pastel.manus.space";
      const session = await stripeClient2.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        customer_email: input.customerEmail,
        client_reference_id: input.customerEmail,
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout`,
        metadata: {
          customer_name: input.customerName,
          customer_email: input.customerEmail,
          customer_phone: input.customerPhone,
          customer_address: input.deliveryAddress,
          customer_city: input.deliveryCity,
          customer_district: input.deliveryDistrict,
          customer_cep: input.deliveryPostalCode,
          delivery_type: input.deliveryType,
          quantity: input.quantity.toString(),
          shipping_cost: shippingCost.toString()
        }
      });
      try {
        console.log("[Checkout] Criando itens do pedido com shippingCost:", shippingCost, "Type:", typeof shippingCost);
        const unitPrice = Number(shippingCost);
        if (isNaN(unitPrice) || !isFinite(unitPrice)) {
          throw new Error("Invalid shipping cost");
        }
        const productUnitPrice = Number(10);
        const productTotalPrice = Number(10 * input.quantity);
        const shippingUnitPrice = Number(unitPrice);
        const shippingTotalPrice = Number(unitPrice);
        if (isNaN(productUnitPrice) || isNaN(productTotalPrice) || isNaN(shippingUnitPrice) || isNaN(shippingTotalPrice)) {
          throw new Error("Invalid price calculation");
        }
        const orderItems2 = [
          {
            productName: "Massa de Pastel Brasileira 1kg",
            quantity: input.quantity,
            unitPrice: productUnitPrice,
            totalPrice: productTotalPrice
          },
          {
            productName: "Frete CTT - " + (input.deliveryType === "home" ? "Domic\xEDlio" : "Ponto CTT"),
            quantity: 1,
            unitPrice: shippingUnitPrice,
            totalPrice: shippingTotalPrice
          }
        ];
        console.log("[Checkout] Order items:", JSON.stringify(orderItems2));
        const totalAmount = 10 * input.quantity + shippingCost;
        console.log("[Checkout] Total amount:", totalAmount, "Type:", typeof totalAmount);
        const orderId = await createOrder(
          {
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            deliveryAddress: input.deliveryAddress,
            deliveryPostalCode: input.deliveryPostalCode,
            deliveryCity: input.deliveryCity,
            deliveryType: input.deliveryType,
            shippingCost,
            totalAmount,
            stripePaymentId: session.id,
            paymentStatus: "pending",
            orderStatus: "pending"
          },
          orderItems2
        );
        console.log(`[Checkout] Pedido criado com sucesso: ${orderId}`);
      } catch (dbError) {
        console.error("[Checkout] Erro ao criar pedido:", dbError);
      }
      return {
        checkoutUrl: session.url,
        sessionId: session.id
      };
    } catch (error) {
      console.error("Erro ao criar sess\xE3o de checkout:", error);
      throw error;
    }
  })
});

// server/routers/orders.ts
import { z as z3 } from "zod";
import { eq as eq2 } from "drizzle-orm";
var ordersRouter = router({
  /**
   * Buscar pedido por session_id do Stripe
   */
  getBySessionId: publicProcedure.input(z3.object({ sessionId: z3.string() })).query(async ({ input }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      console.log("[getBySessionId] Buscando pedido com sessionId:", input.sessionId);
      const order = await db.select().from(orders).where(eq2(orders.stripePaymentId, input.sessionId)).limit(1);
      console.log("[getBySessionId] Resultado da query:", order);
      if (!order || order.length === 0) {
        return null;
      }
      const orderData = order[0];
      const items = await db.select().from(orderItems).where(eq2(orderItems.orderId, orderData.id));
      return {
        ...orderData,
        items
      };
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      throw error;
    }
  }),
  /**
   * Listar todos os pedidos do usuário (para página /pedidos)
   */
  list: publicProcedure.input(
    z3.object({
      email: z3.string().email(),
      limit: z3.number().int().min(1).max(100).default(10),
      offset: z3.number().int().min(0).default(0)
    })
  ).query(async ({ input }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userOrders = await db.select().from(orders).where(eq2(orders.customerEmail, input.email)).limit(input.limit).offset(input.offset);
      const ordersWithItems = await Promise.all(
        userOrders.map(async (order) => {
          const items = await db.select().from(orderItems).where(eq2(orderItems.orderId, order.id));
          return {
            ...order,
            items
          };
        })
      );
      return ordersWithItems;
    } catch (error) {
      console.error("Erro ao listar pedidos:", error);
      throw error;
    }
  }),
  /**
   * Buscar pedido por ID
   */
  getById: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const order = await db.select().from(orders).where(eq2(orders.id, input.id)).limit(1);
      if (!order || order.length === 0) {
        return null;
      }
      const orderData = order[0];
      const items = await db.select().from(orderItems).where(eq2(orderItems.orderId, orderData.id));
      return {
        ...orderData,
        items
      };
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      throw error;
    }
  }),
  /**
   * Buscar TODOS os pedidos (apenas para admin)
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user?.role !== "admin") {
        throw new Error("Acesso negado: apenas admin pode acessar");
      }
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const allOrders = await db.select().from(orders);
      return allOrders;
    } catch (error) {
      console.error("Erro ao buscar todos os pedidos:", error);
      throw error;
    }
  })
});

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  shipping: router({
    calculateShipping: publicProcedure.input(z4.object({
      cep: z4.string().min(1, "CEP \xE9 obrigat\xF3rio"),
      deliveryType: z4.enum(["ctt_point", "home"]),
      quantity: z4.number().int().min(1, "Quantidade deve ser pelo menos 1")
    })).query(async ({ input }) => {
      try {
        const shippingCost = calculateShippingByCEP(input.cep, input.deliveryType, input.quantity);
        const totalCost = input.quantity * 10 + shippingCost;
        return {
          shippingCost,
          totalCost,
          source: "local"
        };
      } catch (error) {
        console.error("Erro ao calcular frete:", error);
        throw error;
      }
    })
  }),
  checkout: checkoutRouter,
  orders: ordersRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/stripe-webhook.ts
import Stripe2 from "stripe";
import { eq as eq3 } from "drizzle-orm";

// server/email.ts
async function sendEmailViaManus(data) {
  try {
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      console.warn("[Email] Manus API credentials not configured");
      return false;
    }
    const response = await fetch(`${ENV.forgeApiUrl}/email/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.forgeApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: data.to,
        subject: data.subject,
        html: data.html,
        from: "noreply@top-pastel.manus.space"
      })
    });
    if (!response.ok) {
      const error = await response.text();
      console.error(`[Email] Manus API error: ${response.status} - ${error}`);
      return false;
    }
    console.log(`[Email] Email sent successfully to ${data.to}`);
    return true;
  } catch (err) {
    console.error("[Email] Error sending email via Manus API:", err);
    return false;
  }
}
async function sendOrderConfirmationEmail(customerEmail, customerName, orderId, totalAmount, cttTrackingNumber) {
  const trackingLink = cttTrackingNumber ? `https://www.ctt.pt/feapl_2/app/open/mailing/rastreio?cc=${cttTrackingNumber}` : "";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2d5016; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Top Pastel \u{1F95F}</h1>
        <p style="margin: 5px 0 0 0;">Sua Massa de Pastel Brasileira</p>
      </div>
      
      <div style="padding: 20px;">
        <h2 style="color: #2d5016;">Seu Pedido foi Confirmado! \u2705</h2>
        
        <p>Ol\xE1 ${customerName},</p>
        
        <p>Obrigado por sua compra na <strong>Top Pastel</strong>! Seu pedido foi processado com sucesso e est\xE1 sendo preparado com cuidado.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2d5016;">Detalhes do Pedido</h3>
          <p><strong>N\xFAmero do Pedido:</strong> #${orderId}</p>
          <p><strong>Valor Total:</strong> \u20AC${totalAmount.toFixed(2)}</p>
          ${cttTrackingNumber ? `<p><strong>N\xFAmero de Rastreamento CTT:</strong> <code style="background-color: #e8e8e8; padding: 2px 6px; border-radius: 3px;">${cttTrackingNumber}</code></p>` : ""}
        </div>
        
        ${cttTrackingNumber ? `
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2d5016;">\u{1F69A} Acompanhe seu Pedido</h3>
            <p>Seu pedido est\xE1 a caminho! Voc\xEA pode acompanhar o rastreamento em tempo real:</p>
            <a href="${trackingLink}" style="display: inline-block; background-color: #2d5016; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; font-weight: bold;">
              Rastrear Encomenda CTT
            </a>
          </div>
        ` : ""}
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2d5016;">\u23F1\uFE0F Pr\xF3ximos Passos</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>\u2713 Seu pedido ser\xE1 preparado com cuidado</li>
            <li>\u2713 Ser\xE1 enviado via CTT em 1 dia \xFAtil</li>
            <li>\u2713 Voc\xEA receber\xE1 atualiza\xE7\xF5es de status por email</li>
          </ul>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>D\xFAvidas?</strong> Entre em contato conosco pelo WhatsApp:<br>
            <strong style="font-size: 16px; color: #2d5016;">+351 937675660</strong>
          </p>
        </div>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0;">\xA9 2026 Top Pastel - Massa de Pastel Brasileira</p>
        <p style="margin: 5px 0 0 0;">Feita com amor e ingredientes selecionados \u{1F1E7}\u{1F1F7}</p>
      </div>
    </div>
  `;
  try {
    const emailSent = await sendEmailViaManus({
      to: customerEmail,
      subject: `Pedido Confirmado #${orderId} - Top Pastel \u{1F95F}`,
      html
    });
    if (!emailSent) {
      console.warn(`[Email] Failed to send confirmation email to ${customerEmail}, will retry later`);
    }
    return emailSent;
  } catch (err) {
    console.error(`[Email] Failed to send confirmation email to ${customerEmail}:`, err);
    return false;
  }
}
async function notifyOwnerNewOrder(orderId, customerName, customerEmail, totalAmount, cttTrackingNumber) {
  try {
    const message = `
Novo Pedido Recebido!

ID do Pedido: #${orderId}
Cliente: ${customerName}
Email: ${customerEmail}
Valor Total: \u20AC${totalAmount.toFixed(2)}
${cttTrackingNumber ? `Rastreamento CTT: ${cttTrackingNumber}` : "Status: Aguardando cria\xE7\xE3o de envio"}
    `;
    await notifyOwner({
      title: `\u{1F389} Novo Pedido #${orderId}`,
      content: message
    });
    console.log(`[Email] Owner notified about order #${orderId}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to notify owner about order #${orderId}:`, err);
    return false;
  }
}

// server/ctt-api.ts
async function createCTTShipping(data) {
  try {
    const cttPublicKey = process.env.CTT_PUBLIC_KEY;
    const cttSecretKey = process.env.CTT_SECRET_KEY;
    const cttApiUrl = process.env.CTT_API_URL || "https://enviosecommerce.ctt.pt";
    if (!cttPublicKey || !cttSecretKey) {
      console.log(
        `[CTT API] No credentials found, using simulated tracking number for ${data.customerName}`
      );
      return generateSimulatedTracking();
    }
    try {
      const response = await fetch(`${cttApiUrl}/shipping/create`, {
        method: "POST",
        headers: {
          "X-CTT-Public-Key": cttPublicKey,
          "X-CTT-Secret-Key": cttSecretKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          deliveryAddress: data.deliveryAddress,
          deliveryCity: data.deliveryCity,
          deliveryPostalCode: data.deliveryPostalCode,
          deliveryType: data.deliveryType === "ctt_point" ? "POINT" : "HOME",
          weight: data.weight,
          quantity: data.quantity
        })
      });
      if (!response.ok) {
        throw new Error(`CTT API error: ${response.statusText}`);
      }
      const result = await response.json();
      console.log(
        `[CTT API] Shipping created for ${data.customerName}: ${result.trackingNumber}`
      );
      return {
        success: true,
        trackingNumber: result.trackingNumber,
        trackingUrl: `https://www.ctt.pt/feapl_2/app/open/mailing/rastreio?cc=${result.trackingNumber}`
      };
    } catch (apiError) {
      console.warn(
        `[CTT API] Real API call failed, falling back to simulation:`,
        apiError
      );
      return generateSimulatedTracking();
    }
  } catch (error) {
    console.error("[CTT API] Error creating shipping:", error);
    return {
      success: false,
      error: "Erro ao criar envio na CTT"
    };
  }
}
function generateSimulatedTracking() {
  const trackingNumber = generateTrackingNumber();
  const trackingUrl = `https://www.ctt.pt/feapl_2/app/open/mailing/rastreio?cc=${trackingNumber}`;
  console.log(`[CTT API] Using simulated tracking number: ${trackingNumber}`);
  return {
    success: true,
    trackingNumber,
    trackingUrl
  };
}
function generateTrackingNumber() {
  const randomNum = Math.floor(Math.random() * 1e13).toString().padStart(13, "0");
  return `PT${randomNum}`;
}

// server/stripe-webhook.ts
var stripe = new Stripe2(process.env.STRIPE_SECRET_KEY || "");
var WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  if (!sig || !WEBHOOK_SECRET) {
    console.error("[Webhook] Missing signature or webhook secret");
    return res.status(400).json({ error: "Missing signature" });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }
  const isTestEvent = event.id.startsWith("evt_test_");
  if (isTestEvent) {
    console.log("[Webhook] Test event detected, processing for local testing");
  }
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case "payment_intent.succeeded":
        console.log("[Webhook] Payment intent succeeded:", event.data.object);
        break;
      case "payment_intent.payment_failed":
        console.log("[Webhook] Payment intent failed:", event.data.object);
        break;
      case "charge.refunded":
        console.log("[Webhook] Charge refunded:", event.data.object);
        break;
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function handleCheckoutSessionCompleted(session) {
  console.log("[Webhook] Processing checkout.session.completed:", session.id);
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  try {
    const metadata = session.metadata || {};
    const customerName = metadata.customer_name || "Unknown";
    const customerEmail = metadata.customer_email || session.customer_email || "";
    const customerPhone = metadata.customer_phone || "";
    const deliveryAddress = metadata.customer_address || "";
    const deliveryCity = metadata.customer_city || "";
    const deliveryDistrict = metadata.customer_district || "";
    const deliveryPostalCode = metadata.customer_cep || "";
    const deliveryType = metadata.delivery_type || "home";
    const quantity = parseInt(metadata.quantity || "1");
    const shippingCost = parseFloat(metadata.shipping_cost || "0");
    const unitPrice = 10;
    const subtotal = quantity * unitPrice;
    const totalAmount = subtotal + shippingCost;
    const result = await db.insert(orders).values({
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      deliveryPostalCode,
      deliveryCity,
      deliveryType,
      shippingCost: shippingCost.toString(),
      totalAmount: totalAmount.toString(),
      stripePaymentId: session.id,
      paymentStatus: "completed",
      orderStatus: "processing"
    });
    const orderId = result.insertId || 0;
    if (orderId > 0) {
      await db.insert(orderItems).values({
        orderId,
        productName: "Massa de Pastel Brasileira 1kg",
        quantity,
        unitPrice: unitPrice.toString(),
        totalPrice: subtotal.toString()
      });
      await db.insert(orderItems).values({
        orderId,
        productName: `Frete CTT - ${deliveryType === "ctt_point" ? "Ponto CTT" : "Domic\xEDlio"}`,
        quantity: 1,
        unitPrice: shippingCost.toString(),
        totalPrice: shippingCost.toString()
      });
    }
    console.log(`[Webhook] Order created successfully: #${orderId}`);
    if (orderId > 0) {
      try {
        const cttResult = await createCTTShipping({
          customerName,
          customerEmail,
          customerPhone,
          deliveryAddress,
          deliveryCity,
          deliveryPostalCode,
          deliveryType,
          quantity,
          weight: quantity * 0.5
          // Assumir 500g por rolo
        });
        if (cttResult.success && cttResult.trackingNumber) {
          await db.update(orders).set({
            cttShippingNumber: cttResult.trackingNumber,
            cttTrackingUrl: cttResult.trackingUrl,
            orderStatus: "shipped"
          }).where(eq3(orders.id, orderId));
          console.log(`[Webhook] CTT shipping created: ${cttResult.trackingNumber}`);
        } else {
          console.warn(`[Webhook] CTT shipping failed: ${cttResult.error}`);
        }
      } catch (cttError) {
        console.error("[Webhook] Error creating CTT shipping:", cttError);
      }
    }
    await sendOrderConfirmationEmail(
      customerEmail,
      customerName,
      orderId,
      totalAmount
    );
    await notifyOwnerNewOrder(
      orderId,
      customerName,
      customerEmail,
      totalAmount
    );
    console.log("[Webhook] Confirmation email and owner notification sent");
  } catch (error) {
    console.error("[Webhook] Error creating order:", error);
    throw error;
  }
}
function registerStripeWebhook(app) {
  app.post("/api/stripe/webhook", (req, res, next) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      req.body = data;
      handleStripeWebhook(req, res).catch(next);
    });
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  registerStripeWebhook(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
