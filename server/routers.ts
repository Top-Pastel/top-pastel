import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { calculateShippingByCEP } from "./shippingRates";
import { calculateShippingWithCTT } from "./cttShippingCalculator";
import { checkoutRouter } from "./routers/checkout";
import { ordersRouter } from "./routers/orders";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  shipping: router({
    calculateShipping: publicProcedure
      .input(z.object({
        cep: z.string().min(1, "CEP é obrigatório"),
        deliveryType: z.enum(['ctt_point', 'home']),
        quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
      }))
      .query(async ({ input }) => {
        try {
          // Usar cálculo local como fallback rápido
          const shippingCost = calculateShippingByCEP(input.cep, input.deliveryType as any, input.quantity);
          const totalCost = (input.quantity * 10) + shippingCost;
          
          return {
            shippingCost,
            totalCost,
            source: 'local',
          };
        } catch (error) {
          console.error('Erro ao calcular frete:', error);
          throw error;
        }
      }),
  }),

  checkout: checkoutRouter,
  orders: ordersRouter,
});

export type AppRouter = typeof appRouter;
