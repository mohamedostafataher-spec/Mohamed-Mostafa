import React, { useState } from 'react';
import { ShieldCheck, Heart, Sparkles, Star, User, Layers, Ruler, HelpCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Product } from '../types';
import AiProductAdvisor from './AiProductAdvisor';

interface SultaConciergeProps {
  products: Product[];
  country: 'EG' | 'SA';
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, color: { name: string; hex: string }, size: string, qty: number) => void;
}

export default function SultaConcierge({
  products,
  country,
  favorites,
  toggleFavorite,
  onSelectProduct,
  onAddToCart
}: SultaConciergeProps) {
  const [advisorView, setAdvisorView] = useState<'advisor' | 'quick-size'>('advisor');

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 space-y-12 text-right font-sans select-none" dir="rtl" id="sulta_digital_concierge">
      
      {/* Header card description */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="bg-[#A44C5C]/5 text-[#A44C5C] text-[10px] font-bold px-3 py-1 rounded-full font-serif font-black tracking-widest uppercase">
          SULTA DIGITAL ATELIER • صالون الاستشارات الملكية
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-light text-gray-950 tracking-tight leading-relaxed">
          مستشارتِك الشخصية كوتور
        </h1>
        <p className="text-gray-500 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
          مرحباً بكِ في البوتيك الاستشاري الفاخر. تتيح لكِ هذه البوابة التفاعل مع خبيرتنا الذكية واكتشاف المقاس المناسب وطراز الحرير المطابق لتطلعات جمالكِ.
        </p>

        {/* View Toggle */}
        <div className="flex gap-2 p-1 bg-stone-100 rounded-2xl w-fit mx-auto border border-stone-200 mt-6 overflow-hidden">
          <button
            onClick={() => setAdvisorView('advisor')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${advisorView === 'advisor' ? 'bg-white shadow-xs text-gray-950 border border-stone-200' : 'text-gray-500 hover:text-gray-800'}`}
          >
            👑 مستشارة الموديل والأناقة SULTA Advisor
          </button>
          <button
            onClick={() => setAdvisorView('quick-size')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${advisorView === 'quick-size' ? 'bg-white shadow-xs text-gray-950 border border-stone-200' : 'text-gray-500 hover:text-gray-800'}`}
          >
            📏 حاسبة المقاسات التلقائية
          </button>
        </div>
      </div>

      {advisorView === 'advisor' ? (
        <div className="animate-fade-in-rapid">
          <AiProductAdvisor allProducts={products} onSelectProduct={onSelectProduct} />
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto bg-white border border-stone-200 p-6 md:p-8 rounded-3.5xl space-y-8 animate-fade-in-rapid">
          <div className="border-b border-gray-100 pb-5">
            <span className="text-xs text-[#A44C5C] font-semibold">حاسبة القياس الملكية المقيدة بالمقاييس</span>
            <h3 className="font-serif text-xl font-bold text-gray-900 mt-1">المحاكاة السريعة لقياس الجسد</h3>
            <p className="text-gray-550 text-xs leading-relaxed mt-1">سيدس محركنا نسب الأوراك والكتلة الخاصة بك بالارتكاز على إدخال طولك الدقيق ووزنك.</p>
          </div>
          
          {/* Sizing sliders directly inside to let them play */}
          <QuickSizerProducts products={products} country={country} onSelectProduct={onSelectProduct} />
        </div>
      )}

    </div>
  );
}

// Quick sized auxiliary product recommendation slider
function QuickSizerProducts({ products, country, onSelectProduct }: { products: Product[], country: 'EG' | 'SA', onSelectProduct: (p: Product) => void }) {
  const [h, setH] = useState<number>(165);
  const [w, setW] = useState<number>(60);
  const [pref, setPref] = useState<'fitted' | 'regular' | 'loose'>('regular');

  // BMI simple index math
  const heightM = h / 100;
  const bmiTmp = w / (heightM * heightM);
  let size = 'M';
  if (bmiTmp < 19) size = 'S';
  else if (bmiTmp >= 19 && bmiTmp < 25) size = 'M';
  else if (bmiTmp >= 25 && bmiTmp < 30) size = 'L';
  else if (bmiTmp >= 30 && bmiTmp < 34) size = 'XL';
  else size = 'XXL';

  if (pref === 'loose') {
    if (size === 'S') size = 'M';
    else if (size === 'M') size = 'L';
    else if (size === 'L') size = 'XL';
    else if (size === 'XL') size = 'XXL';
  } else if (pref === 'fitted') {
    if (size === 'XXL') size = 'XL';
    else if (size === 'XL') size = 'L';
    else if (size === 'L') size = 'M';
    else if (size === 'M') size = 'S';
  }

  const matches = products.filter(p => p.sizes.includes(size)).slice(0, 3);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-gray-800">
              <span>الطول بالسم:</span>
              <span className="font-mono text-[#A44C5C]">{h} سم</span>
            </div>
            <input type="range" min={140} max={200} value={h} onChange={e=>setH(Number(e.target.value))} className="w-full accent-[#A44C5C]" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-gray-800">
              <span>الوزن بالكجم:</span>
              <span className="font-mono text-[#A44C5C]">{w} كجم</span>
            </div>
            <input type="range" min={40} max={120} value={w} onChange={e=>setW(Number(e.target.value))} className="w-full accent-[#A44C5C]" />
          </div>

          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-bold text-gray-800 block">درجة الانسدال والاتساع:</span>
            <div className="flex gap-2">
              {['fitted', 'regular', 'loose'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPref(p as any)}
                  className={`flex-1 py-2 text-[10.5px] font-bold rounded-xl border cursor-pointer ${pref === p ? 'border-[#A44C5C] bg-[#A44C5C]/5 text-[#A44C5C]' : 'border-gray-200 bg-white text-gray-500'}`}
                >
                  {p === 'fitted' ? 'مخصر' : p === 'regular' ? 'معتدل' : 'فضفاض كيمونو'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="bg-stone-900 border border-stone-850 rounded-2.5xl p-5 text-white flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-[#F6E7A6] lowercase font-mono">optimal computed size</span>
            <h4 className="text-5xl font-serif font-black text-rose-300 leading-none">{size}</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed mt-2">
              لقد حسبنا مقاسك المتوافق {size} بنسب تباينية جيدة ومقاسات مريحة للاسترخاء اليومي.
            </p>
          </div>
          <div className="bg-white/10 px-3 py-2 rounded-xl text-center text-emerald-400 text-[10.5px] font-bold mt-4">
            ✓ متوافر للشراء الفوري والطلب الملكي 👑
          </div>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-gray-100">
          <span className="text-[11px] font-bold text-stone-500 block">روائع الأطقم الداعمة والمتاحة بمقاسكِ {size}:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {matches.map((p) => {
              const price = country === 'EG' ? p.priceEG : p.priceSA;
              const cur = country === 'EG' ? 'ج.م' : 'ر.س';
              return (
                <div 
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className="bg-neutral-50/75 p-3 rounded-2xl border border-gray-200/50 hover:bg-white cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <img src={p.images[0] || '/img/placeholder.png'} className="w-full h-32 object-cover rounded-xl border border-gray-100" referrerPolicy="no-referrer" />
                    <h5 className="text-[11px] font-bold text-gray-900 mt-2 truncate">{p.nameAr}</h5>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 text-[10px]">
                    <span className="text-[#A44C5C] font-bold">{price} {cur}</span>
                    <span className="text-gray-400">انقري للعرض</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
