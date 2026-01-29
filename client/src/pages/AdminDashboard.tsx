import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, LogOut, Package, DollarSign, Users, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  // Buscar todos os pedidos - DEVE estar antes de qualquer return condicional
  const { data: orders, isLoading } = trpc.orders.getAll.useQuery();

  // Verificar se é admin
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Acesso Restrito</h1>
          <p className="text-muted-foreground">Você precisa estar autenticado para acessar o painel admin.</p>
          <Button onClick={() => navigate("/")}>Voltar para Home</Button>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar o painel admin.</p>
          <Button onClick={() => navigate("/")}>Voltar para Home</Button>
        </div>
      </div>
    );
  }



  // Calcular estatísticas
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount), 0) || 0;
  const pendingOrders = orders?.filter((o: any) => o.orderStatus === "pending").length || 0;
  const completedOrders = orders?.filter((o: any) => o.orderStatus === "completed").length || 0;

  const selectedOrder = orders?.find((o: any) => o.id === selectedOrderId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Painel Admin</h1>
              <p className="text-muted-foreground">Bem-vindo, {user?.name || "Admin"}</p>
            </div>
            <Button variant="outline" onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <p className="text-3xl font-bold text-primary">{totalOrders}</p>
              </div>
              <Package className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-3xl font-bold text-green-600">€{totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingOrders}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Completos</p>
                <p className="text-3xl font-bold text-blue-600">{completedOrders}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Pedidos */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Pedidos Recentes</h2>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.map((order: any) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedOrderId === order.id
                          ? "bg-primary/10 border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">#{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">€{parseFloat(order.totalAmount).toFixed(2)}</p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              order.orderStatus === "completed"
                                ? "bg-green-100 text-green-800"
                                : order.orderStatus === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">Nenhum pedido encontrado</p>
              )}
            </Card>
          </div>

          {/* Detalhes do Pedido */}
          <div>
            {selectedOrder ? (
              <Card className="p-6 sticky top-8">
                <h3 className="text-xl font-bold mb-4">Detalhes do Pedido</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Número do Pedido</p>
                    <p className="font-bold">#{selectedOrder.id}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-bold">{selectedOrder.customerName}</p>
                    <p className="text-sm">{selectedOrder.customerEmail}</p>
                    <p className="text-sm">{selectedOrder.customerPhone}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Endereço de Entrega</p>
                    <p className="text-sm">
                      {selectedOrder.deliveryAddress}
                      <br />
                      {selectedOrder.deliveryCity}, {selectedOrder.deliveryPostalCode}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Entrega</p>
                    <p className="text-sm">
                      {selectedOrder.deliveryType === "ctt_point" ? "Ponto CTT" : "Domicílio"}
                    </p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="font-bold">
                      €{(parseFloat(selectedOrder.totalAmount) - parseFloat(selectedOrder.shippingCost)).toFixed(2)}
                    </p>

                    <p className="text-sm text-muted-foreground mt-2">Frete</p>
                    <p className="font-bold">€{parseFloat(selectedOrder.shippingCost).toFixed(2)}</p>

                    <div className="border-t border-border mt-4 pt-4">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold text-primary">€{parseFloat(selectedOrder.totalAmount).toFixed(2)}</p>
                    </div>
                  </div>

                  {selectedOrder.cttShippingNumber && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Rastreamento</p>
                      <p className="font-mono text-sm">{selectedOrder.cttShippingNumber}</p>
                    </div>
                  )}

                  <div className="pt-4 space-y-2">
                    <Button className="w-full" variant="outline">
                      Editar Status
                    </Button>
                    <Button className="w-full" variant="outline">
                      Enviar Rastreamento
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                Selecione um pedido para ver detalhes
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
