import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Settings } from '../types';

interface HeroProps {
  onExplore: () => void;
  onDiscoverNew: () => void;
  settings?: Settings;
  homepageSections?: any[];
}

export default function Hero({ onExplore, onDiscoverNew, settings, homepageSections = [] }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Parse dynamic hero banners from Supabase table 'homepage_sections'
  const heroSection = homepageSections.find(s => s.section_key === 'hero_banners');
  const dynamicBanners = heroSection?.content_json?.banners || [];
  const dbActiveBanners = dynamicBanners.filter((b: any) => b.active !== false);
  
  const fallbackBanners = [
    {
      mediaUrl: '/assets/images/hero_pajama_lifestyle_1_1780682110287.png',
      title: 'فخامةٌ تليقُ بِمَلِكَة',
      subtitle: 'أناقةٌ لا تَعرفُ الحدود',
      description: 'بيجامات الحرير الإيطالي المعالج لنعومة فائقة طوال الليل',
      ctaText: 'تسوقي التشكيلة الجديدة',
      mediaType: 'image'
    },
    {
      mediaUrl: '/assets/images/hero_pajama_editorial_2_1780682126486.png',
      title: 'سُلْطَة.. للراحةِ مَعنىً آخَر',
      subtitle: 'كوتور ملابسِ النومِ الفاخِرة',
      description: 'تصاميمُ ملكيّة تجمعُ بين الرقي والراحةِ المطلقة في منزلكِ',
      ctaText: 'اكتشفي الأناقة المنزليّة',
      mediaType: 'image'
    },
    {
      mediaUrl: '/assets/images/hero_pajama_detail_3_1780682140472.png',
      title: 'أدَقُ التفاصيلِ لأرقَى الأذواق',
      subtitle: 'جودةٌ تلمسينَها في كُلِ غرزة',
      description: 'نستخدمُ أجودَ خاماتِ المودال والكتان لتجربةِ نومٍ مثاليّة',
      ctaText: 'دليل المنتجات الفاخرة',
      mediaType: 'image'
    }
  ];

  const activeBanners = dbActiveBanners.length > 0 ? dbActiveBanners : fallbackBanners;

  const slides = activeBanners.map((b: any) => ({
    url: b.mediaUrl || b.url,
    alt: b.title || 'Sulta Banner',
    title: b.title || 'CURATED LUXURY.',
    subtitle: b.subtitle || 'TIMELESS STYLE.\nYOUR RESET.',
    description: b.description || 'Zero Effort. Full Comfort.',
    ctaText: b.ctaText || 'SHOP NOW',
    mediaType: b.mediaType || 'image'
  }));

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlideData = slides[currentSlide];

  if (!currentSlideData) return null; // No static fallbacks

  return (
    <section className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center justify-start overflow-hidden bg-[#FAF5F0]">
      {/* Background elegant visuals with auto slider */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.url + idx}
              className={`absolute inset-0 w-full h-full transform transition-all duration-[2000ms] ease-in-out ${
                isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
              }`}
            >
              {slide.mediaType === 'video' ? (
                <video
                  src={slide.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <img
                  src={slide.url}
                  alt={slide.alt}
                  className="w-full h-full object-cover object-center"
                />
              )}
              {/* Optional elegant gradient overlay to ensure text legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FAF5F0]/80 via-[#FAF5F0]/40 to-transparent" />
            </div>
          );
        })}
      </div>

      {/* Content overlay matched with mockup layout (Right aligned for Arabic) */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 pt-20 pb-32" dir="rtl">
        <div className="max-w-xl animate-fade-in text-right">
          
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[72px] text-[#A44C5C] font-normal leading-[1.1] tracking-normal mb-2 shadow-sm drop-shadow-sm whitespace-pre-line">
            {currentSlideData.title}
            {currentSlideData.subtitle && (
              <span className="block text-[#DF8A9D]">{currentSlideData.subtitle}</span>
            )}
          </h2>
          
          {/* Decorative Ribbon Icon Placement (Simulated with text/lucide for now) */}
          <div className="my-6">
            <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#A44C5C] scale-x-[-1]">
               <path d="M16 12C16 16.4183 12.4183 20 8 20C3.58172 20 0 16.4183 0 12C0 7.58172 3.58172 4 8 4C12.4183 4 16 7.58172 16 12Z" fill="currentColor" fillOpacity="0.2"/>
               <path d="M40 12C40 16.4183 36.4183 20 32 20C27.5817 20 24 16.4183 24 12C24 7.58172 27.5817 4 32 4C36.4183 4 40 7.58172 40 12Z" fill="currentColor" fillOpacity="0.2"/>
               <circle cx="20" cy="12" r="4" fill="currentColor"/>
            </svg>
          </div>

          <p className="font-serif text-xl md:text-3xl text-[#0B0B0B] mb-10 drop-shadow-sm">
            {currentSlideData.description}
          </p>

          <div className="flex flex-wrap gap-4 items-center justify-start">
            <button
              onClick={onExplore}
              className="bg-[#A44C5C] text-[#FAF5F0] hover:bg-[#DF8A9D] border border-transparent px-8 py-3.5 rounded-full text-sm tracking-wider uppercase transition-colors inline-flex items-center justify-center gap-2 font-sans font-medium hover:scale-105 duration-300"
            >
              <span>{currentSlideData.ctaText}</span>
              <ArrowRight size={16} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
