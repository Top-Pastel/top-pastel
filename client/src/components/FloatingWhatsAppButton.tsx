import { MessageCircle } from "lucide-react";

export function FloatingWhatsAppButton() {
  const whatsappNumber = "+351937675660";
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=Olá%20Top%20Pastel!%20Gostaria%20de%20mais%20informações%20sobre%20a%20massa%20de%20pastel.`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      title="Fale conosco no WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
