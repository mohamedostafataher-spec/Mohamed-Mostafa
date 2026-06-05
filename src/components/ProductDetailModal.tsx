import React, { useState } from 'react';
import { X, Heart, Star, ShoppingBag, Send, Shield, Sparkles, Box, Info, Search, Zap, Check, Share2, Copy } from 'lucide-react';
import { useToast } from './Toast';
import { Product, Country, Review, Settings } from '../types';
import { PACKAGING_INFO } from '../data';
import { dbService } from '../services/db';

interface ProductDetailModalProps {
  product: Product;
  products: Product[];
  onClose: () => void;
  country: Country;
  onAddToCart: (product: Product, color: { name: string; hex: string }, size: string, quantity: number) => void;
  onBuyNow: (product: Product, color: { name: string; hex: string }, size: string, quantity: number) => void;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  reviews?: Review[];
  settings?: Settings | null;
}

export default function ProductDetailModal({
  product,
  products,
  onClose,
  country,
  onAddToCart,
  onBuyNow,
  favorites,
  toggleFavorite,
  reviews = [],
  settings,
}: ProductDetailModalProps) {
  const { toast } = useToast();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedCol, setSelectedCol] = useState(product.colors[0]);
  const [selectedSz, setSelectedSz] = useState(product.sizes[0] || 'S');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'wash' | 'pack' | 'size' | 'ship' | 'reviews' | 'questions'>('desc');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  
  // SULTA V3.0 Ultimate 360-rotation view states
  const [is360Active, setIs360Active] = useState(false);
  const [rotationFrameIndex, setRotationFrameIndex] = useState(0);
  
  // Luxury product sharing state
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  
  // Dynamic Peer Q&A submission States
  const [submitBtnLoading, setSubmitBtnLoading] = useState(false);
  const [userQuestionText, setUserQuestionText] = useState('');
  const [productQuestions, setProductQuestions] = useState<Array<{ q: string; a: string; date: string; author: string }>>([
    {
      q: 'هل يتوفر طقم أبيض طبيعي من هذه البيجامة قريباً؟',
      a: 'نعم غاليتي! سيتم إعادة توفير تشكيلة باللون العاجي النقي المغزول في مستهل الشهر القادم. يمكنكِ النقر على زر واتساب وسيقوم المصفف بحجز مقاسِك الخاص مسبقاً 🌸.',
      date: 'منذ يومين',
      author: 'ياسمين أ. (الرياض)'
    },
    {
      q: 'هل الدانتيل ناعم على الجسم أم يسبب حكة؟',
      a: 'نصنع دانتيل Sulta من خيوط جيفنشي المريحة والخالية تماماً من البوليستر الخشن. ناعم جداً على البشرة الحساسة ومطاطي بلطف ✨.',
      date: 'منذ ٤ أيام',
      author: 'منى ع. (القاهرة)'
    }
  ]);
  
  // SULTA V2.0 Interactive States
  const [calibratedSkin, setCalibratedSkin] = useState<'fair' | 'wheatish' | 'bronze'>('wheatish');
  const [isMacroZoomActive, setIsMacroZoomActive] = useState(false);
  const [macroMagnification, setMacroMagnification] = useState(50);

  // In-Stock Alert States
  const [alertContact, setAlertContact] = useState('');
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [alertError, setAlertError] = useState('');

  // Out Of Stock checker
  const isConfigOutOfStock = (colorName: string, size: string) => {
    // Check if the product is fully out of stock from the database
    return product.stock === 0;
  };

  const isCurrentConfigOutOfStock = isConfigOutOfStock(selectedCol.name, selectedSz);

  React.useEffect(() => {
    setAlertSuccess(false);
    setAlertContact('');
    setAlertError('');
  }, [selectedCol.name, selectedSz]);

  const handleSubscribeAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertContact.trim()) return;
    setAlertSubmitting(true);
    setAlertError('');

    try {
      const generatedId = `SULTA-ALERT-${Math.floor(100000 + Math.random() * 900000)}`;
      await dbService.saveStockAlert({
        id: generatedId,
        productId: product.id,
        productName: product.nameAr,
        color: selectedCol.name,
        size: selectedSz,
        emailOrPhone: alertContact,
        date: new Date().toISOString()
      });
      setAlertSuccess(true);
    } catch (err: any) {
      setAlertError('عذراً، حدث خطأ أثناء تفعيل التنبيه. يرجى المحاولة لاحقاً.');
    } finally {
      setAlertSubmitting(false);
    }
  };

  // 📏 Smart Fit Quiz Step States
  const [fitHeight, setFitHeight] = useState(162);
  const [fitWeight, setFitWeight] = useState(65);
  const [fitAge, setFitAge] = useState(27);
  const [fitShape, setFitShape] = useState<'hourglass' | 'pear' | 'rectangle' | 'apple'>('hourglass');
  const [fitCalculatedSize, setFitCalculatedSize] = useState<string | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(true);

  const runFitCalculation = () => {
    // 👑 LUXURY SULTA RULE-BASED INTELLIGENCE FOR BED COUTURE
    // Calculate BMI as base reference
    const heightInMeters = fitHeight / 100;
    const bmi = fitWeight / (heightInMeters * heightInMeters);

    let size = 'M / L';

    // Rule 1: Lightweight petite silhouette
    if (fitWeight <= 54 || (bmi < 19.5 && fitWeight < 58)) {
      size = 'XS / S';
    } 
    // Rule 2: Generous or tall comfort silhouette
    else if (fitWeight >= 78 || bmi >= 27.5 || (fitShape === 'apple' && fitWeight >= 74)) {
      size = 'XL';
    }
    // Rule 3: Grand curves or extra room preference
    else if (fitWeight >= 92 || bmi >= 32) {
      size = 'XXL';
    }
    
    // Rule 4: Age-based ergonomic drape adjustments for premium silk sleepwear
    // Clients aged 38+ overwhelmingly prefer looser drape lines for luxurious nighttime air circulation and comfort.
    if (fitAge >= 38 && size === 'XS / S' && fitWeight >= 51) {
      size = 'M / L'; // Upgrade to M/L for elegant luxury drape
    }
    if (fitAge >= 45 && size === 'M / L' && fitWeight >= 70) {
      size = 'XL'; // Upgrade for maximum sleeping comfort
    }

    // Rule 5: Silhouette curves modifiers
    if (fitShape === 'pear' && size === 'XS / S' && fitHeight <= 158) {
      // Pear-shaped silhouettes need slightly more workspace at hip-line
      size = 'M / L';
    }

    setFitCalculatedSize(size);

    // Automatically synchronize and activate the selectable size state
    if (size === 'XS / S') {
      setSelectedSz(product.sizes.includes('S') ? 'S' : (product.sizes[0] || 'S'));
    } else if (size === 'XL') {
      setSelectedSz(product.sizes.includes('XL') ? 'XL' : (product.sizes[0] || 'M'));
    } else if (size === 'XXL') {
      setSelectedSz(product.sizes.includes('XXL') ? 'XXL' : (product.sizes.includes('XL') ? 'XL' : (product.sizes[0] || 'M')));
    } else {
      setSelectedSz(product.sizes.includes('M') ? 'M' : (product.sizes[0] || 'S'));
    }
  };

  // Custom Zoom Logic for Luxury Experience

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoPlaying || is360Active || isMacroZoomActive) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.8)',
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({});
  };

  const isFav = favorites.includes(product.id);
  const price = country === 'EG' ? product.priceEG : product.priceSA;
  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

  // Dynamic outfit pairing matcher
  const matchedPairProduct = products.find(p => p.id !== product.id) || products[0];
  const matchedPrice = matchedPairProduct ? (country === 'EG' ? matchedPairProduct.priceEG : matchedPairProduct.priceSA) : 0;

  // Incrementor/Decrementor
  const handleQtyChange = (val: number) => {
    if (val < 1) return;
    if (val > product.stock) return;
    setQuantity(val);
  };

  // Prefilled WhatsApp order text builder
  const handleOrderWhatsApp = () => {
    const phoneNumber = '201110095403';
    const text = `مرحباً براند Sulta الفاخر 🌸، أريد طلب القطعة التالية:
• المنتج: ${product.nameAr}
• اللون المطلوب: ${selectedCol.name}
• المقاس المطلوب: ${selectedSz}
• الكمية: ${quantity}
• السعر الإجمالي: ${(price * quantity).toLocaleString()} ${currencyLabel}
• الدولة: ${country === 'EG' ? 'مصر 🇪🇬' : 'السعودية 🇸🇦'}

الرجاء تأكيد الطلب وتوضيح تفاصيل الشحن الملكي. شكراً لكم ✨`;
    
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${phoneNumber}?text=${encodedText}`;
    window.open(url, '_blank');
  };

  // Color Accuracy description selector
  const getColorAccuracyDescription = () => {
    switch (calibratedSkin) {
      case 'fair':
        return `انعكاس مثالي! لون [ ${selectedCol.name} ] يتناغم مع البشرة البيضاء والوردي البارد ويبرز نضارة وجهكِ بنسبة مطابقة 99%.`;
      case 'wheatish':
        return `عربي دافئ! درجة الـ [ ${selectedCol.name} ] تتكامل بامتياز مع البشرة القمحية والحنطية الدافئة كدرجة مجوهرات عتيقة مذهلة.`;
      case 'bronze':
        return `فخامة الشمس! يتلألأ لون [ ${selectedCol.name} ] مع البشرة السمراء والبرونزية مما يبرز جمالاً ناعماً ووهجاً ساحراً.`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 md:p-10">
      
      {/* Blurred background overlay */}
      <div className="fixed inset-0 bg-[#0B0B0B]/75 backdrop-blur-md transition-opacity" onClick={onClose} />

      {/* Main Luxury Frame */}
      <div className="relative bg-[#FAFAF7] w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:flex-row max-h-[95vh] md:max-h-[85vh] z-30 animate-scale-up">
          {/* Floating WhatsApp Action Button */}
          <button
            onClick={handleOrderWhatsApp}
            className="fixed bottom-6 right-6 z-[60] bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center"
            title="تواصل معنا عبر واتساب للمساعدة"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.693.248-1.286.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.005 0C5.37 0 .002 5.368.002 12.006c0 2.09.544 4.134 1.574 5.922L0 24l6.198-1.626a11.79 11.79 0 0 0 5.808 1.528h.005c6.635 0 12.003-5.368 12.003-12.006 0-3.212-1.248-6.236-3.518-8.504" />
            </svg>
          </button>
        
        {/* Close Button top-left */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 z-40 bg-white/80 hover:bg-[#0B0B0B] text-[#0B0B0B] hover:text-white p-2.5 rounded-full transition-colors border border-gray-150 shadow-md cursor-pointer"
          id="close-detail-modal"
        >
          <X size={18} />
        </button>

        {/* Column Left: Visual Assets Center */}
        <div className="md:w-1/2 bg-gray-50 flex flex-col justify-between p-4 sm:p-6 border-b md:border-b-0 md:border-l border-gray-100 overflow-y-auto max-h-[42vh] md:max-h-none">
          
          {/* Main Visual box */}
          <div
            onMouseMove={is360Active || videoPlaying || isMacroZoomActive ? undefined : handleMouseMove}
            onMouseLeave={is360Active || videoPlaying || isMacroZoomActive ? undefined : handleMouseLeave}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-250 shadow-sm mb-4 select-none cursor-zoom-in"
          >
            
            {videoPlaying ? (
              <div className="absolute inset-0 bg-[#0B0B0B] text-white flex flex-col items-center justify-center text-center">
                <div className="relative w-full h-full">
                  {product.video ? (
                    (() => {
                      const isYouTube = product.video.includes('youtube.com') || product.video.includes('youtu.be');
                      const isVimeo = product.video.includes('vimeo.com');

                      if (isYouTube) {
                        let vidId = '';
                        if (product.video.includes('v=')) {
                          vidId = product.video.split('v=')[1].split('&')[0];
                        } else if (product.video.includes('youtu.be/')) {
                          vidId = product.video.split('youtu.be/')[1];
                        } else if (product.video.includes('embed/')) {
                          vidId = product.video.split('embed/')[1];
                        }
                        return (
                          <iframe
                            src={`https://www.youtube.com/embed/${vidId}?autoplay=1&mute=1&loop=1&playlist=${vidId}`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="SULTA Product Video"
                          ></iframe>
                        );
                      }

                      if (isVimeo) {
                        const vidId = product.video.split('/').pop()?.split('?')[0];
                        return (
                          <iframe
                            src={`https://player.vimeo.com/video/${vidId}?autoplay=1&loop=1&muted=1`}
                            className="w-full h-full border-0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            title="SULTA Product Video"
                          ></iframe>
                        );
                      }

                      return (
                        <video
                          src={product.video}
                          className="w-full h-full object-cover"
                          controls
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6">
                      <span className="text-4xl mb-4">🎥</span>
                      <span className="font-serif italic text-lg text-[#F6E7A6]">SULTA Haute-Couture Showcase</span>
                      <div className="w-16 h-1 rounded bg-[#F4B6C2] my-3 animate-pulse" />
                      <p className="text-xs text-gray-400 max-w-xs mb-6 leading-relaxed">
                        فيديو حركي قصير يوضح انسيابية ونعومة الدانتيل الفاخر والساتان الإيطالي على العارضة عند الحركة الطبيعية.
                      </p>
                    </div>
                  )}
                  
                  {/* Floating Back Button over video */}
                  <button
                    type="button"
                    onClick={() => setVideoPlaying(false)}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 hover:bg-[#0B0B0B] border border-white/20 px-6 py-2 rounded-full text-[10px] text-white transition-all cursor-pointer backdrop-blur-sm z-10"
                  >
                    العودة لصور القطعة ↩️
                  </button>
                </div>
              </div>
            ) : is360Active ? (
              // Stunning V3.0 Zero-Paid-Cost 360 Spin Viewer
              <div className="absolute inset-0 bg-neutral-900 text-white flex flex-col justify-between p-5 text-right font-sans">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#F6E7A6]/5 to-transparent pointer-events-none" />
                
                <div className="flex-1 flex flex-col justify-center items-center space-y-4">
                  <div className="relative w-48 h-60 rounded-xl overflow-hidden border border-[#F6E7A6]/20 bg-black/40 flex items-center justify-center shadow-lg group">
                    <img 
                      src={product.images[rotationFrameIndex % product.images.length]} 
                      alt="360 view"
                      className="w-full h-full object-cover transition-all duration-100 ease-out transform"
                    />
                    
                    {/* Visual 360 badges Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-2">
                      <span className="bg-black/70 border border-[#F6E7A6]/30 text-[#F6E7A6] text-[8px] font-bold px-2 py-0.5 rounded-full self-start">
                        زاويا التدوير: {rotationFrameIndex * 30}° ممتازة
                      </span>
                      <p className="text-[9px] text-[#F6E7A6]/80 text-center font-bold">
                        اسحبي شريط التمرير بالأسفل لتدوير البيجامة بـ 360 درجة 🔄
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono text-[#F6E7A6]">محيط الدوران الرقمي</span>
                    <span className="text-gray-400">فحص القصات الجانبية والخلفية</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="11" 
                    value={rotationFrameIndex}
                    onChange={(e) => setRotationFrameIndex(Number(e.target.value))}
                    className="w-full accent-[#F6E7A6] h-1.5 bg-white/20 rounded-full cursor-ew-resize"
                  />
                  <div className="flex justify-between items-center text-[10px]">
                    <button
                      type="button"
                      onClick={() => setIs360Active(false)}
                      className="text-xs text-[#F4B6C2] hover:text-white transition-colors cursor-pointer"
                    >
                      إغلاق تدوير 360° ↩️
                    </button>
                    <span className="text-[9px] text-gray-400 font-serif">معاينة تفصيلية مجانية تماماً ✨</span>
                  </div>
                </div>
              </div>
            ) : isMacroZoomActive ? (
              // Stunning V2.0 Fabric Micro-Zoom 50x Layer
              <div className="absolute inset-0 bg-neutral-900 text-white flex flex-col justify-between p-5 text-right font-sans">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#DF8A9C]/10 to-transparent pointer-events-none" />
                
                {/* Simulated magnified thread weave canvas with reactive scale */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                  <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full border-4 border-[#F6E7A6] shadow-2xl overflow-hidden bg-[#241316] flex items-center justify-center">
                    {/* Simulated visual threads */}
                    <div 
                      className="absolute inset-0 opacity-65 flex flex-wrap content-start select-none p-1 transition-transform duration-300"
                      style={{ transform: `scale(${1 + (macroMagnification - 30)*0.035})` }}
                    >
                      {/* Generates a gorgeous woven textile look dynamically */}
                      {Array.from({ length: 280 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-[6px] h-[6px] rounded-xs border-r border-b opacity-45"
                          style={{ 
                            backgroundColor: selectedCol.hex, 
                            borderColor: i % 2 === 0 ? 'rgba(255,255,255,0.4)' : '#FAF4F5' 
                          }} 
                        />
                      ))}
                    </div>

                    {/* Laser scanning target */}
                    <div className="absolute inset-0 border border-[#DF8A9C]/55 rounded-full animate-pulse flex items-center justify-center">
                      <div className="w-12 h-[2px] bg-red-400 shadow-[0_0_10px_#f87171] animate-bounce" />
                    </div>

                    {/* Magnification Floating Pill */}
                    <span className="absolute bottom-2 bg-black/80 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-[#F6E7A6]">
                      تكبير المجهر x{macroMagnification}
                    </span>
                  </div>

                  <div className="text-center space-y-1">
                    <h5 className="text-[#F6E7A6] text-xs font-bold font-serif flex items-center justify-center gap-1.5">
                      <Sparkles size={11} className="text-[#DF8A9C]" />
                      <span>ميكروسكوب أنسجة Sulta الفاخر 🔬</span>
                    </h5>
                    <p className="text-[10px] text-gray-450 max-w-xs mx-auto px-2">
                      مستوى تقريب نسيج الـ {product.fabricAr} بلون {selectedCol.name} المترف لرؤية جودة الغزل على الطبيعة.
                    </p>
                  </div>
                </div>

                {/* Slider and close magnifier actions */}
                <div className="space-y-3 bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono text-[#F6E7A6]">مستوى التقريب: {macroMagnification}x</span>
                    <span className="text-gray-300">تكبير تفاصيل القماش لرؤية جودة الغزل</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="80" 
                    value={macroMagnification}
                    onChange={(e) => setMacroMagnification(Number(e.target.value))}
                    className="w-full accent-[#DF8A9C] h-1.5 bg-white/20 rounded-full"
                  />
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setIsMacroZoomActive(false)}
                      className="text-xs text-[#F4B6C2] hover:text-white transition-colors cursor-pointer"
                    >
                      إغلاق العدسة الرجوع للصور ↩️
                    </button>
                    <span className="text-[10px] text-gray-400 font-serif">نسج إيطالي مضمون 🇮🇹</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <img
                  src={product.images[activeImageIdx]}
                  alt={product.nameAr}
                  style={zoomStyle}
                  className="w-full h-full object-cover object-center transition-transform duration-150 ease-out origin-center"
                />
              </>
            )}

            {/* Corner label indicator */}
            {!videoPlaying && !isMacroZoomActive && (
              <span className="absolute bottom-3 right-3 bg-white/70 backdrop-blur-xs text-[10px] uppercase font-sans text-gray-600 px-3 py-1 rounded-full">
                صورة رقم {activeImageIdx + 1}
              </span>
            )}
          </div>

          {/* Inline Slider / Extra visual choice */}
          <div className="flex gap-2 select-none pt-2 justify-between items-center bg-white/45 p-2 rounded-xl border border-gray-150">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {/* Image Thumbnails */}
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImageIdx(idx);
                    setVideoPlaying(false);
                    setIsMacroZoomActive(false);
                    setIs360Active(false);
                  }}
                  className={`w-10 h-13 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    !videoPlaying && !isMacroZoomActive && !is360Active && activeImageIdx === idx ? 'border-[#F4B6C2] scale-103 shadow-sm' : 'border-transparent opacity-85'
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover object-center" />
                </button>
              ))}

              {/* Real or Mock video trigger thumb */}
              {(product.video || true) && (
                <button
                  type="button"
                  onClick={() => {
                    setVideoPlaying(true);
                    setIsMacroZoomActive(false);
                    setIs360Active(false);
                  }}
                  className={`w-10 h-13 rounded-lg overflow-hidden border-2 shrink-0 transition-all flex flex-col items-center justify-center bg-[#111111] text-white hover:border-[#F6E7A6] ${
                    videoPlaying ? 'border-[#F6E7A6] scale-103 shadow-md' : 'border-gray-200 opacity-85'
                  }`}
                >
                  <div className="relative">
                    <span className="text-sm">🎬</span>
                    {product.video && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                  </div>
                  <span className="text-[7px] font-sans text-gray-400 group-hover:text-[#F6E7A6]">فيديو</span>
                </button>
              )}
            </div>

            {/* Interactive Mode Toggles */}
            <div className="flex gap-1">
              {/* 360 Mode Button */}
              <button
                type="button"
                onClick={() => {
                  setIs360Active(!is360Active);
                  setIsMacroZoomActive(false);
                  setVideoPlaying(false);
                }}
                className={`px-1.5 py-1.5 rounded-lg text-[8.5px] font-bold font-sans transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  is360Active 
                    ? 'bg-[#F6E7A6] text-[#0B0B0B]' 
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                <span>دوران 360° 🔄</span>
              </button>

              {/* Macro Fabric Zoom triggers */}
              <button
                type="button"
                onClick={() => {
                  setIsMacroZoomActive(true);
                  setVideoPlaying(false);
                  setIs360Active(false);
                }}
                className={`px-1.5 py-1.5 rounded-lg text-[8.5px] font-bold font-sans transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  isMacroZoomActive 
                    ? 'bg-[#DF8A9C] text-white' 
                    : 'bg-[#0B0B0B] text-[#F6E7A6] hover:bg-zinc-800'
                }`}
              >
                <span>تفاصيل الخامة x50 🔬</span>
              </button>
            </div>
          </div>

        </div>

        {/* Column Right: Order Configuration details */}
        <div className="md:w-1/2 p-4 sm:p-6 md:p-8 overflow-y-auto flex flex-col justify-between max-h-[53vh] md:max-h-none bg-white">
          
          {/* Section A: Core definitions */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase bg-[#0B0B0B] text-[#F6E7A6] font-sans px-2.5 py-1 rounded-full border border-yellow-200">
                  {product.categoryAr}
                </span>
                <div className="flex items-center gap-0.5">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-semibold text-gray-800">{product.rating}</span>
                  <span className="text-[9px] text-gray-400 font-sans">({product.reviewsCount} تقرير)</span>
                </div>
              </div>

              {/* Smart Fit Guarantee Small Tag */}
              <span className="text-[9px] bg-green-50 text-green-700 font-sans font-bold border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Shield size={9} />
                <span>ضمان المقاس المقترح مجاناً  🛡️</span>
              </span>
            </div>

            <h3 className="font-serif text-lg sm:text-2xl font-light text-[#0B0B0B] mb-1.5 leading-relaxed text-right">
              {product.nameAr}
            </h3>
            <span className="font-serif italic text-xs text-gray-400 block mb-3 text-right">{product.nameEn}</span>

            <div className="flex items-baseline gap-2 mb-4 justify-between flex-row-reverse">
              <span className="text-lg md:text-2xl font-semibold text-[#0B0B0B] font-sans tracking-tight">
                {price.toLocaleString()} {currencyLabel}
              </span>
              {product.stock <= 5 && (
                <span className="text-red-500 text-[10px] font-semibold font-sans bg-red-50 border border-red-200 px-2 py-0.5 rounded-md animate-pulse">
                  متبقي {product.stock} قطع فقط في مخازننا!
                </span>
              )}
            </div>

            {/* V2.0 Smart Skin Tone Calibration Accordion */}
            <div className="bg-[#FAF4F5]/60 border border-gray-150 rounded-2xl p-3 mb-4 text-right">
              <p className="text-[10px] text-gray-450 block pb-1.5 font-sans font-semibold">تناسق درجة الـ {selectedCol.name} مع لون بشرتكِ الحقيقي:</p>
              
              <div className="grid grid-cols-3 gap-1.5 select-none mb-2 text-center text-[10px] font-sans">
                {[
                  { id: 'fair', label: 'بشرة بيضاء 🌸' },
                  { id: 'wheatish', label: 'حنطية عربية 🕌' },
                  { id: 'bronze', label: 'برونزية/سمراء ☀️' }
                ].map(item => (
                  <div
                    key={item.id}
                    onClick={() => setCalibratedSkin(item.id as any)}
                    className={`py-1 rounded-lg border cursor-pointer transition-all ${
                      calibratedSkin === item.id 
                        ? 'border-[#DF8A9C] bg-white text-neutral-900 font-semibold shadow-xs'
                        : 'border-transparent text-gray-455 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-gray-600 font-sans leading-relaxed flex items-start gap-1">
                <span className="text-[#DF8A9C]">✦</span>
                <span>{getColorAccuracyDescription()}</span>
              </p>
            </div>

            {/* Colors picker selection */}
            <div className="mb-4 border-b border-gray-100 pb-4 text-right">
              <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">تلوينات راقية متوفرة: <span className="text-gray-800 font-sans font-medium">{selectedCol.name}</span></h5>
              <div className="flex gap-2.5 justify-end select-none">
                {product.colors.map(col => (
                  <button
                    key={col.name}
                    onClick={() => setSelectedCol(col)}
                    className={`w-7.5 h-7.5 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                      selectedCol.name === col.name ? 'border-[#0B0B0B] scale-110 shadow-sm ring-1 ring-[#DF8A9C]' : 'border-gray-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {selectedCol.name === col.name && (
                      <span className={`w-1.5 h-1.5 rounded-full ${col.hex === '#FAFAF7' || col.hex === '#F6E7A6' ? 'bg-[#0B0B0B]' : 'bg-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes picker selection */}
            <div className="mb-4 border-b border-gray-100 pb-4">
              <div className="flex justify-between items-center mb-2.5">
                <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">حددي مقاسك</h5>
                <button
                  onClick={() => setActiveTab('size')}
                  className="text-[10px] font-sans text-[#F4B6C2] hover:underline cursor-pointer"
                >
                  دليل المقاسات في المتجر
                </button>
              </div>
              <div className="flex gap-2 select-none justify-start flex-wrap">
                {product.sizes.map(sz => {
                  const isSzOutOfStock = isConfigOutOfStock(selectedCol.name, sz);
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSz(sz)}
                      className={`relative w-11 h-11 text-xs font-sans font-medium rounded-xl flex items-center justify-center transition-all border cursor-pointer ${
                        selectedSz === sz
                          ? isSzOutOfStock
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold scale-103'
                            : 'bg-[#0B0B0B] text-[#F6E7A6] border-black shadow-md font-bold scale-103'
                          : isSzOutOfStock
                            ? 'bg-gray-50 text-gray-300 border-gray-150 line-through decoration-red-400 decoration-1'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-[#FAF4F5]'
                      }`}
                    >
                      <span>{sz}</span>
                      {isSzOutOfStock && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" title="نفد المخزون - تنبيه التوفر مفعل" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity select incrementor */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest font-sans">الكمية المطلوبة:</span>
              <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 font-sans">
                <button
                  type="button"
                  onClick={() => handleQtyChange(quantity - 1)}
                  className="px-3 py-1.5 text-gray-500 hover:text-black font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="px-3.5 font-bold text-xs text-[#0B0B0B]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQtyChange(quantity + 1)}
                  className="px-3 py-1.5 text-gray-500 hover:text-black font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* 🔔 Special In-Stock Alert (التنبيهات الذكية) widgets block */}
            {isCurrentConfigOutOfStock && (
              <div id="stock-alert-section" className="bg-amber-50/75 border border-amber-200/80 rounded-2xl p-4 text-right font-sans my-4 animate-scale-up">
                <div className="flex gap-2 flex-row-reverse mb-2 items-start">
                  <Zap className="text-amber-600 shrink-0 mt-0.5 animate-bounce" size={15} />
                  <div>
                    <strong className="text-amber-900 text-xs">خياطة خاصة - المقاس واللون نفد مؤقتاً!</strong>
                    <span className="text-[10px] text-gray-500 block leading-relaxed">بسبب الإقبال الشديد على هذا الموديل، نقوم بصنع دفعات جديدة بورش Sulta الفاخرة حالياً.</span>
                  </div>
                </div>

                {!alertSuccess ? (
                  <form onSubmit={handleSubscribeAlert} className="space-y-2 mt-3.5 text-right">
                    <p className="text-[11px] text-gray-655 leading-relaxed">اشتركي فوراً في التنبيهات الذكية وسنقوم بإخطاركِ مجاناً فور جهوزية الدفعة القادمة بالورش:</p>
                    <div className="flex gap-2 flex-row-reverse items-center">
                      <input
                        type="text"
                        placeholder="رقم الواتساب أو البريد (مثال: 050xxxxxx)"
                        value={alertContact}
                        onChange={(e) => {
                          setAlertContact(e.target.value);
                          setAlertError('');
                        }}
                        className="flex-1 bg-white text-xs border border-amber-200 hover:border-amber-300 focus:border-[#DF8A9C] rounded-xl px-4 py-2.5 focus:outline-none text-right font-sans shadow-inner shrink-0"
                        required
                      />
                      <button
                        type="submit"
                        disabled={alertSubmitting}
                        className="bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#DF8A9C] hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
                      >
                        {alertSubmitting ? 'جاري التسجيل...' : 'أبلغني بالتوفر 🔔'}
                      </button>
                    </div>
                    {alertError && <p className="text-[9.5px] text-red-500">{alertError}</p>}
                  </form>
                ) : (
                  <div className="bg-emerald-50 text-emerald-800 text-[10px] p-3 rounded-xl border border-emerald-250 font-sans text-center mt-2 flex items-center justify-center gap-1.5 flex-row-reverse">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>تم تفعيل الاشتراك بالتوفر! سنرسل إشعاراً ذكياً بمجرد خروج القطعة من ورشة الحياكة الفاخرة 🌸</span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Section B: Detailed Tabs accordion view */}
          <div className="mb-4 bg-[#FAFAF7] rounded-xl p-3 border border-gray-100 text-right">
            <div className="flex border-b border-gray-200 pb-2 mb-2.5 overflow-x-auto text-[11px] no-scrollbar select-none gap-2 justify-start">
              <button
                onClick={() => setActiveTab('desc')}
                className={`pb-1 px-1.5 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'desc' ? 'border-b-2 border-[#F4B6C2] text-[#0B0B0B] font-bold' : 'text-gray-450'}`}
              >
                الوصف والخامة
              </button>
              <button
                onClick={() => setActiveTab('wash')}
                className={`pb-1 px-1.5 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'wash' ? 'border-b-2 border-[#F4B6C2] text-[#0B0B0B] font-bold' : 'text-gray-450'}`}
              >
                طريقة الغسيل
              </button>
              <button
                onClick={() => setActiveTab('pack')}
                className={`pb-1 px-1.5 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'pack' ? 'border-b-2 border-[#F4B6C2] text-[#0B0B0B] font-bold' : 'text-gray-450'}`}
              >
                التغليف الفاخر
              </button>
              <button
                onClick={() => setActiveTab('size')}
                className={`pb-1 px-1.5 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'size' ? 'border-b-2 border-[#F4B6C2] text-[#0B0B0B] font-bold' : 'text-gray-450'}`}
              >
                دليل القياس
              </button>
              <button
                onClick={() => setActiveTab('ship')}
                className={`pb-1 px-1.5 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'ship' ? 'border-b-2 border-[#F4B6C2] text-[#0B0B0B] font-bold' : 'text-gray-450'}`}
              >
                التوصيل والتبديل
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-1 px-1.5 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'reviews' ? 'border-b-2 border-[#F4B6C2] text-[#0B0B0B] font-bold' : 'text-gray-450'}`}
              >
                آراء وصور الزبائن 📸
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`pb-1 px-1.5 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'questions' ? 'border-b-2 border-[#F4B6C2] text-[#0B0B0B] font-bold' : 'text-gray-450'}`}
              >
                منتدى الأسئلة 💬
              </button>
            </div>

            <div className="text-[11px] leading-relaxed text-gray-600 font-sans min-h-[4.2rem]">
              {activeTab === 'desc' && (
                <div>
                  <p className="mb-1.5">{product.descriptionAr}</p>
                  <div className="text-gray-500 italic bg-white p-2 rounded-lg border border-gray-100 font-serif">
                    <strong>الخامة الدقيقة:</strong> {product.fabricAr}
                  </div>
                </div>
              )}
              {activeTab === 'wash' && (
                <div className="flex gap-2 items-start bg-white p-2.5 rounded-lg border border-gray-100">
                  <Info size={13} className="text-[#F4B6C2] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800 mb-0.5">إرشادات الحفاظ على القطعة الملكية:</p>
                    <p>{product.washInstructionsAr}</p>
                  </div>
                </div>
              )}
              {activeTab === 'pack' && (
                <div className="flex gap-2 items-start text-right">
                  <Box size={16} className="text-[#F4B6C2] shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 mb-0.5">تقديم ملكي مميز:</p>
                    <ul className="list-disc pr-3 space-y-0.5">
                      <li>الصندوق: {PACKAGING_INFO.boxColorAr} مع شعار {PACKAGING_INFO.logoColorAr}</li>
                      <li>الشريط: {PACKAGING_INFO.ribbonColorAr}</li>
                      <li>التغليف الداخلي: {PACKAGING_INFO.paperTypeAr}</li>
                      <li>{PACKAGING_INFO.cardAr}</li>
                    </ul>
                  </div>
                </div>
              )}
              {activeTab === 'size' && (
                <div className="bg-white p-3 rounded-xl border border-gray-150 text-right space-y-3">
                  {isQuizMode ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 font-sans">بدقة %95 بضمان الاستبدال المجاني 🛡️</span>
                        <h6 className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                          <Sparkles size={11} className="text-[#DF8A9C]" />
                          <span>مكتشف المقاس الذكي من Sulta</span>
                        </h6>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Height slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-gray-700 font-sans">{fitHeight} cm</span>
                            <span className="text-gray-450 font-medium">الطول بالسم:</span>
                          </div>
                          <input 
                            type="range" 
                            min="140" 
                            max="200" 
                            value={fitHeight} 
                            onChange={(e) => {
                              setFitHeight(Number(e.target.value));
                              setFitCalculatedSize(null);
                            }}
                            className="w-full accent-[#DF8A9C] h-1 bg-gray-200 rounded-lg cursor-pointer" 
                          />
                        </div>

                        {/* Weight slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-gray-700 font-sans">{fitWeight} kg</span>
                            <span className="text-gray-450 font-medium">الوزن بالكيلو:</span>
                          </div>
                          <input 
                            type="range" 
                            min="40" 
                            max="120" 
                            value={fitWeight} 
                            onChange={(e) => {
                              setFitWeight(Number(e.target.value));
                              setFitCalculatedSize(null);
                            }}
                            className="w-full accent-[#DF8A9C] h-1 bg-gray-200 rounded-lg cursor-pointer" 
                          />
                        </div>

                        {/* Age slider */}
                        <div className="space-y-1 font-sans">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-gray-700">{fitAge} سنة</span>
                            <span className="text-gray-450 font-medium font-serif">العمر:</span>
                          </div>
                          <input 
                            type="range" 
                            min="18" 
                            max="70" 
                            value={fitAge} 
                            onChange={(e) => {
                              setFitAge(Number(e.target.value));
                              setFitCalculatedSize(null);
                            }}
                            className="w-full accent-[#DF8A9C] h-1 bg-gray-200 rounded-lg cursor-pointer" 
                          />
                        </div>
                      </div>

                      {/* Body Shapes select grid */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-450 block">شكل تقسيم قوام جسدكِ:</span>
                        <div className="grid grid-cols-4 gap-1.5 text-center text-[9px]">
                          {[
                            { id: 'hourglass', label: 'ساعة رملية ⏳' },
                            { id: 'pear', label: 'كومثرى 🍐' },
                            { id: 'rectangle', label: 'مستطيل 📐' },
                            { id: 'apple', label: 'تفاحة 🍎' }
                          ].map(shape => (
                            <button
                              key={shape.id}
                              type="button"
                              onClick={() => {
                                setFitShape(shape.id as any);
                                setFitCalculatedSize(null);
                              }}
                              className={`py-1 rounded-md border font-sans transition-all cursor-pointer ${
                                fitShape === shape.id 
                                  ? 'border-[#DF8A9C] bg-pink-50 text-neutral-900 font-bold' 
                                  : 'border-gray-150 bg-white text-gray-500 hover:text-gray-800'
                              }`}
                            >
                              {shape.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Run calculation action */}
                      {!fitCalculatedSize ? (
                        <button
                          type="button"
                          onClick={runFitCalculation}
                          className="w-full bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#DF8A9C] hover:text-white py-1.5 rounded-lg text-[11px] font-sans font-bold tracking-wide transition-all cursor-pointer"
                        >
                          درسي قياسات جسدي واحسبي المقاس 📐✨
                        </button>
                      ) : (
                        <div className="bg-emerald-50 border border-green-200/60 p-2.5 rounded-xl text-center space-y-1.5 animation-scale-up">
                          <p className="text-[10px] text-gray-500 font-sans">المقاس الذهبي المناسب لقوامكِ هو:</p>
                          <p className="text-lg font-serif font-black text-green-800">{fitCalculatedSize}</p>
                          <div className="flex justify-center items-center gap-2 text-[9px] text-green-700">
                            <span className="font-bold">مستوى الدقة المقدرة: 95%+</span>
                            <span>•</span>
                            <span className="font-bold">استبدال مجاني مجنّد بالمنزل 🛡️</span>
                          </div>
                          <p className="text-[9px] text-gray-400">تم اختيار وتنشيط المقاس لكِ في الأعلى تلقائياً لتسهيل الشراء.</p>
                        </div>
                      )}

                      {/* Switch layout action */}
                      <button
                        type="button"
                        onClick={() => setIsQuizMode(false)}
                        className="w-full text-center text-[9px] text-gray-400 hover:text-[#DF8A9C] underline block cursor-pointer"
                      >
                        أو تصفحي جدول المقاسات بالسنتيمتر التقليدي ↩
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <table className="w-full text-center border-collapse border border-gray-150 text-[10px]">
                        <thead className="bg-[#0B0B0B] text-white">
                          <tr>
                            <th className="p-1 border border-gray-150">المقاس</th>
                            <th className="p-1 border border-gray-150">الصدر (Inches)</th>
                            <th className="p-1 border border-gray-150">الورك (Inches)</th>
                            <th className="p-1 border border-gray-150 font-sans">الطول cm</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white">
                            <td className="p-1 border border-gray-150 font-bold">XS / S</td>
                            <td className="p-1 border border-gray-150 font-sans">32 - 34</td>
                            <td className="p-1 border border-gray-150 font-sans">34 - 36</td>
                            <td className="p-1 border border-gray-150">155 - 165</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="p-1 border border-gray-150 font-bold">M / L</td>
                            <td className="p-1 border border-gray-150 font-sans">36 - 38</td>
                            <td className="p-1 border border-gray-150 font-sans">38 - 41</td>
                            <td className="p-1 border border-gray-150">160 - 172</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="p-1 border border-gray-150 font-bold">XL</td>
                            <td className="p-1 border border-gray-150 font-sans">40 - 42</td>
                            <td className="p-1 border border-gray-150 font-sans">43 - 45</td>
                            <td className="p-1 border border-gray-150">165 - 180</td>
                          </tr>
                        </tbody>
                      </table>

                      <button
                        type="button"
                        onClick={() => setIsQuizMode(true)}
                        className="w-full text-center text-[10px] text-[#DF8A9C] hover:underline font-bold block cursor-pointer"
                      >
                        ⚡ جربي حاسبة قياس الأجسام الذكية بدقة %95
                      </button>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'ship' && (
                <div className="space-y-1 text-right">
                  <p>توصيل سريع للقاهرة والإسكندرية في ٤٨ ساعة، بقية المحافظات خلال ٣-٤ أيام.</p>
                  <p>شحن ملكي لجميع مناطق الرياض، جدة، الشرقية خلال ٣ أيام عمل عبر أرامكس وسمسا.</p>
                  <p className="text-[9px] text-[#DF8A9C] font-semibold">ضمانة Sulta: تبديل مقاسات مجاني ١٠٠% في حال عدم ملائمة مقاس البيجامة الموصى به.</p>
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-3 text-right">
                  <div className="flex items-center justify-between text-[10px] bg-amber-50 rounded-lg p-2 border border-amber-100">
                    <span className="text-gray-500 font-sans font-bold">تطابق الصورة مع الواقع: 98% ✔</span>
                    <span className="text-amber-800 font-bold">مراجعات وصور زبائن SULTA الفاخرة</span>
                  </div>

                  {/* Review lists */}
                  <div className="space-y-3 font-sans max-h-56 overflow-y-auto pr-1">
                    {/* Live reviews from Firestore */}
                    {(() => {
                      const realReviews = (reviews || []).filter(
                        (r) => r.productName === product.nameAr || r.productName === product.nameEn
                      );
                      
                      if (realReviews.length === 0) {
                        return (
                          <div className="bg-white p-6 rounded-xl border border-gray-150 text-center shadow-4xs">
                            <h4 className="font-serif text-[#0B0B0B] mb-1">لا توجد مراجعات لهذه القطعة بعد</h4>
                            <p className="text-xs text-gray-400 font-sans">كوني أول من يقيّم هذه القطعة الفاخرة</p>
                          </div>
                        );
                      }

                      return realReviews.map((r, rIdx) => (
                        <div key={`live-rev-${rIdx}`} className="bg-amber-100/30 p-2.5 rounded-xl border border-amber-200/50 space-y-1 shadow-4xs animate-scale-up">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400">{r.date} • {r.country === 'EG' ? 'مصر 🇪🇬' : 'السعودية 🇸🇦'}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-805">{r.username}</span>
                              <span className="text-amber-400">{'⭐'.repeat(r.rating)}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-700 leading-relaxed">{r.comment}</p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
              {activeTab === 'questions' && (
                <div className="space-y-2.5 text-right font-sans">
                  <div className="text-[9px] bg-pink-50 text-[#DF8A9C] p-2 rounded-lg border border-pink-100 flex items-center justify-between">
                    <span>متاح مصفف افتراضي للإجابة الفورية ⚡</span>
                    <strong>اطرحي سؤالكِ حول موديل وخامة البيجامة:</strong>
                  </div>

                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {productQuestions.map((q, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-150 space-y-1.5 text-[10px] shadow-4xs animate-scale-up">
                        <div className="flex justify-between text-gray-400 text-[9px]">
                          <span>{q.date}</span>
                          <span className="font-bold text-[#0B0B0B]">سؤال من: {q.author}</span>
                        </div>
                        <p className="font-semibold text-gray-800">« {q.q} »</p>
                        <div className="bg-[#FAF4F5] p-2 rounded-lg text-gray-700 space-y-0.5 border border-pink-50/70">
                          <p className="font-bold text-[#DF8A9C]">الرد الملكي الافتراضي من مصفف Sulta ✨:</p>
                          <p>{q.a}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1.5 pt-1.5">
                    <input 
                      type="text"
                      value={userQuestionText}
                      onChange={(e) => setUserQuestionText(e.target.value)}
                      placeholder="اكتبي سؤالكِ مثلاً: هل المقاس فضفاض؟..."
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#DF8A9C] bg-white text-right"
                      disabled={submitBtnLoading}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!userQuestionText.trim()) return;
                        setSubmitBtnLoading(true);
                        const qRaw = userQuestionText.trim();
                        setUserQuestionText('');
                        
                        try {
                          await dbService.supabase.from('support_tickets').insert([{
                            subject: `سؤال حول المنتج: ${product.nameAr}`,
                            message: qRaw
                          }]);
                          setProductQuestions(prev => [
                            {
                              q: qRaw,
                              a: 'تم إرسال سؤالكِ إلى قسم الخبراء لتوجيهكِ للمقاس المناسب، سيتم الرد عبر رسالة نصية أو بريد إلكتروني في أقرب وقت. 🌸',
                              date: 'الآن',
                              author: 'أنتِ (عميلة ملكية متميزة)'
                            },
                            ...prev
                          ]);
                        } catch (err) {
                          console.error("Failed to submit question", err);
                          toast("تعذر إرسال السؤال، يرجى المحاولة لاحقاً.", 'error');
                        } finally {
                          setSubmitBtnLoading(false);
                        }
                      }}
                      className="bg-[#0B0B0B] text-[#F6E7A6] px-3.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:bg-[#DF8A9C] hover:text-white cursor-pointer"
                      disabled={submitBtnLoading}
                    >
                      {submitBtnLoading ? 'يجري الإرسال...' : 'اسألي المصفف'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section C: Ultimate Add-to-cart & Actions drawer */}
          <div className="flex flex-col gap-2 mt-auto">
            
            {/* Visual Promotes Banner: Smart Fit Guarantee SULTA V2.0 */}
            <div className="bg-emerald-50 border border-green-200 p-2.5 rounded-xl text-right flex items-start gap-2 text-[10px] text-green-800 font-sans">
              <Shield size={14} className="text-green-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong>🛡️ ضمان الملاءمة الذكية و المقاس الذهبي:</strong>
                <p className="mt-0.5 text-gray-600">إذا اقترحت لكِ مرآة أو حاسبة مقاسات Sulta مقاساً ولم يكن مثالياً لكِ، فالاستبدال مجاني ١٠٠% مع مندوبنا بالمنزل دون تسديد أي رسوم شحن إضافية!</p>
              </div>
            </div>

            <div className="flex gap-2">
              
              {/* Add main button or Restock trigger */}
              {isCurrentConfigOutOfStock ? (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('stock-alert-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 bg-amber-550/90 text-white hover:bg-amber-600 py-3 rounded-xl text-xs font-sans font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                >
                  <Zap size={14} />
                  <span>انضمي إلى قائمة الانتظار للتوفر 🔔</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onAddToCart(product, selectedCol, selectedSz, quantity)}
                  className="flex-1 bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#F4B6C2] hover:text-white py-3 rounded-xl text-xs font-sans font-bold tracking-wide transition-luxury flex items-center justify-center gap-2 cursor-pointer"
                  id="add-to-cart-action"
                >
                  <ShoppingBag size={14} />
                  <span>إضافة إلى سلة المشتريات</span>
                </button>
              )}

              {/* Toggle Fav */}
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                className="bg-[#FAFAF7] hover:bg-white text-gray-800 p-3 rounded-xl transition-all border border-gray-200 hover:text-red-500 hover:scale-103 cursor-pointer"
                title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              >
                <Heart size={16} fill={isFav ? '#EF4444' : 'none'} className={isFav ? 'text-red-500' : 'text-gray-750'} />
              </button>

              {/* Luxury Share Button representing Zoria / SULTA sleepwear */}
              <button
                type="button"
                onClick={() => setIsSharePanelOpen(!isSharePanelOpen)}
                className={`p-3 rounded-xl transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                  isSharePanelOpen 
                    ? "bg-[#DF8A9C] text-white border-[#DF8A9C] font-semibold" 
                    : "bg-[#FAFAF7] hover:bg-white text-gray-800 border-gray-200 hover:text-[#DF8A9C] hover:scale-103"
                }`}
                title="مشاركة القطعة الفاخرة"
              >
                <Share2 size={15} />
                <span className="text-[10px] font-sans font-bold">مشاركة 🌸</span>
              </button>
            </div>

            {/* Premium Interactive Share Drawer Panel */}
            {isSharePanelOpen && (
              <div className="bg-[#FAFAF5] border border-[#E9DADA] rounded-2xl p-4 space-y-3.5 text-right mt-1 shadow-xs ring-1 ring-black/5 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-[#E9DADA]/60 pb-1.5 flex-row-reverse">
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    <span className="text-xs font-serif font-black text-gray-900">مشاركة قطعة SULTA الفاخرة ✨</span>
                    <Sparkles size={11} className="text-[#DF8A9C] animate-pulse" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSharePanelOpen(false)}
                    className="text-gray-400 hover:text-gray-650 text-xs cursor-pointer font-bold px-1"
                  >
                    إغلاق ×
                  </button>
                </div>

                <p className="text-[10px] text-gray-600 font-sans leading-relaxed">
                  شاركي فخامة وأناقة علامة SULTA لملابس النوم الراقية مع صديقاتكِ أو على حسابتكِ الاجتماعية بلمسة واحدة.
                </p>

                {/* Grid of sharing methods */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* WhatsApp sharing */}
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}?product=${product.id}`;
                      const text = `شاهدت هذا التصميم الخيالي لبيجامات وملابس نوم SULTA الفاخرة ✨:
🌸 الموديل: *${product.nameAr}*
🎨 الألوان المتوفرة: ${product.colors.map(c => c.name).join(' - ')}
💎 المقاسات المتوافرة: ${product.sizes.join(', ')}
💰 السعر: ${price.toLocaleString()} ${currencyLabel}

القطعة منسوجة بقمة الفخامة والنعومة ومتاحة للتوصيل الفوري بالرياض ومصر ومختلف الدول العربيّة!
رابط القطعة الفاخرة للاستعراض والطلب:
${shareUrl}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="bg-[#25D366] hover:bg-[#20ba59] text-white py-2 px-3 rounded-xl text-[11px] font-sans font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Send size={12} className="rotate-220 text-white" />
                    <span>مشاركة عبر واتساب (WhatsApp)</span>
                  </button>

                  {/* Copy Link to Clipboards */}
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}?product=${product.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }}
                    className={`py-2 px-3 rounded-xl text-[11px] font-sans font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                      copied 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                        : 'bg-white hover:bg-gray-50 border-[#E9DADA] text-gray-850'
                    }`}
                  >
                    {copied ? <Check size={12} className="text-emerald-600 animate-bounce" /> : <Copy size={12} className="text-gray-500" />}
                    <span>{copied ? 'تم نسخ الرابط بنجاح! 🌸' : 'نسخ رابط القطعة المباشر'}</span>
                  </button>
                </div>

                {/* Elegant Instagram / Stories sharing guide */}
                <div className="bg-white/80 p-3 rounded-xl border border-[#DF8A9C]/15 space-y-2">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-[10px] font-black text-gray-900">نصيحة التألق من SULTA على انستغرام (Instagram) 📸</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DF8A9C]" />
                  </div>
                  
                  <p className="text-[9px] text-gray-600 leading-normal">
                    انستغرام لا يدعم مشاركة الروابط المباشرة في المنشورات العادية، لذلك نوصيكِ بمشاركة رابط السوري (Story Link) أو إضافة الرابط في البايو الخاص بكِ.
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const caption = `بيجامة SULTA لملابس النوم الفاخرة ✨ تصاميم خيالية تجمع النعومة الفائقة والرقي الملكي 🌸. الموديل المفضل لدي: "${product.nameAr}". تدرجات الألوان الفاخرة متاحة الآن!`;
                        navigator.clipboard.writeText(caption);
                        setCaptionCopied(true);
                        setTimeout(() => setCaptionCopied(false), 2500);
                      }}
                      className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        captionCopied
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'bg-amber-100 hover:bg-amber-150 border-amber-200 text-amber-900'
                      }`}
                    >
                      {captionCopied ? '✓ تم نسخ الوصف الجاهز!' : '📋 نسخ وصف/كابشن انستقرام جاهز للقصة'}
                    </button>

                    <button
                      type="button"
                      onClick={() => window.open('https://instagram.com', '_blank')}
                      className="bg-gradient-to-tr from-[#f9ce71] via-[#ee2a7b] to-[#6228d7] text-white font-bold py-1 px-2.5 rounded-lg text-[9px] transition-all cursor-pointer hover:opacity-90 flex items-center gap-1"
                    >
                      <span>افتتح تطبيق Instagram ↗</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic AI Outfit Complete-Look Suggestion Strip */}
            {matchedPairProduct && (
              <div className="bg-[#FAFAF7] border border-gray-150 rounded-2xl p-3 mb-2 text-right">
                <span className="text-[9px] bg-[#0B0B0B] text-[#F6E7A6] px-2 py-0.5 rounded-full font-serif block w-fit mb-2">
                  ✦ اقتران منسّق بالذكاء من Sulta
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-15 rounded-lg overflow-hidden border border-gray-150 bg-gray-100 shrink-0">
                    <img referrerPolicy="no-referrer" src={matchedPairProduct.images[0]} alt="Pairing Match" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-900 truncate">{matchedPairProduct.nameAr}</p>
                    <p className="text-[9px] text-[#DF8A9C] font-semibold mt-0.5">يكمل إطلالتكِ الملكية الحالية بامتياز ✨</p>
                    <p className="text-[9px] text-gray-500 font-sans mt-0.5">السعر: {matchedPrice.toLocaleString()} {currencyLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(matchedPairProduct, matchedPairProduct.colors[0], matchedPairProduct.sizes[0], 1);
                      toast('تمت إضافة التنسيق المكمل (الكيمونو/البيجامة) إلى سلتكِ بنجاح! 🌸', 'success');
                    }}
                    className="bg-[#0B0B0B] text-white hover:bg-[#DF8A9C] p-2 rounded-xl transition-all cursor-pointer shrink-0"
                    title="إضافة التنسيق المقترح لتكملة المظهر"
                  >
                    <ShoppingBag size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Quick buy and WhatsApp layout buttons */}
            <div className="grid grid-cols-2 gap-2">
              {isCurrentConfigOutOfStock ? (
                <div className="bg-amber-100 hover:bg-amber-150 text-amber-900 border border-amber-300 py-2.5 rounded-xl text-[10px] font-sans font-bold transition-all text-center flex items-center justify-center gap-1 select-none">
                  <span>⚠️ حجز مسبق تحت الحياكة ✦</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onBuyNow(product, selectedCol, selectedSz, quantity)}
                  className="bg-[#F4B6C2] text-white hover:bg-white hover:text-gray-950 border border-transparent hover:border-gray-200 py-2.5 rounded-xl text-xs font-sans font-bold transition-all text-center cursor-pointer"
                >
                  شراء مباشر الآن
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (isCurrentConfigOutOfStock) {
                    const phoneNumber = '201110095403';
                    const text = `مرحباً براند Sulta الفاخر 🌸، أريد حجز مقاس مسبق (تحت الحياكة اليدوية):
• المنتج: ${product.nameAr}
• اللون المطلوب: ${selectedCol.name}
• المقاس المطلوب: ${selectedSz}
• الكمية: ${quantity}
• حالة القطعة: حياكة بالطلب (غير متوفرة للتسليم الفوري)
• السعر الإجمالي: ${(price * quantity).toLocaleString()} ${currencyLabel}
• الدولة: ${country === 'EG' ? 'مصر 🇪🇬' : 'السعودية 🇸🇦'}

أود التواصل لحين جهوزيتها ويسعدني الحجز المسبق معكم ✨`;
                    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
                  } else {
                    handleOrderWhatsApp();
                  }
                }}
                className="bg-[#25D366] text-white hover:bg-[#20ba59] py-2.5 rounded-xl text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send size={12} className="rotate-220" />
                <span>الطلب عبر واتساب</span>
              </button>
            </div>

            {/* Credential Badge */}
            <p className="text-center text-[9px] text-gray-400 font-serif flex justify-center items-center gap-1 mt-1">
              <Shield size={9} className="text-gray-400" />
              <span>تسوق آمن ومضمون من موقع Sulta لملابس النوم واللانجيري الفاخر.</span>
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
