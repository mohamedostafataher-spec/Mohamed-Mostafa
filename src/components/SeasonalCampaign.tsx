import React from 'react';
import { Sparkles, ArrowLeft, Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import SultaImage from './SultaImage';

interface SeasonalCampaignProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onExplore: () => void;
}

export default function SeasonalCampaign({ products, onSelectProduct, onExplore }: SeasonalCampaignProps) {
  // Select top 4 cozy products
  const cozyProducts = products
    .filter(p => p.status === 'active')
    .slice(0, 4);

  if (cozyProducts.length === 0) return null;

  return (
    <section className="py-12 bg-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Campaign Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-[#A44C5C] text-[10px] font-bold tracking-widest uppercase">
            <Sparkles size={12} className="animate-pulse" />
            <span>SULTA Cozy Season 2026</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 font-serif">
            راحتك صارت ستايل — كوليكشن الموسم
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            لأنكِ تستحقين الاسترخاء بأبهى صورة، اخترنا لكِ مجموعة من البيجامات القطنية الناعمة التي تجمع بين الدفء والأناقة العصرية.
          </p>
        </div>

        {/* Featured Campaign Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {cozyProducts.map((product) => (
            <div 
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="group cursor-pointer space-y-3"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 shadow-xs group-hover:shadow-md transition-all duration-500">
                <SultaImage 
                  src={product.images[0]} 
                  alt={product.nameAr}
                  width="md"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-400 group-hover:text-red-500 transition-colors shadow-sm">
                    <Heart size={14} />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <button className="w-full py-2.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-2">
                    <ShoppingBag size={12} />
                    <span>تسوقي الآن</span>
                  </button>
                </div>
              </div>
              <div className="text-right px-1">
                <h3 className="text-xs font-bold text-gray-900 group-hover:text-[#A44C5C] transition-colors line-clamp-1">
                  {product.nameAr}
                </h3>
                <div className="flex items-center gap-1.5 justify-end mt-1">
                  <span className="text-[13px] font-black text-[#A44C5C] font-mono">{product.priceSA}</span>
                  <span className="text-[10px] font-bold text-gray-400">ر.س</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Campaign Footer CTA */}
        <div className="mt-10 text-center">
          <button
            onClick={onExplore}
            className="inline-flex items-center gap-2 bg-gray-950 hover:bg-black text-white px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 group"
          >
            <span>اكتشفي كوليكشن Cozy Season بالكامل</span>
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
