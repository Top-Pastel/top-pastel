import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createProducts() {
  try {
    console.log('🔄 Criando produtos no Stripe...\n');

    // Criar produto 1: Massa de Pastel
    console.log('1️⃣ Criando produto: Massa de Pastel Brasileira 1kg');
    const product1 = await stripe.products.create({
      name: 'Massa de Pastel Brasileira 1kg',
      description: 'Rolo de massa de pastel fresca, artesanal, pronta para fritar',
      type: 'good',
    });

    const price1 = await stripe.prices.create({
      product: product1.id,
      unit_amount: 1000, // €10.00 em centavos
      currency: 'eur',
    });

    console.log(`✅ Produto criado: ${product1.id}`);
    console.log(`✅ Preço criado: ${price1.id}\n`);

    // Criar produto 2: Frete CTT
    console.log('2️⃣ Criando produto: Frete CTT - Domicílio');
    const product2 = await stripe.products.create({
      name: 'Frete CTT - Domicílio',
      description: 'Entrega para Guimarães',
      type: 'service',
    });

    const price2 = await stripe.prices.create({
      product: product2.id,
      unit_amount: 558, // €5.58 em centavos
      currency: 'eur',
    });

    console.log(`✅ Produto criado: ${product2.id}`);
    console.log(`✅ Preço criado: ${price2.id}\n`);

    // Exibir resultado
    console.log('📋 IDs dos Produtos e Preços:');
    console.log('================================');
    console.log(`PRODUCT_ID_PASTEL: ${product1.id}`);
    console.log(`PRICE_ID_PASTEL: ${price1.id}`);
    console.log(`PRODUCT_ID_FRETE: ${product2.id}`);
    console.log(`PRICE_ID_FRETE: ${price2.id}`);
    console.log('================================\n');

    console.log('✅ Produtos criados com sucesso!');
    console.log('Copie os IDs acima e adicione no arquivo server/products.ts');

  } catch (error) {
    console.error('❌ Erro ao criar produtos:', error.message);
    process.exit(1);
  }
}

createProducts();
