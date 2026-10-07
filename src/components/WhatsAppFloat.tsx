import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Country } from '../types';

interface WhatsAppFloatProps {
  number?: string;
  saudiNumber?: string;
  country?: Country;
  message?: string;
}

export default function WhatsAppFloat({
  number = '966596894393',
  saudiNumber = '966596894393',
  message = 'مرحباً SULTA، أود الاستفسار بخصوص الموديلات الملكية وتأكيد طلبي 🌸'
}: WhatsAppFloatProps) {
  const cleanSaudi = (saudiNumber || number || '966596894393').replace(/\D/g, '');
  const saudiUrl = `https://wa.me/${cleanSaudi}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-7 md:right-7 z-50 select-none font-sans" dir="rtl">
      <a
        href={saudiUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-13 h-13 md:w-14 md:h-14 bg-[#DF8A9D] hover:bg-[#A44C5C] text-white rounded-full shadow-[0_6px_25px_rgba(223,138,157,0.35)] hover:shadow-[0_8px_30px_rgba(223,138,157,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border-2 border-white group relative"
        aria-label="تواصل معنا عبر واتساب SULTA"
        title="تواصل مباشر عبر واتساب 0596894393"
      >
        <MessageCircle size={28} />
        
        {/* Subtle status pulse */}
        <span className="absolute top-1 right-1 w-3 h-3 bg-[#25D366] rounded-full border-2 border-white" />

        {/* Hover label for desktop */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden md:group-hover:flex items-center gap-1.5 bg-[#A44C5C] text-white text-xs px-3 py-1.5 rounded-xl shadow-xl border border-white/10 whitespace-nowrap pointer-events-none transition-all">
          <span>محادثة واتساب سريعة</span>
          <span className="text-emerald-400">⚡</span>
        </div>
      </a>
    </div>
  );
}
