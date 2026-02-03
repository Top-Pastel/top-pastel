import { Express, Request, Response } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { orders, orderItems } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { sendOrderConfirmationEmail, notifyOwnerNewOrder } from "./email";
import { createCTTShipping } from "./ctt-api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig || !WEBHOOK_SECRET) {
    console.error("[Webhook] Missing signature or webhook secret");
    return res.status(400).json({ error: "Missing signature" });
  }

  let event: Stripe.Event;

  try {
    event = (stripe as any).webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  // ⚠️ CRITICAL: Handle test events - still process them for local testing
  const isTestEvent = event.id.startsWith("evt_test_");
  if (isTestEvent) {
    console.log("[Webhook] Test event detected, processing for local testing");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
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

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("[Webhook] Processing checkout.session.completed:", session.id);

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Extrair dados do metadata
    const metadata = session.metadata || {};
    const customerName = metadata.customer_name || "Unknown";
    const customerEmail = metadata.customer_email || session.customer_email || "";
    const customerPhone = metadata.customer_phone || "";
    const deliveryAddress = metadata.customer_address || "";
    const deliveryCity = metadata.customer_city || "";
    const deliveryDistrict = metadata.customer_district || "";
    const deliveryPostalCode = metadata.customer_cep || "";
    const deliveryType = (metadata.delivery_type || "home") as "ctt_point" | "home";
    const quantity = parseInt(metadata.quantity || "1");
    const shippingCost = parseFloat(metadata.shipping_cost || "0");

    // Calcular subtotal (quantidade * 10€ por rolo)
    const unitPrice = 10.00;
    const subtotal = quantity * unitPrice;
    const totalAmount = subtotal + shippingCost;

    // Criar pedido no banco de dados
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
      orderStatus: "processing",
    });

    const orderId = (result as any).insertId || 0;

    // Criar itens do pedido
    if (orderId > 0) {
      await db.insert(orderItems).values({
        orderId,
        productName: "Massa de Pastel Brasileira 1kg",
        quantity,
        unitPrice: unitPrice.toString(),
        totalPrice: subtotal.toString(),
      });

      // Adicionar item de frete
      await db.insert(orderItems).values({
        orderId,
        productName: `Frete CTT - ${deliveryType === "ctt_point" ? "Ponto CTT" : "Domicílio"}`,
        quantity: 1,
        unitPrice: shippingCost.toString(),
        totalPrice: shippingCost.toString(),
      });
    }

    console.log(`[Webhook] Order created successfully: #${orderId}`);

    // Criar envio na CTT
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
          weight: quantity * 0.5, // Assumir 500g por rolo
        });

        if (cttResult.success && cttResult.trackingNumber) {
          // Atualizar pedido com número de rastreamento
          await db.update(orders).set({
            cttShippingNumber: cttResult.trackingNumber,
            cttTrackingUrl: cttResult.trackingUrl,
            orderStatus: "shipped",
          }).where(eq(orders.id, orderId));

          console.log(`[Webhook] CTT shipping created: ${cttResult.trackingNumber}`);
        } else {
          console.warn(`[Webhook] CTT shipping failed: ${cttResult.error}`);
        }
      } catch (cttError) {
        console.error("[Webhook] Error creating CTT shipping:", cttError);
      }
    }

    // Enviar email de confirmação ao cliente
    await sendOrderConfirmationEmail(
      customerEmail,
      customerName,
      orderId,
      totalAmount
    );

    // Notificar proprietário
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

export function registerStripeWebhook(app: Express) {
  // ⚠️ IMPORTANT: Register BEFORE express.json() middleware
  app.post("/api/stripe/webhook", (req, res, next) => {
    // For webhook, we need raw body, not parsed JSON
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
