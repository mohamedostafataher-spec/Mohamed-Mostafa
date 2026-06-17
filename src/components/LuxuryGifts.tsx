import React, { useState } from 'react';
import { Gift, Sparkles, Check, Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import { Product } from '../types';
import { cleanImgUrl } from '../services/db';
import { ProductPrice } from './ProductPrice';

interface LuxuryGiftsProps {
  products: Product[];
  country: 'EG' | 'SA';
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, color: { name: string; hex: string }, size: string, qty: number) => void;
}

export default function LuxuryGifts({
  products,
  country,
  favorites,
  toggleFavorite,
  onSelectProduct,
  onAddToCart
}: LuxuryGiftsProps) {
  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';
  const giftItems = products.filter(p => p.status === 'active' && (p.isBestSeller || p.featured)).slice(0, 4);

  // Gifting customization states
  const [selectedBox, setSelectedBox] = useState<'classic' | 'royal' | 'pouch'>('classic');
  const [cardMessage, setCardMessage] = useState<string>('');
  const [isGiftAdded, setIsGiftAdded] = useState<boolean>(false);

  // Brand-defined packaging parameters
  const PACKAGING = {
    classic: {
      title: 'صندوق SULTA الكلاسيكي المطفي الأسود',
      desc: 'صندوق كرتوني سميك فاخر باللون الأسود الملكي، مبطّن بورق مناديل الحرير الوردي الناعم ومحكم بشريط ستان ذهبي عريض.',
      fee: country === 'EG' ? 100 : 15,
      img: '/img/sulta_product_2.png'
    },
    royal: {
      title: 'صندوق العرائس الملكي الفخم للزفاف',
      desc: 'صندوق جلدي أسود كبير مزخرف بحروف ذهبية بارزة مع طبقة واقية وحقيبة تسوق فخمة وبطاقة شكر مخملية.',
      fee: country === 'EG' ? 250 : 35,
      img: '/img/sulta_product_1.png'
    },
    pouch: {
      title: 'حقيبة كوتور الحريرية الفاخرة للرحلات',
      desc: 'حقيبة قماشية من الساتان المصقول برباط مخملي لتخزين القطع الثمينة والمحافظة عليها أثناء التنقل والسفر.',
      fee: country === 'EG' ? 50 : 8,
      img: '/img/sulta_hero_banner.png'
    }
  };

  const handleApplyGiftConfig = () => {
    setIsGiftAdded(true);
    setTimeout(() => {
      setIsGiftAdded(false);
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-right" dir="rtl">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <div className="flex justify-center items-center gap-1.5 text-[#A44C5C] text-xs font-serif tracking-widest font-bold">
          <Gift size={14} className="text-[#A44C5C]" />
          <span>SULTA COUTURE GIFTING EXPERIENCE</span>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0B0B0B] tracking-wide">
          هدايا SULTA | صندوق السعادة والكمال لعروسكِ
        </h2>
        <div className="w-16 h-[1px] bg-[#A44C5C]/30 mx-auto my-3" />
        <p className="text-gray-500 text-xs leading-relaxed max-w-lg mx-auto">
          امنحي من تحبين تجربة فتح بكج مذهلة لا غبار عليها. تغليف فاخر متوفر باللون الأسود المطفي مع شرائط الستان الحريرية وبطاقات التهنئة المفتوحة يدوياً لتخليد أرق اللحظات.
        </p>
      </div>

      {/* Gift Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-[2.5rem] p-6 md:p-10 border border-[#DF8A9D]/12 shadow-sm mb-16">
        
        {/* Left column: Box visualization & Card message Preview */}
        <div className="space-y-6 flex flex-col justify-center">
          <div className="relative aspect-[4/3] rounded-[1.8rem] overflow-hidden bg-neutral-50 border border-gray-100">
            <img 
              src={cleanImgUrl(PACKAGING[selectedBox].img)} 
              alt="Luxury Packaging" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-6 right-6 text-white">
              <span className="text-[10px] tracking-widest text-[#F6E7A6] font-bold uppercase block mb-1">تعبئة وتغليف كوتور</span>
              <h4 className="font-serif text-base font-medium">{PACKAGING[selectedBox].title}</h4>
            </div>
          </div>

          {/* Golden Letter Card preview */}
          <div className="bg-[#FAF5F0] border-2 border-dashed border-[#A44C5C]/20 p-6 rounded-2xl relative">
            <div className="absolute top-3 left-3 text-2xs text-[#A44C5C]/40 font-serif italic">Atelier Sulta Card</div>
            <h5 className="font-serif text-xs text-[#A44C5C] font-semibold mb-3">بطاقة التهنئة بالخط العربي الفاخر:</h5>
            <div className="bg-white p-4 rounded-xl text-center min-h-[90px] flex items-center justify-center border border-[#DF8A9D]/10">
              {cardMessage ? (
                <p className="font-serif italic text-xs leading-relaxed text-[#0B0B0B] whitespace-pre-line tracking-wide">
                  {cardMessage}
                </p>
              ) : (
                <p className="text-gray-300 text-2xs italic">
                  اكتبي هنا رسالتكِ الفاخرة للعروس أو الصديقة، وسيقوم خطاط سولتة بنقشها بماء الذهب وعناية بالغة...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customizer Selector inputs */}
        <div className="space-y-8 text-right">
          <div className="space-y-2">
            <h3 className="font-serif text-xl font-medium text-[#0B0B0B]">صممي بكج كوتور الخاص بكِ</h3>
            <p className="text-gray-400 text-2xs">أضيفي لمستك الملوكية على الهدايا وسيتم تجهيزها وتعبئتها وشحنها مباشرة.</p>
          </div>

          {/* Box select list */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">١. اخْتاري نَوْع التَّغليف المُفضَّل:</span>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(PACKAGING) as Array<keyof typeof PACKAGING>).map((key) => {
                const item = PACKAGING[key];
                const isActive = selectedBox === key;

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedBox(key)}
                    className={`p-4 rounded-xl border text-right cursor-pointer transition-all flex justify-between items-center ${
                      isActive 
                        ? 'bg-[#0B0B0B] text-white border-black shadow-md' 
                        : 'bg-white text-gray-700 hover:bg-neutral-50 border-gray-150'
                    }`}
                  >
                    <div>
                      <h4 className={`text-xs font-semibold ${isActive ? 'text-[#F6E7A6]' : 'text-gray-800'}`}>{item.title}</h4>
                      <p className={`text-[10px] mt-1 ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>{item.desc}</p>
                    </div>
                    <div className="text-left font-serif font-bold text-xs shrink-0 pl-2">
                      +{item.fee} {currencyLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Letter text input */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">٢. اِكْتبي رِسالة الهَدِيَّة:</span>
            <textarea
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value.slice(0, 150))}
              placeholder="مثال: ألف مبروك الزواج يا أغلى صديقة، تمنياتي لكِ برغد كامل وحياة ناعمة كالحرير..."
              rows={3}
              className="w-full text-xs p-3.5 bg-[#FAF4F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A44C5C]/20 border border-transparent focus:border-[#A44C5C] text-right"
            />
            <div className="text-3xs text-gray-400">الحد الأقصى ١٥٠ حرفاً. سيتم نقشها يدوياً وبطابع فاخر بدقة وعناية.</div>
          </div>

          {/* Action apply button */}
          <div>
            <button
              onClick={handleApplyGiftConfig}
              className={`w-full py-4 rounded-xl text-xs font-serif font-bold tracking-widest uppercase transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-2 ${
                isGiftAdded 
                  ? 'bg-green-600 text-white' 
                  : 'bg-[#A44C5C] hover:bg-[#A44C5C]/90 text-[#FAF5F0]'
              }`}
            >
              {isGiftAdded ? (
                <>
                  <Check size={14} />
                  <span>تم تطبيق خيارات التغليف الملكي!</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="animate-spin" />
                  <span>تأكيد وحفظ خيار التغليف الفخم الهدية</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Curated Gifting Products Suggestions */}
      <div>
        <div className="border-b border-gray-150 pb-4 mb-8">
          <h3 className="font-serif text-lg font-medium text-[#0B0B0B]">قطع مقترحة لوضعها بداخل الصندوق الهدية</h3>
          <p className="text-gray-400 text-2xs mt-1">القطع المفضلة للعرائس وسيدات المجتمع للأفراح والمواقف الوجدانية الصادقة.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {giftItems.map((prod) => {
            const priceVal = country === 'EG' ? prod.priceEG : prod.priceSA;
            const imgToUse = cleanImgUrl(prod.images[0], prod.category);

            return (
              <div
                key={prod.id}
                onClick={() => onSelectProduct(prod)}
                className="group flex flex-col h-full bg-white rounded-2xl p-4 overflow-hidden border border-[#DF8A9D]/12 hover:border-[#DF8A9D]/30 transition-all duration-300 hover:shadow-md relative select-none cursor-pointer"
              >
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[8.5px] text-[#A44C5C] font-semibold tracking-wide border border-rose-100">
                    هدية فاخرة ✦ GIFT SUGGESTION
                  </span>
                </div>

                <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF5F0] rounded-xl mb-3">
                  <img
                    src={imgToUse}
                    alt={prod.nameAr}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[800ms] opacity-95"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-400 flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(prod, prod.colors?.[0] || { name: 'وردي', hex: '#F4B6C2' }, prod.sizes?.[0] || 'M', 1);
                      }}
                      className="p-2.5 bg-white text-[#A44C5C] hover:bg-[#A44C5C] hover:text-white rounded-full transition-all duration-300 transform scale-0 group-hover:scale-100 shadow-md"
                      title="أضيفي للصندوق"
                    >
                      <ShoppingBag size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct(prod);
                      }}
                      className="p-2.5 bg-white text-gray-700 hover:bg-black hover:text-white rounded-full transition-all duration-300 transform scale-0 group-hover:scale-100 shadow-md"
                      title="تفاصيل القطعة"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-center mt-auto flex flex-col items-center">
                  <h4 className="text-3xs sm:text-2xs md:text-xs font-semibold text-[#0B0B0B] line-clamp-1 font-serif tracking-wide text-center">
                    {country === 'EG' ? prod.nameAr : prod.nameEn}
                  </h4>
                  <div className="mt-1.5 flex flex-col items-center">
                    <ProductPrice product={prod} country={country} size="sm" showBadge={true} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
