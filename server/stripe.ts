import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Obter instância do Stripe
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.CUSTOM_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY ou CUSTOM_STRIPE_SECRET_KEY não configurada");
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

/**
 * Criar uma sessão de checkout do Stripe
 */
export async function createCheckoutSession({
  orderId,
  customerEmail,
  customerName,
  items,
  totalAmount,
  successUrl,
  cancelUrl,
}: {
  orderId: number;
  customerEmail: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeClient();

  const lineItems = items.map(item => ({
    price_data: {
      currency: "eur",
      product_data: {
        name: item.name,
      },
      unit_amount: Math.round(item.price * 100), // Converter para centavos
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: customerEmail,
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      orderId: String(orderId),
      customerName,
    },
  });

  return session;
}

/**
 * Recuperar sessão de checkout
 */
export async function getCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();
  return await stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Criar webhook para processar eventos do Stripe
 */
export async function processWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        type: "payment_completed",
        orderId: session.metadata?.orderId,
        paymentId: session.payment_intent,
      };

    case "charge.refunded":
      const charge = event.data.object as Stripe.Charge;
      return {
        type: "payment_refunded",
        paymentId: charge.id,
      };

    default:
      return null;
  }
}

/**
 * Criar um Payment Intent
 */
export async function createPaymentIntent({
  amount,
  currency = "eur",
  metadata = {},
}: {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripeClient();

  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Converter para centavos
    currency,
    metadata,
  });
}
