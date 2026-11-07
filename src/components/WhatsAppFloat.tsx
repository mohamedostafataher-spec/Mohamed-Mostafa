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
  message = 'مرحباً Sulta، أود الاستفسار بخصوص الموديلات الملكية وتأكيد طلبي 🌸'
}: WhatsAppFloatProps) {
  const cleanSaudi = (saudiNumber || number || '966552823677').replace(/\D/g, '');
  const saudiUrl = `https://wa.me/${cleanSaudi}?text=${encodeURIComponent(message)}`;

  const handleClick = () => {
    try {
      trackContact('whatsapp', 'المحادثة السريعة العائمة');
    } catch {}
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 select-none font-sans" dir="rtl">
      <a
        href={saudiUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="w-11 h-11 md:w-12 md:h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border-2 border-white group relative"
        aria-label="تواصل معنا عبر واتساب Sulta"
        title="تواصل مباشر عبر واتساب 0552823677"
      >
        <MessageCircle size={20} className="text-white" />
        
        {/* Subtle status pulse */}
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />

        {/* Hover label for desktop */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden md:group-hover:flex items-center gap-1.5 bg-black/80 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
          <span>مساعدة فورية</span>
          <span className="text-emerald-400">⚡</span>
        </div>
      </a>
    </div>
  );
}
