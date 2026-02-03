/**
 * Tabela de fretes CTT para Portugal e Espanha
 * Baseado nos preços fornecidos pelo cliente
 */

export type DeliveryType = 'Ponto CTT' | 'Domicílio' | 'ctt_point' | 'home';
export type Destination = 'pt_continente' | 'acores' | 'madeira' | 'es_peninsula' | 'es_outros';

interface ShippingRate {
  peso: string;
  ponto_ctt?: number;
  domicilio: number;
}

// Mapeamento de tipos de entrega
const deliveryTypeMap: Record<string, 'ponto_ctt' | 'domicilio'> = {
  'ctt_point': 'ponto_ctt',
  'home': 'domicilio',
  'Ponto CTT': 'ponto_ctt',
  'Domicílio': 'domicilio',
};

export const shippingRates: Record<Destination, ShippingRate[]> = {
  pt_continente: [
    { peso: 'Até 1kg', ponto_ctt: 4.59, domicilio: 5.58 },
    { peso: 'Até 2kg', ponto_ctt: 4.93, domicilio: 5.58 },
    { peso: 'Até 5kg', ponto_ctt: 5.49, domicilio: 6.14 },
    { peso: 'Até 10kg', ponto_ctt: 6.81, domicilio: 7.46 },
    { peso: 'Até 20kg', ponto_ctt: 8.12, domicilio: 8.77 },
    { peso: 'Até 30kg', ponto_ctt: 10.94, domicilio: 11.59 },
  ],
  acores: [
    { peso: 'Até 1kg', ponto_ctt: 5.00, domicilio: 7.50 },
    { peso: 'Até 2kg', ponto_ctt: 6.00, domicilio: 9.00 },
    { peso: 'Até 5kg', ponto_ctt: 8.00, domicilio: 12.00 },
    { peso: 'Até 10kg', ponto_ctt: 10.00, domicilio: 15.00 },
    { peso: 'Até 20kg', ponto_ctt: 13.00, domicilio: 20.00 },
    { peso: 'Até 30kg', ponto_ctt: 16.00, domicilio: 25.00 },
  ],
  madeira: [
    { peso: 'Até 1kg', ponto_ctt: 5.50, domicilio: 8.00 },
    { peso: 'Até 2kg', ponto_ctt: 6.50, domicilio: 9.50 },
    { peso: 'Até 5kg', ponto_ctt: 8.50, domicilio: 12.50 },
    { peso: 'Até 10kg', ponto_ctt: 11.00, domicilio: 16.00 },
    { peso: 'Até 20kg', ponto_ctt: 14.00, domicilio: 21.00 },
    { peso: 'Até 30kg', ponto_ctt: 17.00, domicilio: 26.00 },
  ],
  es_peninsula: [
    { peso: 'Até 1kg', ponto_ctt: 2.50, domicilio: 3.50 },
    { peso: 'Até 2kg', ponto_ctt: 3.00, domicilio: 4.20 },
    { peso: 'Até 5kg', ponto_ctt: 4.00, domicilio: 5.50 },
    { peso: 'Até 10kg', ponto_ctt: 5.00, domicilio: 7.00 },
    { peso: 'Até 20kg', ponto_ctt: 6.50, domicilio: 9.00 },
    { peso: 'Até 30kg', ponto_ctt: 8.00, domicilio: 11.00 },
  ],
  es_outros: [
    { peso: 'Até 1kg', domicilio: 14.05 },
    { peso: 'Até 5kg', domicilio: 26.64 },
    { peso: 'Até 10kg', domicilio: 58.84 },
    { peso: 'Até 15kg', domicilio: 75.43 },
    { peso: 'Até 20kg', domicilio: 108.33 },
    { peso: 'Até 25kg', domicilio: 141.22 },
    { peso: 'Até 30kg', domicilio: 173.83 },
  ],
};

/**
 * Determina o destino baseado no CEP
 * @param cep - CEP/código postal
 * @returns Destination type
 */
export function getDestinationFromCEP(cep: string): Destination {
  const cleanCEP = cep.replace(/\D/g, '');

  // Açores: 9500-9799 (Ponta Delgada, Terceira, Faial, Pico, São Jorge)
  if (cleanCEP.match(/^950\d{2}/) || cleanCEP.match(/^970\d{2}/) || cleanCEP.match(/^980\d{2}/) || cleanCEP.match(/^990\d{2}/) || cleanCEP.match(/^995\d{2}/)) {
    return 'acores';
  }

  // Madeira: 9000-9399 (Funchal, Porto Santo, Câmara de Lobos)
  if (cleanCEP.match(/^900\d{2}/) || cleanCEP.match(/^910\d{2}/) || cleanCEP.match(/^930\d{2}/)) {
    return 'madeira';
  }

  // Espanha Península (28000-52999)
  if (cleanCEP.match(/^[2-5]\d{4}$/)) {
    return 'es_peninsula';
  }

  // Portugal Continental (1000-9099)
  if (cleanCEP.match(/^[1-9]\d{3}/) && !cleanCEP.match(/^9[5-9]\d{2}/) && !cleanCEP.match(/^9[1-4]\d{2}/)) {
    return 'pt_continente';
  }

  // Espanha Outros
  if (cleanCEP.match(/^[0-1]\d{4}$/) || cleanCEP.match(/^[6-9]\d{4}$/)) {
    return 'es_outros';
  }

  // Espanha - outros códigos (0000-9999)
  if (cleanCEP.match(/^\d{5}$/)) {
    return 'es_outros';
  }

  // Default: Portugal Continental
  return 'pt_continente';
}

/**
 * Calcula o frete baseado no destino, tipo de entrega e peso
 * @param destination - Destino
 * @param deliveryType - Tipo de entrega (ponto_ctt ou domicilio)
 * @param weight - Peso em kg (padrão: 1.5kg para um rolo)
 * @returns Valor do frete em euros
 */
export function calculateShipping(
  destination: Destination,
  deliveryType: DeliveryType,
  weight: number = 1.5
): number {
  const rates = shippingRates[destination];
  if (!rates) return 5.58; // Valor padrão para Portugal Continental Domicílio

  // Encontra a faixa de peso apropriada
  let applicableRate = rates[0];
  for (const rate of rates) {
    const maxWeight = parseInt(rate.peso.match(/\d+/)?.[0] || '0');
    if (weight <= maxWeight) {
      applicableRate = rate;
      break;
    }
  }

  // Retorna o preço baseado no tipo de entrega
  const normalizedType = typeof deliveryType === 'string' ? deliveryTypeMap[deliveryType] || deliveryType : deliveryType;
  if (normalizedType === 'ponto_ctt' && applicableRate.ponto_ctt) {
    return applicableRate.ponto_ctt;
  }

  return applicableRate.domicilio;
}

/**
 * Calcula o frete baseado no CEP
 * @param cep - CEP/código postal
 * @param deliveryType - Tipo de entrega
 * @param weight - Peso em kg
 * @returns Valor do frete em euros
 */
export function calculateShippingByCEP(
  cep: string,
  deliveryType: DeliveryType | 'ctt_point' | 'home',
  quantity: number = 1
): number {
  try {
    // Validação rigorosa
    if (!cep || typeof cep !== 'string' || cep.trim().length === 0) {
      console.warn('[ShippingRates] CEP inválido:', cep);
      return 5.58; // Valor padrão para Portugal Continental Domicílio
    }
    
    // Mapear novo tipo de entrega para tipo antigo
    const mappedDeliveryType = deliveryTypeMap[deliveryType] || 'domicilio';
    
    // Validar quantidade
    const validQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
    const weight = validQuantity * 1.5; // Cada rolo pesa 1.5kg
    
    const destination = getDestinationFromCEP(cep);
    const result = calculateShipping(destination, mappedDeliveryType as DeliveryType, weight);
    
    // Validação final do resultado
    const finalResult = Number(result);
    if (isNaN(finalResult) || !isFinite(finalResult) || finalResult <= 0) {
      console.warn('[ShippingRates] Resultado inválido:', finalResult, 'CEP:', cep, 'Destino:', destination);
      return 5.58; // Valor padrão
    }
    
    return finalResult;
  } catch (error) {
    console.error('[ShippingRates] Erro ao calcular frete:', error);
    return 5.58; // Valor padrão
  }
}
