"use client"

import { MessageCircle } from "lucide-react"

interface WhatsAppButtonProps {
  phone?: string;
  message?: string;
}

export function WhatsAppButton({ 
  phone = "5567992149878", 
  message = "Olá, gostaria de mais informações!" 
}: WhatsAppButtonProps) {
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
      aria-label="Falar conosco no WhatsApp"
    >
      <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
    </a>
  )
}
