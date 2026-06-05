import React from 'react';
import { Award, Feather, Sparkles } from 'lucide-react';

interface AboutUsProps {
  homepageSections?: any[];
}

export default function AboutUs({ homepageSections = [] }: AboutUsProps) {
  const aboutData = homepageSections.find(s => s.section_key === 'about_page')?.content_json;

  if (!aboutData) {
    return (
      <div className="bg-white min-h-screen py-32 text-center text-gray-400 font-serif">
        <p>Our story is being crafted.</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen animate-fade-in">
      
      {/* Hero Header */}
      <div className="bg-[#FAF5F0] py-24 md:py-32 border-b border-[#DF8A9D]/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl md:text-6xl font-light text-[#0B0B0B] tracking-wide mb-6 uppercase">
            {aboutData.title || 'The Sulta House'}
          </h2>
          <div className="w-12 h-[1px] bg-[#A44C5C] mx-auto mb-8" />
          <p className="font-serif italic text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            "{aboutData.quote || 'We believe that comfort and elegance are never mutually exclusive.'}"
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        
        {/* Editorial Layout 1 */}
        {aboutData.section1 && (
          <div className="flex flex-col md:flex-row gap-16 items-center mb-24">
            <div className="md:w-1/2 space-y-6 order-2 md:order-1">
              <h4 className="font-serif text-2xl md:text-3xl text-[#0B0B0B] font-normal tracking-wider uppercase">
                {aboutData.section1.title}
              </h4>
              <div 
                className="text-sm text-gray-600 leading-relaxed font-sans space-y-4"
                dangerouslySetInnerHTML={{ __html: aboutData.section1.content }}
              />
            </div>
            {aboutData.section1.imageUrl && (
              <div className="md:w-1/2 order-1 md:order-2 aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[#FAF5F0] relative">
                <img 
                  src={aboutData.section1.imageUrl} 
                  alt={aboutData.section1.title} 
                  className="w-full h-full object-cover mix-blend-multiply opacity-90"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        )}

        {/* Editorial Layout 2 */}
        {aboutData.section2 && (
          <div className="flex flex-col md:flex-row gap-16 items-center mb-24">
            {aboutData.section2.imageUrl && (
              <div className="md:w-1/2 aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[#FAF5F0] relative">
                <img 
                  src={aboutData.section2.imageUrl} 
                  alt={aboutData.section2.title} 
                  className="w-full h-full object-cover mix-blend-multiply opacity-90"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="md:w-1/2 space-y-6">
              <h4 className="font-serif text-2xl md:text-3xl text-[#0B0B0B] font-normal tracking-wider uppercase">
                {aboutData.section2.title}
              </h4>
              <div 
                className="text-sm text-gray-600 leading-relaxed font-sans space-y-4"
                dangerouslySetInnerHTML={{ __html: aboutData.section2.content }}
              />
            </div>
          </div>
        )}

        {/* Pillars */}
        {aboutData.pillars && aboutData.pillars.length > 0 && (
          <div className="bg-[#FAF5F0] py-20 px-8 text-center border-t border-[#DF8A9D]/20">
            <h4 className="font-serif text-2xl tracking-widest text-[#0B0B0B] font-medium mb-16 uppercase">
              {aboutData.pillarsTitle || 'The Golden Pillars'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              {aboutData.pillars.map((pillar: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center placeholder-gray-400 space-y-4">
                  <Sparkles size={28} className="text-[#A44C5C]" strokeWidth={1} />
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
