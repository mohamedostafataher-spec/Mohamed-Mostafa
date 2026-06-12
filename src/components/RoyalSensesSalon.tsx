import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Award, Star, ShieldCheck, Heart, ShoppingBag, Eye, Check,
  Wind, Sun, Flame, Box, Zap, Compass, RotateCcw, Volume2, VolumeX, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Country } from '../types';
import { cleanImgUrl } from '../services/db';

interface RoyalSensesSalonProps {
  products: Product[];
  country: Country;
  onAddToCart: (product: Product, color: { name: string; hex: string }, size: string, qty: number, customOpts?: any) => void;
  onSelectProduct?: (product: Product) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  setTab?: (tab: string) => void;
}

const DEFAULT_WAX_COLORS = [
  { id: 'gold', nameAr: 'ذهبي أوراق الغار', hex: '#D4AF37' },
  { id: 'emerald', nameAr: 'أخضر الزمرد الملكي', hex: '#097969' },
  { id: 'crimson', nameAr: 'أحمر قاني كلاسيكي', hex: '#800020' },
  { id: 'pearl', nameAr: 'وردي اللؤلؤ المصقول', hex: '#EAE0D5' }
];

const DEFAULT_RIBBONS = [
  { id: 'champagne', nameAr: 'شريط شامبين ميتاليك فخم', hex: '#F6E7A6' },
  { id: 'pink', nameAr: 'شريط ستان وردي كراميل ناعم', hex: '#F4B6C2' },
  { id: 'black', nameAr: 'شريط حريري أسود فاحم دراماتيكي', hex: '#0B0B0B' }
];

export default function RoyalSensesSalon({
  products = [],
  country,
  onAddToCart,
  onSelectProduct,
  favorites = [],
  toggleFavorite,
  setTab
}: RoyalSensesSalonProps) {
  const [activeSuite, setActiveSuite] = useState<'fabric' | 'wax' | 'outfit'>('fabric');
  
  // Custom Dynamic Sensory Options lists
  const [waxColorsList, setWaxColorsList] = useState(DEFAULT_WAX_COLORS);
  const [ribbonsList, setRibbonsList] = useState(DEFAULT_RIBBONS);

  // Fabric Suite States
  const [selectedProductFabric, setSelectedProductFabric] = useState<Product | null>(null);
  const [lightMode, setLightMode] = useState<'chandelier' | 'sunset' | 'golden' | 'candle'>('chandelier');
  const [windSpeed, setWindSpeed] = useState<number>(30); // 0 to 100
  const [lightSlider, setLightSlider] = useState<number>(65); // 0 to 100
  const [simulationActive, setSimulationActive] = useState(false);

  // Wax & Ribbon Personalizer States
  const [customInitial, setCustomInitial] = useState('S');
  const [waxColor, setWaxColor] = useState(DEFAULT_WAX_COLORS[0]);
  const [ribbonColor, setRibbonColor] = useState(DEFAULT_RIBBONS[0]);
  const [isStamping, setIsStamping] = useState(false);
  const [stampCompleted, setStampCompleted] = useState(false);

  // Clothing Coordinate States
  const [outfitTop, setOutfitTop] = useState<Product | null>(null);
  const [outfitBottom, setOutfitBottom] = useState<Product | null>(null);
  const [harmonyScore, setHarmonyScore] = useState<number>(0);
  const [harmonyText, setHarmonyText] = useState('');
  const [addedBundleToCart, setAddedBundleToCart] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Synchronize custom lists on changes or mount
  useEffect(() => {
    const loadSensoryConfig = () => {
      try {
        const storedWax = localStorage.getItem('sulta_custom_wax_colors');
        if (storedWax) {
          const parsed = JSON.parse(storedWax);
          if (parsed && parsed.length > 0) {
            setWaxColorsList(parsed);
            setWaxColor(curr => parsed.find((p: any) => p.id === curr.id) || parsed[0]);
          }
        }
        const storedRibbons = localStorage.getItem('sulta_custom_ribbons');
        if (storedRibbons) {
          const parsed = JSON.parse(storedRibbons);
          if (parsed && parsed.length > 0) {
            setRibbonsList(parsed);
            setRibbonColor(curr => parsed.find((p: any) => p.id === curr.id) || parsed[0]);
          }
        }
      } catch (e) {
        console.warn('Sensory data load error:', e);
      }
    };

    loadSensoryConfig();
    window.addEventListener('storage', loadSensoryConfig);
    window.addEventListener('sulta-sensory-updated', loadSensoryConfig);

    return () => {
      window.removeEventListener('storage', loadSensoryConfig);
      window.removeEventListener('sulta-sensory-updated', loadSensoryConfig);
    };
  }, []);

  // Standard safe synthesizer for immersive experiential audio effects
  const playLuxuryTone = (freq1: number, freq2: number, duration: number, type: 'sine' | 'triangle' = 'sine') => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq1, ctx.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq2, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc2.start();

      setTimeout(() => {
        try {
          osc.stop();
          osc2.stop();
          ctx.close();
        } catch (_) {}
      }, duration * 1000 + 100);
    } catch (_) {}
  };

  // Set default products if active list changes
  useEffect(() => {
    if (products.length > 0) {
      const activeItems = products.filter(p => (p.status === 'active' || !p.status) && p.stock > 0);
      if (activeItems.length > 0) {
        if (!selectedProductFabric) setSelectedProductFabric(activeItems[0]);
        if (!outfitTop) {
          const abayas = activeItems.filter(p => p.categoryAr?.includes('عباء') || p.category?.toLowerCase().includes('abaya'));
          setOutfitTop(abayas.length > 0 ? abayas[0] : activeItems[0]);
        }
        if (!outfitBottom) {
          const pajamas = activeItems.filter(p => p.categoryAr?.includes('نوم') || p.category?.toLowerCase().includes('sleep') || p.category?.toLowerCase().includes('pajama'));
          setOutfitBottom(pajamas.length > 0 ? pajamas[0] : (activeItems[1] || activeItems[0]));
        }
      }
    }
  }, [products]);

  // Coordinate harmony analyzer logic
  useEffect(() => {
    if (!outfitTop || !outfitBottom) return;

    if (outfitTop.id === outfitBottom.id) {
      setHarmonyScore(60);
      setHarmonyText("تنسيق قطعة أحادية مكررة يفتقر لتباين الكوتور. جربي مزج عباءة حريرية مع طقم نوم دانتيل.");
      return;
    }

    // Colors matching checks
    const col1 = outfitTop.colors?.[0]?.name || '';
    const col2 = outfitBottom.colors?.[0]?.name || '';
    
    let baseScore = 80;
    
    // Aesthetic evaluation
    if (col1.includes('أسود') && col2.includes('بيج') || col1.includes('بيج') && col2.includes('أسود')) baseScore += 18;
    else if (col1.includes('ذهبي') || col2.includes('ذهبي')) baseScore += 15;
    else if (col1.includes('وردي') && col2.includes('أبيض')) baseScore += 17;
    else if (col1 === col2) baseScore += 10;
    else baseScore += 12;

    const finalScore = Math.min(100, baseScore);
    setHarmonyScore(finalScore);

    if (finalScore >= 95) {
      setHarmonyText("✦ توليفة ملوكية إيطالية تحبس الأنفاس! تزاوج الألوان والأقمشة في قمة التناغم والترف.");
    } else if (finalScore >= 85) {
      setHarmonyText("✦ تنسيق منسجم جداً ومناسب للمناسبات والزيارات الرسمية الراقية.");
    } else {
      setHarmonyText("تنسيق جيد، جربي إقران الفخامة مع ألوان هادئة مثل اللون السكري أو الشامبين.");
    }
  }, [outfitTop, outfitBottom]);

  // Stamp Wax Crest Animation trigger
  const handleStamp = () => {
    if (isStamping) return;
    setIsStamping(true);
    setStampCompleted(false);
    playLuxuryTone(120, 95, 0.45, 'triangle'); // deep tactile stamp audio

    setTimeout(() => {
      setIsStamping(false);
      setStampCompleted(true);
      playLuxuryTone(440, 554.37, 0.4, 'sine'); // success sparkling tone
    }, 1600);
  };

  // Add customized Single Product (with Wax Initial/Ribbon settings) to cart!
  const handleAddCustomizedToCart = (prod: Product, mode: 'fabric') => {
    const defaultColor = prod.colors?.[0] || { name: 'أساسي', hex: '#000000' };
    const defaultSize = prod.sizes?.[0] || 'Free Size';
    
    const extraMetadata = {
      waxInitial: customInitial,
      waxColor: waxColor.nameAr,
      ribbonColor: ribbonColor.nameAr,
      customNote: `تم تصميم الساتان وتجهيزه عبر صالون الأناقة الذكي لـ SULTA koutour.`
    };

    onAddToCart(prod, defaultColor, defaultSize, 1, extraMetadata);
    playLuxuryTone(587.33, 698.46, 0.65, 'sine');
  };

  // Checkout custom combined outfit bundle
  const handleAddBundleToCart = () => {
    if (!outfitTop || !outfitBottom) return;

    const extraMetadataTop = {
      bundle: "طقم صالون التنسيق الملكي",
      partnerProduct: outfitBottom.nameAr,
      waxInitial: customInitial,
      waxColor: waxColor.nameAr,
      ribbonColor: ribbonColor.nameAr,
    };

    const extraMetadataBottom = {
      bundle: "طقم صالون التنسيق الملكي",
      partnerProduct: outfitTop.nameAr,
      waxInitial: customInitial,
      waxColor: waxColor.nameAr,
      ribbonColor: ribbonColor.nameAr,
    };

    // Add top
    onAddToCart(outfitTop, outfitTop.colors?.[0] || { name: 'أساسي', hex: '#000000' }, outfitTop.sizes?.[0] || 'S', 1, extraMetadataTop);
    
    // Add bottom
    onAddToCart(outfitBottom, outfitBottom.colors?.[0] || { name: 'أساسي', hex: '#000000' }, outfitBottom.sizes?.[0] || 'M', 1, extraMetadataBottom);

    setAddedBundleToCart(true);
    playLuxuryTone(523.25, 783.99, 0.9, 'sine');
    
    setTimeout(() => {
      setAddedBundleToCart(false);
    }, 4000);
  };

  // Dynamic light background generator based on selection
  const getLightGradientClass = () => {
    switch (lightMode) {
      case 'candle': // Warm golden intimate candle glow
        return 'from-amber-950/20 via-orange-900/10 to-transparent';
      case 'sunset': // Vivid sunset pink glow matching bridal tone
        return 'from-pink-900/15 via-rose-700/10 to-transparent';
      case 'golden': // Rich luxury pure gold status reflection
        return 'from-yellow-700/20 via-amber-600/10 to-transparent';
      default: // Chandelier cold elite room chandelier glow
        return 'from-slate-400/15 via-neutral-200/5 to-transparent';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10 selection:bg-[#DF8A9C]/30 select-none text-right font-serif" dir="rtl">
      
      {/* Dynamic Header Box */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <span className="font-sans italic text-xs tracking-[0.25em] text-[#A44C5C] font-black uppercase block mb-1">Interactive Sensory Experiential Suite</span>
        <h2 className="text-2xl md:text-3.5xl font-bold font-serif text-[#0B0B0B] flex items-center justify-center gap-2">
          <span>صالون الحواس والأناقة الملوكية</span>
          <span className="text-[#A44C5C] text-2xl sm:text-3xl">⚜️</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 font-sans max-w-2xl mx-auto leading-relaxed">
          عيشي أبعاد الرفاهية السبع! اختبري فيزياء وهج الحرير الطبيعي، حددي مهر أختام الشمع الملكية، أو نسقي أطقم مخصصة لك وشاركيها كتحفة فنية غير مسبوقة.
        </p>
      </div>

      {/* Main Suite Tab Buttons */}
      <div className="flex flex-wrap justify-center gap-1.5 p-1 bg-neutral-100 rounded-2xl max-w-2xl mx-auto mb-10 border border-neutral-200 text-xs sm:text-sm font-semibold text-gray-600 font-sans font-sans">
        <button
          onClick={() => { setActiveSuite('fabric'); playLuxuryTone(329.63, 392.00, 0.3, 'sine'); }}
          className={`flex-1 py-3 px-4 rounded-xl text-center transition-all cursor-pointer ${
            activeSuite === 'fabric' ? 'bg-[#0B0B0B] text-[#F6E7A6] shadow-md font-bold' : 'hover:bg-white hover:text-gray-900'
          }`}
        >
          ✨ بريق وهج الحرير
        </button>
        <button
          onClick={() => { setActiveSuite('wax'); playLuxuryTone(392.00, 493.88, 0.3, 'sine'); }}
          className={`flex-1 py-3 px-4 rounded-xl text-center transition-all cursor-pointer ${
            activeSuite === 'wax' ? 'bg-[#0B0B0B] text-[#F6E7A6] shadow-md font-bold' : 'hover:bg-white hover:text-gray-900'
          }`}
        >
          👑 صندوق الأختام الملكية
        </button>
        <button
          onClick={() => { setActiveSuite('outfit'); playLuxuryTone(523.25, 659.25, 0.3, 'sine'); }}
          className={`flex-1 py-3 px-4 rounded-xl text-center transition-all cursor-pointer hover:bg-white hover:text-gray-900 ${
            activeSuite === 'outfit' ? 'bg-[#0B0B0B] text-[#F6E7A6] shadow-md font-bold' : ''
          }`}
        >
          👗 منسق الأطقم
        </button>
      </div>

      {/* CORE ACTIVE SUITE DISPLAY PANEL */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden min-h-[500px]">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* LEFT INTERACTIVE PREVIEW COLUMN (7 cols) */}
          <div className="lg:col-span-7 bg-[#FAFAF8] p-6 sm:p-10 flex flex-col justify-between relative border-l border-gray-100 overflow-hidden">
            
            {/* Ambient Lighting Overlay Gradient effect */}
            <div className={`absolute inset-0 bg-gradient-to-tr ${getLightGradientClass()} transition-all duration-1000 pointer-events-none`} />

            {/* Title / Packaging indicator */}
            <div className="relative z-10 flex justify-between items-center mb-6 font-sans">
              <div className="text-right">
                <span className="text-[10px] text-[#A44C5C] font-extrabold uppercase tracking-widest block">جناح الحواس والتعبئة الفاخرة</span>
                <h4 className="text-sm font-bold text-gray-900">
                  {activeSuite === 'fabric' && "غرفة محاكاة فيزياء وهج الأقمشة والرياح 🌬️"}
                  {activeSuite === 'wax' && "مكبس مهر ختم الشمع الملكي وبطاقات Vintage الزيتية ✉️"}
                  {activeSuite === 'outfit' && "طاولة خزانة المزج والتنسيق الإرستقراطية 🏰"}
                </h4>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">محاكاة حية ثنائية الأبعاد</span>
              </div>
            </div>

            {/* SUITE 1 PREVIEW: TACTILE FABRIC LUSTER PHYSICS */}
            {activeSuite === 'fabric' && selectedProductFabric && (
              <div className="flex-1 flex flex-col items-center justify-center py-6 relative z-10">
                <div className="relative w-64 h-84 md:w-72 md:h-96 rounded-2xl overflow-hidden shadow-2xl border border-white/50 bg-white group">
                  
                  {/* Dynamic Custom WebGL-styled Satin Reflection overlay using CSS gradients and rotation */}
                  <motion.div 
                    animate={{
                      background: `linear-gradient(${lightSlider * 3.6}deg, rgba(255,255,255,0) 0%, rgba(255,245,220,${(lightSlider / 100) * 0.4}) 35%, rgba(255,255,255,0) 70%)`
                    }}
                    transition={{ ease: "easeOut", duration: 0.1 }}
                    className="absolute inset-0 pointer-events-none mix-blend-overlay z-15"
                  />

                  {/* Wind Waves Ripple Layer */}
                  <motion.div 
                    animate={{ 
                      x: [0, (windSpeed / 10) * 1.5, 0],
                      scaleX: [1, 1 + (windSpeed / 500), 1]
                    }}
                    transition={{ repeat: Infinity, duration: Math.max(0.6, 3 - (windSpeed / 35)), ease: "easeInOut" }}
                    className="w-full h-full relative"
                  >
                    <img 
                      src={selectedProductFabric.images[0]} 
                      alt="" 
                      className="w-full h-full object-cover select-none pointer-events-none" 
                    />
                  </motion.div>

                  {/* Reflection Specs Metrics Panel popup */}
                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-2 rounded-xl text-left border border-white/10 z-20 font-sans text-[10px] text-white">
                    <div className="flex justify-between gap-4">
                      <span>Refractive Index (Satin):</span>
                      <strong className="text-[#F6E7A6]">1.46 - Ultra Gloss</strong>
                    </div>
                    <div className="flex justify-between gap-4 mt-1">
                      <span>Ventilation Ratio:</span>
                      <strong className="text-[#F6E7A6]">99% - Cool Tech</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-center max-w-sm space-y-1">
                  <span className="text-xs font-bold text-gray-800 block">مرشد صالون الألياف لبريق الساتان:</span>
                  <p className="text-[11px] text-gray-550 leading-relaxed font-sans">
                    حركي المزلاج بالأسفل لتوجيه أشعة ضوء الثريا أو الغروب على الثوب، وانظري كيف تتولد التماوجات المضيئة وتتراقص حواف ريش السروال بشكل مدهش.
                  </p>
                </div>
              </div>
            )}



            {/* SUITE 3 PREVIEW: WAX CREST BOX PERSONALIZATION */}
            {activeSuite === 'wax' && (
              <div className="flex-1 flex flex-col items-center justify-center py-6 relative z-10">
                <div className="relative w-72 h-72 md:w-80 md:h-80 bg-[#151515] rounded-3xl border border-neutral-800 flex items-center justify-center shadow-3xl text-center select-none overflow-hidden">
                  
                  {/* Subtle leather texture background representation */}
                  <div className="absolute inset-0 bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:16px_16px] opacity-35" />

                  <div className="relative space-y-4">
                    {/* Royal Box Cover preview with ribbon */}
                    <span className="text-[10px] text-amber-500 font-sans tracking-[0.2em] uppercase block">SULTA COUTURE BOX</span>
                    
                    {/* Customized Wax Seal Stamp Container */}
                    <div className="relative mx-auto w-36 h-36 rounded-full border-4 border-dashed border-[#F6E7A6]/20 flex items-center justify-center">
                      
                      {/* Interactive stamp visual state */}
                      <AnimatePresence mode="wait">
                        {isStamping ? (
                          <motion.div 
                            initial={{ scale: 2, opacity: 0, y: -45 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", stiffness: 350, damping: 20 }}
                            className="absolute -top-6 w-14 h-24 bg-[#D4AF37] rounded-b-xl border border-amber-300 shadow-xl flex items-center justify-center"
                          >
                            <span className="text-xs font-sans text-neutral-900 font-bold">M</span>
                          </motion.div>
                        ) : stampCompleted ? (
                          <motion.div 
                            initial={{ scale: 0.1, rotate: -25 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="w-24 h-24 rounded-full flex items-center justify-center shadow-inner relative"
                            style={{ backgroundColor: waxColor.hex, border: `3px solid ${waxColor.hex}dd` }}
                          >
                            {/* Inner circle of wax ring */}
                            <div className="w-18 h-18 rounded-full border-2 border-double border-white/20 flex items-center justify-center text-white font-serif text-3xl font-bold select-all drop-shadow-md">
                              {customInitial || '?'}
                            </div>
                            
                            {/* Outer melted irregular crest wax drop indicators */}
                            <span className="absolute -top-1.5 left-6 w-4 h-4 rounded-full" style={{ backgroundColor: waxColor.hex }} />
                            <span className="absolute -bottom-1 right-8 w-5.5 h-3.5 rounded-full" style={{ backgroundColor: waxColor.hex }} />
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-1.5 rounded-xl opacity-80" style={{ backgroundColor: waxColor.hex }} />
                          </motion.div>
                        ) : (
                          <div className="text-center font-sans text-xs text-gray-550 max-w-[110px] leading-relaxed">
                            اضغطي على "مهر الختم" لتثبيت الختم الشمعي المخصص.
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Styled Ribbon colors */}
                    <div className="space-y-1 font-sans">
                      <span className="text-[10px] text-gray-400 block pb-1">شريط الستان الملكي:</span>
                      <div className="flex gap-2 justify-center items-center">
                        <span className="w-16 h-3 rounded" style={{ backgroundColor: ribbonColor.hex }} />
                        <span className="text-[10px] text-white font-semibold">{ribbonColor.nameAr.split(' ')[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stamp audio visual toggle placeholder button */}
                  {stampCompleted && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600/90 text-white font-sans text-[10px] px-3 py-1 rounded-full border border-emerald-500/25 block leading-none"
                    >
                      ✓ تم تسجيل ختم الحرف {customInitial} بنجاح
                    </motion.div>
                  )}
                </div>

                <div className="mt-5 text-center max-w-sm space-y-1">
                  <span className="text-xs text-amber-500 font-serif font-semibold block">مختوم بشرف العناية اليدوية ✦</span>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                    ستستلمي طلبكِ مغلفاً ببطاقة شمعية كلاسيكية مع شريط حريري ملون، كنز مادي حقيقي لتجربة استلام أسطورية.
                  </p>
                </div>
              </div>
            )}

            {/* SUITE 4 PREVIEW: CHIC DRESSING HARMONY TABLE */}
            {activeSuite === 'outfit' && (
              <div className="flex-1 flex flex-col items-center justify-center py-6 relative z-10">
                <div className="relative w-full max-w-md bg-white border border-gray-150 rounded-2.5xl p-6 shadow-xl text-right">
                  <span className="text-[10px] text-[#A44C5C] font-extrabold uppercase tracking-wide block mb-3 border-b border-gray-50 pb-1">الملكان والمطابقة الملكية (Mix Room)</span>
                  
                  <div className="grid grid-cols-2 gap-4 items-center">
                    
                    {/* Top Layer */}
                    <div className="bg-neutral-50/70 p-3 rounded-2xl border border-dashed border-gray-200 text-center space-y-2 select-none relative min-h-[160px] flex flex-col justify-between">
                      <span className="text-[9px] text-[#A44C5C] font-sans font-bold bg-pink-100 rounded-full px-2 py-0.5 inline-block mx-auto">الطبقة العليا (عباءة كوتور)</span>
                      
                      {outfitTop ? (
                        <div className="space-y-1.5" onClick={() => onSelectProduct && onSelectProduct(outfitTop)}>
                          <div className="w-14 h-18 bg-white border border-gray-100 rounded-lg mx-auto overflow-hidden shadow-xs cursor-pointer">
                            <img src={outfitTop.images[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                          <h6 className="text-[10px] font-bold text-gray-900 truncate">{outfitTop.nameAr}</h6>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 block py-8">حددي قطعة عليا</span>
                      )}
                    </div>

                    {/* Bottom Layer */}
                    <div className="bg-neutral-50/70 p-3 rounded-2xl border border-dashed border-gray-200 text-center space-y-2 select-none relative min-h-[160px] flex flex-col justify-between">
                      <span className="text-[9px] text-zinc-600 font-sans font-bold bg-zinc-200 rounded-full px-2 py-0.5 inline-block mx-auto">الطبقة الأساسية (ملابس نوم)</span>
                      
                      {outfitBottom ? (
                        <div className="space-y-1.5" onClick={() => onSelectProduct && onSelectProduct(outfitBottom)}>
                          <div className="w-14 h-18 bg-white border border-gray-100 rounded-lg mx-auto overflow-hidden shadow-xs cursor-pointer">
                            <img src={outfitBottom.images[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                          <h6 className="text-[10px] font-bold text-gray-900 truncate">{outfitBottom.nameAr}</h6>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 block py-8">حددي قطعة بيجاما/لانجري</span>
                      )}
                    </div>

                  </div>

                  {/* Harmony Analysis meters */}
                  {outfitTop && outfitBottom && (
                    <div className="mt-5 bg-gradient-to-tr from-stone-50 to-amber-50/40 p-3.5 rounded-xl border border-amber-200/40 space-y-2">
                      <div className="flex justify-between items-center flex-row-reverse text-xs">
                        <span className="font-sans font-bold text-amber-900">مؤشر ترف وتناسق الهيئة الملكي:</span>
                        <strong className="text-[#A44C5C] font-mono text-sm">{harmonyScore}%</strong>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${harmonyScore}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-amber-500 to-[#A44C5C]"
                        />
                      </div>
                      <p className="text-[10px] sm:text-[10.5px] text-gray-600 leading-relaxed font-sans font-normal text-right">
                        {harmonyText}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* General bottom suite indicators */}
            <div className="relative z-10 flex justify-between items-center text-[10.5px] font-sans border-t border-gray-200/50 pt-5 mt-4">
              <span className="text-gray-400">موصى باستخدامه عبر الهواتف بوضع الشاشة العمودي</span>
              <span className="text-[#A44C5C] font-semibold flex items-center gap-1">
                <span>✦ صمم بحب في أتيلييه SULTA 👑</span>
              </span>
            </div>

          </div>

          {/* RIGHT PANELS CONTROL COLUMN (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            
            {/* PANEL 1: FABRIC PREVIEW CONTROLS */}
            {activeSuite === 'fabric' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-gray-150 pb-3">
                    <h5 className="text-sm font-extrabold text-[#0B0B0B] block">1. اختر قطعة الحرير للمعاينة:</h5>
                    <span className="text-[10px] text-gray-400 font-sans">تطبيق محاكاة الضوء على خامات الكوتور</span>
                  </div>

                  {/* List of active products for cloth selector */}
                  <div className="max-h-36 overflow-y-auto space-y-2 custom-scrollbar text-right pr-1">
                    {products.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProductFabric(p)}
                        className={`w-full p-2 rounded-xl border flex gap-2 items-center flex-row-reverse text-right transition-all cursor-pointer ${
                          selectedProductFabric?.id === p.id 
                            ? 'border-[#A44C5C] bg-[#A44C5C]/5 font-bold text-gray-950' 
                            : 'border-gray-150 bg-white hover:bg-neutral-50'
                        }`}
                      >
                        <img src={p.images[0]} alt="" className="w-8 h-10 object-cover rounded-md shrink-0" />
                        <div className="flex-1 min-w-0 font-sans text-xs">
                          <h6 className="font-bold truncate text-gray-900">{p.nameAr}</h6>
                          <span className="text-[9.5px] text-gray-400 block">{p.categoryAr} • {country === 'EG' ? p.priceEG : p.priceSA} {country === 'EG' ? 'EGP' : 'SAR'}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Light Atmosphere choices */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block">2. مصدر الضوء (منبع البريق):</span>
                    <div className="grid grid-cols-2 gap-2 font-sans text-[10px] text-gray-600">
                      <button
                        onClick={() => { setLightMode('chandelier'); setLightSlider(65); }}
                        className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${lightMode === 'chandelier' ? 'border-[#A44C5C] bg-[#A44C5C]/10 text-gray-950 font-bold' : 'bg-white border-gray-150 hover:bg-neutral-50'}`}
                      >
                        🏮 ثريا الكريستالات
                      </button>
                      <button
                        onClick={() => { setLightMode('sunset'); setLightSlider(40); }}
                        className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${lightMode === 'sunset' ? 'border-[#A44C5C] bg-[#A44C5C]/10 text-gray-950 font-bold' : 'bg-white border-gray-150 hover:bg-neutral-50'}`}
                      >
                        🌅 شفق الغروب الدافئ
                      </button>
                      <button
                        onClick={() => { setLightMode('golden'); setLightSlider(85); }}
                        className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${lightMode === 'golden' ? 'border-[#A44C5C] bg-[#A44C5C]/10 text-gray-950 font-bold' : 'bg-white border-gray-150 hover:bg-neutral-50'}`}
                      >
                        ⚜️ ساعة الذهب الساطعة
                      </button>
                      <button
                        onClick={() => { setLightMode('candle'); setLightSlider(25); }}
                        className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${lightMode === 'candle' ? 'border-[#A44C5C] bg-[#A44C5C]/10 text-gray-950 font-bold' : 'bg-white border-gray-150 hover:bg-neutral-50'}`}
                      >
                        🕯️ شموع هادئة مريحة
                      </button>
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-3 font-sans text-[11px] text-gray-700">
                    <div className="space-y-1">
                      <div className="flex justify-between flex-row-reverse">
                        <span>قوة وهج الساتان (Light Angle):</span>
                        <strong className="text-[#A44C5C]">{lightSlider}%</strong>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={lightSlider} 
                        onChange={(e) => setLightSlider(parseInt(e.target.value))} 
                        className="w-full accent-[#A44C5C] h-1 bg-gray-200 rounded-lg cursor-ew-resize"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between flex-row-reverse">
                        <span>حركة نسمات هواء الأتيلييه (Breeze):</span>
                        <strong className="text-[#A44C5C]">{windSpeed}%</strong>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={windSpeed} 
                        onChange={(e) => setWindSpeed(parseInt(e.target.value))} 
                        className="w-full accent-[#A44C5C] h-1 bg-gray-200 rounded-lg cursor-ew-resize"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-150">
                  <button
                    onClick={() => selectedProductFabric && handleAddCustomizedToCart(selectedProductFabric, 'fabric')}
                    className="w-full bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#A44C5C] hover:text-white py-3.5 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <ShoppingBag size={14} />
                    <span>إرسال القطعة المعاينة للحقيبة 🛍️</span>
                  </button>
                </div>
              </div>
            )}



            {/* PANEL 3: WAX SEAL CONTROLS */}
            {activeSuite === 'wax' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-gray-150 pb-3">
                    <h5 className="text-sm font-extrabold text-[#0B0B0B] block font-serif">بطاقة العرائس وصندوق الأحلام:</h5>
                    <span className="text-[10px] text-gray-400 font-sans">تطريز الحرف وضغطة الشمع الساخن القديمة</span>
                  </div>

                  {/* Character input */}
                  <div className="space-y-1 font-sans">
                    <label className="text-xs font-bold text-gray-700 block text-right">1. اكتب حرف النحت الملكي (اسمكِ أو اسم العروس):</label>
                    <input
                      type="text"
                      maxLength={1}
                      value={customInitial}
                      onChange={(e) => { 
                        setCustomInitial(e.target.value.toUpperCase()); 
                        setStampCompleted(false); 
                        playLuxuryTone(330, 0, 0.1); 
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-center text-lg font-serif font-bold text-gray-900 focus:outline-[#A44C5C] focus:ring-1 focus:ring-[#A44C5C]"
                      placeholder="S"
                    />
                    <span className="text-[9px] text-gray-400 block text-right">حرف واحد كحد أقصى سيتم نحته يدوياً على ختم الشمع النحاسي.</span>
                  </div>

                  {/* Wax colors list */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block text-right">2. لون الشمع المنصهر (Melted Wax color):</span>
                    <div className="grid grid-cols-2 gap-2 font-sans text-[10px]">
                      {waxColorsList.map(wc => (
                        <button
                          key={wc.id}
                          onClick={() => { setWaxColor(wc); setStampCompleted(false); playLuxuryTone(260, 0, 0.1); }}
                          className={`p-2 rounded-xl border flex gap-1.5 justify-end items-center flex-row-reverse cursor-pointer transition-all ${
                            waxColor.id === wc.id ? 'border-[#A44C5C] bg-white font-bold ring-2 ring-[#A44C5C]/10 text-gray-900' : 'bg-white border-gray-150'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: wc.hex }} />
                          <span>{wc.nameAr}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ribbon colors list */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block text-right">3. لون شريط الساتان المحيط:</span>
                    <div className="space-y-2 font-sans text-xs">
                      {ribbonsList.map(ri => (
                        <div
                          key={ri.id}
                          onClick={() => { setRibbonColor(ri); playLuxuryTone(294.18, 0, 0.1); }}
                          className={`p-2 rounded-xl border cursor-pointer text-right flex gap-3 items-center flex-row-reverse transition-all ${
                            ribbonColor.id === ri.id ? 'border-amber-300 bg-amber-50/20 text-gray-900 font-bold' : 'bg-white border-gray-150 text-gray-600'
                          }`}
                        >
                          <span className="w-10 h-2.5 rounded" style={{ backgroundColor: ri.hex }} />
                          <span className="flex-1 text-[11px] font-bold text-right">{ri.nameAr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-150">
                  <button
                    onClick={handleStamp}
                    disabled={isStamping || !customInitial.trim()}
                    className="w-full bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#A44C5C] hover:text-white py-3.5 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-60 h-12"
                  >
                    <span>{isStamping ? "جاري مهر الصندوق بالشمع الشديد الحرارة..." : "مهر الختم الملكي للشحنة ✉️"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* PANEL 4: COORDINATE CLOTH OUTFIT MATCHMAKER */}
            {activeSuite === 'outfit' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-gray-150 pb-3">
                    <h5 className="text-sm font-extrabold text-[#0B0B0B] block">طاولة تنسيق العباءات وملابس النوم:</h5>
                    <span className="text-[10px] text-gray-400 font-sans">تزاوج مذهل بين الطبقات للتسوق الفاره</span>
                  </div>

                  {/* Top product select drop down */}
                  <div className="space-y-1 font-sans">
                    <label className="text-xs font-bold text-gray-700 block">العنصر العلوي (عباءة / قطعة فضفاضة):</label>
                    <select
                      value={outfitTop?.id || ''}
                      onChange={(e) => {
                        const found = products.find(p => p.id === e.target.value);
                        if (found) { setOutfitTop(found); playLuxuryTone(330, 0, 0.1); }
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-[#A44C5C] focus:ring-1 focus:ring-[#A44C5C]"
                    >
                      {products.filter(p => p.categoryAr?.includes('عباء') || p.category?.toLowerCase().includes('abaya')).map(p => (
                        <option key={p.id} value={p.id}>{p.nameAr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bottom product select drop down */}
                  <div className="space-y-1 font-sans">
                    <label className="text-xs font-bold text-gray-700 block">العنصر الداخلي (بيجاما / طقم نوم لانجري):</label>
                    <select
                      value={outfitBottom?.id || ''}
                      onChange={(e) => {
                        const found = products.find(p => p.id === e.target.value);
                        if (found) { setOutfitBottom(found); playLuxuryTone(294, 0, 0.1); }
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-[#A44C5C] focus:ring-1 focus:ring-[#A44C5C]"
                    >
                      {products.filter(p => p.categoryAr?.includes('نوم') || p.category?.toLowerCase().includes('sleep') || p.category?.toLowerCase().includes('pajama')).map(p => (
                        <option key={p.id} value={p.id}>{p.nameAr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Wrapping carry-over notice */}
                  <div className="bg-stone-50 p-3 rounded-xl border border-gray-150 font-sans text-[10px] text-gray-500 text-right space-y-1">
                    <span className="font-extrabold text-[#A44C5C] block">✓ تفضيلات التعبئة والتغليف المطبقة:</span>
                    <p>العلبة: ختم شمعي بحرف "{customInitial}" (لون {waxColor.nameAr}) مع {ribbonColor.nameAr}</p>
                  </div>

                </div>

                <div className="pt-4 border-t border-gray-150">
                  <button
                    onClick={handleAddBundleToCart}
                    disabled={!outfitTop || !outfitBottom}
                    className="w-full bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#A44C5C] hover:text-white py-3.5 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                  >
                    {addedBundleToCart ? (
                      <>
                        <Check size={14} className="text-emerald-400 font-bold" />
                        <span>✓ تمت إضافة هذا الطقم المتناسق للحقيبة!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={14} />
                        <span>شراء وحجز طقم الهيئة الكامل المستقر 🛍️</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
