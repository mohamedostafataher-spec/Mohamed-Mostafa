import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppFloatProps {
  number?: string;
  message?: string;
}

export default function WhatsAppFloat({ number, message = "مرحباً SULTA، أحتاج للمساعدة بخصوص" }: WhatsAppFloatProps) {
  if (!number) return null;

  const whatsappUrl = `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-[0_4px_15px_rgba(37,211,102,0.4)] hover:scale-110 hover:shadow-[0_6px_20px_rgba(37,211,102,0.6)] transition-all duration-300 group flex items-center justify-center"
      aria-label="تواصل معنا عبر واتساب"
    >
      <MessageCircle size={28} className="animate-pulse" />
      <span className="absolute left-full ml-4 whitespace-nowrap bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg font-sans font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        الدعم السريع الملكي 👑
      </span>
    </a>
  );
}
