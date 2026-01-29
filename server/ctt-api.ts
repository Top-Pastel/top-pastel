/**
 * Integração com API CTT para criar envios e gerar números de rastreamento
 * 
 * Suporta tanto integração real quanto simulação como fallback
 */

export interface CTTShippingData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPostalCode: string;
  deliveryType: "ctt_point" | "home";
  quantity: number;
  weight: number; // em kg
}

export interface CTTShippingResponse {
  success: boolean;
  trackingNumber?: string;
  trackingUrl?: string;
  error?: string;
}

/**
 * Criar envio na API CTT (com fallback para simulação)
 * Se as credenciais não estiverem configuradas, usa simulação
 */
export async function createCTTShipping(
  data: CTTShippingData
): Promise<CTTShippingResponse> {
  try {
    const cttPublicKey = process.env.CTT_PUBLIC_KEY;
    const cttSecretKey = process.env.CTT_SECRET_KEY;
    const cttApiUrl = process.env.CTT_API_URL || "https://enviosecommerce.ctt.pt";

    // Se não houver credenciais, usar simulação
    if (!cttPublicKey || !cttSecretKey) {
      console.log(
        `[CTT API] No credentials found, using simulated tracking number for ${data.customerName}`
      );
      return generateSimulatedTracking();
    }

    // Tentar integração real com API CTT
    try {
      const response = await fetch(`${cttApiUrl}/shipping/create`, {
        method: "POST",
        headers: {
          "X-CTT-Public-Key": cttPublicKey,
          "X-CTT-Secret-Key": cttSecretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          deliveryAddress: data.deliveryAddress,
          deliveryCity: data.deliveryCity,
          deliveryPostalCode: data.deliveryPostalCode,
          deliveryType: data.deliveryType === "ctt_point" ? "POINT" : "HOME",
          weight: data.weight,
          quantity: data.quantity,
        }),
      });

      if (!response.ok) {
        throw new Error(`CTT API error: ${response.statusText}`);
      }

      const result = await response.json();

      console.log(
        `[CTT API] Shipping created for ${data.customerName}: ${result.trackingNumber}`
      );

      return {
        success: true,
        trackingNumber: result.trackingNumber,
        trackingUrl: `https://www.ctt.pt/feapl_2/app/open/mailing/rastreio?cc=${result.trackingNumber}`,
      };
    } catch (apiError) {
      console.warn(
        `[CTT API] Real API call failed, falling back to simulation:`,
        apiError
      );
      return generateSimulatedTracking();
    }
  } catch (error) {
    console.error("[CTT API] Error creating shipping:", error);
    return {
      success: false,
      error: "Erro ao criar envio na CTT",
    };
  }
}

/**
 * Gerar rastreamento simulado (fallback)
 */
function generateSimulatedTracking(): CTTShippingResponse {
  const trackingNumber = generateTrackingNumber();
  const trackingUrl = `https://www.ctt.pt/feapl_2/app/open/mailing/rastreio?cc=${trackingNumber}`;

  console.log(`[CTT API] Using simulated tracking number: ${trackingNumber}`);

  return {
    success: true,
    trackingNumber,
    trackingUrl,
  };
}

/**
 * Gerar número de rastreamento simulado
 * Formato: PT + 13 dígitos
 */
function generateTrackingNumber(): string {
  const randomNum = Math.floor(Math.random() * 10000000000000)
    .toString()
    .padStart(13, "0");
  return `PT${randomNum}`;
}

/**
 * Rastrear envio
 */
export async function trackCTTShipping(
  trackingNumber: string
): Promise<{
  status: string;
  location?: string;
  lastUpdate?: Date;
}> {
  try {
    const cttPublicKey = process.env.CTT_PUBLIC_KEY;
    const cttSecretKey = process.env.CTT_SECRET_KEY;
    const cttApiUrl = process.env.CTT_API_URL || "https://enviosecommerce.ctt.pt";

    if (!cttPublicKey || !cttSecretKey) {
      // Simulação
      const statuses = [
        "pending",
        "in_transit",
        "out_for_delivery",
        "delivered",
      ];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        status: randomStatus,
        location: "Portugal",
        lastUpdate: new Date(),
      };
    }

    // Integração real
    const response = await fetch(
      `${cttApiUrl}/shipping/track/${trackingNumber}`,
      {
        method: "GET",
        headers: {
          "X-CTT-Public-Key": cttPublicKey,
          "X-CTT-Secret-Key": cttSecretKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CTT API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      status: result.status,
      location: result.location,
      lastUpdate: result.lastUpdate ? new Date(result.lastUpdate) : undefined,
    };
  } catch (error) {
    console.error("[CTT API] Error tracking shipping:", error);
    return {
      status: "unknown",
    };
  }
}

/**
 * Cancelar envio
 */
export async function cancelCTTShipping(
  trackingNumber: string
): Promise<boolean> {
  try {
    const cttPublicKey = process.env.CTT_PUBLIC_KEY;
    const cttSecretKey = process.env.CTT_SECRET_KEY;
    const cttApiUrl = process.env.CTT_API_URL || "https://enviosecommerce.ctt.pt";

    if (!cttPublicKey || !cttSecretKey) {
      // Simulação
      console.log(`[CTT API] Shipping cancelled (simulated): ${trackingNumber}`);
      return true;
    }

    // Integração real
    const response = await fetch(
      `${cttApiUrl}/shipping/cancel/${trackingNumber}`,
      {
        method: "POST",
        headers: {
          "X-CTT-Public-Key": cttPublicKey,
          "X-CTT-Secret-Key": cttSecretKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CTT API error: ${response.statusText}`);
    }

    console.log(`[CTT API] Shipping cancelled: ${trackingNumber}`);
    return true;
  } catch (error) {
    console.error("[CTT API] Error cancelling shipping:", error);
    return false;
  }
}
