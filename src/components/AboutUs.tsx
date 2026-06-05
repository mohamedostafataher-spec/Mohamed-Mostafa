import React from 'react';
import { Award, Feather, Sparkles } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="bg-white min-h-screen">
      
      {/* Hero Header */}
      <div className="bg-[#FAF5F0] py-24 md:py-32 border-b border-[#DF8A9D]/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl md:text-6xl font-light text-[#0B0B0B] tracking-wide mb-6 uppercase">
            The Sulta House
          </h2>
          <div className="w-12 h-[1px] bg-[#A44C5C] mx-auto mb-8" />
          <p className="font-serif italic text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            "We believe that comfort and elegance are never mutually exclusive. They blend to create moments that overflow with pampering and luxury in your own home."
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        
        {/* Editorial Layout 1 */}
        <div className="flex flex-col md:flex-row gap-16 items-center mb-24">
          <div className="md:w-1/2 space-y-6 order-2 md:order-1">
            <h4 className="font-serif text-2xl md:text-3xl text-[#0B0B0B] font-normal tracking-wider uppercase">
              The Genesis of Comfort
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed font-sans">
              <strong>SULTA</strong> was founded to design luxury sleepwear that serves as a tranquil haven for every woman seeking uniqueness, even during her moments of rest and relaxation at home. We noticed the absence of designs that truly combine flawless ultimate comfort with supreme royal allure.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed font-sans">
              From here, our workshops set out to select the finest textiles, developed satin with a softness rivaling natural silk, golden silk threads, and organic Egyptian cotton. Quality that ensures peaceful sleep and endures for years.
            </p>
          </div>
          <div className="md:w-1/2 order-1 md:order-2 aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[#FAF5F0] relative">
            <img 
              src="https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=800" 
              alt="Sulta Heritage" 
              className="w-full h-full object-cover mix-blend-multiply opacity-90"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Editorial Layout 2 */}
        <div className="flex flex-col md:flex-row gap-16 items-center mb-24">
          <div className="md:w-1/2 aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[#FAF5F0] relative">
            <img 
              src="https://images.unsplash.com/photo-1542488856-11f62b083b8b?auto=format&fit=crop&q=80&w=800" 
              alt="Sulta Vision" 
              className="w-full h-full object-cover mix-blend-multiply opacity-90"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="md:w-1/2 space-y-6">
            <h4 className="font-serif text-2xl md:text-3xl text-[#0B0B0B] font-normal tracking-wider uppercase">
              Vision & Mission
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed font-sans">
              <strong>Our Vision:</strong> To lead the throne of luxury sleepwear and loungewear, becoming the first brand that comes to the mind of every woman who is proud of her femininity and seeks quiet pampering.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed font-sans">
              <strong>Our Mission:</strong> Designing and crafting pieces that rival the finest Parisian couture houses, presented in luxurious packaging that grants you an unforgettable, elevated shopping experience from the very first moment.
            </p>
          </div>
        </div>

        {/* Pillars */}
        <div className="bg-[#FAF5F0] py-20 px-8 text-center border-t border-[#DF8A9D]/20">
          <h4 className="font-serif text-2xl tracking-widest text-[#0B0B0B] font-medium mb-16 uppercase">
            The Golden Pillars
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            <div className="flex flex-col items-center placeholder-gray-400 space-y-4">
              <Feather size={28} className="text-[#A44C5C]" strokeWidth={1} />
              <h5 className="font-serif font-semibold text-sm tracking-widest uppercase text-[#0B0B0B]">Absolute Lightness</h5>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                Treated fabrics offering comfortable coolness in summer and elegant warmth in winter.
              </p>
            </div>

            <div className="flex flex-col items-center placeholder-gray-400 space-y-4">
              <Award size={28} className="text-[#A44C5C]" strokeWidth={1} />
              <h5 className="font-serif font-semibold text-sm tracking-widest uppercase text-[#0B0B0B]">Couture Touch</h5>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                Natural pearl buttons and double silk stitching ensuring unique texture and unmatched longevity.
              </p>
            </div>

            <div className="flex flex-col items-center placeholder-gray-400 space-y-4">
              <Sparkles size={28} className="text-[#A44C5C]" strokeWidth={1} />
              <h5 className="font-serif font-semibold text-sm tracking-widest uppercase text-[#0B0B0B]">Unforgettable Memories</h5>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                Luxury packaging and attention to detail give you a princess-like feeling with every order.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
