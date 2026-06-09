import React, { useState } from 'react';
import { ShieldCheck, Heart, Sparkles, Star, User, Layers, Ruler, HelpCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Product } from '../types';
import { cleanImgUrl } from '../services/db';

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
  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

  // Wizard flow state
  // Steps: 1 (Occasion), 2 (Texture & Color), 3 (ruler size calculate), 4 (curation matches)
  const [step, setStep] = useState<number>(1);
  
  // Customization selection state
  const [occasion, setOccasion] = useState<string>('bridal');
  const [fabric, setFabric] = useState<string>('satin');
  const [colorTone, setColorTone] = useState<string>('pink');
  
  // Size Calculator
  const [weight, setWeight] = useState<number>(65);
  const [height, setHeight] = useState<number>(165);
  const [fitStyle, setFitStyle] = useState<'regular' | 'loose'>('regular');
  const [calculatedSize, setCalculatedSize] = useState<string>('M');

  // Occasion Details
  const OCCASIONS = [
    { id: 'bridal', title: 'تحضيرات زواج أو بيجامة الصباحية للعروس 👰', desc: 'أطقم كوتور باللونين الأبيض العاجي والوردي الهادئ مطعمة بالريش الطبيعي والدانتيل الفرنسي العريض.' },
    { id: 'salon', title: 'الاسترخاء الصالوني والمقابلة الخاصة ☕', desc: 'أطقم مريحة من اللانجري المنسدل والحرير الخفيف بلمسات الكارديجان للاسترخاء اليومي الراقي.' },
    { id: 'travel', title: 'السفر، الرحلات والمنتجعات الخاصة ✈️', desc: 'تعبئة مدمجة وخامات ضد التكسيد وعملية وسهلة التوضيب للسفر والمنتجعات الصيفية.' },
    { id: 'daily', title: 'طقوسي اليومية لتهيئة النوم الهانئ 💤', desc: 'البيجامات الأبسط نسيجاً والأثقل وزناً لتهدئة الجسد وتوفير الارتخاء المريح للغاية.' }
  ];

  // Logic to calculate size recommendation
  const handleCalculateSize = () => {
    let size = 'M';
    if (weight < 55) {
      size = 'S';
    } else if (weight >= 55 && weight < 70) {
      size = 'M';
    } else if (weight >= 70 && weight < 85) {
      size = 'L';
    } else if (weight >= 85 && weight < 95) {
      size = 'XL';
    } else {
      size = 'XXL';
    }

    // Adjust for loose fit or height
    if (fitStyle === 'loose' && size !== 'XXL') {
      const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
      const idx = sizes.indexOf(size);
      size = sizes[idx + 1];
    }
    
    setCalculatedSize(size);
    setStep(4);
  };

  // Curation list matching user choices
  const getCurationList = () => {
    return products.filter(p => {
      if (p.status !== 'active') return false;
      
      // Filter by category or description loosely based on inputs
      if (occasion === 'bridal' && (p.category === 'sleepwear' || p.isBestSeller)) return true;
      if (fabric === 'velvet' && (p.descriptionAr?.includes('مخمل') || p.category === 'homewear')) return true;
      if (fabric === 'satin' && (p.category === 'sleepwear' || p.category === 'loungewear')) return true;
      
      return true;
    }).slice(0, 3);
  };

  const curatedItems = getCurationList();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-right" dir="rtl">
      {/* Editorial Header */}
      <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
        <span className="text-[9px] text-[#A44C5C] font-semibold tracking-[0.3em] uppercase block">
          ✦ CONCIERGE PERSONNALISÉ SULTA ✦
        </span>
        <h2 className="font-serif text-3xl font-light text-[#0B0B0B] tracking-wide">
          مُساعد الأناقة والمقاسات الخاص
        </h2>
        <div className="w-12 h-[1px] bg-[#A44C5C]/35 mx-auto my-2" />
        <p className="text-gray-500 text-3xs sm:text-2xs max-w-md mx-auto leading-relaxed">
          أهلاً بكِ في ركن الاستشارة الشخصية. نساعدكِ خطوة بخطوة في اختيار أنسب القطع لطقوسكِ وحساب المقاس الإيطالي الدقيق لتجربة استرخاء خالية من المتاعب.
        </p>
      </div>

      {/* Progress timeline */}
      <div className="flex justify-between items-center max-w-md mx-auto mb-12 relative select-none font-sans text-2xs font-semibold text-gray-400">
        <div className="absolute left-0 right-0 h-[2px] bg-neutral-100 top-1/2 -translate-y-1/2 z-0" />
        {[
          { label: 'المناسبة', s: 1 },
          { label: 'اللمسة والألوان', s: 2 },
          { label: 'دقة المقاس', s: 3 },
          { label: 'توصية الكوتور', s: 4 }
        ].map(item => (
          <div 
            key={item.s} 
            className={`relative z-10 px-4 py-1.5 rounded-full border transition-all duration-500 ${
              step >= item.s 
                ? 'bg-[#0B0B0B] text-[#F6E7A6] border-black scale-102 font-bold shadow-xs' 
                : 'bg-white border-gray-200'
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* STEP WIZARD FRAMES */}
      <div className="bg-white rounded-[2rem] border border-[#DF8A9D]/12 p-6 md:p-10 shadow-2xs min-h-[360px] flex flex-col justify-between">
        
        {/* FRAME 1: Occasion selection */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in-rapid">
            <div className="space-y-1.5 border-b border-neutral-100 pb-3">
              <h3 className="font-serif text-lg font-medium text-gray-950">١. ما هي المناسبة الخاصة التي تجري التجهيز لها؟</h3>
              <p className="text-xs text-gray-400">اختاري هدف الشراء لنقترح أنسب التناغمات والمميزات.</p>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {OCCASIONS.map(occ => {
                const isSel = occasion === occ.id;
                return (
                  <div
                    key={occ.id}
                    onClick={() => setOccasion(occ.id)}
                    className={`p-4 rounded-2xl border text-right cursor-pointer transition-all ${
                      isSel 
                        ? 'bg-[#A44C5C]/5 text-[#A44C5C] border-[#A44C5C] ring-1 ring-[#A44C5C]' 
                        : 'bg-white text-gray-700 hover:bg-neutral-50 border-gray-200'
                    }`}
                  >
                    <h4 className="text-xs sm:text-[13px] font-bold">{occ.title}</h4>
                    <p className="text-3xs sm:text-2xs text-gray-500 mt-1">{occ.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="bg-[#A44C5C] text-white hover:bg-[#A44C5C]/90 px-8 py-3.5 rounded-xl text-xs font-serif font-bold tracking-widest flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>المُتابعة والتَّنسيق</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* FRAME 2: Texture & Color selection */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in-rapid">
            <div className="space-y-1.5 border-b border-neutral-100 pb-3">
              <h3 className="font-serif text-lg font-medium text-gray-950">٢. ما هي الأنسجة والألوان الملهمة لذوقكِ الفخم؟</h3>
              <p className="text-xs text-gray-400">الملامس تترجم لغة الراحة والدفء الداخلي.</p>
            </div>

            {/* Fabric textures selector */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">ملمس ونوع النسيج:</span>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'satin', label: 'الحرير والساتان الصاي المبرد 🧵', d: 'ناعم للغاية، مثالي للنوم العميق وضد خدوش وتجاعيد البشرة.' },
                  { id: 'velvet', label: 'المخمل والقطيفة الثقيلة ❄️', d: 'فاخر، دافئ للغاية، ملائم لفترات الفخامة الصالونية الشتوية.' }
                ].map(item => (
                  <div
                    key={item.id}
                    onClick={() => setFabric(item.id)}
                    className={`p-4 rounded-xl border text-right cursor-pointer transition-all ${
                      fabric === item.id 
                        ? 'bg-[#A44C5C]/6 border-[#A44C5C] text-[#A44C5C]' 
                        : 'bg-white text-gray-700 hover:bg-neutral-50 border-gray-200'
                    }`}
                  >
                    <h4 className="text-xs font-bold">{item.label}</h4>
                    <p className="text-3xs text-gray-400 mt-1 leading-normal">{item.d}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Luxury colors suggestions */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-sans">توني ألوان ذوقكِ المفضل:</span>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: 'pink', name: 'الوردي الهادئ', hex: '#FAF4F5' },
                  { id: 'white', name: 'الأبيض العاجي', hex: '#FAFAF7' },
                  { id: 'black', name: 'الأسود الترف', hex: '#0B0B0B' },
                  { id: 'gold', name: 'الذهبي اللامع', hex: '#FAF5F0' }
                ].map(tone => (
                  <div
                    key={tone.id}
                    onClick={() => setColorTone(tone.id)}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      colorTone === tone.id 
                        ? 'border-gray-900 ring-2 ring-pink-100 bg-neutral-50' 
                        : 'border-gray-150 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full mx-auto mb-1 border border-gray-250" style={{ backgroundColor: tone.hex === '#0B0B0B' ? '#111' : tone.hex }} />
                    <span className="text-[9px] font-bold text-gray-700">{tone.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                onClick={() => setStep(1)}
                className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>الرجوع للمناسبة</span>
              </button>
              
              <button
                onClick={() => setStep(3)}
                className="bg-[#A44C5C] text-white hover:bg-[#A44C5C]/90 px-8 py-3.5 rounded-xl text-xs font-serif font-bold tracking-widest flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>مُطابقة مقاسي الإيطالي</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* FRAME 3: Size Advisor */}
        {step === 3 && (
          <div className="space-y-8 animate-fade-in-rapid">
            <div className="space-y-1.5 border-b border-neutral-100 pb-3">
              <h3 className="font-serif text-lg font-medium text-gray-950">٣. حاسبة مقاس SULTA الإيطالي الدقيق</h3>
              <p className="text-xs text-gray-400">قومي بضبط الوزن والطول لنحدد المقاس المثالي بدون أخطاء.</p>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              {/* Weight Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">تقدير الوزن الحالي:</span>
                  <span className="text-xs font-bold text-[#A44C5C] font-mono">{weight} كجم</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="110"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#A44C5C]"
                />
              </div>

              {/* Height Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">تقدير الطول الفعلي:</span>
                  <span className="text-xs font-bold text-[#A44C5C] font-mono">{height} سم</span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="190"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#A44C5C]"
                />
              </div>
            </div>

            {/* Preferred Fit style toggler */}
            <div className="space-y-3 bg-[#FAF5F0] p-4 rounded-xl border border-[#DF8A9D]/10">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">شكل تفضيل الارتداء:</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                  <input
                    type="radio"
                    name="fit"
                    checked={fitStyle === 'regular'}
                    onChange={() => setFitStyle('regular')}
                    className="accent-[#A44C5C]"
                  />
                  <span>كلاسيكي مبرز لتضاريس الجمال (Classic Fitted)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                  <input
                    type="radio"
                    name="fit"
                    checked={fitStyle === 'loose'}
                    onChange={() => setFitStyle('loose')}
                    className="accent-[#A44C5C]"
                  />
                  <span>فضفاض مريح فسيح للاسترخاء (Relaxed Loose)</span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                onClick={() => setStep(2)}
                className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>الرجوع للتنسيق والألوان</span>
              </button>
              
              <button
                onClick={handleCalculateSize}
                className="bg-black text-[#F6E7A6] hover:bg-neutral-900 px-8 py-3.5 rounded-xl text-xs font-serif font-bold tracking-widest flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>احسبي واعرضي المقترحات ✦</span>
                <Ruler size={14} className="text-[#F6E7A6]" />
              </button>
            </div>
          </div>
        )}

        {/* FRAME 4: Curation results & recommendations */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in-rapid">
            <div className="space-y-1 bg-[#0B0B0B] text-white p-6 rounded-2xl border border-white/5 text-center relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-2 left-2 text-3xs text-[#F6E7A6] tracking-widest font-mono">ESTIMATION COMPLETED</div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">المقاس الإيطالي الموصى به لكِ:</span>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#F6E7A6] my-2">{calculatedSize}</h2>
              <p className="text-[10.5px] text-gray-300 max-w-sm leading-relaxed">
                بناءً على الوزن {weight}كجم وميلك لارتداء بيجامة {fitStyle === 'loose' ? 'فضفاضة مريحة' : 'كلاسيكية مخصرة'}، نوصيكِ بشراء المقاس الفخم {calculatedSize} لراحة قصوى متناهية الجمال والدلال.
              </p>
            </div>

            {/* Results cards */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">روائع الكوتور المختارة بعناية لكِ:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {curatedItems.splice(0, 3).map((prod) => {
                  const priceVal = country === 'EG' ? prod.priceEG : prod.priceSA;
                  const imgToUse = cleanImgUrl(prod.images[0], prod.category);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => onSelectProduct(prod)}
                      className="group flex flex-col bg-neutral-50 rounded-xl p-3 border border-gray-150 hover:border-[#DF8A9D]/25 hover:bg-white cursor-pointer transition-all duration-300 shadow-2xs hover:shadow-md"
                    >
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2.5">
                        <img src={imgToUse} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="text-[10.5px] font-semibold text-gray-900 line-clamp-1">{country === 'EG' ? prod.nameAr : prod.nameEn}</h4>
                        <div className="text-[9.5px] text-[#A44C5C] font-semibold font-mono">{priceVal.toLocaleString()} {currencyLabel}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-neutral-105">
              <button
                onClick={() => setStep(3)}
                className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>إعادة تقدير المقاس</span>
              </button>

              <button
                onClick={() => setStep(1)}
                className="bg-[#A44C5C] text-white hover:bg-[#A44C5C]/90 px-8 py-3 rounded-xl text-xs font-serif font-bold tracking-widest hover:scale-[1.01] transition-all cursor-pointer"
              >
                بدء تشخيص جديد ↺
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
