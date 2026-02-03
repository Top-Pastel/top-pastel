import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, orders, orderItems, shipmentTracking, type InsertOrder, type InsertOrderItem, type InsertShipmentTracking } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
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

export async function upsertUser(user: Partial<InsertUser> & { openId: string }): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Tentar atualizar primeiro
    const existing = await db.select().from(users).where(eq(users.openId, user.openId));
    
    if (existing.length > 0) {
      // Usuario ja existe, atualizar
      const updateData: any = {};
      if (user.name !== null && user.name !== undefined) updateData.name = user.name;
      if (user.email !== null && user.email !== undefined) updateData.email = user.email;
      if (user.loginMethod !== null && user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
      if (user.lastSignedIn) updateData.lastSignedIn = user.lastSignedIn;
      
      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.openId, user.openId));
      }
    } else {
      // Novo usuario, inserir
      await db.insert(users).values(user);
    }
  } catch (error) {
    console.error("[Database] Error upserting user:", error);
    throw error;
  }
}

/**
 * Obter usuario pelo openId
 */
export async function getUserByOpenId(openId: string): Promise<Partial<InsertUser> | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.openId, openId));
  return result.length > 0 ? result[0] : null;
}

/**
 * Criar novo pedido com itens
 */
export async function createOrder(
  orderData: InsertOrder,
  items: InsertOrderItem[]
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validar dados do pedido
  const validatedOrderData = {
    ...orderData,
    shippingCost: Number(orderData.shippingCost) || 5.58,
    totalAmount: Number(orderData.totalAmount) || 15.58,
  };

  // Validar que nao ha NaN
  if (isNaN(Number(validatedOrderData.shippingCost)) || isNaN(Number(validatedOrderData.totalAmount))) {
    throw new Error('Invalid order data: NaN values detected');
  }

  const result = await db.insert(orders).values(validatedOrderData as any);
  
  // Extrair o ID do pedido corretamente do Drizzle
  let orderId: number = 0;
  
  console.log('[DB] Insert result type:', typeof result, 'Keys:', Object.keys(result || {}));
  
  if (result && typeof result === 'object') {
    // Tentar diferentes formas de acessar o ID
    if ('insertId' in result && result.insertId) {
      orderId = Number((result as any).insertId);
      console.log('[DB] Got insertId:', orderId);
    } else if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object' && 'id' in result[0]) {
      orderId = (result[0] as any).id;
      console.log('[DB] Got id from array:', orderId);
    }
  }

  // Se nao conseguir extrair o ID, fazer uma query para obter o ultimo ID inserido
  if (isNaN(orderId) || orderId <= 0) {
    console.warn('[DB] Could not extract order ID from result, querying database');
    const lastOrder = await db.select().from(orders).orderBy(desc(orders.id)).limit(1);
    if (lastOrder.length > 0) {
      orderId = lastOrder[0].id;
      console.log('[DB] Got order ID from query:', orderId);
    } else {
      throw new Error('Failed to create order: could not retrieve order ID');
    }
  }

  console.log('[DB] Order created with ID:', orderId);

  // Adicionar items do pedido
  if (items.length > 0) {
    const itemsWithOrderId = items.map(item => {
      // Validar precos dos itens
      const unitPrice = Number(item.unitPrice) || 0;
      const totalPrice = Number(item.totalPrice) || 0;
      
      if (isNaN(unitPrice) || isNaN(totalPrice)) {
        throw new Error(`Invalid item data: NaN values detected for ${item.productName}`);
      }
      
      return {
        ...item,
        orderId: Number(orderId),
        unitPrice: Number(unitPrice),
        totalPrice: Number(totalPrice),
      };
    });
    // Validar todos os itens antes de inserir
    const validatedItems = itemsWithOrderId.map(item => ({
      ...item,
      orderId: Number(item.orderId),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    }));
    
    console.log('[DB] Inserting items:', JSON.stringify(validatedItems));
    await db.insert(orderItems).values(validatedItems as any);
  }

  return orderId;
}

/**
 * Obter pedido com seus itens
 */
export async function getOrderWithItems(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const order = await db.select().from(orders).where(eq(orders.id, orderId));
  if (order.length === 0) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  return {
    ...order[0],
    items,
  };
}

/**
 * Atualizar status do pedido
 */
export async function updateOrderStatus(orderId: number, orderStatus: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders).set({ orderStatus: orderStatus as any }).where(eq(orders.id, orderId));
}

/**
 * Criar rastreamento de envio
 */
export async function createShipmentTracking(
  data: InsertShipmentTracking
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(shipmentTracking).values(data);
}

/**
 * Obter rastreamento de envio
 */
export async function getShipmentTracking(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const tracking = await db
    .select()
    .from(shipmentTracking)
    .where(eq(shipmentTracking.orderId, orderId));

  return tracking.length > 0 ? tracking[0] : null;
}
