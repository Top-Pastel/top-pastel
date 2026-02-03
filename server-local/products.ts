/**
 * Produtos do Stripe
 * Estes são os produtos reais que serão vendidos
 */

export const PRODUCTS = {
  MASSA_PASTEL_1KG: {
    name: "Massa de Pastel Brasileira 1kg",
    description: "Rolo de massa de pastel fresca, artesanal, pronta para fritar",
    price: 1000, // em centavos (€10,00)
    currency: "eur",
    image: "https://top-pastel.manus.space/images/pastel-rolo-top-pastel.jpg",
    priceId: "price_1Ssxm7FpZLuOvGpTKQi8V6CJ",
    productId: "prod_Tqf6bUth39m5Y5",
  },
  FRETE_CTT: {
    name: "Frete CTT - Domicílio",
    description: "Entrega para Guimarães",
    price: 558, // em centavos (€5,58)
    currency: "eur",
    priceId: "price_1SsvTbCfUgGMe1QnsFncRHhb",
    productId: "prod_TqcjhRs7vG4hSx",
  },
};

/**
 * Função para criar sessão de checkout com produtos reais do Stripe
 * Usa price_data para criar preços dinâmicos no checkout
 */
export function getProductLineItems(quantity: number, shippingCost: number = 0) {
  // Validar shippingCost
  const validShippingCost = typeof shippingCost === 'number' && !isNaN(shippingCost) && shippingCost >= 0 
    ? shippingCost 
    : 5.24; // Valor padrão para Portugal Continental

  const lineItems: any[] = [
    {
      price: PRODUCTS.MASSA_PASTEL_1KG.priceId,
      quantity: quantity,
    },
  ];

  // Adicionar frete com preço dinâmico (em centavos)
  if (validShippingCost > 0) {
    const unitAmount = Math.round(validShippingCost * 100);
    if (!isNaN(unitAmount) && unitAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Frete de Entrega",
            description: "Entrega para o seu endereço",
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      });
    }
  }

  return lineItems;
}
