import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { orders, orderItems } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const ordersRouter = router({
  /**
   * Buscar pedido por session_id do Stripe
   */
  getBySessionId: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        console.log("[getBySessionId] Buscando pedido com sessionId:", input.sessionId);

        // Buscar pedido pelo stripePaymentId
        const order = await db
          .select()
          .from(orders)
          .where(eq(orders.stripePaymentId, input.sessionId))
          .limit(1);

        console.log("[getBySessionId] Resultado da query:", order);

        if (!order || order.length === 0) {
          return null;
        }

        const orderData = order[0];

        // Buscar itens do pedido
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderData.id));

        return {
          ...orderData,
          items,
        };
      } catch (error) {
        console.error("Erro ao buscar pedido:", error);
        throw error;
      }
    }),

  /**
   * Listar todos os pedidos do usuário (para página /pedidos)
   */
  list: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        limit: z.number().int().min(1).max(100).default(10),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Buscar pedidos por email
        const userOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.customerEmail, input.email))
          .limit(input.limit)
          .offset(input.offset);

        // Buscar itens para cada pedido
        const ordersWithItems = await Promise.all(
          userOrders.map(async (order: any) => {
            const items = await db
              .select()
              .from(orderItems)
              .where(eq(orderItems.orderId, order.id));

            return {
              ...order,
              items,
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
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const order = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.id))
          .limit(1);

        if (!order || order.length === 0) {
          return null;
        }

        const orderData = order[0];

        // Buscar itens do pedido
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderData.id));

        return {
          ...orderData,
          items,
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
      // Verificar se eh admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Acesso negado: apenas admin pode acessar");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar todos os pedidos
      const allOrders = await db.select().from(orders);

      return allOrders;
    } catch (error) {
      console.error("Erro ao buscar todos os pedidos:", error);
      throw error;
    }
  }),
});
