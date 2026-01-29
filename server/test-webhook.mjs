/**
 * Script para testar webhook do Stripe localmente
 * Simula um evento checkout.session.completed
 */

import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/stripe/webhook';

// Simular evento do Stripe
const event = {
  id: 'evt_test_' + Date.now(),
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_' + crypto.randomBytes(16).toString('hex'),
      customer_email: 'test@example.com',
      metadata: {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '912345678',
        customer_address: 'Rua Teste, 123',
        customer_city: 'Lisboa',
        customer_district: 'Lisboa',
        customer_cep: '1000-001',
        delivery_type: 'home',
        quantity: '1',
        shipping_cost: '5.58'
      }
    }
  }
};

// Criar assinatura do webhook
const timestamp = Math.floor(Date.now() / 1000);
const body = JSON.stringify(event);
const signedContent = `${timestamp}.${body}`;
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(signedContent)
  .digest('hex');
const stripeSignature = `t=${timestamp},v1=${signature}`;

console.log('📨 Enviando webhook de teste para:', WEBHOOK_URL);
console.log('Event ID:', event.id);
console.log('Signature:', stripeSignature);

// Enviar webhook
fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'stripe-signature': stripeSignature
  },
  body: JSON.stringify(event)
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Webhook enviado com sucesso!');
    console.log('Response:', data);
  })
  .catch(err => {
    console.error('❌ Erro ao enviar webhook:', err.message);
  });
