import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  BookOpen, 
  Gift, 
  Percent, 
  ShoppingBag, 
  Truck, 
  Award, 
  ShieldCheck, 
  MessageCircle, 
  ChevronRight, 
  ChevronLeft, 
  Heart, 
  User, 
  Star, 
  X, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Search,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

interface AtelierAudioAtmosphereProps {
  products?: Product[];
  collections?: any[];
  coupons?: any[];
  country?: 'EG' | 'SA';
  setTab?: (tab: string) => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product, color: { name: string; hex: string }, size: string, qty: number) => void;
  session?: any;
}

// Phase 3 & 4 Luxury quotes and Tips data
const LUXURY_BRAND_MESSAGES = [
  "✨ أهلاً بكِ في عوالم SULTA حيث تلتقي الراحة المطلقة بترف التفاصيل.",
  "✨ جميع منتجاتنا مغزولة بعناية فائقة لتمنح جسدك تجربة نوم ملوكية تليق بكِ.",
  "✨ خاماتنا من الساتان المبرد والقطيفة مصممة لتوفر روعة الملمس ونعومة فائقة في كل لحظة.",
  "✨ شكراً لثقتكِ الغالية ببراند SULTA. يسعدنا دائماً مرافقة طقوس أناقتك اليومية."
];

const LUXURY_TIPS = [
  {
    title: "🌸 دليل اختيار أفضل خامات الصيف",
    desc: "نوصي بالساتان الملكي المبرد المعالج لمقاومة الحرارة، فهو لطيف على البشرة ومقاوم للتعرق والخطوط الرفيعة لتنامي برفاهية تامة."
  },
  {
    title: "📐 كيف تختارين قياسك الإيطالي بدقة؟",
    desc: "استخدمي دليلك الخاص في صفحة حسابك لتحديد المقاس عبر الوزن والطول. إن لم تكوني متأكدة، فإن السروال الفضفاض (Loose-fit) هو خيار مريح ممتاز دوماً."
  },
  {
    title: "🧵 نصائح العناية بقطع الكوتور الفاخرة",
    desc: "للحفاظ على الريش الطبيعي والدانتيل الفرنسي سليمين، نوصي دائماً بالغسيل اليدوي اللطيف بالماء الفاتر أو الغسيل الجاف (Dry Clean) والكي البخاري الخفيف."
  },
  {
    title: "👰 دليل هدايا العروس وصندوق الأحلام",
    desc: "نوفر علباً ملكية مخصصة للعرائس. ننصح باختيار اللون الأبيض العاجي (Ivory) مطعماً بالدانتيل كأول طقم لصباحية زفاف ملوكية."
  }
];

export default function AtelierAudioAtmosphere({
  products = [],
  collections = [],
  coupons = [],
  country = 'SA',
  setTab,
  onSelectProduct,
  onAddToCart,
  session
}: AtelierAudioAtmosphereProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'welcome' | 'spotlight' | 'actions'>('welcome');
  const [messageIndex, setMessageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Auto-cycle brand messages periodically (Phase 3)
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LUXURY_BRAND_MESSAGES.length);
    }, 6000);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LUXURY_TIPS.length);
    }, 12000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(tipInterval);
    };
  }, []);

  // Set country specific greeting text (Phase 6)
  const getCountryGreeting = () => {
    if (country === 'EG') {
      return {
        flag: "🇪🇬",
        text: "أهلاً ومرحباً بجميلاتنا العزيزات في جمهورية مصر العربية 🖤 يسعدنا تواصلك مع بوتيك SULTA الفاخر."
      };
    }
    return {
      flag: "🇸🇦",
      text: "أهلاً وسهلاً بعميلاتنا الراقيات في المملكة العربية السعودية 🤍 ركن كوتور SULTA يرحب بحضورك الفخم."
    };
  };

  const countryGreeting = getCountryGreeting();

  // Pick luxury product spotlight dynamically from DB (Phase 7)
  const getProductSpotlight = (): Product | null => {
    if (!products || products.length === 0) return null;
    // Prefer best seller or featured, fallback to first product
    const premiumItems = products.filter(p => p.stock > 0);
    if (premiumItems.length === 0) return null;
    
    // Choose product of the day based on date to keep it consistent daily
    const day = new Date().getDate();
    return premiumItems[day % premiumItems.length];
  };

  const spotlightProduct = getProductSpotlight();

  // Get bride guide products (Phase 9)
  const getBrideProducts = (): Product[] => {
    if (!products || products.length === 0) return [];
    return products.filter(p => 
      p.stock > 0 && 
      (p.nameAr.includes("عروس") || 
       p.nameAr.includes("ريش") || 
       p.descriptionAr?.includes("عروس") || 
       p.category === 'sleepwear')
    ).slice(0, 2);
  };

  const brideProducts = getBrideProducts();

  // Copy coupon action helper
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const currentPriceLabel = country === 'EG' ? 'EGP' : 'SAR';

  // Quick Action Triggers (Phase 13)
  const triggerQuickAction = (action: string) => {
    if (!setTab) return;
    
    switch (action) {
      case 'bestsellers':
        setTab('store');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('filterStore', { detail: 'best_sellers' }));
        }, 100);
        break;
      case 'new':
        setTab('store');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('filterStore', { detail: 'new_arrivals' }));
        }, 100);
        break;
      case 'coupons':
        setActiveTab('actions');
        break;
      case 'bride':
        // Wedding/Bride selections
        setTab('store');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('searchStore', { detail: 'عروس' }));
        }, 100);
        break;
      case 'track':
        setTab('account');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openAccountTab', { detail: 'orders' }));
        }, 100);
        break;
      case 'support':
        setTab('account');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openAccountTab', { detail: 'support' }));
        }, 100);
        break;
      default:
        break;
    }
  };

  // Safe Add to Cart helper inside widget
  const handleSpotlightAddToCart = (product: Product) => {
    if (onAddToCart) {
      const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0] : { name: "أساسي", hex: "#000000" };
      const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : "Free Size";
      onAddToCart(product, defaultColor, defaultSize, 1);
    } else {
      if (onSelectProduct) onSelectProduct(product);
    }
  };

  return (
    <div 
      className={`fixed z-40 font-serif transition-all duration-305 ${
        isOpen 
          ? "bottom-24 left-4 right-4 sm:left-6 sm:right-auto max-w-[calc(100vw-32px)] sm:max-w-[360px]" 
          : "bottom-24 left-4 sm:left-6"
      }`} 
      dir="rtl"
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '72px' : 'auto',
              width: isMinimized ? '240px' : '100%'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="bg-[#FAFAF7]/95 backdrop-blur-md rounded-[2rem] shadow-2xl border border-[#DF8A9D]/18 ring-8 ring-[#FAF4F5]/40 select-none overflow-hidden text-right font-sans w-full"
          >
            {/* Elegant Background ambient gradient (Phase 10) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FAF4F5] via-transparent to-amber-50/10 pointer-events-none" />

            {/* HEADER AREA - Intuitive RTL spacing: Title on Right, Close on Left */}
            <div className="relative z-10 bg-gradient-to-l from-[#0B0B0B] to-[#1C1C1C] px-4 py-3 flex justify-between items-center border-b border-[#FAF5F0]/10">
              {/* Title & Brand (Floats to the right side on RTL) */}
              <div className="flex items-center gap-2 text-right min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FAFAF7]/10 py-1 flex items-center justify-center border border-[#F6E7A6]/30 shadow-inner shrink-0">
                  <span className="text-sm">👑</span>
                </div>
                <div className="text-right min-w-0">
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#F6E7A6] tracking-wide font-serif truncate">SULTA Concierge</h4>
                  <span className="text-[9px] text-gray-300 font-serif italic block truncate">مرشد SULTA الملكي الفاخر</span>
                </div>
              </div>

              {/* Left Utilities with touch target safety (Floats to the left side on RTL) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-gray-300 hover:text-white w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                  title={isMinimized ? "توسيع" : "تصغير"}
                >
                  {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-300 hover:text-red-400 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer border border-transparent hover:border-red-500/15"
                  title="إغلاق المرشد"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* EXPANDED CONTENT VIEW */}
            {!isMinimized && (
              <div className="relative z-10 max-h-[300px] xs:max-h-[340px] sm:max-h-[450px] overflow-y-auto custom-scrollbar p-5 space-y-4">
                
                {/* INTERACTIVE NAVIGATION TAB BUTTONS */}
                <div className="grid grid-cols-3 gap-1 bg-[#0B0B0B]/5 p-1 rounded-xl border border-gray-100 font-semibold text-[10.5px] text-gray-600 mb-2">
                  <button 
                    onClick={() => setActiveTab('welcome')}
                    className={`py-2 rounded-lg text-center transition-all cursor-pointer ${activeTab === 'welcome' ? 'bg-[#0B0B0B] text-[#F6E7A6] shadow-xs' : 'hover:bg-gray-150'}`}
                  >
                    الصالون الملكي ✨
                  </button>
                  <button 
                    onClick={() => setActiveTab('spotlight')}
                    className={`py-2 rounded-lg text-center transition-all cursor-pointer ${activeTab === 'spotlight' ? 'bg-[#0B0B0B] text-[#F6E7A6] shadow-xs' : 'hover:bg-gray-150'}`}
                  >
                    أحدث الروائع 💎
                  </button>
                  <button 
                    onClick={() => setActiveTab('actions')}
                    className={`py-2 rounded-lg text-center transition-all cursor-pointer ${activeTab === 'actions' ? 'bg-[#0B0B0B] text-[#F6E7A6] shadow-xs' : 'hover:bg-gray-150'}`}
                  >
                    خيارات سريعة 🛍️
                  </button>
                </div>

                {/* TAB 1: WELCOME & MOTTO & TIPS */}
                {activeTab === 'welcome' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 text-right"
                  >
                    {/* Country Greeting Message (Phase 6) */}
                    <div className="bg-emerald-50/40 p-3 rounded-2xl border border-emerald-500/10 flex gap-2.5 items-center flex-row-reverse">
                      <span className="text-xl shrink-0">{countryGreeting.flag}</span>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-900 leading-normal">
                        {countryGreeting.text}
                      </p>
                    </div>

                    {/* Luxury brand motivational quote (Phase 3) */}
                    <div className="bg-white/80 p-4 rounded-2xl border border-neutral-100 shadow-3xs relative overflow-hidden min-h-[68px] flex items-center">
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#A44C5C]" />
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={messageIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.4 }}
                          className="text-[11px] sm:text-xs text-gray-800 leading-relaxed italic pr-2 font-serif font-light"
                        >
                          {LUXURY_BRAND_MESSAGES[messageIndex]}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    {/* Tip of the day (Phase 4) */}
                    <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-300/15 space-y-1.5 text-right relative">
                      <div className="flex justify-between items-center flex-row-reverse mb-1">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-amber-800 font-sans">نصيحة اليوم للأناقة ✦</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setTipIndex(prev => (prev - 1 + LUXURY_TIPS.length) % LUXURY_TIPS.length)}
                            className="p-1 hover:bg-amber-100 rounded text-amber-700 cursor-pointer"
                          >
                            <ChevronLeft size={10} />
                          </button>
                          <button 
                            onClick={() => setTipIndex(prev => (prev + 1) % LUXURY_TIPS.length)}
                            className="p-1 hover:bg-amber-100 rounded text-amber-700 cursor-pointer"
                          >
                            <ChevronRight size={10} />
                          </button>
                        </div>
                      </div>
                      
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={tipIndex}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-1"
                        >
                          <h5 className="text-[11px] sm:text-xs font-bold text-gray-950">{LUXURY_TIPS[tipIndex].title}</h5>
                          <p className="text-[10px] sm:text-[10.5px] text-gray-500 leading-relaxed font-sans font-normal">
                            {LUXURY_TIPS[tipIndex].desc}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Why SULTA (Phase 8) */}
                    <div className="bg-white/50 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                      <span className="text-[9.5px] uppercase font-bold tracking-widest text-[#A44C5C] block border-b border-gray-50 pb-1">لماذا تتألقين مع SULTA؟ ✨</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-gray-700">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span>خامات فاخرة</span>
                          <Award size={11} className="text-[#A44C5C]" />
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span>شحن فوري سريع</span>
                          <Truck size={11} className="text-[#A44C5C]" />
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span>جودة كوتور إيطالية</span>
                          <Star size={11} className="text-[#A44C5C]" />
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span>دعم مخصص عالي الترف</span>
                          <User size={11} className="text-[#A44C5C]" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-[9.5px] text-emerald-600 bg-emerald-50 py-1 rounded-lg">
                        <ShieldCheck size={11} />
                        <span>بوابة دفع آمنة بنسبة 100% وموثوقة</span>
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* TAB 2: SPOTLIGHT & NEWS & BRIDAL GUIDE */}
                {activeTab === 'spotlight' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Spotlight Product of the day (Phase 7) */}
                    {spotlightProduct && (
                      <div className="bg-white border border-[#DF8A9D]/18 rounded-2.5xl p-3 shadow-3xs space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <span className="text-[9px] text-[#A44C5C] font-extrabold uppercase tracking-wider bg-[#FAF4F5] px-2 py-0.5 rounded-full block">👑 نجم اليوم الفاخر</span>
                          <span className="text-[8.5px] text-gray-400">توصية المستشار الشخصي</span>
                        </div>

                        <div className="flex gap-3 items-start flex-row-reverse" onClick={() => onSelectProduct && onSelectProduct(spotlightProduct)}>
                          <div className="w-16 h-22 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 cursor-pointer">
                            <img src={spotlightProduct.images[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-1 text-right space-y-1 flex flex-col justify-between">
                            <div>
                              <h5 className="font-serif text-xs font-bold text-gray-950 truncate hover:text-[#A44C5C] cursor-pointer">
                                {spotlightProduct.nameAr}
                              </h5>
                              <span className="text-[9.5px] text-gray-400 block font-light">{spotlightProduct.categoryAr}</span>
                            </div>
                            
                            <strong className="text-xs text-[#A44C5C] block font-mono font-black mt-1">
                              {(country === 'EG' ? spotlightProduct.priceEG : spotlightProduct.priceSA).toLocaleString()} {currentPriceLabel}
                            </strong>
                          </div>
                        </div>

                        {/* Interactive Click triggers */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] font-bold">
                          <button
                            onClick={() => onSelectProduct && onSelectProduct(spotlightProduct)}
                            className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-gray-700 py-2 rounded-xl text-center cursor-pointer"
                          >
                            عرض التفاصيل 🔍
                          </button>
                          <button
                            onClick={() => handleSpotlightAddToCart(spotlightProduct)}
                            className="bg-[#A44C5C] text-white hover:bg-[#8D3F4E] py-2 rounded-xl text-center cursor-pointer flex items-center justify-center gap-1"
                          >
                            <ShoppingBag size={11} />
                            <span>حقيبة تسوق</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Boutique updates & real state news (Phase 5) */}
                    <div className="bg-[#FAF5F0]/60 p-3.5 rounded-2xl border border-[#DF8A9D]/12 space-y-2 text-right">
                      <span className="text-[9.5px] font-bold text-[#A44C5C] uppercase tracking-widest block border-b border-[#DF8A9D]/10 pb-1">أخبار ومجموعات البوتيك الحالية ⚜️</span>
                      
                      <div className="space-y-2 text-[10px] text-gray-700">
                        <div className="bg-white/80 p-2 rounded-lg border border-gray-100 leading-relaxed">
                          📌 <span className="font-bold text-gray-950">التشكيلة الجديدة:</span> تم توفير قطع صيفية جديدة من الساتان المعالج مضافة للتو فحصي "أحدث المنتجات".
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-gray-100 leading-relaxed">
                          📌 <span className="font-bold text-gray-950">الحالة العامة:</span> خامات فخمة بأرقى درجات الخياطة مع توفر {products.filter(p => p.stock > 0).length} قطعة فاخرة جاهزة للتجهيز والتغليف اليومي.
                        </div>
                      </div>
                    </div>

                    {/* Bride Wedding Guide Section (Phase 9) */}
                    {brideProducts.length > 0 && (
                      <div className="bg-white p-3.5 rounded-2xl border border-gray-150 space-y-2.5">
                        <div className="flex justify-between items-center flex-row-reverse border-b border-gray-50 pb-1.5">
                          <span className="text-[10px] font-bold text-gray-900 font-serif">👰 دليل زفاف العروس (Bridal Guide)</span>
                          <span className="text-[8px] text-gray-400 bg-pink-50 text-[#A44C5C] px-1.5 py-0.5 rounded">موصى به</span>
                        </div>
                        <p className="text-[9.5px] text-gray-550 leading-relaxed text-right font-light">
                          قطع فاخرة مصممة خصيصاً باللون الأبيض والوردي مع ريش طبيعي ودانتيل إيطالي لتخليد أجمل زفاف وصباحية:
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {brideProducts.map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => onSelectProduct && onSelectProduct(p)}
                              className="group cursor-pointer bg-neutral-50 hover:bg-pink-50/20 p-2 rounded-xl border border-neutral-100 transition-all text-center space-y-1.5"
                            >
                              <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-gray-50">
                                <img src={p.images[0]} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                              </div>
                              <h6 className="text-[9.5px] font-bold text-gray-900 line-clamp-1">{p.nameAr}</h6>
                              <span className="text-[9px] text-[#A44C5C] font-mono font-bold block">
                                {(country === 'EG' ? p.priceEG : p.priceSA).toLocaleString()} {currentPriceLabel}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 3: QUICK ACTIONS & COUPONS */}
                {activeTab === 'actions' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Active Promo Coupons (Phase 5) */}
                    {coupons && coupons.length > 0 ? (
                      <div className="bg-amber-50/40 p-3.5 rounded-2xl border border-amber-300/15 text-right space-y-2">
                        <span className="text-[9.5px] font-extrabold text-amber-800 uppercase tracking-widest block font-sans">🎁 عروض الخصم الملكي اليومية:</span>
                        <div className="space-y-2">
                          {coupons.slice(0, 2).map((c: any) => (
                            <div key={c.id || c.code} className="bg-white p-2.5 rounded-xl border border-amber-250 flex justify-between items-center flex-row-reverse border-dashed gap-2">
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-900 block">{c.descriptionAr || `خصم بقيمة ${c.discountPercent}%`}</span>
                                <span className="text-[8.5px] text-gray-450 block font-light">استخدمي الكود عند الدفع لحفظ قيمتك</span>
                              </div>
                              
                              <button
                                onClick={() => handleCopyCoupon(c.code)}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-amber-250 transition-all cursor-pointer flex items-center gap-1"
                              >
                                {copiedCoupon === c.code ? <Check size={11} className="text-emerald-600" /> : <Percent size={11} />}
                                <span>{copiedCoupon === c.code ? "تم نسخ" : c.code}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50/20 p-3.5 rounded-2xl border border-amber-200/10 text-center text-gray-400 font-sans text-[10px]">
                        <span>لا تتوفر قسائم خصم عامة معلنة حالياً. عروشنا تواصل فوري! 💖</span>
                      </div>
                    )}

                    {/* Quick Access Navigation Panel (Phase 13) */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block text-right">أوامر الوصول السريع ⚡</span>
                      
                      <div className="grid grid-cols-2 gap-2 font-semibold text-[10.5px]">
                        <button
                          onClick={() => triggerQuickAction('bestsellers')}
                          className="bg-white hover:bg-[#FAF5F0] border border-gray-100 hover:border-[#DF8A9D]/20 p-3 rounded-xl cursor-pointer text-center flex flex-col items-center gap-1 transition-all"
                        >
                          <span className="text-base">🛍️</span>
                          <span>الأكثر مبيعاً ورواجاً</span>
                        </button>

                        <button
                          onClick={() => triggerQuickAction('new')}
                          className="bg-white hover:bg-[#FAF5F0] border border-gray-100 hover:border-[#DF8A9D]/20 p-3 rounded-xl cursor-pointer text-center flex flex-col items-center gap-1 transition-all"
                        >
                          <span className="text-base font-serif">✨</span>
                          <span>أحدث تشكيلة بالصالون</span>
                        </button>

                        <button
                          onClick={() => triggerQuickAction('bride')}
                          className="bg-white hover:bg-[#FAF5F0] border border-gray-100 hover:border-[#DF8A9D]/20 p-3 rounded-xl cursor-pointer text-center flex flex-col items-center gap-1 transition-all"
                        >
                          <span className="text-base">👰</span>
                          <span>تشكيلات زفاف العرائس</span>
                        </button>

                        <button
                          onClick={() => triggerQuickAction('track')}
                          className="bg-white hover:bg-[#FAF5F0] border border-gray-100 hover:border-[#DF8A9D]/20 p-3 rounded-xl cursor-pointer text-center flex flex-col items-center gap-1 transition-all"
                        >
                          <span className="text-base">📦</span>
                          <span>تتبع طلبيتك وشحنتك</span>
                        </button>

                        <button
                          onClick={() => triggerQuickAction('support')}
                          className="bg-white hover:bg-[#FAF5F0] border border-gray-100 hover:border-[#DF8A9D]/20 p-2.5 rounded-xl cursor-pointer text-center flex flex-col items-center gap-1 transition-all col-span-2 text-[#A44C5C] font-bold"
                        >
                          <div className="flex items-center gap-1 justify-center">
                            <span>💬</span>
                            <span>استشارة وفريق الدعم الملكي الفوري</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* FOOTER COUNTER */}
                <div className="text-center pt-3 border-t border-gray-100 font-sans text-[8.5px] text-gray-400">
                  SULTA Boutique Concierge © {new Date().getFullYear()} • دائم الخدمة لجمالكِ الرفيع
                </div>

              </div>
            )}

            {/* MINIMIZED VIEW STATE CONTENT */}
            {isMinimized && (
              <div 
                className="relative z-10 px-4 py-3 flex justify-between items-center flex-row-reverse cursor-pointer bg-white/40"
                onClick={() => setIsMinimized(false)}
              >
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">اضغطي للتوسيع ⤢</span>
                <p className="text-[11px] font-semibold text-gray-800 truncate pr-2">
                  ✨ {LUXURY_BRAND_MESSAGES[messageIndex].slice(0, 36)}...
                </p>
              </div>
            )}

          </motion.div>
        ) : (
          /* FLOATING BUTTON (TRULY PREMIUM LOOK WITH RIPPLE RINGS) */
          <motion.button
            layoutId="atelier-radio-btn"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#A44C5C] hover:text-white px-3 py-2 sm:px-4 sm:py-3 rounded-full shadow-2xl transition-all z-40 select-none cursor-pointer group active:scale-95 border border-[#F6E7A6]/20 ring-4 ring-neutral-500/10"
            title="افتح مرشد SULTA الملكي الفاخر 👑"
          >
            <div className="relative flex items-center justify-center">
              <span className="text-xs sm:text-sm group-hover:scale-110 transition-transform">👑</span>
              <span className="absolute inset-0 rounded-full bg-[#F6E7A6]/10 animate-ping" />
            </div>
            
            <div className="flex flex-col text-right pr-0.5 leading-none">
              <span className="text-[8.5px] sm:text-[9px] font-serif font-black tracking-wide">SULTA Concierge</span>
              <span className="text-[6.5px] text-gray-300 font-sans block mt-0.5 font-medium">استشارتك الملكية ✦</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
