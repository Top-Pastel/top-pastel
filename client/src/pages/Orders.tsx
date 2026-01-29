import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Package, AlertCircle, CheckCircle } from "lucide-react";

export default function Orders() {
  const [email, setEmail] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: orders, isLoading, error } = trpc.orders.list.useQuery(
    { email, limit: 50, offset: 0 },
    { enabled: hasSearched && !!email }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setHasSearched(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "processing":
        return "text-blue-600 bg-blue-50";
      case "shipped":
        return "text-purple-600 bg-purple-50";
      case "delivered":
        return "text-green-600 bg-green-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      processing: "Processando",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-primary">Meus Pedidos</h1>
          <p className="text-muted-foreground">Consulte o status dos seus pedidos</p>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Pedidos</CardTitle>
            <CardDescription>Digite seu email para ver todos os seus pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !email}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  "Buscar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin mb-4" />
                <p className="text-muted-foreground">Carregando pedidos...</p>
              </div>
            ) : error ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Erro ao carregar pedidos</p>
                      <p className="text-sm text-red-700">{error?.message || "Tente novamente"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-primary" />
                          <div>
                            <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                            <CardDescription>
                              {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                            </CardDescription>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                          {getStatusLabel(order.orderStatus)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-2 border-b pb-4">
                        <p className="text-sm font-semibold text-muted-foreground">Itens do Pedido</p>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.productName}</span>
                              <span className="font-medium">€{parseFloat(item.totalPrice).toFixed(2)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhum item</p>
                        )}
                      </div>

                      {/* Delivery Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Endereço de Entrega</p>
                          <p className="text-sm">{order.deliveryAddress}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.deliveryCity}, {order.deliveryPostalCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Tipo de Entrega</p>
                          <p className="text-sm">
                            {order.deliveryType === "ctt_point" ? "Ponto CTT" : "Domicílio"}
                          </p>
                          {order.cttShippingNumber && (
                            <p className="text-sm text-primary font-mono mt-2">{order.cttShippingNumber}</p>
                          )}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total</span>
                        <span className="text-lg font-bold text-primary">
                          €{parseFloat(order.totalAmount).toFixed(2)}
                        </span>
                      </div>

                      {/* Tracking Link */}
                      {order.cttTrackingUrl && (
                        <a
                          href={order.cttTrackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium"
                        >
                          Rastrear Encomenda →
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">Nenhum pedido encontrado para este email</p>
                  <p className="text-sm text-muted-foreground">
                    Faça uma compra para ver seus pedidos aqui
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
