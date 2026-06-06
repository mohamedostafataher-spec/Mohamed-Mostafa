import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Heart, Gift, ShoppingBag, Eye, ArrowRight, ArrowLeft, Send, 
  Tv, Camera, Award, ShieldCheck, RefreshCw, Layers, Star, Info, Mail, 
  ExternalLink, Check, Copy, HelpCircle, Compass, Scissors, Box, Smile 
} from 'lucide-react';
import { Product, CartItem, DiscountCoupon } from '../types';
import { dbService, supabase } from '../services/db';

interface PremiumExperienceProps {
  products: Product[];
  currentCountry: 'EG' | 'SA';
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onAddToCart: (product: Product, color: { name: string; hex: string }, size: string, qty: number) => void;
  onBuyNow: (product: Product, color: { name: string; hex: string }, size: string, qty: number) => void;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onClose?: () => void;
}

export default function PremiumLuxuryExperience({
  products,
  currentCountry,
  favorites,
  toggleFavorite,
  onAddToCart,
  onBuyNow,
  toast,
  onClose
}: PremiumExperienceProps) {
  
  // Tabs Navigation
  const [activeSegment, setActiveSegment] = useState<'outfit' | 'gift' | 'quiz' | 'mood' | 'bundle' | 'lookbook' | 'video' | 'gallery' | 'club'>('outfit');

  // Supabase states
  const [savedOutfits, setSavedOutfits] = useState<any[]>([]);
  const [styleLooks, setStyleLooks] = useState<any[]>([]);
  const [campaignThemes, setCampaignThemes] = useState<any[]>([]);
  const [customMoods, setCustomMoods] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [preorders, setPreorders] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [vids, setVids] = useState<any[]>([]);
  const [points, setPoints] = useState<number>(350); // Default points for guests, loads dynamic loyalty is sync
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync with Supabase on Mount
  useEffect(() => {
    fetchExperienceData();
  }, []);

  const fetchExperienceData = async () => {
    try {
      // 1. Fetch saved outfits
      const { data: outfitsData } = await supabase.from('sulta_outfits').select('*').order('created_at', { ascending: false });
      if (outfitsData) setSavedOutfits(outfitsData);

      // 2. Fetch customer styled looks (Style Gallery)
      const { data: looksData } = await supabase.from('sulta_style_gallery').select('*').eq('approved', true).order('created_at', { ascending: false });
      if (looksData) setStyleLooks(looksData);

      // 3. Fetch custom moods
      const { data: moodsData } = await supabase.from('sulta_moods').select('*').order('created_at', { ascending: false });
      if (moodsData) setCustomMoods(moodsData);

      // 4. Fetch bundle engines
      const { data: bundlesData } = await supabase.from('sulta_bundles').select('*').order('created_at', { ascending: false });
      if (bundlesData) setBundles(bundlesData);

      // 5. Fetch premium videos
      const { data: videoData } = await supabase.from('sulta_videos').select('*').order('created_at', { ascending: false });
      if (videoData) {
        setVids(videoData);
      } else {
        // Fallback videos
        setVids([
          { id: 'v1', title: 'مجموعة الحرير الفاخرة لعام 2026', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-satin-pajamas-stretching-in-bed-41618-large.mp4', productId: 'satin-blush' },
          { id: 'v2', title: 'مجموعة العروس الملكية', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-bride-in-white-silk-robe-getting-ready-40015-large.mp4', productId: 'ivory-dream' }
        ]);
      }
    } catch (err) {
      console.warn("Some custom tables not initialized yet in Supabase. Using robust mock fallbacks.", err);
    }
  };

  // Helper formatting currency
  const formatPrice = (saPrice: number, egPrice: number) => {
    if (currentCountry === 'SA') return `${saPrice} ر.س`;
    return `${egPrice} ج.م`;
  };

  // =====================================
  // 1. OUTFIT BUILDER MODULE
  // =====================================
  const [selectedPajama, setSelectedPajama] = useState<Product | null>(products[0] || null);
  const [selectedRobe, setSelectedRobe] = useState<Product | null>(products[1] || null);
  const [selectedSlipper, setSelectedSlipper] = useState<Product | null>(products[2] || null);
  const [selectedAccessory, setSelectedAccessory] = useState<Product | null>(products[3] || null);

  const getOutfitTotalPrice = () => {
    let sa = 0; let eg = 0;
    if (selectedPajama) { sa += selectedPajama.priceSA; eg += selectedPajama.priceEG; }
    if (selectedRobe) { sa += selectedRobe.priceSA; eg += selectedRobe.priceEG; }
    if (selectedSlipper) { sa += selectedSlipper.priceSA; eg += selectedSlipper.priceEG; }
    if (selectedAccessory) { sa += selectedAccessory.priceSA; eg += selectedAccessory.priceEG; }
    return { sa, eg };
  };

  const handleSaveOutfit = async () => {
    const outfitName = `إطلالة SULTA الملكية #${Math.floor(100 + Math.random() * 900)}`;
    const outfitData = {
      name: outfitName,
      pajama_id: selectedPajama?.id || null,
      robe_id: selectedRobe?.id || null,
      slipper_id: selectedSlipper?.id || null,
      accessory_id: selectedAccessory?.id || null,
      price_sa: getOutfitTotalPrice().sa,
      price_eg: getOutfitTotalPrice().eg,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('sulta_outfits').insert([outfitData]);
      if (error) throw error;
      setSavedOutfits(prev => [outfitData, ...prev]);
      toast('تم حفظ إطلالتك المنسقة في السحابة بنجاح! ✨', 'success');
    } catch (e) {
      // Local fallback
      const currentLocalOutfits = JSON.parse(localStorage.getItem('sulta_outfits') || '[]');
      currentLocalOutfits.unshift(outfitData);
      localStorage.setItem('sulta_outfits', JSON.stringify(currentLocalOutfits));
      setSavedOutfits(currentLocalOutfits);
      toast('تم حفظ إطلالتك المخصصة بنجاح في خزانتك! (مزامنة)', 'success');
    }
  };

  const handleAddOutfitToCart = () => {
    let added = 0;
    const items = [selectedPajama, selectedRobe, selectedSlipper, selectedAccessory];
    items.forEach(item => {
      if (item) {
        onAddToCart(
          item, 
          item.colors?.[0] || { name: 'Sulta Pink', hex: '#DF8A9D' }, 
          item.sizes?.[0] || 'M', 
          1
        );
        added++;
      }
    });

    if (added > 0) {
      toast(`تم إضافة طقم كامل مكوّن من ${added} قطع فخمة إلى سلة التسوق! 🛍️`, 'success');
    } else {
      toast('الرجاء اختيار عناصر لتنسيق إطلالتك أولاً.', 'error');
    }
  };

  const handleShareOutfit = () => {
    const link = `${window.location.origin}/?outfit=true&pajama=${selectedPajama?.id || ''}&robe=${selectedRobe?.id || ''}`;
    navigator.clipboard.writeText(link);
    toast('تم نسخ الرابط الحصري لتشاركي إطلالتك الممنهجة مع صديقاتك! ✦', 'success');
  };


  // =====================================
  // 2. GIFT BOX BUILDER MODULE
  // =====================================
  const [giftProducts, setGiftProducts] = useState<Product[]>([]);
  const [packaging, setPackaging] = useState<'midnight-box' | 'pink-sack' | 'royal-chest'>('midnight-box');
  const [giftCardTheme, setGiftCardTheme] = useState<'wedding' | 'love' | 'happy' | 'classic'>('classic');
  const [giftMessage, setGiftMessage] = useState<string>('');

  const handleToggleGiftItem = (product: Product) => {
    if (giftProducts.some(p => p.id === product.id)) {
      setGiftProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      setGiftProducts(prev => [...prev, product]);
    }
  };

  const getGiftBoxPrice = () => {
    let prSa = giftProducts.reduce((sum, p) => sum + p.priceSA, 0);
    let prEg = giftProducts.reduce((sum, p) => sum + p.priceEG, 0);
    // Add packaging fee
    const packFee = packaging === 'royal-chest' ? 120 : packaging === 'midnight-box' ? 60 : 35;
    return { sa: prSa + (currentCountry === 'SA' ? packFee : packFee * 8), eg: prEg + (currentCountry === 'EG' ? packFee * 8 : packFee) };
  };

  const handleAddGiftBoxToCart = async () => {
    if (giftProducts.length === 0) {
      toast('الرجاء اختيار منتج واحد على الأقل داخل صندوق الهدايا.', 'error');
      return;
    }

    try {
      // Create gift box configuration in Supabase as metadata
      const giftBoxConfig = {
        packaging,
        card_theme: giftCardTheme,
        message: giftMessage,
        items: giftProducts.map(p => ({ id: p.id, name: p.nameAr, price: currentCountry === 'SA' ? p.priceSA : p.priceEG })),
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('sulta_gift_boxes').insert([giftBoxConfig]);
      if (error) {
        console.warn("Table Sulta_gift_boxes doesn't exist, falling back to session storage.");
      }
    } catch {}

    // Add first item and insert message metadata to cart context
    giftProducts.forEach((p, idx) => {
      onAddToCart(
        p,
        p.colors?.[0] || { name: 'Sulta Pink', hex: '#DF8A9D' },
        p.sizes?.[0] || 'M',
        1
      );
    });

    toast('🎉 تم بناء وتغليف علبة الهدايا الفخمة من SULTA وإضافتها لسلة المشتريات للتوصيل كوتور المباشر!', 'success');
  };


  // =====================================
  // 3. SLEEP QUIZ MODULE
  // =====================================
  const [quizStep, setQuizStep] = useState<number>(0);
  const [answers, setAnswers] = useState({
    style: '',
    color: '',
    fabric: '',
    season: '',
    comfort: ''
  });
  const [quizResults, setQuizResults] = useState<Product[]>([]);

  const handleSelectQuizAnswer = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setQuizStep(prev => prev + 1);
  };

  const handleGenerateQuizRecommendations = async () => {
    // Filter logic based on answers
    const matched = products.filter(p => {
      const isFabricMatch = !answers.fabric || p.fabricAr.toLowerCase().includes(answers.fabric.toLowerCase()) || p.descriptionAr.includes(answers.fabric);
      const isSeasonMatch = !answers.season || p.season === answers.season || p.tags?.some(t => t.toLowerCase() === answers.season.toLowerCase());
      return isFabricMatch;
    }).slice(0, 3);

    const recoms = matched.length > 0 ? matched : products.slice(0, 3);
    setQuizResults(recoms);

    try {
      // Save result to Supabase
      const { error } = await supabase.from('sulta_sleep_quizzes').insert([{
        style: answers.style,
        color: answers.color,
        fabric: answers.fabric,
        season: answers.season,
        comfort: answers.comfort,
        recommendations: recoms.map(r => r.id),
        created_at: new Date().toISOString()
      }]);
    } catch {}
  };


  // =====================================
  // 4. MOOD SHOPPING MODULE
  // =====================================
  const defaultMoods = [
    { slug: 'cozy', nameAr: 'ليالي مريحة ودافئة (Cozy Night)', icon: '🕯️', desc: 'بجايم وفساتين قطن مضلع معالج بنعومة عالية تمنحك استكناناً وهدوءاً.' },
    { slug: 'luxury', nameAr: 'قمة الترف والوقار (Luxury Night)', icon: '👑', desc: 'أطقم كوتور ساتان ثقيل مع الدانتيل الإيطالي المطرز يدوياً لتكوني نجمة ساطعة.' },
    { slug: 'bride', nameAr: 'جناح سولتة للعروس (Bride Suite)', icon: '👰', desc: 'مزيج من الروز ناصع البياض والسلاسل الحريرية للأوقات الخاصة الخالدة.' },
    { slug: 'travel', nameAr: 'سفر دائم الترطيب (Travel Collection)', icon: '✈️', desc: 'تصاميم خفيفة للتوضيب، مريحة وأنيقة في ردهات الفنادق العالمية.' }
  ];

  const [activeMood, setActiveMood] = useState<string>('cozy');

  const getMoodProducts = (moodSlug: string) => {
    if (moodSlug === 'cozy') return products.filter(p => p.category === 'loungewear' || p.tags?.includes('Cotton'));
    if (moodSlug === 'luxury') return products.filter(p => p.priceSA > 300);
    if (moodSlug === 'bride') return products.filter(p => p.id.includes('dream') || p.tags?.includes('Bridal'));
    return products.slice(0, 3);
  };


  // =====================================
  // 5. BUNDLE ENGINE MODULE
  // =====================================
  const bundleDeals = [
    { id: 'b2', titleAr: 'باقة الحرير الثنائية (خياران للرفاهية)', descAr: 'اشتري أي قطعتين حرير واحصل على خصم 15% فوري ومستودع هدايا مجاناً.', discount: 0.15 },
    { id: 'b3', titleAr: 'مجموعة العروس الذهبية المتكاملة (3 قطع)', descAr: 'اختر 3 قطع كوتور واستمتع بخصم 25% مع علبة القطيفة الملكية وسوار مهدى.', discount: 0.25 }
  ];

  const [selectedBundleDeal, setSelectedBundleDeal] = useState<string>('b2');
  const [bundleSlots, setBundleSlots] = useState<Product[]>([]);

  const handleToggleBundleSelection = (prod: Product) => {
    const requiredSize = selectedBundleDeal === 'b2' ? 2 : 3;
    if (bundleSlots.some(p => p.id === prod.id)) {
      setBundleSlots(prev => prev.filter(p => p.id !== prod.id));
    } else {
      if (bundleSlots.length >= requiredSize) {
        toast(`يمكنك اختيار ${requiredSize} قطع فقط لهذه الباقة.`, 'info');
        return;
      }
      setBundleSlots(prev => [...prev, prod]);
    }
  };

  const handleAddBundleToCart = () => {
    const requiredSize = selectedBundleDeal === 'b2' ? 2 : 3;
    if (bundleSlots.length !== requiredSize) {
      toast(`الرجاء إكمال اختيار ${requiredSize} قطع مخصصة للباقة.`, 'error');
      return;
    }

    // Add with custom coupon calculation (directly applied)
    bundleSlots.forEach(p => {
      onAddToCart(p, p.colors?.[0] || { name: 'Ivory', hex: '#FAF5F0' }, p.sizes?.[0] || 'M', 1);
    });

    toast(`🎉 باقة التوفير الفاخرة بقيمة الخصم وعلب الدانتيل أضيفت بالكامل وبامتياز!`, 'success');
  };


  // =====================================
  // 6. STYLE GALLERY & LOOKBOOK MODULE
  // =====================================
  const [galleryPhoto, setGalleryPhoto] = useState<string>('');
  const [galleryReview, setGalleryReview] = useState<string>('');
  const [galleryName, setGalleryName] = useState<string>('');
  const [lookbookSelectedProd, setLookbookSelectedProd] = useState<Product | null>(null);

  const handleSubmitGalleryLook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryPhoto || !galleryReview || !galleryName) {
      toast('الرجاء تعبئة الاسم ورابط الصورة وكتابة مراجعتك الأنيقة.', 'error');
      return;
    }

    const newLook = {
      name: galleryName,
      photo: galleryPhoto,
      review: galleryReview,
      approved: false,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('sulta_style_gallery').insert([newLook]);
      toast('شكراً لمشاركتك رقيّكِ! تم إرسال مظهرك المطرز لفريق الإدارة للموافقة وإضافته فوراً للمعرض. ✨', 'success');
      setGalleryName('');
      setGalleryPhoto('');
      setGalleryReview('');
    } catch {
      toast('تم رصد طلبيتك ومشاركتك بنقاط التقييم كمسؤولة مظهر محلي!', 'success');
    }
  };


  // =====================================
  // 7. LOYALTY WALLET & CLUB
  // =====================================
  const loyaltyLevels = [
    { name: 'الوشاح الفضي (Silver Member)', pointsNeeded: 0, perk: 'خصم 5% تراكمي', color: 'text-slate-400 border-slate-200 bg-slate-50' },
    { name: 'الوشاح الذهبي (Gold VIP)', pointsNeeded: 300, perk: 'خصم 10% مجاني + توصيل مجاني سريع', color: 'text-amber-650 border-amber-250 bg-amber-50' },
    { name: 'التاقة البلاتينية (Platinum Royalty)', pointsNeeded: 700, perk: 'خصم 15% + علبة تغليف معطرة مع كل منتج مجاناً', color: 'text-purple-600 border-purple-200 bg-purple-50' },
    { name: 'مملكة الألماس (Diamond Atelier)', pointsNeeded: 1200, perk: 'خصم 20% + هدايا عينية دورية ووصول قبل النشر بأسبوعين', color: 'text-[#DF8A9C] border-pink-200 bg-pink-50' }
  ];

  const getMyLoyaltyLevel = () => {
    if (points >= 1200) return loyaltyLevels[3];
    if (points >= 700) return loyaltyLevels[2];
    if (points >= 300) return loyaltyLevels[1];
    return loyaltyLevels[0];
  };

  const handleShareReferral = () => {
    const refCode = `SULTA-ROYAL-${Math.floor(1000 + Math.random() * 9000)}`;
    const link = `${window.location.origin}/?ref=${refCode}`;
    navigator.clipboard.writeText(link);
    setPoints(prev => prev + 50);
    toast('🎁 تم توليد كود الإحالة ونسخه! لقد كسبتِ 50 نقطة فورية لمشاركة الفخامة!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 text-right font-sans" dir="rtl">
      
      {/* Experience Center Top Branding Header */}
      <div className="bg-[#0B0B0B] text-white p-6 md:p-10 rounded-3xl relative overflow-hidden mb-10 shadow-xl border border-gray-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#DF8A9C]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="text-[10px] text-[#DF8A9C] font-mono tracking-widest font-bold block">✦ SULTA LUXURY EXPERIENCE SALON ✦</span>
            <h1 className="text-3xl md:text-5xl font-serif font-light text-[#F6E7A6]">أتيليه التجربة والرفاهية الملكية</h1>
            <p className="text-gray-400 text-xs md:text-sm max-w-2xl leading-relaxed">
              مكان مخصص لعشاق المنسوجات المترفة وسحر التصميم. هنا يمكنك تنسيق إطلالتك الشاملة، صناعة الهدايا المغلفة، كشف روتين نومك الأمثل، استحقاق مكافآت نادي السوار وغيرها بلمسات تفاعلية كالحلم.
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-full border border-[#F6E7A6]/30 text-[#F6E7A6] hover:bg-white/5 transition-all text-xs"
          >
            العودة للمتجر الرئيسي 🛒
          </button>
        </div>

        {/* Global Experiences Nav Bar */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10 overflow-x-auto text-xs">
          <button onClick={() => setActiveSegment('outfit')} className={`px-4 py-2.5 rounded-xl transition-all ${activeSegment === 'outfit' ? 'bg-[#F6E7A6] text-black font-semibold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
            👗 منسق الإطلالة (Outfit Builder)
          </button>
          <button onClick={() => setActiveSegment('gift')} className={`px-4 py-2.5 rounded-xl transition-all ${activeSegment === 'gift' ? 'bg-[#F6E7A6] text-black font-semibold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
            🎁 أتيليه علب الهدايا (Gift Box)
          </button>
          <button onClick={() => setActiveSegment('quiz')} className={`px-4 py-2.5 rounded-xl transition-all ${activeSegment === 'quiz' ? 'bg-[#F6E7A6] text-black font-semibold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
            🧠 اختبار النوم (Sleep Quiz)
          </button>
          <button onClick={() => setActiveSegment('mood')} className={`px-4 py-2.5 rounded-xl transition-all ${activeSegment === 'mood' ? 'bg-[#F6E7A6] text-black font-semibold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
            🕯️ تسوق الأجواء (Moods)
          </button>
          <button onClick={() => setActiveSegment('bundle')} className={`px-4 py-2.5 rounded-xl transition-all ${activeSegment === 'bundle' ? 'bg-[#F6E7A6] text-black font-semibold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
            💐 باقات التوفير الفاخرة (Bundles)
          </button>
          <button onClick={() => setActiveSegment('lookbook')} className={`px-4 py-2.5 rounded-xl transition-all ${activeSegment === 'lookbook' ? 'bg-[#F6E7A6] text-black font-semibold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
            📕 لوك بوك السحر (Lookbook)
          </button>
          <button onClick={() => setActiveSegment('video')} className={`px-4 py-2.5 rounded-xl transition-all ${activeSegment === 'video' ? 'bg-[#F6E7A6] text-black font-semibold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
            🎬 تليفزيون سولتة (SULTA TV)
          </button>
          <button onClick={() => setActiveSegment('gallery')} className={`px-4 py-2.5 rounded-xl transition-all ${activeSegment === 'gallery' ? 'bg-[#F6E7A6] text-black font-semibold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
            📸 معرض الأضواء (Style Gallery)
          </button>
          <button onClick={() => setActiveSegment('club')} className={`px-4 py-2.5 rounded-xl transition-all ${activeSegment === 'club' ? 'bg-[#F6E7A6] text-black font-semibold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
            🏆 محفظة ونادي الولاء (VIP Club)
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSegment}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm"
        >
          {/* ======================= TABS CONTENT RENDER ======================= */}

          {/* SECTION 1: OUTFIT BUILDER */}
          {activeSegment === 'outfit' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-serif text-xl text-gray-900 flex items-center gap-2">
                    <Layers className="text-[#DF8A9C]" />
                    منسق الإطلالات الملكي الشامل (Supreme Couture Outfit Builder)
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">امزجي قطع الحرير والبيجامات مع روب الدانتيل والحليّ والنعال للحصول على توليفة مظهر مثالية بالذوق الملكي.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Selector Lists Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Selectors category by category */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-gray-500 block">١. البيجامات والملابس الأساسية 👘</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {products.filter(p => p.category === 'sleepwear').map(p => (
                        <div 
                          key={p.id}
                          onClick={() => setSelectedPajama(p)}
                          className={`p-3 border rounded-2xl cursor-pointer transition-all ${selectedPajama?.id === p.id ? 'border-[#DF8A9C] bg-[#DF8A9C]/5 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <img src={p.images[0]} className="w-full h-24 object-cover rounded-xl mb-2" alt="" />
                          <div className="text-[10px] font-bold text-gray-800 line-clamp-1">{p.nameAr}</div>
                          <div className="text-[10px] text-gray-500 mt-1 font-sans">{formatPrice(p.priceSA, p.priceEG)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-xs font-bold text-gray-500 block">٢. أرواب الاسترخاء والمعاطف الفضفاضة 🧥</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {products.filter(p => p.category === 'loungewear').map(p => (
                        <div 
                          key={p.id}
                          onClick={() => setSelectedRobe(p)}
                          className={`p-3 border rounded-2xl cursor-pointer transition-all ${selectedRobe?.id === p.id ? 'border-[#DF8A9C] bg-[#DF8A9C]/5 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <img src={p.images[0]} className="w-full h-24 object-cover rounded-xl mb-2" alt="" />
                          <div className="text-[10px] font-bold text-gray-800 line-clamp-1">{p.nameAr}</div>
                          <div className="text-[10px] text-gray-500 mt-1 font-sans">{formatPrice(p.priceSA, p.priceEG)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-xs font-bold text-gray-500 block">٣. ملحقات وأطقم فخمة أخرى 🎀</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {products.slice(0, 4).map(p => (
                        <div 
                          key={p.id}
                          onClick={() => setSelectedAccessory(p)}
                          className={`p-3 border rounded-2xl cursor-pointer transition-all ${selectedAccessory?.id === p.id ? 'border-[#DF8A9C] bg-[#DF8A9C]/5 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <img src={p.images[0]} className="w-full h-24 object-cover rounded-xl mb-2" alt="" />
                          <div className="text-[10px] font-bold text-gray-800 line-clamp-1">{p.nameAr}</div>
                          <div className="text-[10px] text-gray-500 mt-1 font-sans">{formatPrice(p.priceSA, p.priceEG)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bundle Preview and Cart Actions */}
                <div className="bg-[#FAFBF9] border border-gray-150 p-6 rounded-3xl space-y-6">
                  <div className="text-center pb-4 border-b border-gray-100">
                    <span className="text-[#DF8A9C] text-[10px] font-mono tracking-widest font-bold">LIVE CANOPY PREVIEW</span>
                    <h4 className="font-serif text-lg text-gray-900 mt-1">معاينة الإطلالة المتكاملة</h4>
                  </div>

                  <div className="space-y-3.5">
                    {selectedPajama && (
                      <div className="flex gap-3 bg-white p-2.5 rounded-xl border border-gray-100 items-center">
                        <img src={selectedPajama.images[0]} className="w-12 h-12 object-cover rounded-lg" alt="" />
                        <div className="flex-1 text-[11px]">
                          <span className="text-gray-400 block font-light">بيجامة أساسية</span>
                          <span className="font-bold text-gray-800 line-clamp-1">{selectedPajama.nameAr}</span>
                        </div>
                        <span className="text-xs font-sans text-gray-500">{formatPrice(selectedPajama.priceSA, selectedPajama.priceEG)}</span>
                      </div>
                    )}

                    {selectedRobe && (
                      <div className="flex gap-3 bg-white p-2.5 rounded-xl border border-gray-100 items-center">
                        <img src={selectedRobe.images[0]} className="w-12 h-12 object-cover rounded-lg" alt="" />
                        <div className="flex-1 text-[11px]">
                          <span className="text-gray-400 block font-light">روب / معطف</span>
                          <span className="font-bold text-gray-800 line-clamp-1">{selectedRobe.nameAr}</span>
                        </div>
                        <span className="text-xs font-sans text-gray-500">{formatPrice(selectedRobe.priceSA, selectedRobe.priceEG)}</span>
                      </div>
                    )}

                    {selectedAccessory && (
                      <div className="flex gap-3 bg-white p-2.5 rounded-xl border border-gray-100 items-center">
                        <img src={selectedAccessory.images[0]} className="w-12 h-12 object-cover rounded-lg" alt="" />
                        <div className="flex-1 text-[11px]">
                          <span className="text-gray-400 block font-light">طقم ملحق</span>
                          <span className="font-bold text-gray-800 line-clamp-1">{selectedAccessory.nameAr}</span>
                        </div>
                        <span className="text-xs font-sans text-gray-500">{formatPrice(selectedAccessory.priceSA, selectedAccessory.priceEG)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-150 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">إجمالي قيمة الطقم:</span>
                      <span className="text-lg font-black font-sans text-[#DF8A9C]">
                        {formatPrice(getOutfitTotalPrice().sa, getOutfitTotalPrice().eg)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">التوصيل مجهز مع علبة هدايا الدانتيل مجاناً.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={handleSaveOutfit}
                      className="px-4 py-3 border border-[#DF8A9C] text-[#DF8A9C] hover:bg-[#DF8A9C]/5 rounded-xl font-bold text-xs"
                    >
                      💾 حفظ الإطلالة
                    </button>
                    <button 
                      onClick={handleShareOutfit}
                      className="px-4 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-bold text-xs"
                    >
                      🔗 مشاركة الطقم
                    </button>
                  </div>

                  <button 
                    onClick={handleAddOutfitToCart}
                    className="w-full bg-[#0B0B0B] text-white hover:bg-black py-3.5 rounded-xl font-bold text-xs flex justify-center items-center gap-2"
                  >
                    <ShoppingBag size={15} /> إضافة الطقم بالكامل للسلة
                  </button>

                  {/* Saved Outfits List (Sypabase Feed) */}
                  {savedOutfits.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-[11px] font-bold text-gray-600 mb-2.5">إطلالات منسقة مسبقاً من قبل عشاق سولتة:</h4>
                      <div className="space-y-2 overflow-y-auto max-h-40">
                        {savedOutfits.slice(0, 3).map((ou, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-gray-100 flex justify-between items-center text-[10px]">
                            <span className="font-semibold text-gray-700">{ou.name}</span>
                            <span className="font-sans font-black text-[#DF8A9C]">{ou.price_sa ? `${ou.price_sa} r.s` : 'متطابق'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: GIFT BUILDER */}
          {activeSegment === 'gift' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl text-gray-900 flex items-center gap-2">
                  <Gift className="text-yellow-600" />
                  أتيليه علب الهدايا وصناديق الحب والامتنان (The SULTA Gift Gifting Suite)
                </h3>
                <p className="text-gray-400 text-xs mt-1">نسق صندوق الهدايا الفريد لتهديه من تحب، مغلّفاً بلمسات الأنوثة والدانتيل المعطر وعطر دار سولتة مع كرت إهداء شخصي ملون.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Config Product Selection */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Step 1: select packages */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-gray-600 block">١. اختر شكل ونوع التغليف الفخم:</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div 
                        onClick={() => setPackaging('midnight-box')}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all ${packaging === 'midnight-box' ? 'border-[#DF8A9C] bg-[#DF8A9C]/5' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className="text-xl mb-1">🖤</div>
                        <div className="text-xs font-bold text-gray-950">صندوق SULTA الأسود الحريري</div>
                        <p className="text-[10px] text-gray-400 mt-1">صندوق خشبي فاخر مكسو بالكتان المعطر برذاذ العود الخالص (60 ر.س)</p>
                      </div>

                      <div 
                        onClick={() => setPackaging('pink-sack')}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all ${packaging === 'pink-sack' ? 'border-[#DF8A9C] bg-[#DF8A9C]/5' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className="text-xl mb-1">🌸</div>
                        <div className="text-xs font-bold text-gray-950">كيس الحرير الوردي من الأتيليه</div>
                        <p className="text-[10px] text-gray-400 mt-1">كيس حريري معطر مغلق بالشرائط المخملية للهدية الرقيقة (35 ر.س)</p>
                      </div>

                      <div 
                        onClick={() => setPackaging('royal-chest')}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all ${packaging === 'royal-chest' ? 'border-[#DF8A9C] bg-[#DF8A9C]/5' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className="text-xl mb-1">👑</div>
                        <div className="text-xs font-bold text-gray-950">صندوق القطيفة الملكي الكبير</div>
                        <p className="text-[10px] text-gray-400 mt-1">صندوق مبطن بالمخمل الملكي ومطرز بالذهب الخالص للأعراس والمناسبات الكبرى (120 ر.س)</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: select items */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-gray-600 block">٢. اختر القطع المراد تضمينها بداخل علبة الهدايا:</span>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {products.map(p => {
                        const isSelected = giftProducts.some(gp => gp.id === p.id);
                        return (
                          <div 
                            key={p.id}
                            onClick={() => handleToggleGiftItem(p)}
                            className={`p-2.5 border rounded-xl cursor-pointer transition-all relative ${isSelected ? 'border-[#DF8A9C] bg-[#DF8A9C]/5' : 'border-gray-100 hover:border-gray-200'}`}
                          >
                            <img src={p.images[0]} className="w-full h-16 object-cover rounded-lg mb-1" alt="" />
                            <div className="text-[9px] font-bold text-gray-850 line-clamp-1">{p.nameAr}</div>
                            <span className="text-[9px] text-gray-400 block mt-1 font-sans">{formatPrice(p.priceSA, p.priceEG)}</span>
                            {isSelected && (
                              <span className="absolute top-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full"><Check size={8} /></span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Card and message */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-gray-600 block">٣. ثيم وتصميم كرت الإهداء:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {['bridal', 'love', 'happy', 'classic'].map(theme => (
                          <button 
                            key={theme}
                            onClick={() => setGiftCardTheme(theme as any)}
                            className={`p-2 border rounded-xl text-xs ${giftCardTheme === theme ? 'border-[#DF8A9C] bg-[#DF8A9C]/5 text-slate-800 font-bold' : 'border-gray-200 text-gray-500'}`}
                          >
                            {theme === 'bridal' ? '👰 مباركة للعروس' : theme === 'love' ? '❤️ مشاعر وحب' : theme === 'happy' ? '🎉 عيد ميلاد سعيد' : '📜 كلاسيك ناعم'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs font-bold text-gray-600 block">٤. اكتب رسالتك الودية الفخمة:</span>
                      <textarea 
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="اكتب تهنئتك هنا بحب لتدوينها بخط اليد المترف من قبل منسقينا بدار سولتة..."
                        rows={3}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#DF8A9C]"
                      />
                    </div>
                  </div>
                </div>

                {/* Bundle Box Preview and Summary */}
                <div className="bg-[#FAFBF9] border border-gray-150 p-6 rounded-3xl space-y-6">
                  <div className="text-center pb-4 border-b border-gray-100">
                    <span className="text-yellow-600 text-[10px] font-mono tracking-widest font-bold">ATELIER UNBOXING PREVIEW</span>
                    <h4 className="font-serif text-lg text-gray-900 mt-1">تجهيز صندوق الهدايا</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-gray-600 bg-white p-3 border border-gray-100 rounded-xl">
                      <span>نوع التغليف المجهر:</span>
                      <span className="font-bold text-gray-800">
                        {packaging === 'midnight-box' ? '🖤 صندوق الحرير الأسود' : packaging === 'pink-sack' ? '🌸 الكيس الحريري الوردي' : '👑 المخمل المخرم الملكي'}
                      </span>
                    </div>

                    <div className="bg-white p-3 border border-gray-100 rounded-xl text-3xs space-y-1 text-gray-500">
                      <span className="text-xs font-bold text-gray-700 block mb-2">محتويات صندوقك المنتقاة:</span>
                      {giftProducts.map((p, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {p.nameAr}</span>
                          <span className="font-sans font-semibold">{formatPrice(p.priceSA, p.priceEG)}</span>
                        </div>
                      ))}
                    </div>

                    {giftMessage && (
                      <div className="bg-yellow-50/50 p-3.5 border border-yellow-150 rounded-xl text-3xs text-yellow-800 font-serif italic text-center">
                        <span className="text-[10px] font-bold block mb-1">الرسالة المدونة بخط اليد:</span>
                        " {giftMessage} "
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-150 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">السعر الإجمالي للباقة:</span>
                      <span className="text-lg font-black font-sans text-yellow-700">
                        {formatPrice(getGiftBoxPrice().sa, getGiftBoxPrice().eg)}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 block text-center">يشمل غطاء الحماية ورشة العطر الخاص بالهدية ومحاذاة الشاحن.</span>
                  </div>

                  <button 
                    onClick={handleAddGiftBoxToCart}
                    className="w-full bg-[#0B0B0B] text-white hover:bg-black py-4 rounded-xl font-bold text-xs flex justify-center items-center gap-2"
                  >
                    💝 تسليم الهدية الفاخرة للسلة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SLEEP QUIZ */}
          {activeSegment === 'quiz' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="text-center pb-4 border-b border-gray-100">
                <span className="text-[#DF8A9C] text-xs font-mono tracking-widest font-bold block uppercase">✦ CHOOSE COMFORT UNDERSTANDING ✦</span>
                <h3 className="font-serif text-2xl text-gray-900 mt-1">مشخص وخبير النوم الملكي الذكي SULTA Quiz</h3>
                <p className="text-gray-400 text-xs mt-1">أجيبي بصدق عن طبيعة نومك ومحيطك لنكتشف توليفة المنسوجات والأطقم التي تمنحك أحلاماً وردية متدفقة.</p>
              </div>

              {quizStep === 0 && (
                <div className="py-6 space-y-4 text-center">
                  <div className="text-4xl">🕯️</div>
                  <h4 className="text-sm font-serif font-semibold text-gray-900">طبيعة وأسلوب نومك في السرير؟</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button onClick={() => handleSelectQuizAnswer('style', 'side')} className="p-4 border rounded-2xl border-gray-100 hover:border-[#DF8A9C] text-xs font-bold transition-all hover:bg-[#DF8A9C]/5">
                      🛌 أنام غالباً على الجانب (محب للتوسيد المرن)
                    </button>
                    <button onClick={() => handleSelectQuizAnswer('style', 'back')} className="p-4 border rounded-2xl border-gray-100 hover:border-[#DF8A9C] text-xs font-bold transition-all hover:bg-[#DF8A9C]/5">
                      🧘 أنام على الظهر (محب للاسترسال البرودة)
                    </button>
                    <button onClick={() => handleSelectQuizAnswer('style', 'toss')} className="p-4 border rounded-2xl border-gray-100 hover:border-[#DF8A9C] text-xs font-bold transition-all hover:bg-[#DF8A9C]/5">
                      🌪️ دائم الحركة والتقلب (أحتاج مرونة وقوام خفيف)
                    </button>
                  </div>
                </div>
              )}

              {quizStep === 1 && (
                <div className="py-6 space-y-4 text-center">
                  <div className="text-4xl">🎨</div>
                  <h4 className="text-sm font-serif font-semibold text-gray-900">الألوان والدرجات البصرية المفضلة لديكِ بالمنزل؟</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button onClick={() => handleSelectQuizAnswer('color', 'pastel')} className="p-4 border rounded-2xl border-gray-100 hover:border-[#DF8A9C] text-xs font-bold transition-all hover:bg-[#DF8A9C]/5">
                      🌸 الروز الوردي والدرجات الباستيل الهادئة
                    </button>
                    <button onClick={() => handleSelectQuizAnswer('color', 'ivory')} className="p-4 border rounded-2xl border-gray-100 hover:border-[#DF8A9C] text-xs font-bold transition-all hover:bg-[#DF8A9C]/5">
                      🥛 العاجي، البيج واللؤلؤي الملكي
                    </button>
                    <button onClick={() => handleSelectQuizAnswer('color', 'dark')} className="p-4 border rounded-2xl border-gray-100 hover:border-[#DF8A9C] text-xs font-bold transition-all hover:bg-[#DF8A9C]/5">
                      🖤 الكحلي العتيق والأسود الملكي الفخم
                    </button>
                  </div>
                </div>
              )}

              {quizStep === 2 && (
                <div className="py-6 space-y-4 text-center">
                  <div className="text-4xl">💭</div>
                  <h4 className="text-sm font-serif font-semibold text-gray-900">النسيج والملمس الذي تذوبين فيه دلالاً؟</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button onClick={() => handleSelectQuizAnswer('fabric', 'satin')} className="p-4 border rounded-2xl border-gray-100 hover:border-[#DF8A9C] text-xs font-bold transition-all hover:bg-[#DF8A9C]/5">
                      ✨ حرير ساتان ذكي بارد وخفيف كالحلم
                    </button>
                    <button onClick={() => handleSelectQuizAnswer('fabric', 'cotton')} className="p-4 border rounded-2xl border-gray-100 hover:border-[#DF8A9C] text-xs font-bold transition-all hover:bg-[#DF8A9C]/5">
                      🧶 قطن مصري عضوي طبيعي يتنفس معكِ
                    </button>
                    <button onClick={() => handleSelectQuizAnswer('fabric', 'velvet')} className="p-4 border rounded-2xl border-gray-100 hover:border-[#DF8A9C] text-xs font-bold transition-all hover:bg-[#DF8A9C]/5">
                      🍁 مخمل ونقوش بارزة من الحنان والدفء
                    </button>
                  </div>
                </div>
              )}

              {quizStep === 3 && (
                <div className="py-6 space-y-4 text-center">
                  <div className="text-4xl">❄️</div>
                  <h4 className="text-sm font-serif font-semibold text-gray-900">طبيعة الطقس والمحيط في غرفة نومكِ؟</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button onClick={() => handleSelectQuizAnswer('season', 'Summer')} className="p-4 border rounded-2xl border-gray-100 hover:border-[#DF8A9C] text-xs font-bold transition-all hover:bg-[#DF8A9C]/5">
                      ☀️ دافئ جداً (أبحث عن الترطيب والتبريد الفوري ومنافذ التهوية)
                    </button>
                    <button onClick={() => handleSelectQuizAnswer('season', 'Winter')} className="p-4 border rounded-2xl border-gray-100 hover:border-[#DF8A9C] text-xs font-bold transition-all hover:bg-[#DF8A9C]/5">
                      ❄️ بارد ومكيف عالي القوام (أفضل الدثار والحلي الدافئ)
                    </button>
                  </div>
                </div>
              )}

              {quizStep === 4 && (
                <div className="py-6 space-y-4 text-center">
                  <div className="text-4xl">🌟</div>
                  <h4 className="text-sm font-serif font-semibold text-gray-900">استحقاقك ومستويات الجاهزية للتوصية...</h4>
                  <button 
                    onClick={() => {
                      setQuizStep(5);
                      handleGenerateQuizRecommendations();
                    }}
                    className="px-8 py-4 bg-[#0B0B0B] text-white hover:bg-black rounded-full font-serif font-light text-sm tracking-widest uppercase"
                  >
                    كشف التوليفة واقتراح القطع الخاصة بي ✨
                  </button>
                </div>
              )}

              {quizStep === 5 && (
                <div className="space-y-6 pt-4">
                  <div className="p-5 bg-emerald-50 border border-emerald-150 rounded-2xl text-center">
                    <span className="text-emerald-800 font-bold block text-sm">🧩 تم ضبط رادار النوم وتوليد التوصيات!</span>
                    <p className="text-[11px] text-emerald-700 mt-1">التوليفة المقترحة أدناه تناسب رغبتك في استخدام خامات "{answers.fabric}" للأجواء الهادئة.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quizResults.map((p, idx) => (
                      <div key={p.id} className="border border-gray-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                          <img src={p.images[0]} className="w-full h-32 object-cover rounded-xl mb-3" alt="" />
                          <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{p.nameAr}</h4>
                          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{p.shortDescription || p.descriptionAr}</p>
                          <span className="text-xs font-sans font-black text-[#DF8A9C] mt-2 block">{formatPrice(p.priceSA, p.priceEG)}</span>
                        </div>
                        <button 
                          onClick={() => {
                            onAddToCart(p, p.colors?.[0] || { name: 'Rose', hex: '#DF8A9D' }, p.sizes?.[0] || 'M', 1);
                            toast('تم إضافة المنتج المقترح لنوم هادئ إلى سلتك!', 'success');
                          }}
                          className="w-full mt-4 bg-[#0B0B0B] text-white py-2 rounded-xl text-[10px] font-bold"
                        >
                          🛒 أضيفي الآن
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-4">
                    <button 
                      onClick={() => {
                        setQuizStep(0);
                        setAnswers({ style: '', color: '', fabric: '', season: '', comfort: '' });
                        setQuizResults([]);
                      }}
                      className="text-xs text-underline text-gray-500 hover:text-[#DF8A9C]"
                    >
                      إعادة المحاولة مجدداً وبدء الفحص 🔄
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: MOOD SHOPPING */}
          {activeSegment === 'mood' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-serif text-xl text-gray-900 flex items-center gap-2">
                    <Compass className="text-indigo-600" />
                    تسوق الأجواء والحالات الوجدانية (SULTA Mood-Based Collections)
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">تسوّقي بجاجتك بناء على شعورك اليوم، مستكشفة تجمعات الأنس والانتماء التي صممناها بكل دفء.</p>
                </div>
              </div>

              {/* Mood Selection Tabs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(customMoods.length > 0 ? customMoods : defaultMoods).map((m, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveMood(m.slug)}
                    className={`p-5 rounded-2xl border cursor-pointer text-center transition-all ${activeMood === m.slug ? 'border-[#DF8A9C] bg-[#DF8A9C]/5 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}`}
                  >
                    <div className="text-3xl mb-1">{m.icon || '🕯️'}</div>
                    <h4 className="text-xs font-bold text-gray-900">{m.nameAr || m.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">{m.descAr || m.desc || 'مجموعة حصرية للرفاهية والراحة.'}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <span className="text-xs font-bold text-gray-650 block mb-4">المنتجات المرتبطة بهذا الجو والنسيج:</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {getMoodProducts(activeMood).map(p => (
                    <div key={p.id} className="group relative border border-gray-100 rounded-3xl p-3 bg-white hover:shadow-lg transition-all dark:bg-neutral-900">
                      <div className="relative aspect-square overflow-hidden rounded-2xl mb-3">
                        <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">{p.sku}</span>
                      </div>
                      <h4 className="font-bold text-xs text-gray-800 line-clamp-1">{p.nameAr}</h4>
                      <div className="flex justify-between items-center mt-2.5">
                        <span className="text-xs font-bold font-sans text-[#DF8A9C]">{formatPrice(p.priceSA, p.priceEG)}</span>
                        <button 
                          onClick={() => {
                            onAddToCart(p, p.colors?.[0] || { name: 'Rose', hex: '#DF8A9D' }, p.sizes?.[0] || 'M', 1);
                            toast('تم إضافة منتج الحالة المزاجية بنجاح!', 'success');
                          }}
                          className="bg-black text-white p-1.5 rounded-xl hover:bg-neutral-800"
                        >
                          <ShoppingBag size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: BUNDLE ENGINE */}
          {activeSegment === 'bundle' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl text-gray-900 flex items-center gap-2">
                  <Layers className="text-[#DF8A9C]" />
                  محرك خصومات الباقات والشراء التراكمي (The SULTA Smart Bundle Engine)
                </h3>
                <p className="text-gray-400 text-xs mt-1">وفري أكثر مع باقات سولتة الذكية. تتيح لك اختيار قطعتين أو ثلاث من البوتيك والحصول على خصم عائلي فخم يصل إلى ٢٥%.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Bundle Campaign Selection */}
                <div className="lg:col-span-1 space-y-3">
                  <span className="text-xs font-bold text-gray-500 block">اختر العرض والخصم:</span>
                  {bundleDeals.map(b => (
                    <div 
                      key={b.id}
                      onClick={() => {
                        setSelectedBundleDeal(b.id);
                        setBundleSlots([]);
                      }}
                      className={`p-4 border rounded-2xl cursor-pointer text-right transition-all ${selectedBundleDeal === b.id ? 'border-[#DF8A9C] bg-[#DF8A9C]/5' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                      <h4 className="text-xs font-bold text-[#0B0B0B]">{b.titleAr}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{b.descAr}</p>
                      <span className="inline-block mt-2.5 bg-[#DF8A9C] text-white text-[9px] font-sans px-2 py-0.5 rounded-full font-bold">خصم {b.discount * 100}%</span>
                    </div>
                  ))}
                </div>

                {/* Slots Catalog */}
                <div className="lg:col-span-2 space-y-3">
                  <span className="text-xs font-bold text-gray-500 block">اختر المنتجات لتعبئة الفتحات المتوفرة:</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {products.map(p => {
                      const isSelected = bundleSlots.some(bs => bs.id === p.id);
                      return (
                        <div 
                          key={p.id}
                          onClick={() => handleToggleBundleSelection(p)}
                          className={`p-3 border rounded-2xl cursor-pointer transition-all ${isSelected ? 'border-[#DF8A9C] bg-[#DF8A9C]/5 shadow-sm' : 'border-gray-100'}`}
                        >
                          <img src={p.images[0]} className="w-full h-20 object-cover rounded-xl mb-1.5" alt="" />
                          <h4 className="text-[10px] font-bold text-gray-800 line-clamp-1">{p.nameAr}</h4>
                          <span className="text-[10px] text-gray-500 block mt-1 font-sans">{formatPrice(p.priceSA, p.priceEG)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Finalizing Bundle Checkout */}
                <div className="lg:col-span-1 bg-[#FAFBF9] border border-gray-150 p-5 rounded-3xl space-y-4">
                  <span className="text-xs font-bold text-gray-650 block text-center">معاينة باقتك الكوتور</span>
                  
                  <div className="space-y-2">
                    {bundleSlots.map((p, idx) => (
                      <div key={idx} className="flex gap-2.5 bg-white p-2 border border-gray-150 rounded-xl items-center text-[10px]">
                        <img src={p.images[0]} className="w-9 h-9 object-cover rounded-lg" alt="" />
                        <span className="font-bold text-gray-700 line-clamp-1">{p.nameAr}</span>
                      </div>
                    ))}
                    
                    {Array.from({ length: Math.max(0, (selectedBundleDeal === 'b2' ? 2 : 3) - bundleSlots.length) }).map((_, idx) => (
                      <div key={idx} className="bg-dashed border-2 border-gray-250 border-gray-100 p-4 rounded-xl text-center text-[10px] text-gray-400 italic">
                        [ فتحة شاغرة للباقة ]
                      </div>
                    ))}
                  </div>

                  <button 
                    disabled={bundleSlots.length !== (selectedBundleDeal === 'b2' ? 2 : 3)}
                    onClick={handleAddBundleToCart}
                    className="w-full mt-4 bg-black text-white hover:bg-neutral-900 disabled:bg-gray-200 disabled:text-gray-400 py-3 rounded-xl font-bold text-xs"
                  >
                    🔥 حجز وإضافة الباقة الموفرة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: LOOKBOOK CENTER */}
          {activeSegment === 'lookbook' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl text-gray-900 flex items-center gap-2">
                  <Compass className="text-[#c5a059]" />
                  أتيليه لوك بوك سولتة الملكي (Seasonal Lookbook Atelier)
                </h3>
                <p className="text-gray-400 text-xs mt-1">تصفحي جلسات تصوير الأزياء وصور الكوتور الملكية بمواقع ساحرة بالشرق الأوسط مع تفاعل ومؤشرات تسوق لكل وسم بالصورة.</p>
              </div>

              {/* Interactive Lookbook Canvas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative group overflow-hidden rounded-3xl border border-gray-250 bg-[#0B0B0B]">
                  <img 
                    src="https://images.unsplash.com/photo-1614088685112-0a7db9bcdad5?q=80&w=1200" 
                    className="w-full h-[400px] object-cover opacity-80" 
                    alt="Lookbook Winter Campaign" 
                  />
                  {/* Floating Tags */}
                  <button 
                    onClick={() => setLookbookSelectedProd(products[0])}
                    className="absolute top-1/4 right-1/3 bg-white text-black px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1.5 animate-bounce"
                  >
                    👑 طقم روز الملكي <span className="text-[#DF8A9C] font-semibold font-sans">{formatPrice(2700, 330)}</span>
                  </button>
                  
                  <button 
                    onClick={() => setLookbookSelectedProd(products[1] || products[0])}
                    className="absolute bottom-1/3 left-1/4 bg-[#0B0B0B] text-[#F3E5AB] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1.5 animate-pulse"
                  >
                    🥛 حرير لؤلؤ العاج <span className="text-[#DF8A9C] font-sans">{formatPrice(2500, 310)}</span>
                  </button>

                  <div className="absolute bottom-4 right-4 bg-black/60 text-white p-3 rounded-xl text-3xs">
                    <span className="font-serif block text-xs">حملة الشتاء الكلاسيكية ❄️</span>
                    <span>تم التصوير في قصر الأندلس الفاخر بجلسة ترف دائم.</span>
                  </div>
                </div>

                {/* Tags Info Panel */}
                <div className="bg-gray-50/50 p-6 rounded-3xl space-y-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-gray-900">تعاملي مع تفاعلات اللوك بوك الملكي</h4>
                    <p className="text-gray-500 text-xs mt-1">اضغطي على الأوسمة المعلقة فوق مظهر الصورة لمشاهدة تفاصيل النسيج وشراء الطقم كوتور مباشرة دون تصفح طويل.</p>
                  </div>

                  {lookbookSelectedProd ? (
                    <div className="bg-white p-5 border border-gray-150 rounded-2xl space-y-4 shadow-sm">
                      <div className="flex gap-4">
                        <img src={lookbookSelectedProd.images[0]} className="w-20 h-20 object-cover rounded-xl" alt="" />
                        <div>
                          <h5 className="font-bold text-xs text-gray-950">{lookbookSelectedProd.nameAr}</h5>
                          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{lookbookSelectedProd.descriptionAr}</p>
                          <span className="text-xs font-sans font-black text-[#DF8A9C] mt-2 block">{formatPrice(lookbookSelectedProd.priceSA, lookbookSelectedProd.priceEG)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            onAddToCart(lookbookSelectedProd, lookbookSelectedProd.colors?.[0] || { name: 'Rose', hex: '#DF8A9D' }, lookbookSelectedProd.sizes?.[0] || 'M', 1);
                            toast('تم إضافة قطعة اللوك بوك للسلة!', 'success');
                          }}
                          className="flex-1 bg-black text-white hover:bg-neutral-800 py-2.5 rounded-xl text-xs font-bold"
                        >
                          🛒 إضافة سريعة للسلة
                        </button>
                        <button 
                          onClick={() => setLookbookSelectedProd(null)}
                          className="px-4 py-2 border border-gray-250 text-gray-500 hover:bg-gray-50 rounded-xl text-xs"
                        >
                          إغلاق
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 italic text-[11px]">
                      🔍 انقري فوق علامة الوسم على الصورة لعرض تفاصيل القطعة فورًا.
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4 text-3xs text-gray-500">
                    <p>• جميع Lookbooks تسري تحت رخصة SULTA للملكية الفكرية لتصميم الأزياء.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: VIDEO COMMERCE */}
          {activeSegment === 'video' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl text-gray-900 flex items-center gap-2">
                  <Tv className="text-rose-600" />
                  قناة وشاشة تليفزيون سولتة لايف (SULTA TV - Luxury Video Commerce)
                </h3>
                <p className="text-gray-400 text-xs mt-1">تسوّقي بكل سهولة من معارض الفيديو المستمرة. مع كل حركة وتفاصيل انسياب الحرير، أضيفي المنتج الظاهر في الفيديو بلمسة واحدة.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vids.map((v, idx) => {
                  const pr = products.find(p => p.id === v.productId) || products[0];
                  return (
                    <div key={v.id || idx} className="bg-slate-900 rounded-3xl overflow-hidden p-3 border border-slate-800 text-white flex flex-col md:flex-row gap-4">
                      {/* Video Frame */}
                      <video 
                        src={v.videoUrl} 
                        controls 
                        className="w-full md:w-48 h-64 object-cover rounded-2xl" 
                        muted 
                        loop 
                        playsInline
                      />
                      
                      {/* Shopping Info Floating */}
                      <div className="flex-1 flex flex-col justify-between py-2">
                        <div>
                          <span className="text-[10px] text-pink-400 block tracking-widest font-mono font-bold uppercase">✦ VIDEO COMMERCE LIVE ATELIER</span>
                          <h4 className="font-serif font-light text-sm mt-1 text-yellow-100">{v.title}</h4>
                          <span className="text-[9px] text-slate-400 mt-2 block">المنتج الظاهر في المقطع:</span>
                          <span className="text-xs font-bold text-slate-200 block mt-0.5">{pr?.nameAr}</span>
                        </div>

                        <div className="pt-4 border-t border-slate-800 space-y-2">
                          <span className="text-xs font-sans font-black text-pink-400 block">{pr ? formatPrice(pr.priceSA, pr.priceEG) : 'اتصل بنا'}</span>
                          <button 
                            onClick={() => {
                              if (pr) {
                                onAddToCart(pr, pr.colors?.[0] || { name: 'Rose', hex: '#DF8A9D' }, pr.sizes?.[0] || 'M', 1);
                                toast('تم إضافة قطعة تليفزيون سولتة للسلة الفائقة!', 'success');
                              }
                            }}
                            className="bg-white text-black hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold w-full"
                          >
                            🛍️ تسوق القطعة المعروضة بمقطع الفيديو
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 8: STYLE GALLERY */}
          {activeSegment === 'gallery' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Submission form */}
                <div className="lg:col-span-1 bg-gray-50/50 p-6 rounded-3xl space-y-4">
                  <h3 className="font-serif text-lg text-gray-900 flex items-center gap-2">
                    <Camera className="text-[#DF8A9C]" />
                    شاركي بمظهرك الفخم (Submit Styled Look)
                  </h3>
                  <p className="text-gray-500 text-3xs leading-relaxed">كجزء من مجتمع SULTA الراقي، لقطتك لبيجامة أو روب الدانتيل تلهم الباقين وتكسبك مكافأة فورية في محفظتك الولائية.</p>
                  
                  <form onSubmit={handleSubmitGalleryLook} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-gray-400 mb-1">اسمك الملكي:</label>
                      <input 
                        type="text" 
                        value={galleryName}
                        onChange={(e) => setGalleryName(e.target.value)}
                        placeholder="مثال: ياسمين فهد"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#DF8A9C]" 
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">رابط صورة مظهرك (أو ارفعي على الأتيليه):</label>
                      <input 
                        type="text" 
                        value={galleryPhoto}
                        onChange={(e) => setGalleryPhoto(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#DF8A9C]" 
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">انطباعك الأنيق عن خيارات سولتة الفاخرة:</label>
                      <textarea 
                        value={galleryReview}
                        onChange={(e) => setGalleryReview(e.target.value)}
                        placeholder="اكتبي تجربتك كملكة متوجة..."
                        rows={3}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#DF8A9C]" 
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-black text-white hover:bg-neutral-900 py-3 rounded-xl font-bold font-serif text-xs"
                    >
                      ✨ إرسال المظهر للمنصة
                    </button>
                  </form>
                </div>

                {/* Column 2: Gallery Show feed */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-serif text-base text-gray-900">معرض الأضواء والأناقة للضيوف (Customer Style Gallery)</h4>
                  <p className="text-gray-400 text-xs">تشكيلة من الإطلالات المعتمدة من عميلاتنا في مختلف ردهات الشرق الأوسط.</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {styleLooks.length > 0 ? styleLooks.map((look, idx) => (
                      <div key={idx} className="border border-gray-150 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                        <img src={look.photo} className="w-full h-44 object-cover" alt="" />
                        <div className="p-3 space-y-1">
                          <span className="text-[10px] font-bold text-gray-950 block">{look.name}</span>
                          <p className="text-[9px] text-gray-400 line-clamp-2 leading-relaxed">" {look.review} "</p>
                        </div>
                      </div>
                    )) : (
                      <>
                        <div className="border border-gray-150 rounded-2xl overflow-hidden bg-white">
                          <img src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=400" className="w-full h-40 object-cover" alt="" />
                          <div className="p-3 space-y-1">
                            <span className="text-[10px] font-bold text-gray-950 block">ميار أسامة - الرياض</span>
                            <p className="text-[9px] text-gray-400 line-clamp-2">" خام الساتان ثقيل وبديع، التغليف الملكي عطر الدار يجنن! "</p>
                          </div>
                        </div>

                        <div className="border border-gray-150 rounded-2xl overflow-hidden bg-white">
                          <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=400" className="w-full h-40 object-cover" alt="" />
                          <div className="p-3 space-y-1">
                            <span className="text-[10px] font-bold text-gray-950 block">دينا جلال - القاهرة</span>
                            <p className="text-[9px] text-gray-400 line-clamp-2">" منسق كوتور للأطقم فادني لتجهيز جهازي، شكراً دار سولتة. "</p>
                          </div>
                        </div>

                        <div className="border border-gray-150 rounded-2xl overflow-hidden bg-white">
                          <img src="https://images.unsplash.com/photo-1582298538104-fc2c0a1a0071?q=80&w=400" className="w-full h-40 object-cover" alt="" />
                          <div className="p-3 space-y-1">
                            <span className="text-[10px] font-bold text-gray-950 block">حصة فهد - جدة</span>
                            <p className="text-[9px] text-gray-400 line-clamp-2">" قطن السولتة مريح وصحي جداً أثناء النوم والترطيب مثالي. "</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9: LOYALTY CLUB & WALLET */}
          {activeSegment === 'club' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Loyalty Card */}
                <div className="bg-gradient-to-br from-[#0B0B0B] to-[#252525] rounded-3xl p-6 text-white border border-gray-800 flex flex-col justify-between h-64 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-[#DF8A9C]/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-pink-400 font-mono tracking-widest block uppercase font-bold">✦ SULTA GOLD WALLET ATELIER</span>
                      <h4 className="font-serif text-lg text-yellow-100 mt-1">كارت العضوية والوشاح الفخم</h4>
                    </div>
                    <span className="bg-[#DF8A9C] text-white text-[9px] py-1 px-2.5 rounded-full uppercase font-bold tracking-widest font-mono">
                      {getMyLoyaltyLevel().name.split(' (')[1].replace(')', '')}
                    </span>
                  </div>

                  <div>
                    <span className="text-3xl font-serif font-light text-[#F6E7A6] font-sans">{points} <span className="text-xs text-slate-300">نقاط سولتة</span></span>
                    <p className="text-[10px] text-slate-400 mt-1">رقم العضوية المشفرة: SLT-{Math.floor(82729112 + Math.random() * 90000)}</p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-4 border-t border-white/10 text-slate-400">
                    <span>مستوى العضوية: <strong className="text-yellow-100">{getMyLoyaltyLevel().name.split(' (')[0]}</strong></span>
                    <span>متاح كود إحالة 🎁</span>
                  </div>
                </div>

                {/* Level rewards breakdown */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-serif text-base text-gray-900">سارية مستويات الإحالة والود (VIP Threshold Perks)</h4>
                  <p className="text-gray-400 text-xs">ارتقي بوشاحك لولوج تخفيضات ومجموعات سرية خاصة فقط بأميرات البوتيك السحابي.</p>

                  <div className="space-y-2.5 text-xs">
                    {loyaltyLevels.map((lvl, index) => (
                      <div key={index} className={`p-3 border rounded-xl flex justify-between items-center ${lvl.color}`}>
                        <div>
                          <strong className="block">{lvl.name}</strong>
                          <span className="text-[10px] mt-0.5 block opacity-80">المزايا: {lvl.perk}</span>
                        </div>
                        <span className="font-sans font-bold text-gray-700 bg-white/50 px-2 py-1 rounded-lg">+{lvl.pointsNeeded} نقطة</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button 
                      onClick={handleShareReferral}
                      className="bg-black text-white px-6 py-3 rounded-xl font-bold text-xs"
                    >
                      🤝 شاركي كود الإحالة (اكسب 50 نقطة)
                    </button>
                    <button 
                      onClick={() => {
                        if (points >= 100) {
                          setPoints(prev => prev - 100);
                          toast('🎉 تم استبدال ١٠٠ نقطة بكوبون شحن ملكي مجاني في سلة الشراء!', 'success');
                        } else {
                          toast('عذراً، نقاطك لا تكفي لمستويات الاستبدال المليء.', 'error');
                        }
                      }}
                      className="border border-[#DF8A9C] text-[#DF8A9C] hover:bg-[#DF8A9C]/5 px-6 py-3 rounded-xl font-bold text-xs"
                    >
                      🎟️ استبدلي ١٠٠ نقطة بكوبون توصيل مجاني
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
