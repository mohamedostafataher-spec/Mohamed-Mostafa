import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Country } from '../types';
import { trackContact } from '../utils/analytics';

interface WhatsAppFloatProps {
  number?: string;
  saudiNumber?: string;
  country?: Country;
  message?: string;
}

export default function WhatsAppFloat({
  number = '966552823677',
  saudiNumber = '966552823677',
  message = 'مرحباً SULTA، أود الاستفسار بخصوص الموديلات الملكية وتأكيد طلبي 🌸'
}: WhatsAppFloatProps) {
  const cleanSaudi = (saudiNumber || number || '966552823677').replace(/\D/g, '');
  const saudiUrl = `https://wa.me/${cleanSaudi}?text=${encodeURIComponent(message)}`;

  const handleClick = () => {
    try {
      trackContact('whatsapp', 'المحادثة السريعة العائمة');
    } catch {}
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-7 md:right-7 z-50 select-none font-sans" dir="rtl">
      <a
        href={saudiUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="w-12 h-12 md:w-14 md:h-14 bg-[#A44C5C] hover:bg-[#8e3f4e] text-white rounded-full shadow-[0_6px_25px_rgba(164,76,92,0.35)] hover:shadow-[0_8px_30px_rgba(164,76,92,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border-2 border-white group relative"
        aria-label="تواصل معنا عبر واتساب SULTA"
        title="تواصل مباشر عبر واتساب 0552823677"
      >
        <MessageCircle size={24} className="text-white" />
        
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
