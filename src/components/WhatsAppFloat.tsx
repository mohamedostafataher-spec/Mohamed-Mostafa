import React, { useState } from 'react';
import { MessageCircle, X, ChevronUp, Sparkles, Send, PhoneCall } from 'lucide-react';
import { Country } from '../types';

interface WhatsAppFloatProps {
  number?: string;
  saudiNumber?: string;
  country?: Country;
  message?: string;
}

export default function WhatsAppFloat({
  number = '201110095403',
  saudiNumber = '966596894393',
  country = 'SA',
  message = 'مرحباً SULTA، أود الاستفسار بخصوص الموديلات وتأكيد الطلب 🌸'
}: WhatsAppFloatProps) {
  const [isOpen, setIsOpen] = useState(false);

  const cleanSaudi = (saudiNumber || '966596894393').replace(/\D/g, '');
  const cleanEgypt = (number || '201110095403').replace(/\D/g, '');

  const saudiUrl = `https://wa.me/${cleanSaudi}?text=${encodeURIComponent(message)}`;
  const egyptUrl = `https://wa.me/${cleanEgypt}?text=${encodeURIComponent(message)}`;

  // Default target based on selected country
  const defaultUrl = country === 'SA' ? saudiUrl : egyptUrl;
  const activeCountryLabel = country === 'SA' ? 'السعودية 🇸🇦' : 'مصر 🇪🇬';
  const activePhoneDisplay = country === 'SA' ? '0596894393 (+966)' : '+20 111 009 5403';

  return (
    <div className="fixed bottom-20 right-4 md:bottom-7 md:right-7 z-50 select-none font-sans" dir="rtl">
      {/* Floating Popover Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-80 max-w-[92vw] bg-[#0B0B0B] text-[#FAFAF7] rounded-2xl shadow-2xl border border-[#F6E7A6]/30 overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1b1b1b] to-[#252525] p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
                <MessageCircle size={18} />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-[#F6E7A6] flex items-center gap-1">
                  <span>كونسيرج SULTA الملكي</span>
                  <span className="text-xs">👑</span>
                </h4>
                <p className="text-[10px] text-gray-400 font-sans">متواجدون دائماً لخدمتكِ واستقبال طلباتكِ</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body Options */}
          <div className="p-3.5 space-y-2.5 text-right font-sans">
            {/* Saudi Arabia Option */}
            <a
              href={saudiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-3 rounded-xl border transition-all duration-200 group ${
                country === 'SA'
                  ? 'bg-[#25D366]/10 border-[#25D366]/60 shadow-[0_0_12px_rgba(37,211,102,0.15)]'
                  : 'bg-white/5 border-white/10 hover:border-[#25D366]/40 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇸🇦</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-[#25D366] transition-colors">
                        واتساب فرع السعودية
                      </span>
                      {country === 'SA' && (
                        <span className="bg-[#25D366] text-[#0B0B0B] text-[9px] font-black px-1.5 py-0.2 rounded-full">
                          مفعل لكِ
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-[#F6E7A6] font-bold block mt-0.5" dir="ltr">
                      0596894393
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Send size={13} className="rotate-220" />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 mr-7">
                للطلبات داخل كافة مدن المملكة، استفسار المقاسات والشحن السريع
              </p>
            </a>

            {/* Egypt Option */}
            <a
              href={egyptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-3 rounded-xl border transition-all duration-200 group ${
                country === 'EG'
                  ? 'bg-[#25D366]/10 border-[#25D366]/60 shadow-[0_0_12px_rgba(37,211,102,0.15)]'
                  : 'bg-white/5 border-white/10 hover:border-[#25D366]/40 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇪🇬</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-[#25D366] transition-colors">
                        واتساب فرع مصر
                      </span>
                      {country === 'EG' && (
                        <span className="bg-[#25D366] text-[#0B0B0B] text-[9px] font-black px-1.5 py-0.2 rounded-full">
                          مفعل لكِ
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-gray-300 block mt-0.5" dir="ltr">
                      +20 111 009 5403
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Send size={13} className="rotate-220" />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 mr-7">
                للطلبات داخل كافة محافظات مصر، الحجز والتفصيل الخاص
              </p>
            </a>
          </div>

          {/* Footer note */}
          <div className="bg-black/60 px-4 py-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
            <span>رد فوري خلال دقائق ⚡</span>
            <span className="text-[#F6E7A6]">SULTA ATELIER 👑</span>
          </div>
        </div>
      )}

      {/* Main Trigger Pill & Button */}
      <div className="flex items-center gap-2">
        {/* Toggle options mini-button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden sm:flex items-center gap-1 bg-white/95 text-gray-800 text-[11px] font-bold px-3 py-2 rounded-full shadow-lg border border-gray-200 hover:border-[#25D366] transition-all cursor-pointer hover:bg-white"
          title="اختر فرع السعودية أو مصر"
        >
          <Sparkles size={12} className="text-[#A44C5C]" />
          <span>واتساب {activeCountryLabel}</span>
          <ChevronUp size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* WhatsApp Icon Circle Button */}
        <div className="relative group">
          <button
            onClick={() => {
              // Open menu or directly navigate
              if (isOpen) {
                setIsOpen(false);
              } else {
                setIsOpen(true);
              }
            }}
            className="w-13 h-13 md:w-14 md:h-14 bg-[#25D366] text-white rounded-full shadow-[0_6px_25px_rgba(37,211,102,0.45)] hover:shadow-[0_8px_30px_rgba(37,211,102,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center relative cursor-pointer"
            aria-label="تواصل معنا عبر واتساب SULTA"
          >
            <MessageCircle size={28} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 bg-[#F6E7A6] text-[#0B0B0B] text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-serif font-black shadow-md border border-black/20">
              👑
            </span>
          </button>

          {/* Quick Tooltip on Hover */}
          {!isOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden md:group-hover:flex items-center gap-2 bg-[#0B0B0B] text-[#FAFAF7] text-xs px-3.5 py-2 rounded-xl shadow-xl border border-[#F6E7A6]/30 whitespace-nowrap pointer-events-none transition-all">
              <span>تواصل واتساب:</span>
              <strong className="text-[#25D366] font-mono" dir="ltr">
                {activePhoneDisplay}
              </strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
