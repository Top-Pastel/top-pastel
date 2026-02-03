import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getStripeClient } from "../stripe";
import { getProductLineItems } from "../products";
import { calculateShippingByCEP } from "../shippingRates";
import { createOrder } from "../db";
import { type InsertOrderItem } from "../../drizzle/schema";

export const checkoutRouter = router({
  /**
   * Criar uma sessão de checkout com produtos reais do Stripe
   */
  createSession: publicProcedure
    .input(
      z.object({
        customerName: z.string().min(1, "Nome é obrigatório"),
        customerEmail: z.string().email("Email inválido"),
        customerPhone: z.string().min(1, "Telefone é obrigatório"),
        deliveryAddress: z.string().min(1, "Endereço é obrigatório"),
        deliveryPostalCode: z.string().min(1, "CEP é obrigatório"),
        deliveryCity: z.string().min(1, "Cidade é obrigatória"),
        deliveryDistrict: z.string().min(1, "Distrito é obrigatório"),
        deliveryType: z.enum(["ctt_point", "home"]),
        quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
        shippingCost: z.number().min(0, "Frete deve ser um valor válido"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Usar o shippingCost enviado do frontend
        let shippingCost = Number(input.shippingCost);
        console.log('[Checkout] Received shipping cost from frontend:', shippingCost, 'Type:', typeof shippingCost);
        
        // Validar frete
        if (isNaN(shippingCost) || !isFinite(shippingCost) || shippingCost <= 0) {
          console.warn('[Checkout] Shipping cost is invalid, using default: 5.58');
          shippingCost = 5.58;
        }

        // Obter itens de produto usando Price IDs do Stripe
        const lineItems = getProductLineItems(input.quantity, shippingCost);

        // Criar sessão de checkout
        const stripeClient = getStripeClient();
        const origin = ctx.req.headers.origin || process.env.VITE_APP_URL || "https://top-pastel.manus.space";
        const session = await stripeClient.checkout.sessions.create({
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
            shipping_cost: shippingCost.toString(),
          },
        });

        // Criar pedido com itens
        // Isso garante que a página de sucesso consiga recuperar os dados
        try {
          console.log('[Checkout] Criando itens do pedido com shippingCost:', shippingCost, 'Type:', typeof shippingCost);
          
          const unitPrice = Number(shippingCost);
          if (isNaN(unitPrice) || !isFinite(unitPrice)) {
            throw new Error('Invalid shipping cost');
          }
          
          // Garantir que os preços são números válidos
          const productUnitPrice = Number(10.00);
          const productTotalPrice = Number(10.00 * input.quantity);
          const shippingUnitPrice = Number(unitPrice);
          const shippingTotalPrice = Number(unitPrice);
          
          // Validar todos os preços
          if (isNaN(productUnitPrice) || isNaN(productTotalPrice) || isNaN(shippingUnitPrice) || isNaN(shippingTotalPrice)) {
            throw new Error('Invalid price calculation');
          }
          
          const orderItems = [
            {
              productName: "Massa de Pastel Brasileira 1kg",
              quantity: input.quantity,
              unitPrice: productUnitPrice,
              totalPrice: productTotalPrice,
            },
            {
              productName: "Frete CTT - " + (input.deliveryType === "home" ? "Domicílio" : "Ponto CTT"),
              quantity: 1,
              unitPrice: shippingUnitPrice,
              totalPrice: shippingTotalPrice,
            },
          ] as any;
          
          console.log('[Checkout] Order items:', JSON.stringify(orderItems));

          const totalAmount = 10.00 * input.quantity + shippingCost;
          console.log('[Checkout] Total amount:', totalAmount, 'Type:', typeof totalAmount);
          
          const orderId = await createOrder(
            {
              customerName: input.customerName,
              customerEmail: input.customerEmail,
              customerPhone: input.customerPhone,
              deliveryAddress: input.deliveryAddress,
              deliveryPostalCode: input.deliveryPostalCode,
              deliveryCity: input.deliveryCity,
              deliveryType: input.deliveryType,
              shippingCost: shippingCost as any,
              totalAmount: totalAmount as any,
              stripePaymentId: session.id,
              paymentStatus: "pending",
              orderStatus: "pending",
            },
            orderItems as any
          );
          console.log(`[Checkout] Pedido criado com sucesso: ${orderId}`);
        } catch (dbError) {
          console.error("[Checkout] Erro ao criar pedido:", dbError);
        }

        return {
          checkoutUrl: session.url,
          sessionId: session.id,
        };
      } catch (error) {
        console.error("Erro ao criar sessão de checkout:", error);
        throw error;
      }
    }),
});
