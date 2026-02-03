/**
 * Serviço de Email para notificações automáticas
 * Usa a API de email do Manus para enviar emails reais aos clientes
 */

import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

/**
 * Enviar email via API do Manus
 */
async function sendEmailViaManus(data: EmailData): Promise<boolean> {
  try {
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      console.warn("[Email] Manus API credentials not configured");
      return false;
    }

    const response = await fetch(`${ENV.forgeApiUrl}/email/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.forgeApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: data.to,
        subject: data.subject,
        html: data.html,
        from: "noreply@top-pastel.manus.space",
      }),
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

/**
 * Enviar email de confirmação de pedido com rastreamento
 */
export async function sendOrderConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  totalAmount: number,
  cttTrackingNumber?: string
) {
  const trackingLink = cttTrackingNumber
    ? `https://www.ctt.pt/feapl_2/app/open/mailing/rastreio?cc=${cttTrackingNumber}`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2d5016; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Top Pastel 🥟</h1>
        <p style="margin: 5px 0 0 0;">Sua Massa de Pastel Brasileira</p>
      </div>
      
      <div style="padding: 20px;">
        <h2 style="color: #2d5016;">Seu Pedido foi Confirmado! ✅</h2>
        
        <p>Olá ${customerName},</p>
        
        <p>Obrigado por sua compra na <strong>Top Pastel</strong>! Seu pedido foi processado com sucesso e está sendo preparado com cuidado.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2d5016;">Detalhes do Pedido</h3>
          <p><strong>Número do Pedido:</strong> #${orderId}</p>
          <p><strong>Valor Total:</strong> €${totalAmount.toFixed(2)}</p>
          ${cttTrackingNumber ? `<p><strong>Número de Rastreamento CTT:</strong> <code style="background-color: #e8e8e8; padding: 2px 6px; border-radius: 3px;">${cttTrackingNumber}</code></p>` : ""}
        </div>
        
        ${cttTrackingNumber ? `
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2d5016;">🚚 Acompanhe seu Pedido</h3>
            <p>Seu pedido está a caminho! Você pode acompanhar o rastreamento em tempo real:</p>
            <a href="${trackingLink}" style="display: inline-block; background-color: #2d5016; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; font-weight: bold;">
              Rastrear Encomenda CTT
            </a>
          </div>
        ` : ""}
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2d5016;">⏱️ Próximos Passos</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>✓ Seu pedido será preparado com cuidado</li>
            <li>✓ Será enviado via CTT em 1 dia útil</li>
            <li>✓ Você receberá atualizações de status por email</li>
          </ul>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>Dúvidas?</strong> Entre em contato conosco pelo WhatsApp:<br>
            <strong style="font-size: 16px; color: #2d5016;">+351 937675660</strong>
          </p>
        </div>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0;">© 2026 Top Pastel - Massa de Pastel Brasileira</p>
        <p style="margin: 5px 0 0 0;">Feita com amor e ingredientes selecionados 🇧🇷</p>
      </div>
    </div>
  `;

  try {
    // Enviar email real ao cliente
    const emailSent = await sendEmailViaManus({
      to: customerEmail,
      subject: `Pedido Confirmado #${orderId} - Top Pastel 🥟`,
      html,
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

/**
 * Notificar proprietário sobre novo pedido
 */
export async function notifyOwnerNewOrder(
  orderId: number,
  customerName: string,
  customerEmail: string,
  totalAmount: number,
  cttTrackingNumber?: string
) {
  try {
    const message = `
Novo Pedido Recebido!

ID do Pedido: #${orderId}
Cliente: ${customerName}
Email: ${customerEmail}
Valor Total: €${totalAmount.toFixed(2)}
${cttTrackingNumber ? `Rastreamento CTT: ${cttTrackingNumber}` : "Status: Aguardando criação de envio"}
    `;

    await notifyOwner({
      title: `🎉 Novo Pedido #${orderId}`,
      content: message,
    });

    console.log(`[Email] Owner notified about order #${orderId}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to notify owner about order #${orderId}:`, err);
    return false;
  }
}

/**
 * Notificar sobre mudança de status de envio
 */
export async function notifyShippingStatusChange(
  customerEmail: string,
  customerName: string,
  orderId: number,
  status: string,
  cttTrackingNumber: string
) {
  const trackingLink = `https://www.ctt.pt/feapl_2/app/open/mailing/rastreio?cc=${cttTrackingNumber}`;

  const statusMessages: Record<string, string> = {
    pending: "Seu pedido está sendo preparado",
    processing: "Seu pedido está sendo processado",
    shipped: "Seu pedido foi enviado!",
    delivered: "Seu pedido foi entregue!",
    cancelled: "Seu pedido foi cancelado",
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2d5016; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Top Pastel 🥟</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2 style="color: #2d5016;">Atualização de Status do Pedido</h2>
        
        <p>Olá ${customerName},</p>
        
        <p>${statusMessages[status] || "Seu pedido foi atualizado"}</p>
        
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Número do Pedido:</strong> #${orderId}</p>
          <p><strong>Status:</strong> ${status.toUpperCase()}</p>
          <p><strong>Rastreamento:</strong> <code style="background-color: #e8e8e8; padding: 2px 6px; border-radius: 3px;">${cttTrackingNumber}</code></p>
          <a href="${trackingLink}" style="display: inline-block; background-color: #2d5016; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; font-weight: bold;">
            Ver Detalhes do Rastreamento
          </a>
        </div>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0;">© 2026 Top Pastel - Massa de Pastel Brasileira</p>
      </div>
    </div>
  `;

  try {
    await sendEmailViaManus({
      to: customerEmail,
      subject: `Atualização de Pedido #${orderId} - Top Pastel 🥟`,
      html,
    });

    console.log(`[Email] Status update email sent to ${customerEmail}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send status update email to ${customerEmail}:`, err);
    return false;
  }
}
