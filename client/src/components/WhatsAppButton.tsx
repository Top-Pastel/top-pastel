import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppButtonProps {
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function WhatsAppButton({ 
  variant = "default", 
  size = "md",
  className = "",
  text = "Comprar Agora"
}: WhatsAppButtonProps) {
  // Número do WhatsApp (Top Pastel - Portugal)
  const phoneNumber = "351937675660"; // Formato: 55 + código país + DDD + número (sem +)
  
  // Mensagem padrão
  const message = encodeURIComponent(
    "Olá! 👋 Quero comprar a Massa de Pastel Brasileira da Top Pastel! 🥟\n\nPode me informar mais detalhes e formas de pagamento?"
  );
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
  
  const sizeClasses = {
    sm: "h-10 px-4 text-sm",
    md: "h-12 px-6 text-base",
    lg: "h-14 px-8 text-lg"
  };
  
  const variantClasses = {
    default: "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-200",
    outline: "border-2 border-green-600 text-green-600 hover:bg-green-50",
    secondary: "bg-green-100 text-green-700 hover:bg-green-200"
  };

  return (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
      <Button 
        className={`rounded-full font-bold flex items-center gap-2 transition-all duration-300 hover:-translate-y-1 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        <MessageCircle className="w-5 h-5" />
        {text}
      </Button>
    </a>
  );
}
