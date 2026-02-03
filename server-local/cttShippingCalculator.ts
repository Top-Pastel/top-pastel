/**
 * Calculador de frete que integra com a API CTT
 * Usa a API real quando disponível, fallback para tabelas locais
 */

import { getCTTClient } from './cttApi';
import { calculateShippingByCEP as calculateShippingLocal } from './shippingRates';

export type DeliveryType = 'ponto_ctt' | 'domicilio';

interface ShippingCalculationRequest {
  originPostalCode: string;
  destinationPostalCode: string;
  weight: number;
  deliveryType: DeliveryType;
}

interface ShippingCalculationResult {
  cost: number;
  estimatedDays?: number;
  source: 'ctt_api' | 'local_fallback';
  error?: string;
}

/**
 * Calcular frete usando API CTT com fallback para tabelas locais
 */
export async function calculateShippingWithCTT(
  request: ShippingCalculationRequest
): Promise<ShippingCalculationResult> {
  try {
    // Tentar usar a API CTT
    const cttClient = getCTTClient();
    
    const quote = await cttClient.getShippingQuote({
      originPostalCode: request.originPostalCode,
      destinationPostalCode: request.destinationPostalCode,
      weight: request.weight,
      serviceType: request.deliveryType,
    });

    return {
      cost: quote.price,
      estimatedDays: quote.estimatedDays,
      source: 'ctt_api',
    };
  } catch (error) {
    console.warn('Erro ao usar API CTT, usando fallback local:', error);
    
    // Fallback para cálculo local
    try {
      const localCost = calculateShippingLocal(
        request.destinationPostalCode,
        request.deliveryType as any,
        Math.ceil(request.weight / 1.5)
      );

      return {
        cost: localCost,
        source: 'local_fallback',
        error: 'API CTT indisponível, usando tabelas locais',
      };
    } catch (fallbackError) {
      console.error('Erro ao calcular frete com fallback:', fallbackError);
      throw new Error('Falha ao calcular frete');
    }
  }
}

/**
 * Calcular frete apenas com API CTT (sem fallback)
 */
export async function calculateShippingCTTOnly(
  request: ShippingCalculationRequest
): Promise<ShippingCalculationResult> {
  const cttClient = getCTTClient();
  
  const quote = await cttClient.getShippingQuote({
    originPostalCode: request.originPostalCode,
    destinationPostalCode: request.destinationPostalCode,
    weight: request.weight,
    serviceType: request.deliveryType,
  });

  return {
    cost: quote.price,
    estimatedDays: quote.estimatedDays,
    source: 'ctt_api',
  };
}

/**
 * Calcular frete apenas com tabelas locais (sem API)
 */
export function calculateShippingLocalOnly(
  request: ShippingCalculationRequest
): ShippingCalculationResult {
  const cost = calculateShippingLocal(
    request.destinationPostalCode,
    request.deliveryType as any,
    Math.ceil(request.weight / 1.5) // Converter peso para quantidade de rolos
  );

  return {
    cost,
    source: 'local_fallback',
  };
}
