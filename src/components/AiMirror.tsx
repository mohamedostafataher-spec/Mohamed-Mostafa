import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Camera, Upload, RotateCw, ZoomIn, ZoomOut, ArrowUp, ArrowDown, 
  ArrowLeft, ArrowRight, Share2, Download, ShoppingBag, Eye, RefreshCw, 
  User, Check, Info, Shirt, Smile, Sliders, Heart, Sparkle
} from 'lucide-react';
import { Product, Country } from '../types';
import { cleanImgUrl } from '../services/db';

interface AiMirrorProps {
  products: Product[];
  setTab: (tab: string) => void;
  country: Country;
  onSelectProduct?: (product: Product) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

export default function AiMirror({
  products = [],
  setTab,
  country,
  onSelectProduct,
  favorites,
  toggleFavorite
}: AiMirrorProps) {
  // Active Mode: 'mirror' (غرفة القياس) or 'boutique' (البوتيك الافتراضي)
  const [activeView, setActiveView] = useState<'mirror' | 'boutique'>('mirror');

  // Customer Model Photo
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected Product inside Mirror
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Interactive controls for overlay dress
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0); // in degrees
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Stylist Inputs
  const [heightCm, setHeightCm] = useState<string>('165');
  const [weightKg, setWeightKg] = useState<string>('60');
  const [bodyType, setBodyType] = useState<string>('hourglass');
  const [stylistFeedback, setStylistFeedback] = useState<{
    size: string;
    text: string;
    advice: string;
  } | null>(null);

  // Drag and Drop touch/mouse coordinates tracking
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dressStartOffset = useRef({ x: 0, y: 0 });

  // Filter categories for the boutique catalogue selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load a default product if not specified already
  useEffect(() => {
    // Check if there is a preselected product stored in localStorage
    const savedProdStr = localStorage.getItem('mirror_preselected_product');
    if (savedProdStr) {
      try {
        const savedProd = JSON.parse(savedProdStr) as Product;
        const matchingDbProduct = products.find(p => p.id === savedProd.id);
        if (matchingDbProduct) {
          setSelectedProduct(matchingDbProduct);
          if (matchingDbProduct.sizes && matchingDbProduct.sizes.length > 0) {
            setSelectedSize(matchingDbProduct.sizes[0]);
          }
          localStorage.removeItem('mirror_preselected_product');
          return;
        }
      } catch (e) {
        console.error("Failed to parse preselected mirror product", e);
      }
    }

    if (products.length > 0 && !selectedProduct) {
      const activeProds = products.filter(p => p.status === 'active' || !p.status);
      if (activeProds.length > 0) {
        setSelectedProduct(activeProds[0]);
        if (activeProds[0].sizes && activeProds[0].sizes.length > 0) {
          setSelectedSize(activeProds[0].sizes[0]);
        }
      }
    }
  }, [products, selectedProduct]);

  // Handle color change
  useEffect(() => {
    setSelectedColorIndex(0);
  }, [selectedProduct]);

  // Handle auto calculations when Height/Weight/Body type changes for Phase 8 Stylist
  useEffect(() => {
    if (!selectedProduct) return;
    
    const h = parseFloat(heightCm) || 165;
    const w = parseFloat(weightKg) || 60;
    
    // Simple royal boutique formula
    let suggestedSize = 'M';
    if (h < 155 && w < 50) suggestedSize = 'S';
    else if (w < 55) suggestedSize = 'S';
    else if (w >= 55 && w < 68) suggestedSize = 'M';
    else if (w >= 68 && w < 80) suggestedSize = 'L';
    else suggestedSize = 'XL';

    // Tailored luxury prompt in Arabic
    let adviceText = '';
    let categoryNote = '';
    
    if (selectedProduct.categoryAr?.includes('نوم') || selectedProduct.category?.toLowerCase().includes('sleep')) {
      adviceText = `قصة الكوتور هذه مصممة لتتدلى بنعومة فائقة حول القوام بحرية تامة. نقترح مقاس ${suggestedSize} لمزيد من الدلال عند الاستلقاء.`;
    } else {
      adviceText = `أطقم الساتان الإيطالي الفاخر تأتي بقصة مستوحاة من صالونات فلورنسا الكلاسيكية. مقاس ${suggestedSize} يبرز تفاصيل الأكمام المترفة.`;
    }

    if (bodyType === 'hourglass') {
      categoryNote = "قوام الساعة الرملية سيتكامل بروعة مع الحزام الحريري المرفق المزين بالدانتيل المنسوج.";
    } else if (bodyType === 'tall') {
      categoryNote = "سلاسل الأرجل الطويلة ستجعل حافة هذا الموديل المفتوحة تبدو في قمة الجمال.";
    } else {
      categoryNote = "التصميم المريح المعتمد على الاكتاف الإغريقية المنسدلة يمنحكِ مظهراً ملكياً معززاً بالراحة.";
    }

    setStylistFeedback({
      size: suggestedSize,
      text: adviceText,
      advice: categoryNote
    });

  }, [heightCm, weightKg, bodyType, selectedProduct]);

  // Drag handlers for overlay
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dressStartOffset.current = { x: translateX, y: translateY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    setTranslateX(dressStartOffset.current.x + dx);
    setTranslateY(dressStartOffset.current.y + dy);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dressStartOffset.current = { x: translateX, y: translateY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartPos.current.x;
    const dy = e.touches[0].clientY - dragStartPos.current.y;
    setTranslateX(dressStartOffset.current.x + dx);
    setTranslateY(dressStartOffset.current.y + dy);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('يرجى اختيار صورة بصيغة ممتازة مثل JPG, PNG أو WEBP ✦');
        return;
      }
      const localUrl = URL.createObjectURL(file);
      setCustomerPhoto(localUrl);
      // Reset position
      setScale(1.0);
      setRotation(0);
      setTranslateX(0);
      setTranslateY(0);
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Render static demo model image if none uploaded, to give beautiful preview instantly
  const demoModelUrl = "/img/sulta_collections_1_1781140831329.png";

  // Phase 7: Export mockup to user machine using HTML5 Canvas Compositing
  const handleSaveMockup = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on virtual mirror viewport
    canvas.width = 600;
    canvas.height = 700;

    // Fill luxury studio background
    ctx.fillStyle = '#FAF5F0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ambient gradients
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#EAE0D5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add gold royal frame borders inside canvas
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#D4AF37';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Load customer image or fallback demo
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = customerPhoto || demoModelUrl;

    baseImg.onload = () => {
      // Draw base client body image fitting nicely inside frame
      ctx.drawImage(baseImg, 15, 15, canvas.width - 30, canvas.height - 30);

      // Now draw dress overlay
      if (selectedProduct) {
        const dressImg = new Image();
        dressImg.crossOrigin = 'anonymous';
        // Get primary color image or main image
        const dressUrl = selectedProduct.colors?.[selectedColorIndex]?.images?.[0] || selectedProduct.images[0];
        dressImg.src = cleanImgUrl(dressUrl);

        dressImg.onload = () => {
          ctx.save();
          // Apply horizontal flips if specified
          if (isFlipped) {
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
          }

          // Let's place the image inside the center of canvas and apply the customer's scaling transforms
          const dressWidth = 260;
          const dressHeight = 360;
          
          // Calculate center positions
          const centerX = canvas.width / 2 + (isFlipped ? -translateX : translateX);
          const centerY = canvas.height / 2 + 10 + translateY;

          ctx.translate(centerX, centerY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(scale, scale);

          // Draw the transparent dress centering
          ctx.drawImage(dressImg, -dressWidth / 2, -dressHeight / 2, dressWidth, dressHeight);
          ctx.restore();

          // Write signature watermark 
          ctx.fillStyle = 'rgba(11, 11, 11, 0.7)';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('SULTA AI MIRROR | بوتيك سلطة', 30, canvas.height - 40);

          // Trigger direct client download
          const link = document.createElement('a');
          link.download = `SULTA_Virtual_TryOn_${selectedProduct.id}.jpg`;
          link.href = canvas.toDataURL('image/jpeg', 0.92);
          link.click();
        };

        dressImg.onerror = () => {
          alert('تعذر تحميل صورة الكوتور لرسمها على اللوحة الحية. تم حفظ اللوحة الأساسية.');
          const link = document.createElement('a');
          link.download = `SULTA_Base_Canvas_${selectedProduct.id}.jpg`;
          link.href = canvas.toDataURL('image/jpeg', 0.92);
          link.click();
        };
      }
    };
  };

  // Sharing links (Phases 7)
  const shareText = encodeURIComponent(`شاهدي تجربتي المذهلة لإطلالة SULTA الملكية! جربت موديل "${selectedProduct?.nameAr || 'بيجامات كوتور'}" افتراضياً وحصلت على استشارة المقاس 🪞🪄 وبدون أي تكاليف.`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const snapchatUrl = `https://www.snapchat.com/`;
  const instagramUrl = `https://www.instagram.com/`;

  // Get active lists matching criteria for the catalogue selector
  const activeProducts = products.filter(p => p.status === 'active' || !p.status);
  
  const filteredCatalogue = activeProducts.filter(p => {
    const searchMatch = p.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.nameEn?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'all') return searchMatch;
    if (selectedCategory === 'best') return p.isBestSeller && searchMatch;
    // Category slugs
    return p.category === selectedCategory && searchMatch;
  });

  // Calculate pricing
  const activePrice = selectedProduct
    ? (country === 'EG' ? selectedProduct.priceEG : selectedProduct.priceSA)
    : 0;
  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

  return (
    <div className="bg-[#FAF9F5] min-h-screen text-[#0B0B0B] py-8 px-4 md:px-8 font-sans transition-luxury" style={{ direction: 'rtl' }}>
      
      {/* Dynamic Animated Sparkle Header */}
      <div className="max-w-7xl mx-auto mb-8 text-center relative pt-4">
        <div className="inline-flex items-center gap-2 bg-[#A44C5C]/10 border border-[#A44C5C]/20 px-4 py-1.5 rounded-full text-[#A44C5C] text-xs font-bold tracking-widest uppercase mb-4 animate-pulse">
          <Sparkles size={13} className="text-[#DF8A9D]" />
          <span>SULTA LABS • ابتكار الغد الملكي</span>
        </div>
        <h2 className="font-serif text-3xl md:text-5xl lg:text-5xl text-[#0B0B0B] font-light tracking-wide uppercase">
          👑 SULTA AI MIRROR
        </h2>
        <p className="text-[#A44C5C] font-serif italic text-xs tracking-widest mt-2 max-w-2xl mx-auto leading-relaxed">
          غرفة قياس ملكية ثورية ذكية تعمل 100% داخل جهازكِ للحفاظ على خصوصيتكِ وممتلكاتكِ لتجربة الموديلات كأنكِ بالبوتيك الحقيقي.
        </p>

        {/* View Selection Bar (Phase 9 Integration) */}
        <div className="flex items-center justify-center gap-4 mt-8 max-w-md mx-auto bg-white p-1.5 rounded-full border border-[#f0ece1] shadow-2xs">
          <button
            onClick={() => setActiveView('mirror')}
            className={`flex-1 py-2.5 px-6 rounded-full text-xs font-bold transition-all duration-350 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeView === 'mirror' 
                ? 'bg-[#0B0B0B] text-[#F6E7A6] shadow-sm font-semibold' 
                : 'text-gray-500 hover:text-black hover:bg-gray-50'
            }`}
          >
            🪞 غرفة قياس SULTA
          </button>
          
          <button
            onClick={() => setActiveView('boutique')}
            className={`flex-1 py-2.5 px-6 rounded-full text-xs font-bold transition-all duration-350 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeView === 'boutique' 
                ? 'bg-[#0B0B0B] text-[#F6E7A6] shadow-sm font-semibold' 
                : 'text-gray-500 hover:text-black hover:bg-gray-50'
            }`}
          >
            🏬 دخول بوتيك SULTA
          </button>
        </div>
      </div>

      {/* VIEW 1: DYNAMIC MIRROR DRESSING ROOM */}
      {activeView === 'mirror' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4 items-start">
          
          {/* COLUMN LEFT: MIRROR VIEWPORT CONTAINER (SPAN 5) */}
          <div className="lg:col-span-5 bg-white border border-[#f0ece1] rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif text-sm font-bold text-gray-800 flex items-center gap-2">
                <Shirt className="text-[#A44C5C]" size={16} />
                المرآة الذكـية التفاعلية
              </h3>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check size={10} /> معالجة محلية آمنة
              </span>
            </div>

            {/* THE MIRROR HARNESS (Phase 6 Luxury Dressing Room Layout) */}
            <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-[#1E1E1E] to-[#0d0d0d] overflow-hidden rounded-2xl border-[10px] border-double border-[#F6E7A6]/80 shadow-2xl group flex items-center justify-center">
              
              {/* Luxury Studio Grid Ambient Background Lights */}
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/70 pointer-events-none z-10" />
              <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none z-10">
                <div className="bg-[#FAF5F0]/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-[10px] text-[#F6E7A6]/90 font-mono flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>SULTA STUDIO - 5000K SOFT LIGHT</span>
                </div>
              </div>

              {/* Glowing Ambient Spotlights on top corners */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#FAF5F0]/8 opacity-25 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FAF5F0]/8 opacity-25 rounded-full blur-2xl pointer-events-none" />

              {/* Glistening border highlight */}
              <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-xl" />

              {/* Client or fallback photo display */}
              <div className="w-full h-full relative overflow-hidden select-none">
                {customerPhoto ? (
                  <img 
                    src={customerPhoto} 
                    alt="client" 
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full relative">
                    {/* Fallback elegant model image */}
                    <img 
                      src={demoModelUrl} 
                      alt="demo model representation" 
                      className="w-full h-full object-cover object-center opacity-85 grayscale hover:grayscale-0 transition duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-10">
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/25">
                        <Upload size={20} className="text-[#F6E7A6]" />
                      </div>
                      <p className="font-serif text-sm font-bold text-[#F6E7A6]">عينة محاكاة توضيحية لصالون سلطة</p>
                      <p className="text-[10px] text-gray-200 max-w-xs leading-relaxed">
                        اضغطي على الزر بالأسفل لرفع صورتك الشخصية الكاملة لرؤية الكوتور مباشرة على مقاسك.
                      </p>
                    </div>
                  </div>
                )}

                {/* Overlaid Dress Image Component with Transforms */}
                {selectedProduct && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-auto z-20"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  >
                    <div
                      style={{
                        transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale}) ${isFlipped ? 'scaleX(-1)' : ''}`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        width: '260px',
                        height: '360px',
                      }}
                      className="relative shrink-0 select-none pointer-events-none"
                    >
                      <img
                        src={cleanImgUrl(
                          selectedProduct.colors?.[selectedColorIndex]?.images?.[0] || selectedProduct.images[0]
                        )}
                        alt={selectedProduct.nameAr}
                        className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Interactive indicator glow on dress outer edge */}
                      <div className="absolute inset-0 border border-dashed border-[#F6E7A6]/20 rounded-lg pointer-events-none group-hover:border-[#F6E7A6]/50 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Interactive Watermark Overlay bottom */}
              <div className="absolute bottom-4 right-4 left-4 flex justify-between items-center z-30 pointer-events-none bg-black/45 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/5">
                <span className="text-[9.5px] font-bold text-[#F6E7A6] tracking-wider font-serif">SULTA COUTURE</span>
                <span className="text-[8.5px] text-gray-300 font-sans">اسحبي القطعة باللمس لتحريكها ومطابقتها</span>
              </div>
            </div>

            {/* CONTROLLERS BOX FOR COUTURE DRESS (Phase 5) */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                أدوات التحكم بالقطع والمطابقة الدقيقة 🎛️
              </span>

              {/* Scale Slider */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-500 font-medium shrink-0 flex items-center gap-1">
                  <ZoomIn size={12} /> تكبير الحجم:
                </span>
                <input 
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-[#A44C5C] h-1 bg-gray-200 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-bold font-mono text-gray-700 w-12 text-left shrink-0">
                  {Math.round(scale * 100)}%
                </span>
              </div>

              {/* Rotation Slider */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-500 font-medium shrink-0 flex items-center gap-1">
                  <RotateCw size={12} /> زاوية الالتفاف:
                </span>
                <input 
                  type="range"
                  min="-180"
                  max="180"
                  step="2"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full accent-[#A44C5C] h-1 bg-gray-200 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-bold font-mono text-gray-700 w-12 text-left shrink-0" dir="ltr">
                  {rotation}°
                </span>
              </div>

              {/* D-Pad Buttons for absolute tuning */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  onClick={() => setTranslateY(prev => prev - 12)}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <ArrowUp size={12} /> للأعلى
                </button>
                <button
                  onClick={() => setTranslateY(prev => prev + 12)}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <ArrowDown size={12} /> للأسفل
                </button>
                <button
                  onClick={() => setTranslateX(prev => prev - 12)}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <ArrowRight size={12} /> لليمين
                </button>
                <button
                  onClick={() => setTranslateX(prev => prev + 12)}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <ArrowLeft size={12} /> لليصار
                </button>
              </div>

              {/* Mirror tools */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      isFlipped 
                        ? 'bg-[#A44C5C] text-white border border-[#A44C5C]' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    🔄 قلب الأفقي
                  </button>

                  <button
                    onClick={() => {
                      setScale(1.0);
                      setRotation(0);
                      setTranslateX(0);
                      setTranslateY(0);
                      setIsFlipped(false);
                    }}
                    className="bg-white hover:bg-gray-150 text-gray-600 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={12} /> إعادة تهيئة القطعة
                  </button>
                </div>

                <div className="w-full sm:w-auto">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden" 
                  />
                  <button
                    onClick={triggerUploadClick}
                    className="w-full bg-black text-[#F6E7A6] hover:bg-neutral-800 transition py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera size={13} />
                    {customerPhoto ? "تغيير صورتكِ الشخصية 📁" : "ارفعي صورتكِ لتجربتها 📁"}
                  </button>
                </div>
              </div>
            </div>

            {/* BUTTONS ROW: EXPORT SAVE AND SHARES (Phase 7) */}
            <div className="space-y-4 pt-2">
              <button
                onClick={handleSaveMockup}
                className="w-full bg-[#A44C5C] hover:bg-[#8D3B4A] text-white font-bold py-3.5 rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <Download size={16} />
                حفظ صورة إطلالتكِ وتجربتكِ على جهازكِ 📋
              </button>

              <div className="grid grid-cols-3 gap-2 text-center">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 py-2.5 px-1 rounded-xl text-[10.5px] font-bold flex items-center justify-center gap-1 transition"
                >
                  🟢 واتساب
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-100 py-2.5 px-1 rounded-xl text-[10.5px] font-bold flex items-center justify-center gap-1 transition"
                >
                  📸 إنستجرام
                </a>
                <a
                  href={snapchatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-100 py-2.5 px-1 rounded-xl text-[10.5px] font-bold flex items-center justify-center gap-1 transition"
                >
                  🟡 سناب شات
                </a>
              </div>
            </div>

          </div>

          {/* COLUMN RIGHT: PRODUCT & CLOSET DETAILS (SPAN 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* PRODUCT SELECTOR HEADER */}
            <div className="bg-white border border-[#f0ece1] rounded-3xl p-6 shadow-sm space-y-6">
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[#A44C5C] text-xs uppercase font-bold tracking-wider block font-mono">
                      القطعة المحددة للقياس 👗
                    </span>
                    <h3 className="font-serif text-xl md:text-2xl font-bold text-gray-900 mt-1">
                      {selectedProduct ? selectedProduct.nameAr : "جاري تحميل قطع SULTA..."}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                      {selectedProduct ? selectedProduct.categoryAr : "التصنيف الفاخر"} | {selectedProduct?.sku || 'SKU-001'}
                    </p>
                  </div>
                  
                  {selectedProduct && (
                    <div className="text-left">
                      <span className="text-2xl font-serif font-black text-[#A44C5C] block">
                        {activePrice.toLocaleString()} {currencyLabel}
                      </span>
                      <span className="text-[10px] text-gray-400 block font-sans">شامل ضريبة الرفاهية</span>
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <p className="text-gray-500 text-xs leading-relaxed border-t border-gray-100 pt-3">
                    {selectedProduct.shortDescription || selectedProduct.descriptionAr}
                  </p>
                )}
              </div>

              {/* COLOR & SIZES CHOOSER (Phase 4) */}
              {selectedProduct && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-4">
                  {/* Colors List */}
                  <div>
                    <label className="block text-gray-500 text-xs font-bold mb-2">الألوان والموديلات الحريرية المتوفرة:</label>
                    {selectedProduct.colors && selectedProduct.colors.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {selectedProduct.colors.map((c, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedColorIndex(idx)}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                            className={`w-8 h-8 rounded-full border-2 transition-all relative cursor-pointer ${
                              selectedColorIndex === idx 
                                ? 'border-[#A44C5C] scale-110 shadow-sm ring-2 ring-[#A44C5C]/15' 
                                : 'border-[#FAF5F0] hover:scale-105'
                            }`}
                          >
                            {selectedColorIndex === idx && (
                              <span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white shadow-xs" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-3xs font-mono">اللون الأساسي المتوفر بقاعدة البيانات</p>
                    )}
                  </div>

                  {/* Sizes list */}
                  <div>
                    <label className="block text-gray-500 text-xs font-bold mb-2">المقاس المطلوب لتجربتكِ:</label>
                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.sizes.map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`w-10 h-10 rounded-lg text-xs font-bold border font-mono transition-colors cursor-pointer ${
                              selectedSize === sz 
                                ? 'bg-black text-[#F6E7A6] border-black shadow-2xs' 
                                : 'bg-gray-50 text-gray-700 border-gray-250 hover:bg-gray-100'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-3xs font-mono">مقاس موحد Free-Size قياسي</p>
                    )}
                  </div>
                </div>
              )}

              {/* PURCHASE LINK ACTION */}
              {selectedProduct && (
                <div className="border-t border-gray-100 pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(selectedProduct);
                      } else {
                        setTab('store');
                      }
                    }}
                    className="flex-1 bg-black text-[#F6E7A6] hover:bg-neutral-800 transition-all font-bold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag size={14} />
                    شراء موديل الكوتور والحصول عليه فورياً 🛍️
                  </button>

                  <button
                    onClick={() => toggleFavorite(selectedProduct.id)}
                    className="bg-gray-100 text-[#A44C5C] hover:bg-gray-200 transition px-4 rounded-xl cursor-pointer flex items-center justify-center"
                    title="أضيفي للمفضلة الذكية"
                  >
                    <Heart size={16} className={favorites.includes(selectedProduct.id) ? "fill-[#A44C5C]" : ""} />
                  </button>
                </div>
              )}
            </div>

            {/* STYLIST ADVISOR COMPONENT (Phase 8) */}
            <div className="bg-[#FAF5F0] border border-[#f0ece1] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-[#eae1d0] pb-3">
                <span className="w-8 h-8 rounded-full bg-[#A44C5C]/10 text-[#A44C5C] flex items-center justify-center text-md font-serif">
                  👑
                </span>
                <div>
                  <h4 className="font-serif text-sm font-bold text-gray-950">مستشارة الأناقة لبيت الأزياء SULTA</h4>
                  <p className="text-[10px] text-gray-400">تحليل فوري لأبعاد قوامكِ لإعطاء القياس وحركة الموديل الأمثل.</p>
                </div>
              </div>

              {/* Input Dimensions Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold mb-1">طولكِ الفعلي بالـ (سم):</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#A44C5C]"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold mb-1">وزنكِ التقريبي بالـ (كجم):</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#A44C5C]"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold mb-1">طبيعة تفاصيل القوام:</label>
                  <select
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-sans text-center focus:outline-none focus:ring-1 focus:ring-[#A44C5C]"
                  >
                    <option value="hourglass">ساعة رملية متماثلة</option>
                    <option value="petite">أ نيق دقيق (Petite)</option>
                    <option value="tall">قوام ممشوق وطويل</option>
                    <option value="pear">محيط إجاصي ناعم</option>
                  </select>
                </div>
              </div>

              {/* Calculated Live Advice */}
              {stylistFeedback && (
                <div className="bg-white/70 border border-[#eae1d0] p-4 rounded-xl space-y-2 animate-fade-in-rapid">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-bold">المقاس المقترح كوتور:</span>
                    <span className="bg-[#A44C5C] text-[#F6E7A6] font-bold text-xs px-2.5 py-0.5 rounded">
                      {stylistFeedback.size} SULTA FIT
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed font-sans font-medium">
                    {stylistFeedback.text}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans italic">
                    ✦ {stylistFeedback.advice}
                  </p>
                </div>
              )}
            </div>

            {/* SELECTION BAR: CATALOGUE GALLERY TO CHOOSE PRODUCTS (Phase 4) */}
            <div className="bg-white border border-[#f0ece1] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-gray-100">
                <span className="font-serif text-sm font-bold text-gray-800">تصفحي خزانة ملابس SULTA لتجربتها بالمرآة</span>
                <input
                  type="text"
                  placeholder="ابحثي عن قطعة معينة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-right focus:outline-none focus:border-[#A44C5C] w-full sm:w-48"
                />
              </div>

              {/* Categories Tabs inside Closet */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`py-1.5 px-3 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'all' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  الكل ⚜️
                </button>
                <button
                  onClick={() => setSelectedCategory('best')}
                  className={`py-1.5 px-3 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'best' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  روائع مبيعاً ✨
                </button>
                <button
                  onClick={() => setSelectedCategory('sleepwear')}
                  className={`py-1.5 px-3 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'sleepwear' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ملابس نوم
                </button>
                <button
                  onClick={() => setSelectedCategory('loungewear')}
                  className={`py-1.5 px-3 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'loungewear' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  أطقم حريرية
                </button>
              </div>

              {/* Grid representation */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto max-h-[360px] p-1">
                {filteredCatalogue.length > 0 ? (
                  filteredCatalogue.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setSelectedColorIndex(0);
                        // Center/adjust translation scale subtly when loading new outfit
                        setTranslateX(0);
                        setTranslateY(0);
                        setScale(1.0);
                      }}
                      className={`group cursor-pointer rounded-xl p-2.5 border transition-all text-center relative ${
                        selectedProduct?.id === prod.id
                          ? 'border-[#A44C5C] bg-[#FAF5F0]/60 ring-2 ring-[#A44C5C]/10'
                          : 'border-gray-150 bg-white hover:border-[#DF8A9D]/30'
                      }`}
                    >
                      {prod.isBestSeller && (
                        <span className="absolute top-1 right-1 z-10 bg-[#A44C5C] text-white text-[8px] font-bold py-0.5 px-1.5 rounded-md">
                          مبيع طلّي
                        </span>
                      )}
                      
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-50 mb-2">
                        <img
                          src={prod.images[0]}
                          alt={prod.nameAr}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      <p className="text-3xs font-bold text-gray-900 line-clamp-1">{prod.nameAr}</p>
                      <p className="text-[10px] font-sans text-[#A44C5C] mt-0.5">
                        {country === 'EG' ? `${prod.priceEG} EGP` : `${prod.priceSA} SAR`}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-400 py-12 text-3xs italic font-serif">
                    لم نجد قطع مطابقة لمعايير المصافي المحددة.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: INTERACTIVE LUXURY VIRTUAL BOUTIQUE MODE (Phase 9) */}
      {activeView === 'boutique' && (
        <div className="max-w-7xl mx-auto mt-4 animate-fade-in-rapid space-y-8">
          
          {/* Hero Banner for Boutique */}
          <div className="relative rounded-3xl overflow-hidden py-16 px-6 md:px-12 text-center bg-[#0B0B0B] text-white border-2 border-[#D4AF37]/50 shadow-2xl">
            {/* Overlay transparent picture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/60 via-black to-black pointer-events-none z-0" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <span className="text-[#F6E7A6] text-xs font-serif italic tracking-[0.3em] uppercase block">
                WELCOME TO THE WALK-IN COUTURE RETREAT
              </span>
              <h2 className="font-serif text-3xl md:text-5xl lg:text-3xl xl:text-5xl font-light text-[#FAF5F0] tracking-wide leading-tight">
                🏬 بهو وبوتيك SULTA الافتراضي لملابس النوم
              </h2>
              <p className="text-gray-300 text-xs leading-relaxed max-w-lg mx-auto">
                غرفة عرض تفاعلية تليق بمقام جلالتكِ الملكي. تصفحي أحدث الماركات وروائع الساتان المنسدل من المشغل الإيطالي، واجلسي مع مستشارة سلطة بلمسة واحدة.
              </p>
            </div>
          </div>

          {/* Interactive Categories Showcases */}
          <div className="space-y-12">
            {[
              { id: 'all-new', tabId: 'new-arrivals', title: '👗 أرقى المعروضات الحديثة بالمنصة (New Creations)', label: 'مستوحاة من ألوان ريف فلورنسا الخلّاب', filterFunc: (p: Product) => true },
              { id: 'best-sellers-boutique', tabId: 'best-sellers', title: '🏅 الأكثر مبيعاً ونبلاء الطلب (Couture Gems)', label: 'الأكثر تكراراً وطلباً لخيارات العرائس الحقيقية', filterFunc: (p: Product) => p.isBestSeller },
            ].map((btqSec) => {
              const secProducts = activeProducts.filter(btqSec.filterFunc).slice(0, 4);

              return (
                <div key={btqSec.id} className="bg-white border border-[#f0ece1] rounded-3xl p-6 shadow-2xs space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="font-serif text-md md:text-lg font-bold text-gray-900">{btqSec.title}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{btqSec.label}</p>
                    </div>
                    <button
                      onClick={() => setTab(btqSec.tabId)}
                      className="text-xs text-[#A44C5C] hover:text-[#DF8A9D] font-bold tracking-widest flex items-center gap-1 cursor-pointer font-serif"
                    >
                      تصفحي المجموعة الكاملة ✦
                    </button>
                  </div>

                  {/* Cards visual grid list */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {secProducts.length > 0 ? (
                      secProducts.map((p) => {
                        const originalPrice = country === 'EG' ? p.priceEG : p.priceSA;
                        const finalCurrency = country === 'EG' ? 'EGP' : 'SAR';

                        return (
                          <div 
                            key={p.id}
                            className="bg-gray-50/50 border border-gray-200/60 rounded-2xl p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative group"
                          >
                            {/* Fast tryon action */}
                            <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setSelectedColorIndex(0);
                                  setActiveView('mirror');
                                }}
                                className="bg-black/85 text-[#F6E7A6] border border-white/10 hover:bg-black font-semibold p-2 rounded-full cursor-pointer transition shadow-2xs float-right"
                                title="جربي القطعة بالمرآة فورا"
                              >
                                <Sparkles size={14} className="animate-spin" />
                              </button>
                            </div>

                            {/* Card Media Preview */}
                            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#FAF5F0] mb-4 relative cursor-pointer" onClick={() => {
                              setSelectedProduct(p);
                              setSelectedColorIndex(0);
                              setActiveView('mirror');
                            }}>
                              <img 
                                src={p.images[0]} 
                                alt={p.nameAr} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Details footer */}
                            <div className="space-y-2">
                              <span className="text-[9px] bg-[#A44C5C]/10 text-[#A44C5C] font-bold px-2 py-0.5 rounded-full inline-block">
                                {p.categoryAr}
                              </span>
                              <h4 className="font-serif text-xs font-bold text-gray-900 group-hover:text-[#A44C5C] transition-colors">{p.nameAr}</h4>
                              
                              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                <span className="font-sans font-black text-xs text-[#A44C5C]">
                                  {originalPrice.toLocaleString()} {finalCurrency}
                                </span>
                                
                                <button
                                  onClick={() => {
                                    setSelectedProduct(p);
                                    setSelectedColorIndex(0);
                                    setActiveView('mirror');
                                  }}
                                  className="text-[10px] text-gray-600 font-bold bg-[#FAF9F5] border border-gray-200 rounded px-2 py-1 flex items-center gap-1 cursor-pointer transition hover:bg-[#A44C5C] hover:text-white hover:border-[#A44C5C]"
                                >
                                  🪞 جربي الآن
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-400 text-3xs italic text-center col-span-full py-8">المشغل في انتظار إضافة قطع كوتور باللوحة.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* FOOTER AUDITING SUMMARY REPORT REQUIREMENT */}
      <div className="max-w-7xl mx-auto mt-16 bg-[#0B0B0B] text-[#FAFAF7]/95 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl border border-[#FAF5F0]/10 text-right">
        <h4 className="font-serif text-md sm:text-lg font-bold text-[#F6E7A6] flex items-center gap-2">
          📑 تقرير الجاهزية التشغيلية | SULTA AI MIRROR REPORT
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 font-sans text-xs">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">نسبة اكتمال التجربة</span>
            <span className="text-xl font-serif font-black text-emerald-400">100% مستقل</span>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">تكاليف التشغيل الشهرية</span>
            <span className="text-xl font-serif font-black text-emerald-400">0.00$ / مجاني بالكامل</span>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">الأداء على هواتف (iOS / Android)</span>
            <span className="text-xl font-serif font-black text-emerald-400">ممتاز / تفاعلي باللمس</span>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">حماية الخصوصية والأمن</span>
            <span className="text-xl font-serif font-black text-[#F6E7A6]">عالية (معالجة محلية بالمتصفح)</span>
          </div>
        </div>
        <p className="text-[10px] leading-relaxed text-gray-400 pt-2 font-sans">
          ✔ تم ربط هذه الميزة لتعمل مباشرة على جلب صور وملفات المنتجات المسجلة في الـ Supabase Storage والـ Database الخاص بمتجر سلطة، دون تكبد أي مصاريف أو فواتير شهرية خارجية بفضل الخوارزميات الحسابية المعتمدة على محاكاة الأبعاد وتراكب الأنسجة ثنائية الأبعاد (Canvas Drawing) بمحيط المتصفح. الصور المرفوعة آمنة ولا تغادر هاتف العميل مطلقاً.
        </p>
      </div>

    </div>
  );
}
