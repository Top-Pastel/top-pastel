/**
 * Integração com API CTT Envios
 * Documentação: https://developer.ctt.pt/
 */

import axios, { AxiosInstance } from 'axios';

interface CTTConfig {
  publicKey: string;
  secretKey: string;
  apiUrl: string;
}

interface ShippingQuoteRequest {
  originPostalCode: string;
  destinationPostalCode: string;
  weight: number; // em kg
  serviceType?: 'ponto_ctt' | 'domicilio'; // tipo de entrega
}

interface ShippingQuoteResponse {
  price: number;
  estimatedDays: number;
  serviceType: string;
}

export class CTTApiClient {
  private client: AxiosInstance;
  private config: CTTConfig;

  constructor(config: CTTConfig) {
    this.config = config;
    
    // Criar cliente axios com autenticação básica
    this.client = axios.create({
      baseURL: config.apiUrl,
      auth: {
        username: config.publicKey,
        password: config.secretKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Obter cotação de frete da API CTT
   */
  async getShippingQuote(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse> {
    try {
      const response = await this.client.post('/api/shipping/quote', {
        origin_postal_code: request.originPostalCode,
        destination_postal_code: request.destinationPostalCode,
        weight: request.weight,
        service_type: request.serviceType || 'domicilio',
      });

      return {
        price: response.data.price,
        estimatedDays: response.data.estimated_days,
        serviceType: response.data.service_type,
      };
    } catch (error) {
      console.error('Erro ao obter cotação de frete CTT:', error);
      throw new Error('Falha ao calcular frete com CTT');
    }
  }

  /**
   * Criar envio na API CTT
   */
  async createShipment(data: {
    destinationPostalCode: string;
    weight: number;
    serviceType: 'ponto_ctt' | 'domicilio';
    recipientName: string;
    recipientPhone: string;
    recipientEmail: string;
  }) {
    try {
      const response = await this.client.post('/api/shipments', {
        destination_postal_code: data.destinationPostalCode,
        weight: data.weight,
        service_type: data.serviceType,
        recipient_name: data.recipientName,
        recipient_phone: data.recipientPhone,
        recipient_email: data.recipientEmail,
      });

      return {
        shipmentId: response.data.shipment_id,
        trackingNumber: response.data.tracking_number,
        label: response.data.label_url,
      };
    } catch (error) {
      console.error('Erro ao criar envio CTT:', error);
      throw new Error('Falha ao criar envio com CTT');
    }
  }

  /**
   * Rastrear encomenda
   */
  async trackShipment(trackingNumber: string) {
    try {
      const response = await this.client.get(`/api/shipments/${trackingNumber}`);

      return {
        status: response.data.status,
        lastUpdate: response.data.last_update,
        estimatedDelivery: response.data.estimated_delivery,
        events: response.data.events,
      };
    } catch (error) {
      console.error('Erro ao rastrear encomenda:', error);
      throw new Error('Falha ao rastrear encomenda');
    }
  }
}

/**
 * Instância global do cliente CTT
 */
let cttClient: CTTApiClient | null = null;

export function initializeCTTClient(): CTTApiClient {
  if (!cttClient) {
    const publicKey = process.env.CTT_PUBLIC_KEY;
    const secretKey = process.env.CTT_SECRET_KEY;
    const apiUrl = process.env.CTT_API_URL;

    if (!publicKey || !secretKey || !apiUrl) {
      throw new Error('Credenciais CTT não configuradas');
    }

    cttClient = new CTTApiClient({
      publicKey,
      secretKey,
      apiUrl,
    });
  }

  return cttClient;
}

export function getCTTClient(): CTTApiClient {
  if (!cttClient) {
    return initializeCTTClient();
  }
  return cttClient;
}
