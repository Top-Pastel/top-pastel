import { Router } from "express";
import Stripe from "stripe";
import { updateOrderStatus } from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const router = Router();

// Webhook para processar eventos do Stripe
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Detectar eventos de teste
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("[Stripe Webhook] Checkout session completed:", session.id);

  const clientReferenceId = session.client_reference_id;
  if (!clientReferenceId) {
    console.error("[Stripe Webhook] No client_reference_id found");
    return;
  }

  try {
    // Atualizar status do pedido para "processing"
    await updateOrderStatus(
      parseInt(clientReferenceId),
      "processing"
    );

    console.log("[Stripe Webhook] Order payment marked as completed:", clientReferenceId);

    // TODO: Aqui você pode adicionar lógica para:
    // 1. Criar envio automático no CTT
    // 2. Enviar email com rastreamento
    // 3. Notificar o proprietário
  } catch (err) {
    console.error("[Stripe Webhook] Error updating order:", err);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("[Stripe Webhook] Payment intent succeeded:", paymentIntent.id);
  // Lógica adicional se necessário
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("[Stripe Webhook] Payment intent failed:", paymentIntent.id);
  // Lógica para lidar com falha de pagamento
  const clientReferenceId = paymentIntent.metadata?.client_reference_id;
  if (clientReferenceId) {
    try {
      await updateOrderStatus(parseInt(clientReferenceId), "cancelled");
      console.log("[Stripe Webhook] Order marked as cancelled:", clientReferenceId);
    } catch (err) {
      console.error("[Stripe Webhook] Error updating failed order:", err);
    }
  }
}

export default router;
