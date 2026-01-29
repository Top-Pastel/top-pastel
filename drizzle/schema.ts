import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Pedidos - Armazena informações dos pedidos
 */
export const orders = mysqlTable("orders", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Itens do pedido
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Rastreamento de envios
 */
export const shipmentTracking = mysqlTable("shipmentTracking", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  cttShippingNumber: varchar("cttShippingNumber", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  lastUpdate: timestamp("lastUpdate").defaultNow().notNull(),
  trackingData: json("trackingData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShipmentTracking = typeof shipmentTracking.$inferSelect;
export type InsertShipmentTracking = typeof shipmentTracking.$inferInsert;
