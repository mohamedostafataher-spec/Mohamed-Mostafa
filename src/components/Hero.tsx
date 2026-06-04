import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowDown } from 'lucide-react';
import { Settings } from '../types';

interface HeroProps {
  onExplore: () => void;
  onDiscoverNew: () => void;
  settings?: Settings;
}

const BACKGROUND_SLIDES: {url: string; alt: string}[] = [
  { 
    url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=2070', 
    alt: 'Luxury Silk Sleepwear Sulta' 
  },
  { 
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2040', 
    alt: 'Elegant Fashion Sulta' 
  },
  { 
    url: 'https://images.unsplash.com/photo-1574015974293-817f0efebb1b?auto=format&fit=crop&q=80&w=1973', 
    alt: 'Premium Satin Loungewear' 
  }
];

export default function Hero({ onExplore, onDiscoverNew, settings }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = settings?.heroImages && settings.heroImages.length > 0 
    ? settings.heroImages.map(url => ({ url, alt: 'Sulta Banner' }))
    : BACKGROUND_SLIDES;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#0B0B0B]">
      {/* Background elegant visuals with auto slider */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/45 z-10" />
        {slides.map((slide, idx) => (
          <img
            key={slide.url}
            src={slide.url}
            alt={slide.alt}
            className={`absolute inset-0 w-full h-full object-cover object-center transform transition-all duration-[2000ms] ease-in-out ${
              idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          />
        ))}
      </div>

      {/* Floating champagne circles */}
      <div className="absolute top-1/4 right-[10%] w-72 h-72 rounded-full bg-[#F6E7A6]/10 blur-3xl z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 left-[10%] w-80 h-80 rounded-full bg-[#F4B6C2]/10 blur-3xl z-10 pointer-events-none" />

      {/* Content overlays */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 text-center mt-12">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#F6E7A6]/40 bg-black/30 backdrop-blur-md mb-6 hover:border-[#F6E7A6] transition-all">
          <Sparkles size={14} className="text-[#F6E7A6] animate-pulse" />
          <span className="text-[#F6E7A6] tracking-widest text-[10px] md:text-xs font-sans uppercase">
            {settings?.heroMiniAlertAr || 'اصدارات الموسم الجديد متوفرة الآن حصرية'}
          </span>
        </div>

        <h2 className="font-serif text-5xl md:text-7xl lg:text-9xl text-white font-light tracking-[0.2em] uppercase leading-none filter drop-shadow-md select-none">
          {settings?.siteName || 'SULTA'}
        </h2>
        
        <p className="font-serif italic text-lg md:text-2xl text-[#F6E7A6] tracking-wider mt-4 drop-shadow-xs">
          {settings?.heroSubtitleAr || 'Where Comfort Meets Elegance'}
        </p>

        <p className="max-w-xl mx-auto text-[#FAFAF7]/90 text-sm md:text-base leading-relaxed mt-6 font-sans drop-shadow-xs">
          {settings?.heroDescriptionAr || 'مجموعة بيجامات نوم ولانج وير مصممة خصيصاً لتمنحك الراحة الكاملة والأنوثة المستحقة تليق بك وبأدق تفاصيل ليلتك الهادئة والراقية بأرقى الخامات المرموقة.'}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center mt-10">
          <button
            onClick={onExplore}
            className="w-full sm:w-auto bg-[#F4B6C2] text-white hover:bg-white hover:text-[#0B0B0B] border border-transparent hover:border-gray-200 px-8 py-3.5 rounded-full text-sm font-sans font-medium hover:scale-105 tracking-wide transition-all shadow-md duration-300 cursor-pointer"
          >
            تسوقي المجموعة الآن
          </button>
          
          <button
            onClick={onDiscoverNew}
            className="w-full sm:w-auto bg-black/40 text-[#F6E7A6] border border-[#F6E7A6] hover:bg-[#F6E7A6] hover:text-[#0B0B0B] px-8 py-3.5 rounded-full text-sm font-sans font-medium tracking-wide transition-all duration-300 backdrop-blur-md cursor-pointer"
          >
            اكتشفي المجموعة الجديدة
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce mt-10 pointer-events-none">
          <span className="text-[10px] text-[#FAFAF7]/75 font-serif uppercase tracking-[0.15em]">انزلي للأسفل</span>
          <ArrowDown size={14} className="text-[#F4B6C2]" />
        </div>
      </div>
    </section>
  );
}
