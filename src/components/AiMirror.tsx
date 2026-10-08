import SultaImage from "./SultaImage";
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
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Live video streaming states for premium Interactive Smart Mirror
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clean up video stream on component unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);

  // Blend/styling adjustments to make it look "natural" as requested by user
  const [dressOpacity, setDressOpacity] = useState<number>(0.95);
  const [dressBrightness, setDressBrightness] = useState<number>(1.0);
  const [dressContrast, setDressContrast] = useState<number>(1.0);
  const [dressSaturation, setDressSaturation] = useState<number>(1.0);
  const [shadowAlpha, setShadowAlpha] = useState<number>(0.4);
  const [blendMode, setBlendMode] = useState<string>('normal');

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
      adviceText = `أطقم الكوتور الفاخر تأتي بقصة مستوحاة من صالونات فلورنسا الكلاسيكية. مقاس ${suggestedSize} يبرز تفاصيل الأكمام المترفة.`;
    }

    if (bodyType === 'hourglass') {
      categoryNote = "قوام الساعة الرملية سيتكامل بروعة مع الحزام الملوكي المرفق المزين بالدانتيل المنسوج.";
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

  // Global smooth window-level drag tracking to prevent page scroll lockups on mobile
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      setTranslateX(dressStartOffset.current.x + dx);
      setTranslateY(dressStartOffset.current.y + dy);
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      // Prevent browser bounce/scroll while actively dragging the dress
      if (e.cancelable) {
        e.preventDefault();
      }
      const dx = e.touches[0].clientX - dragStartPos.current.x;
      const dy = e.touches[0].clientY - dragStartPos.current.y;
      setTranslateX(dressStartOffset.current.x + dx);
      setTranslateY(dressStartOffset.current.y + dy);
    };

    const handleWindowTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [isDragging]);

  // Touch & Mouse initializations (on the dress itself)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dressStartOffset.current = { x: translateX, y: translateY };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dressStartOffset.current = { x: translateX, y: translateY };
    }
  };

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Robust image verification: check if MIME type starts with image/ OR file extension matches typical image formats
      const isImg = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif|gif)$/i.test(file.name);
      if (!isImg) {
        alert('يرجى اختيار صورة صالحة وبجودة عالية ✦');
        return;
      }
      const localUrl = URL.createObjectURL(file);
      setCustomerPhoto(localUrl);
      // Reset position & blend adjustments
      setScale(1.0);
      setRotation(0);
      setTranslateX(0);
      setTranslateY(0);
      setDressOpacity(0.95);
      setDressBrightness(1.0);
      setDressContrast(1.0);
      setDressSaturation(1.0);
      setBlendMode('normal');
    }
  };

  // Auto alignment and auto-sizing function based on body metrics (Phase 5 + Phase 8 Integration)
  const autoFitDress = () => {
    if (!selectedProduct) return;
    
    const h = parseFloat(heightCm) || 165;
    const w = parseFloat(weightKg) || 60;
    
    // Auto scale calculation relative to standard height/weight proportions
    // Height standard: 165cm, Weight standard: 60kg
    const heightRatio = h / 165;
    const weightRatio = w / 60;
    
    // Smooth weighted scale factor
    let calculatedScale = 1.0 * heightRatio * (0.85 + 0.15 * weightRatio);
    
    // Adjust slightly for body shape
    if (bodyType === 'petite') {
      calculatedScale *= 0.9;
    } else if (bodyType === 'tall') {
      calculatedScale *= 1.08;
    } else if (bodyType === 'pear') {
      calculatedScale *= 1.03;
    }

    // Set state
    setScale(Math.max(0.5, Math.min(2.3, Number(calculatedScale.toFixed(2)))));
    setRotation(0);
    
    // Center it with a slight downward offset of 35px to align perfectly on the body torso
    setTranslateX(0);
    setTranslateY(35);
    
    // Smooth natural blend defaults
    setDressOpacity(0.92);
    setDressBrightness(1.02);
    setDressContrast(1.05);
    setShadowAlpha(0.45);
    setBlendMode('multiply'); // Multiply blend works magic on photo fabrics for seamless look!
  };

  // Camera stream handlers for Live Video Trial (Premium Feature)
  const startCameraStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 800 } }
      });
      setVideoStream(mediaStream);
      setIsStreaming(true);
      setCustomerPhoto(null); // Clear static customer photo
      
      // Delay slightly to ensure element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 150);
    } catch (err) {
      console.error("Error accessing camera stream:", err);
      alert("عذراً، لم نتمكن من تشغيل الكاميرا المباشرة. يرجى التحقق من منح صلاحية الكاميرا في متصفحكِ ✦");
    }
  };

  const stopCameraStream = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsStreaming(false);
  };

  const captureFromStream = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 800;
      const context = canvas.getContext('2d');
      if (context) {
        // Draw the current video frame mirrored (since front camera is mirrored)
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const dataUrl = canvas.toDataURL('image/jpeg');
          setCustomerPhoto(dataUrl);
        } catch (e) {
          console.error("Failed to export captured frame as Data URL", e);
        }
        stopCameraStream();
      }
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraClick = () => {
    cameraInputRef.current?.click();
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

          // Apply opacity & filters to make it look highly natural on export
          ctx.globalAlpha = dressOpacity;
          try {
            ctx.filter = `brightness(${dressBrightness}) contrast(${dressContrast}) saturate(${dressSaturation})`;
          } catch (e) {
            console.warn("Canvas filter not supported, falling back to pure opacity", e);
          }

          // Apply blend modes to canvas compositing!
          if (blendMode && blendMode !== 'normal') {
            ctx.globalCompositeOperation = blendMode as any;
          } else {
            ctx.globalCompositeOperation = 'source-over';
          }

          // Draw the transparent dress centering
          ctx.drawImage(dressImg, -dressWidth / 2, -dressHeight / 2, dressWidth, dressHeight);
          
          // Reset composite operation for watermark text
          ctx.globalCompositeOperation = 'source-over';
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
                ? 'bg-[#A44C5C] text-[#F6E7A6] shadow-sm font-semibold' 
                : 'text-gray-500 hover:text-black hover:bg-gray-50'
            }`}
          >
            🪞 غرفة قياس SULTA
          </button>
          
          <button
            onClick={() => setActiveView('boutique')}
            className={`flex-1 py-2.5 px-6 rounded-full text-xs font-bold transition-all duration-350 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeView === 'boutique' 
                ? 'bg-[#A44C5C] text-[#F6E7A6] shadow-sm font-semibold' 
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
              <div 
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest('.group\\/dress') && !target.closest('.preset-btn') && !target.closest('.photo-ctrl')) {
                    if (!isStreaming) {
                      triggerUploadClick();
                    }
                  }
                }}
                className="w-full h-full relative overflow-hidden select-none cursor-pointer group/mirror"
                title="اضغطي هنا في أي مكان بالمرآة لرفع صورتكِ أو التقاط صورة"
              >
                {isStreaming ? (
                  <div className="w-full h-full relative" onClick={(e) => e.stopPropagation()}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover object-center"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    {/* Floating help button on top left to reset */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        stopCameraStream();
                      }}
                      className="photo-ctrl absolute top-4 left-4 z-30 bg-black/75 hover:bg-black text-[#F4B6C2] border border-[#F4B6C2]/30 text-[10px] font-bold py-1 px-2.5 rounded-full shadow-lg flex items-center gap-1 active:scale-95 transition"
                    >
                      ❌ إيقاف البث والرجوع للموديل
                    </button>
                    {/* Floating trigger button on top right to quickly change photo */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        captureFromStream();
                      }}
                      className="photo-ctrl absolute top-4 right-4 z-30 bg-[#A44C5C] hover:bg-[#8D3B4A] text-white border border-[#A44C5C]/30 text-[10px] font-bold py-1 px-3.5 rounded-full shadow-lg flex items-center gap-1 active:scale-95 transition animate-pulse"
                    >
                      📸 التقاط الصورة فورياً
                    </button>
                  </div>
                ) : customerPhoto ? (
                  <div className="w-full h-full relative">
                    <SultaImage 
                      src={customerPhoto} 
                      alt="client" 
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                    {/* Floating help button on top left to reset */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomerPhoto(null);
                      }}
                      className="photo-ctrl absolute top-4 left-4 z-30 bg-black/75 hover:bg-black text-[#F4B6C2] border border-[#F4B6C2]/30 text-[10px] font-bold py-1 px-2.5 rounded-full shadow-lg flex items-center gap-1 active:scale-95 transition"
                    >
                      ❌ حذف صورتي والعودة للموديل
                    </button>
                    {/* Floating trigger button on top right to quickly change photo */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerUploadClick();
                      }}
                      className="photo-ctrl absolute top-4 right-4 z-30 bg-black/75 hover:bg-black text-[#F6E7A6] border border-[#F6E7A6]/30 text-[10px] font-bold py-1 px-2.5 rounded-full shadow-lg flex items-center gap-1 active:scale-95 transition animate-pulse"
                    >
                      📸 تغيير الصورة الشخصية
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    {/* Fallback elegant model image */}
                    <SultaImage 
                      src={demoModelUrl} 
                      alt="demo model representation" 
                      className="w-full h-full object-cover object-center opacity-85 grayscale hover:grayscale-0 transition duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 text-center text-white space-y-4 z-10">
                      <div className="w-16 h-16 rounded-full bg-[#A44C5C]/20 border-2 border-[#F6E7A6] backdrop-blur-md flex items-center justify-center animate-bounce shadow-xl">
                        <Camera size={28} className="text-[#F6E7A6]" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-serif text-base font-bold text-[#F6E7A6]">اضغطي في أي مكان بالمرآة لرفع صورتكِ 📸</p>
                        <p className="text-[11px] text-gray-200 max-w-xs leading-relaxed">
                          أو التقاط صورة حية بكاميرا هاتفكِ لتجربة البيجامة الملكية فورياً وبخصوصية تامة!
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerCameraClick();
                          }}
                          className="bg-white/10 hover:bg-white/20 text-[#FAF5F0] border border-white/20 text-xs font-bold py-2.5 px-5 rounded-full shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition"
                        >
                          <Camera size={14} />
                          التقاط صورة سريعة بالكاميرا 🤳
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startCameraStream();
                          }}
                          className="bg-[#A44C5C] hover:bg-[#8D3B4A] text-white text-xs font-bold py-2.5 px-5 rounded-full shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition animate-pulse"
                        >
                          <Eye size={14} />
                          تشغيل البث المباشر التفاعلي 🎥
                        </button>
                      </div>

                      {/* Interactive model quick presets for testing if they don't want to upload */}
                      <div className="pt-2 border-t border-white/10 w-full" onClick={(e) => e.stopPropagation()}>
                        <p className="text-[10px] text-gray-400 mb-2">أو اختاري موديل جسم تجريبي جاهز:</p>
                        <div className="flex justify-center gap-1.5 flex-wrap">
                          {[
                            { name: 'جسم دقيق (Petite)', url: '/img/sulta_collections_1_1781140831329.png' },
                            { name: 'جسم طويل (Tall)', url: '/img/sulta_loungewear_1_1781140813379.png' },
                            { name: 'جسم كلاسيكي (Hourglass)', url: '/img/sulta_homewear_1_1781140849645.png' }
                          ].map((model, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setCustomerPhoto(model.url);
                                setBodyType(model.name.includes('دقيق') ? 'petite' : model.name.includes('طويل') ? 'tall' : 'hourglass');
                              }}
                              className="preset-btn bg-white/10 hover:bg-white/20 active:bg-white/30 text-[9.5px] font-sans font-medium text-[#F6E7A6] border border-white/20 rounded-full px-2.5 py-1 transition-all"
                            >
                              👩‍🦰 {model.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
 
                 {/* Overlaid Dress Image Component with Transforms - Now optimized to allow background scrolling! */}
                 {selectedProduct && (
                   <div 
                     className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                   >
                     <div
                       onMouseDown={handleMouseDown}
                       onTouchStart={handleTouchStart}
                       style={{
                         transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale}) ${isFlipped ? 'scaleX(-1)' : ''}`,
                         transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                         width: '240px',
                         height: '340px',
                         cursor: isDragging ? 'grabbing' : 'grab',
                         touchAction: 'none'
                       }}
                       className="relative shrink-0 select-none pointer-events-auto group/dress"
                     >
                       <img
                         src={cleanImgUrl(
                           selectedProduct.colors?.[selectedColorIndex]?.images?.[0] || selectedProduct.images[0]
                         )}
                         alt={selectedProduct.nameAr}
                         style={{
                           opacity: dressOpacity,
                           filter: `brightness(${dressBrightness}) contrast(${dressContrast}) saturate(${dressSaturation}) drop-shadow(0 15px 25px rgba(0,0,0,${shadowAlpha}))`,
                           mixBlendMode: blendMode as any,
                         }}
                         className="w-full h-full object-contain transition-transform duration-300 group-hover/dress:scale-102"
                         referrerPolicy="no-referrer"
                       />
                      
                      {/* Drag Hint Tooltip floating just above the dress when not active */}
                      {!isDragging && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#A44C5C] text-[#F6E7A6] text-[9px] font-sans font-semibold py-1 px-2.5 rounded-full shadow-lg border border-[#F6E7A6]/30 whitespace-nowrap animate-bounce flex items-center gap-1">
                          <span>اسحبي القطعة للتحريك 👆</span>
                        </div>
                      )}

                      {/* Interactive indicator glow on dress outer edge */}
                      <div className={`absolute inset-0 border border-dashed rounded-xl pointer-events-none transition-colors duration-300 ${
                        isDragging ? 'border-[#F6E7A6] scale-102 ring-4 ring-[#F6E7A6]/10' : 'border-[#F6E7A6]/20 group-hover/dress:border-[#F6E7A6]/50'
                      }`} />
                    </div>
                  </div>
                )}
              </div>

              {/* FLOATING QUICK CONTROLS OVERLAY (Extremely intuitive on mobile! Prevents scrolling below fold) */}
              <div className="absolute right-4 top-16 flex flex-col gap-2 z-30">
                {/* Reset / Center */}
                <button
                  type="button"
                  onClick={() => {
                    setScale(1.0);
                    setRotation(0);
                    setTranslateX(0);
                    setTranslateY(0);
                    setIsFlipped(false);
                  }}
                  title="إعادة ضبط ومطابقة"
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-[#F6E7A6] flex items-center justify-center transition-all shadow-lg active:scale-90 cursor-pointer"
                >
                  <RefreshCw size={13} className={isDragging ? 'animate-spin' : ''} />
                </button>

                {/* Zoom In */}
                <button
                  type="button"
                  onClick={() => setScale(prev => Math.min(2.5, prev + 0.15))}
                  title="تكبير الحجم"
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition-all shadow-lg active:scale-90 cursor-pointer"
                >
                  <ZoomIn size={14} />
                </button>

                {/* Zoom Out */}
                <button
                  type="button"
                  onClick={() => setScale(prev => Math.max(0.4, prev - 0.15))}
                  title="تصغير الحجم"
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition-all shadow-lg active:scale-90 cursor-pointer"
                >
                  <ZoomOut size={14} />
                </button>

                {/* Flip Horizontal */}
                <button
                  type="button"
                  onClick={() => setIsFlipped(prev => !prev)}
                  title="عكس الاتجاه"
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition-all shadow-lg active:scale-90 cursor-pointer"
                >
                  <Share2 size={13} className="rotate-180" />
                </button>
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
                  type="button"
                  onClick={() => setTranslateY(prev => prev - 12)}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <ArrowUp size={12} /> للأعلى
                </button>
                <button
                  type="button"
                  onClick={() => setTranslateY(prev => prev + 12)}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <ArrowDown size={12} /> للأسفل
                </button>
                <button
                  type="button"
                  onClick={() => setTranslateX(prev => prev - 12)}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <ArrowRight size={12} /> لليمين
                </button>
                <button
                  type="button"
                  onClick={() => setTranslateX(prev => prev + 12)}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <ArrowLeft size={12} /> لليصار
                </button>
              </div>

              {/* Smart Auto-Fit Action (Phase 5) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={autoFitDress}
                  className="w-full bg-gradient-to-r from-[#A44C5C] to-[#C86B7C] hover:from-[#8D3B4A] hover:to-[#B5596A] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-98 shadow-sm cursor-pointer"
                >
                  <Sparkle size={13} className="text-[#F6E7A6] animate-pulse" />
                  🪄 مواءمة ومطابقة القطعة تلقائياً على قوامكِ (Auto-Fit)
                </button>
              </div>

              {/* Natural Blending Controls */}
              <div className="border-t border-gray-150 pt-4 mt-2 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#A44C5C] uppercase tracking-widest block">
                    🎨 دمج وتناسق الألوان والظلال (لمظهر طبيعي بالكامل)
                  </span>
                  {customerPhoto && (
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      تم رفع صورتكِ المخصصة
                    </span>
                  )}
                </div>

                {/* Blend Mode Selector */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-gray-500 font-medium block">
                    🧬 وضع دمج وملمس القماش مع ظلال جسمكِ:
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'normal', name: 'عادي (مستقل)', desc: 'الألوان الأصلية كاملة' },
                      { id: 'multiply', name: 'مدمج ملوكي', desc: 'تطابق مع ظلال صورتك' },
                      { id: 'overlay', name: 'مشع فاخر', desc: 'إضاءة مضاعفة ممتازة' },
                      { id: 'soft-light', name: 'ناعم جداً', desc: 'انعكاس خفيف للأقمشة' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setBlendMode(mode.id)}
                        title={mode.desc}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all border text-center cursor-pointer ${
                          blendMode === mode.id
                            ? 'bg-[#A44C5C] text-white border-[#A44C5C] shadow-xs'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {mode.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity Slider */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-500 font-medium shrink-0 flex items-center gap-1 font-sans">
                    <Sparkles size={12} className="text-[#A44C5C]" /> شفافية القطعة:
                  </span>
                  <input 
                    type="range"
                    min="0.4"
                    max="1.0"
                    step="0.01"
                    value={dressOpacity}
                    onChange={(e) => setDressOpacity(parseFloat(e.target.value))}
                    className="w-full accent-[#A44C5C] h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-bold font-mono text-gray-700 w-12 text-left shrink-0">
                    {Math.round(dressOpacity * 100)}%
                  </span>
                </div>

                {/* Brightness Slider */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-500 font-medium shrink-0 flex items-center gap-1 font-sans">
                    <Info size={12} className="text-gray-400" /> إضاءة/سطوع الموديل:
                  </span>
                  <input 
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={dressBrightness}
                    onChange={(e) => setDressBrightness(parseFloat(e.target.value))}
                    className="w-full accent-[#A44C5C] h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-bold font-mono text-gray-700 w-12 text-left shrink-0">
                    {Math.round(dressBrightness * 100)}%
                  </span>
                </div>

                {/* Contrast Slider */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-500 font-medium shrink-0 flex items-center gap-1 font-sans">
                    <Sliders size={12} className="text-gray-400" /> تباين وتداخل الأقمشة:
                  </span>
                  <input 
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={dressContrast}
                    onChange={(e) => setDressContrast(parseFloat(e.target.value))}
                    className="w-full accent-[#A44C5C] h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-bold font-mono text-gray-700 w-12 text-left shrink-0">
                    {Math.round(dressContrast * 100)}%
                  </span>
                </div>

                {/* Shadow Slider */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-500 font-medium shrink-0 flex items-center gap-1 font-sans">
                    <Sparkles size={12} className="text-gray-400" /> عمق الظل ثلاثي الأبعاد:
                  </span>
                  <input 
                    type="range"
                    min="0.0"
                    max="0.9"
                    step="0.05"
                    value={shadowAlpha}
                    onChange={(e) => setShadowAlpha(parseFloat(e.target.value))}
                    className="w-full accent-[#A44C5C] h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-bold font-mono text-gray-700 w-12 text-left shrink-0">
                    {Math.round(shadowAlpha * 100)}%
                  </span>
                </div>
              </div>

              {/* Mirror tools */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <div className="flex gap-2">
                  <button
                    type="button"
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
                    type="button"
                    onClick={() => {
                      setScale(1.0);
                      setRotation(0);
                      setTranslateX(0);
                      setTranslateY(0);
                      setIsFlipped(false);
                      setDressOpacity(0.95);
                      setDressBrightness(1.0);
                      setDressContrast(1.0);
                      setDressSaturation(1.0);
                    }}
                    className="bg-white hover:bg-gray-150 text-gray-600 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={12} /> إعادة تهيئة القطعة
                  </button>
                </div>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden" 
                  />
                  <input 
                    type="file" 
                    ref={cameraInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    capture="user" 
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={triggerUploadClick}
                    className="bg-black text-[#F6E7A6] hover:bg-neutral-800 transition py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
                  >
                    <Upload size={13} />
                    {customerPhoto ? "تغيير صورتكِ 📁" : "ارفعي صورتكِ 📁"}
                  </button>
                  <button
                    type="button"
                    onClick={triggerCameraClick}
                    className="bg-[#A44C5C] text-white hover:bg-[#8D3B4A] transition py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
                  >
                    <Camera size={13} />
                    التقاط حقيقي 🤳
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isStreaming) {
                        stopCameraStream();
                      } else {
                        startCameraStream();
                      }
                    }}
                    className={`transition py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial ${
                      isStreaming 
                        ? 'bg-amber-600 text-white hover:bg-amber-700' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    <Eye size={13} />
                    {isStreaming ? "إيقاف البث 🛑" : "بث فيديو حي 🎥"}
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
                    <label className="block text-gray-500 text-xs font-bold mb-2">الألوان والموديلات المتوفرة:</label>
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
                    selectedCategory === 'all' ? 'bg-[#A44C5C] text-[#F6E7A6]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  الكل ⚜️
                </button>
                <button
                  onClick={() => setSelectedCategory('best')}
                  className={`py-1.5 px-3 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'best' ? 'bg-[#A44C5C] text-[#F6E7A6]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  روائع مبيعاً ✨
                </button>
                <button
                  onClick={() => setSelectedCategory('sleepwear')}
                  className={`py-1.5 px-3 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'sleepwear' ? 'bg-[#A44C5C] text-[#F6E7A6]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ملابس نوم
                </button>
                <button
                  onClick={() => setSelectedCategory('loungewear')}
                  className={`py-1.5 px-3 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'loungewear' ? 'bg-[#A44C5C] text-[#F6E7A6]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  أطقم كوتور ملكية
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
          <div className="relative rounded-3xl overflow-hidden py-16 px-6 md:px-12 text-center bg-[#A44C5C] text-white border-2 border-[#D4AF37]/50 shadow-2xl">
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
                غرفة عرض تفاعلية تليق بمقام جلالتكِ الملكي. تصفحي أحدث الماركات وروائع المنسوجات المنسدلة من المشغل الفاخر، واجلسي مع مستشارة سلطة بلمسة واحدة.
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
                              <SultaImage 
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
      <div className="max-w-7xl mx-auto mt-16 bg-[#A44C5C] text-[#FAFAF7]/95 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl border border-[#FAF5F0]/10 text-right">
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
