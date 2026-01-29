import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLocation } from "wouter";
import { Star, Check, ArrowRight, Leaf, Heart, Zap, Users, TrendingUp } from "lucide-react";


export default function Home() {
  const [, setLocation] = useLocation();
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [cep, setCep] = useState('4810-433');
  const [deliveryType, setDeliveryType] = useState<'ctt_point' | 'home'>('home');
  const [shippingCost, setShippingCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  
  const { data: shippingData } = trpc.shipping.calculateShipping.useQuery(
    { cep, deliveryType, quantity },
    { enabled: !!cep }
  );
  
  useEffect(() => {
    if (shippingData) {
      setShippingCost(shippingData.shippingCost);
      setTotalCost(shippingData.totalCost);
    }
  }, [shippingData]);

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => Math.max(1, q - 1));

  const coupons: Record<string, { discount: number; description: string }> = {
    'BRASIL10': { discount: 10, description: '10% de desconto para novos clientes' }
  };

  const applyCoupon = () => {
    if (couponCode.toUpperCase() in coupons) {
      setAppliedCoupon(couponCode.toUpperCase());
      setCouponError('');
    } else {
      setCouponError('Cupom inválido');
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const basePrice = 10;
  const discount = appliedCoupon ? (basePrice * coupons[appliedCoupon].discount) / 100 : 0;
  const pricePerUnit = basePrice - discount;
  const finalPrice = pricePerUnit * quantity;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-secondary selection:text-secondary-foreground">
      <Navbar />
      
      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/10 to-transparent -z-10 rounded-l-[100px]"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8 animate-in slide-in-from-left-10 duration-700 fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700 font-bold text-sm border border-red-200 animate-pulse">
                <Heart className="w-4 h-4 fill-current" />
                <span>🔥 1kg de Pura Crocância</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary leading-[1.1]">
                Crocância que <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-foreground to-secondary relative inline-block">
                  Dá Saudade
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-secondary" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Leve o sabor do Brasil para sua mesa! 🥟 Massas fininhas, frescas e prontas para fritar. Perfeitas para aquele lanche especial que só a avó fazia.
              </p>

              {/* Social Proof */}
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-secondary/20 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-700">+2.500 clientes satisfeitos</span>
                </div>
                <p className="text-sm text-muted-foreground">Já experimentaram a melhor massa de pastel de Portugal!</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-0">
                <Button 
                  variant="default" 
                  size="lg"
                  onClick={() => setLocation('/checkout')}
                >
                  Compre Agora
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-8 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <span>100% Vegana</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Sem Conservantes</span>
                </div>
              </div>
            </div>
            
            {/* Image Content */}
            <div className="relative animate-in slide-in-from-right-10 duration-1000 fade-in delay-200">
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="/images/hero-pastel.jpg" 
                  alt="Pastel Brasileiro Frito" 
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                />
                
                {/* Floating Badge - Social Proof */}
                <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 flex items-center gap-4 animate-bounce duration-[3000ms]">
                  <div className="bg-secondary text-secondary-foreground font-bold text-xl w-12 h-12 rounded-full flex items-center justify-center">
                    1kg
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Massa Fresca</p>
                  </div>
                </div>

                {/* Hot Badge */}
                <div className="absolute top-6 right-6 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-pulse">
                  🔥 Em Alta!
                </div>
              </div>
              
              {/* Decorative Elements behind image */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-700"></div>
            </div>
          </div>
        </section>

        {/* Trust & Urgency Section */}
        <section className="py-12 bg-gradient-to-r from-primary/5 to-secondary/5 border-y border-primary/10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">2.500+</div>
                <p className="text-sm text-muted-foreground">Clientes Felizes</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-secondary">⭐ 4.9</div>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">24h</div>
                <p className="text-sm text-muted-foreground">Entrega Rápida</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-secondary">✅ 100%</div>
                <p className="text-sm text-muted-foreground">Satisfação</p>
              </div>
            </div>
          </div>
        </section>

        {/* Product Detail Section */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              {/* Product Image Gallery */}
              <div className="w-full md:w-1/2 space-y-6">
                <div className="aspect-square rounded-[2rem] overflow-hidden bg-gray-50 border-2 border-gray-100 shadow-inner relative group">
                  <img 
                    src="/images/pastel-rolo-top-pastel.jpg" 
                    alt="Rolo de Massa de Pastel Artesanal Top Pastel 1kg" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <img src="/images/pastel-frying.jpg" alt="Fritando" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <img src="/images/hero-pastel.jpg" alt="Pronto" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <img src="/images/pastel-cortado.jpg" alt="Massa Cortada" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="w-full md:w-1/2 space-y-8">
                <div>
                  <h2 className="text-sm font-bold text-secondary-foreground uppercase tracking-widest mb-2">Categoria: Massas Frescas</h2>
                  <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">Massa de Pastel Brasileira</h1>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                    {appliedCoupon && <span className="text-2xl font-bold text-gray-400 line-through">10,00 €</span>}
                    <span className={`text-3xl font-bold ${appliedCoupon ? 'text-green-600' : 'text-primary'}`}>{finalPrice.toFixed(2)} €</span>
                  </div>
                    <div className="flex text-yellow-400">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-muted-foreground text-sm">(128 avaliações)</span>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    A verdadeira massa de feira, agora na sua casa! Nossa receita exclusiva garante uma massa fininha, que não encharca e fica incrivelmente crocante. Ideal para recheios doces ou salgados.
                  </p>
                </div>

                {/* Urgency & Scarcity */}
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg space-y-2">
                  <div className="flex items-center gap-2 font-bold text-red-700">
                    <Zap className="w-5 h-5" />
                    Oferta Limitada!
                  </div>
                  <p className="text-sm text-red-600">Apenas 15 pacotes disponíveis hoje. Aproveite enquanto dura! 🔥</p>
                </div>

                {/* Coupon Section */}
                <div className="bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/30 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 font-bold text-secondary">
                    <span>🎁</span>
                    <span>Tem um cupom?</span>
                  </div>
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Digite o código do cupom"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                      <button
                        onClick={applyCoupon}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm hover:bg-secondary/90 transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                      <div>
                        <p className="font-bold text-green-700 text-sm">{appliedCoupon} - {coupons[appliedCoupon].discount}% OFF</p>
                        <p className="text-xs text-green-600">{coupons[appliedCoupon].description}</p>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-green-600 hover:text-green-800 font-bold text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-xs text-red-600 font-bold">{couponError}</p>}
                </div>

                <div className="space-y-4 border-t border-b border-gray-100 py-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-primary">Peso Líquido</span>
                    <span className="font-bold text-gray-900">1 kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-primary">Formato</span>
                    <span className="font-bold text-gray-900">Rolo</span>
                  </div>

                </div>

                {/* Shipping Section */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 font-bold text-blue-700">
                    <span>Calcular Frete</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CEP/Codigo Postal</label>
                      <input
                        type="text"
                        placeholder="Ex: 4810-433"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Entrega</label>
                      <select
                        value={deliveryType}
                        onChange={(e) => setDeliveryType(e.target.value as 'ctt_point' | 'home')}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ctt_point">Ponto CTT</option>
                        <option value="home">Domicílio</option>
                      </select>
                    </div>
                    {shippingData && (
                      <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Frete:</span>
                          <span className="font-bold text-blue-700">{shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-blue-100 pt-2">
                          <span className="font-medium text-gray-700">Total com Frete:</span>
                          <span className="font-bold text-lg text-blue-700">{totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-full h-14 w-fit px-2">
                    <button 
                      onClick={decrement}
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 text-primary font-bold text-xl transition-colors"
                    >
                      -
                    </button>
                    <input 
                      type="text" 
                      value={quantity} 
                      readOnly 
                      className="w-12 text-center font-bold text-lg bg-transparent border-none focus:ring-0 p-0"
                    />
                    <button 
                      onClick={increment}
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 text-primary font-bold text-xl transition-colors"
                    >
                      +
                    </button>
                  </div>
                  
                  <Button 
                    variant="default" 
                    onClick={() => setLocation('/checkout')}
                    size="lg"
                    className="flex-1 h-14 text-lg"
                  >
                    Comprar {quantity} Rolo{quantity > 1 ? 's' : ''} - {totalCost.toFixed(2)}€
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center gap-4 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span>Produto fresco e de qualidade garantida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span>Sem devoluções ou trocas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - Emotional Connection */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Por que a nossa massa é Top? 🇧🇷</h2>
              <p className="text-primary-foreground/80">Feita com ingredientes selecionados e uma receita tradicional que atravessa gerações.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Super Crocante",
                  desc: "Nossa receita especial garante aquelas bolhas crocantes que todo mundo ama. É aquele som que só a massa boa faz!",
                  icon: "🥟",
                  emotion: "Nostalgia"
                },
                {
                  title: "Não Encharca",
                  desc: "Massa sequinha mesmo depois de frita. Adeus pastel oleoso! Fica crocante por horas.",
                  icon: "✨",
                  emotion: "Qualidade"
                },
                {
                  title: "Receita Autêntica",
                  desc: "Feita com a mesma receita tradicional das feiras brasileiras. Sem aditivos artificiais, apenas ingredientes naturais e de qualidade.",
                  icon: "🔥",
                  emotion: "Autenticidade"
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 group">
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-primary-foreground/80 leading-relaxed mb-3">{feature.desc}</p>
                  <span className="text-sm font-bold text-secondary">{feature.emotion}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">O que nossos clientes dizem 💬</h2>
              <p className="text-muted-foreground">Histórias reais de quem já provou a melhor massa de pastel!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Maria Silva",
                  city: "Lisboa",
                  text: "Que massa maravilhosa! Meus filhos pediram para repetir. Ficou exatamente como a que minha avó fazia no Rio!",
                  rating: 5
                },
                {
                  name: "João Santos",
                  city: "Porto",
                  text: "Já comprei 3 vezes! Crocante, fresca e muito boa. O melhor custo-benefício que encontrei.",
                  rating: 5
                },
                {
                  name: "Ana Costa",
                  city: "Covilhã",
                  text: "Trouxe a saudade do Brasil para minha mesa. Recomendo para todos os brasileiros em Portugal!",
                  rating: 5
                }
              ].map((testimonial, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-primary">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.city}</p>
                    </div>
                    <span className="text-2xl">😊</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-secondary/20 to-primary/20">
          <div className="container mx-auto px-4 text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">
              Pronto para experimentar? 🥟
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Junte-se aos mais de 2.500 clientes satisfeitos. Compre agora e receba em 24 horas!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="default" 
                  size="lg"
                  className="text-lg"
                  onClick={() => setLocation('/checkout')}
                >
                  🛒 Comprar Agora
                </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
