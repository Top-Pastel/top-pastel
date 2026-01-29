import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
    deliveryPostalCode: "4810-433",
    deliveryCity: "Guimaraes",
    deliveryDistrict: "Braga",
    deliveryType: "home" as "ctt_point" | "home",
    quantity: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState<number | null>(null);


  const createSessionMutation = trpc.checkout.createSession.useMutation();
  const { data: shippingData, isLoading: isCalculatingShipping2 } = trpc.shipping.calculateShipping.useQuery(
    {
      cep: formData.deliveryPostalCode,
      deliveryType: formData.deliveryType,
      quantity: formData.quantity,
    },
    {
      enabled: !!formData.deliveryPostalCode && formData.quantity > 0,
    }
  );

  // Atualizar frete quando dados chegam
  useEffect(() => {
    if (shippingData?.shippingCost) {
      setShippingCost(shippingData.shippingCost);
    }
  }, [shippingData?.shippingCost]);

  useEffect(() => {
    if (formData.deliveryPostalCode && !shippingCost) {
      console.log('[Checkout] CEP pré-preenchido, disparando cálculo');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) || 1 : value,
    }));
  };

  const handleDeliveryTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryType: value as "ctt_point" | "home",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validar dados
      if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
        throw new Error("Por favor, preencha todos os dados pessoais");
      }
      if (!formData.deliveryAddress || !formData.deliveryPostalCode || !formData.deliveryCity || !formData.deliveryDistrict) {
        throw new Error("Por favor, preencha todos os dados de entrega");
      }
      if (formData.quantity < 1) {
        throw new Error("Quantidade deve ser pelo menos 1");
      }
      if (!shippingCost || shippingCost <= 0) {
        throw new Error("Erro ao calcular frete. Tente novamente.");
      }

      // Enviar formData com shippingCost
      const result = await createSessionMutation.mutateAsync({
        ...formData,
        shippingCost: shippingCost,
      } as any);

      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar sessão de checkout");
    } finally {
      setIsLoading(false);
    }
  };

  const productPrice = 10.00;
  const totalShipping = shippingCost || 0;
  const totalPrice = (productPrice * formData.quantity) + totalShipping;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Finalizar Compra</CardTitle>
              <CardDescription>Preencha seus dados para completar o pedido</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seção de Informações Pessoais */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Informações Pessoais</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                    <Input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="João Silva"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <Input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      placeholder="joao@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone *</label>
                    <Input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      placeholder="+351 912345678"
                      required
                    />
                  </div>
                </div>

                {/* Seção de Endereço */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Endereço de Entrega</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Endereço *</label>
                    <Input
                      type="text"
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleChange}
                      placeholder="Rua Principal, 123"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">CEP *</label>
                      <Input
                        type="text"
                        name="deliveryPostalCode"
                        value={formData.deliveryPostalCode}
                        onChange={handleChange}
                        placeholder="4810-433"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Cidade *</label>
                      <Input
                        type="text"
                        name="deliveryCity"
                        value={formData.deliveryCity}
                        onChange={handleChange}
                        placeholder="Guimarães"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Distrito *</label>
                    <Input
                      type="text"
                      name="deliveryDistrict"
                      value={formData.deliveryDistrict}
                      onChange={handleChange}
                      placeholder="Braga"
                      required
                    />
                  </div>
                </div>

                {/* Seção de Frete */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Tipo de Entrega</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Método de Entrega *</label>
                    <Select value={formData.deliveryType} onValueChange={handleDeliveryTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ctt_point">Ponto CTT</SelectItem>
                        <SelectItem value="home">Domicílio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Seção de Quantidade */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Quantidade</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Rolos de Massa (1kg cada) *</label>
                    <Input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                </div>

                {/* Mensagem de Erro */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                {/* Botão de Envio */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Ir para Pagamento"
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Você será redirecionado para o Stripe para completar o pagamento
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Resumo do Pedido */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Produto */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Massa de Pastel 1kg</span>
                  <span className="font-medium">€{productPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantidade</span>
                  <span className="font-medium">{formData.quantity}x</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-b border-border pb-2">
                  <span>Subtotal</span>
                  <span>€{(productPrice * formData.quantity).toFixed(2)}</span>
                </div>
              </div>

              {/* Frete */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  {isCalculatingShipping2 ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Calculando...
                    </span>
                  ) : (
                    <span className="font-medium">€{totalShipping.toFixed(2)}</span>
                  )}
                </div>
                {formData.deliveryPostalCode && (
                  <p className="text-xs text-muted-foreground">
                    CEP: {formData.deliveryPostalCode} | {formData.deliveryType === "home" ? "Domicílio" : "Ponto CTT"}
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="text-2xl font-bold text-primary">€{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Informações */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                <p>✓ Pagamento seguro via Stripe</p>
                <p>✓ Entrega rápida em Portugal</p>
                <p>✓ Garantia de satisfação</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
