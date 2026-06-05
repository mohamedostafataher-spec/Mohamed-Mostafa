import React from 'react';
import { Award, Feather, Sparkles } from 'lucide-react';
import RibbonBowDivider from './RibbonBowDivider';

interface AboutUsProps {
  homepageSections?: any[];
}

export default function AboutUs({ homepageSections = [] }: AboutUsProps) {
  const fallbackStory = {
    title: 'SULTA HOUSE | دار سلطة',
    quote: 'We believe that sleepwear is not just a routine — it is a daily ritual of resetting and pampering oneself.',
    section1: {
      title: 'Our Exquisite Heritage / إرثنا الملكي',
      content: 'Founded to deliver the softest linen and heat-treated modal sleepwear in the Middle East. Every Sulta piece is designed dynamically to wrap you in comfort and peace. Our signature textiles are cooled and treated to stay perfectly breathable and flowy.',
      imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800'
    },
    section2: {
      title: 'The Softest Life Philosophy / فلسفة النعومة الملكية',
      content: 'We combine French Parisian sleep couture with modern Middle-Eastern premium tastes. Handcrafted with pink bow ribbons, lace trims, and delicate details, we believe that high-end sleepwear should make you feel royal every night.',
      imageUrl: '/src/assets/images/hero_sleepwear_luxury_1780620325112.png'
    },
    pillarsTitle: 'Our Timeless Commitments / التزامات تليق بكِ',
    pillars: [
      { title: 'Royal Weave / غزل ملكي', description: 'Threads processed with heat-stabilized modal, ensuring silk-like flow and supreme durability.' },
      { title: 'Fine Finish / لمسة دقيقة', description: 'Sewn with care by expert tailoring salons, carrying neat coquette lace bows and invisible stitching.' },
      { title: 'Direct Value / قيمة حقيقية', description: 'A bridge from workshop to boutique, maximizing fabric quality while maintaining fair pricing.' }
    ]
  };

  const aboutData = homepageSections.find(s => s.section_key === 'about_page')?.content_json || fallbackStory;

  return (
    <div className="bg-[#FAF4F5] min-h-screen animate-fade-in py-12">
      
      {/* Hero Header */}
      <div className="bg-[#FAF5F0] py-20 border-b border-[#DF8A9D]/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[#0B0B0B] tracking-widest mb-4 uppercase">
            {aboutData.title || 'SULTA HOUSE'}
          </h2>
          <div className="py-2">
            <RibbonBowDivider />
          </div>
          <p className="font-serif italic text-base md:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mt-4">
            "{aboutData.quote || 'We believe that comfort and elegance are never mutually exclusive.'}"
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        
        {/* Editorial Layout 1 */}
        {aboutData.section1 && (
          <div className="flex flex-col md:flex-row gap-16 items-center mb-24">
            <div className="md:w-1/2 space-y-6 order-2 md:order-1">
              <h4 className="font-serif text-2xl md:text-3xl text-[#0B0B0B] font-normal tracking-wider uppercase border-b border-[#DF8A9D]/10 pb-4">
                {aboutData.section1.title}
              </h4>
              <p className="text-sm md:text-base text-gray-650 leading-relaxed font-serif">
                {aboutData.section1.content}
              </p>
            </div>
            {aboutData.section1.imageUrl && (
              <div className="md:w-1/2 order-1 md:order-2 aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-white relative rounded-3xl shadow-md border border-pink-100">
                <img 
                  src={aboutData.section1.imageUrl} 
                  alt={aboutData.section1.title} 
                  className="w-full h-full object-cover opacity-95 hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        )}

        <div className="my-16">
          <RibbonBowDivider />
        </div>

        {/* Editorial Layout 2 */}
        {aboutData.section2 && (
          <div className="flex flex-col md:flex-row gap-16 items-center mb-24">
            {aboutData.section2.imageUrl && (
              <div className="md:w-1/2 aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-white relative rounded-3xl shadow-md border border-pink-100">
                <img 
                  src={aboutData.section2.imageUrl} 
                  alt={aboutData.section2.title} 
                  className="w-full h-full object-cover opacity-95 hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="md:w-1/2 space-y-6">
              <h4 className="font-serif text-2xl md:text-3xl text-[#0B0B0B] font-normal tracking-wider uppercase border-b border-[#DF8A9D]/10 pb-4">
                {aboutData.section2.title}
              </h4>
              <p className="text-sm md:text-base text-gray-655 leading-relaxed font-serif">
                {aboutData.section2.content}
              </p>
            </div>
          </div>
        )}

        {/* Pillars */}
        {aboutData.pillars && aboutData.pillars.length > 0 && (
          <div className="bg-[#FAF5F0] py-16 px-8 text-center border border-[#DF8A9D]/10 rounded-3xl shadow-sm">
            <h4 className="font-serif text-2xl tracking-widest text-[#0B0B0B] font-medium mb-12 uppercase">
              {aboutData.pillarsTitle || 'The Golden Pillars'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              {aboutData.pillars.map((pillar: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center space-y-4 bg-white p-6 rounded-2xl shadow-xs border border-pink-50">
                  <Sparkles size={24} className="text-[#A44C5C]" strokeWidth={1.5} />
                  <h5 className="font-serif font-semibold text-sm tracking-widest uppercase text-[#0B0B0B]">{pillar.title}</h5>
                  <p className="text-xs text-gray-500 font-sans leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
