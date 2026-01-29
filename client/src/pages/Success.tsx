import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Success() {
  const [location, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [orderData, setOrderData] = useState<any>(null);

  // Extrair session_id da URL
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const sessionId = searchParams.get("session_id");

  // Buscar dados do pedido
  const { data: order, isLoading } = trpc.orders.getBySessionId.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  useEffect(() => {
    if (order) {
      setOrderData(order);
      setStatus("success");
    } else if (!isLoading && sessionId) {
      setStatus("error");
    }
  }, [order, isLoading, sessionId]);

  if (!sessionId) {
    // Redirecionar para home após 2 segundos se não houver session_id
    useEffect(() => {
      const timer = setTimeout(() => navigate("/"), 2000);
      return () => clearTimeout(timer);
    }, [navigate]);

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
          <h1 className="text-2xl font-bold">Sessão Inválida</h1>
          <p className="text-muted-foreground">Não conseguimos encontrar sua sessão de pagamento.</p>
          <p className="text-sm text-muted-foreground">Redirecionando para home...</p>
          <Button onClick={() => navigate("/")}>Voltar para Home Agora</Button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
          <h1 className="text-2xl font-bold">Processando seu pedido...</h1>
          <p className="text-muted-foreground">Por favor, aguarde enquanto confirmamos seu pagamento.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
          <h1 className="text-2xl font-bold">Erro ao Processar Pedido</h1>
          <p className="text-muted-foreground">Não conseguimos encontrar os dados do seu pedido.</p>
          <Button onClick={() => navigate("/")}>Voltar para Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto" />
          <h1 className="text-4xl font-bold text-primary">Pedido Confirmado!</h1>
          <p className="text-lg text-muted-foreground">Obrigado pela sua compra!</p>
        </div>

        {/* Order Details */}
        {orderData && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            {/* Order Number */}
            <div className="text-center pb-6 border-b border-border">
              <p className="text-sm text-muted-foreground mb-2">Número do Pedido</p>
              <p className="text-2xl font-bold text-primary">#{orderData.id}</p>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Informações Pessoais</p>
                <div className="space-y-1">
                  <p className="font-medium">{orderData.customerName}</p>
                  <p className="text-sm text-muted-foreground">{orderData.customerEmail}</p>
                  <p className="text-sm text-muted-foreground">{orderData.customerPhone}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Endereço de Entrega</p>
                <div className="space-y-1">
                  <p className="font-medium">{orderData.deliveryAddress}</p>
                  <p className="text-sm text-muted-foreground">
                    {orderData.deliveryCity}, {orderData.deliveryPostalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {orderData.deliveryType === "ctt_point" ? "Ponto CTT" : "Domicílio"}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3 border-t border-border pt-6">
              <p className="text-sm font-semibold text-muted-foreground">Itens do Pedido</p>
              {orderData.items && orderData.items.length > 0 ? (
                <div className="space-y-2">
                  {orderData.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.productName} x {item.quantity}</span>
                      <span className="font-medium">€{parseFloat(item.totalPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
              )}
            </div>

            {/* Total */}
            <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>€{(parseFloat(orderData.totalAmount) - parseFloat(orderData.shippingCost)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span>€{parseFloat(orderData.shippingCost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-secondary/20 pt-2">
                <span>Total</span>
                <span className="text-primary">€{parseFloat(orderData.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Tracking Info */}
            {orderData.cttShippingNumber && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-900">Número de Rastreamento</p>
                <p className="font-mono text-lg text-blue-700">{orderData.cttShippingNumber}</p>
                {orderData.cttTrackingUrl && (
                  <a
                    href={orderData.cttTrackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Rastrear Encomenda →
                  </a>
                )}
              </div>
            )}

            {/* Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900 mb-1">Status do Pedido</p>
              <p className="text-green-700 capitalize">{orderData.orderStatus}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate("/")} variant="outline">
            Voltar para Home
          </Button>
          <Button onClick={() => navigate("/pedidos")}>
            Ver Meus Pedidos
          </Button>
        </div>

        {/* Email Confirmation */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Um email de confirmação foi enviado para <span className="font-medium">{orderData?.customerEmail}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
