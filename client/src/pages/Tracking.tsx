import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Tracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError("Por favor, insira um número de rastreamento");
      return;
    }

    setIsLoading(true);
    setError("");
    setTrackingData(null);

    try {
      // Aqui você faria uma chamada para a API do CTT
      // Por enquanto, vamos simular uma resposta
      const mockData = {
        trackingNumber: trackingNumber,
        status: "in_transit",
        lastUpdate: new Date().toLocaleDateString("pt-PT"),
        events: [
          {
            date: new Date().toLocaleDateString("pt-PT"),
            time: "14:30",
            status: "Em trânsito",
            location: "Centro de Distribuição CTT - Porto",
            description: "Encomenda em trânsito para destino",
          },
          {
            date: new Date(Date.now() - 86400000).toLocaleDateString("pt-PT"),
            time: "09:15",
            status: "Recolhida",
            location: "Guimarães",
            description: "Encomenda recolhida do remetente",
          },
        ],
      };

      setTrackingData(mockData);
    } catch (err) {
      setError("Erro ao buscar rastreamento. Tente novamente.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "in_transit":
        return <Truck className="w-6 h-6 text-blue-600" />;
      case "pending":
        return <Clock className="w-6 h-6 text-yellow-600" />;
      default:
        return <Package className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      processing: "Processando",
      in_transit: "Em Trânsito",
      delivered: "Entregue",
      failed: "Falha na Entrega",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Rastreie seu Pedido
          </h1>
          <p className="text-lg text-muted-foreground">
            Insira seu número de rastreamento CTT para acompanhar sua encomenda em tempo real
          </p>
        </div>

        {/* Search Form */}
        <Card className="max-w-2xl mx-auto mb-12 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Número de Rastreamento CTT
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Ex: CT123456789PT"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Buscando..." : "Rastrear"}
                </Button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </form>
        </Card>

        {/* Tracking Results */}
        {trackingData && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Status Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-primary">
                    {getStatusText(trackingData.status)}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Última atualização: {trackingData.lastUpdate}
                  </p>
                </div>
                <div className="flex justify-center">
                  {getStatusIcon(trackingData.status)}
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width:
                        trackingData.status === "delivered"
                          ? "100%"
                          : trackingData.status === "in_transit"
                            ? "66%"
                            : "33%",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Recolhida</p>
                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-1" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Em Trânsito</p>
                  {trackingData.status === "in_transit" || trackingData.status === "delivered" ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-1" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400 mx-auto mt-1" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entregue</p>
                  {trackingData.status === "delivered" ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-1" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400 mx-auto mt-1" />
                  )}
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-primary mb-6">Histórico de Eventos</h3>
              <div className="space-y-6">
                {trackingData.events?.map((event: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-primary" />
                      {index < trackingData.events.length - 1 && (
                        <div className="w-1 h-12 bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-primary">{event.status}</h4>
                        <span className="text-sm text-muted-foreground">
                          {event.date} às {event.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{event.location}</p>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Additional Info */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Informações Importantes</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Atualizações podem levar até 2 horas para aparecer</li>
                    <li>• Você receberá notificações por email a cada atualização</li>
                    <li>• Em caso de dúvidas, entre em contato conosco pelo WhatsApp</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Back Button */}
            <div className="text-center">
              <Button variant="outline" onClick={() => navigate("/")}>
                Voltar para Home
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!trackingData && !error && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">
              Insira seu número de rastreamento acima para começar
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar para Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
