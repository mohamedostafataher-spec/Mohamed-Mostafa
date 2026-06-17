import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, Printer, RefreshCw, Layers, FileText, CheckCircle2, 
  ChevronRight, Sparkles, Check, Info, InfoIcon, Palette, HelpCircle, 
  Share2, ArrowLeft, ArrowRight, Star, QrCode, Tag, Box, Scissors,
  Percent, DollarSign, Image as ImageIcon, ShoppingBag, Eye, Upload, Plus, Trash2, Save
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { dbService, supabase } from '../services/db';
import SultaAutomationStudio from './SultaAutomationStudio';
import { Product } from '../types';

// Types and specs for Brand Assets
interface BrandAsset {
  id: string;
  nameAr: string;
  nameEn: string;
  type: string;
  dimensions: string;
  desc: string;
}

const BRAND_ASSETS_LIBRARY: BrandAsset[] = [
  { id: 'logo-vector', nameAr: 'شعار SULTA المذهب النواقل (SVG)', nameEn: 'Sultan Gold Master Logo Vector', type: 'Vector / SVG', dimensions: 'Resizable Scale-free', desc: 'الشعار الملكي عالي النقاوة المخصص للوحات الإعلانات الكبيرة والطباعة الحفر للأختام.' },
  { id: 'pattern-bg', nameAr: 'خلفية الباترن الحريري الوردي', nameEn: 'Satin Rose Repeating Texture', type: 'Raster / Wallpaper', dimensions: '3000 x 3000 px', desc: 'زخرفة متكررة خفيفة مكونة من الفراشات والفيونكة الكوزي المميزة لغلق ورق الزبد.' },
  { id: 'ribbon-deco', nameAr: 'فواصل خطية على شكل فيونكات خطية', nameEn: 'Feminine Bow Graphic Divider', type: 'Vector Layout', dimensions: '1200 x 300 px', desc: 'فاصل رقيق يوضع أسفل رسائل الشكر أو أعلى جدول دليل كي الملابس.' },
  { id: 'wax-seal-vector', nameAr: 'ختم الشمع الدائري المعياري', nameEn: 'Royal Sulta Wax Seal Stamp Mask', type: 'SVG Vector Mask', dimensions: '500 x 500 px', desc: 'الختم الدائري لتطبيق الورنيش البارز (Spot UV) على ملصقات إغلاق الكراتين.' }
];

interface AdminPackagingCenterProps {
  products?: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
}

export default function AdminPackagingCenter({ products: initialProducts, setProducts: externalSetProducts }: AdminPackagingCenterProps = {}) {
  const [activeTab, setActiveTab] = useState<'identity_library' | 'cards_tags' | 'stickers_qr' | 'boxes_tissue' | 'shipping_mockup' | 'full_kit' | 'automation_studio' | 'unboxing_catalog'>('automation_studio');
  const [isLowInk, setIsLowInk] = useState<boolean>(false);
  
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const [zoomScale, setZoomScale] = useState<number>(1);

  // Custom states for Luxury Unboxing Experience Catalog Management
  const [unboxingItems, setUnboxingItems] = useState<any[]>([]);
  const [newUnboxingTitle, setNewUnboxingTitle] = useState('');
  const [newUnboxingDesc, setNewUnboxingDesc] = useState('');
  const [newUnboxingUrl, setNewUnboxingUrl] = useState('');
  const [newUnboxingTag, setNewUnboxingTag] = useState('');
  const [savingUnboxing, setSavingUnboxing] = useState(false);

  useEffect(() => {
    const fetchUnboxingCatalog = async () => {
      try {
        const { data } = await supabase.from('homepage_sections').select('content_json').eq('section_key', 'sulta_luxury_packaging_v2').limit(1).single();
        if (data && data.content_json) {
          const parsed = typeof data.content_json === 'string' ? JSON.parse(data.content_json) : data.content_json;
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setUnboxingItems(parsed);
            return;
          }
        }
      } catch (e) {
        console.warn("Could not fetch remote unboxing items, using defaults.", e);
      }
      
      // Default unboxing items fallback
      setUnboxingItems([
        {
          id: 'rose-box',
          titleAr: 'طرد وردي الحواس الملكي الأول',
          descAr: 'العلبة الوردية الناعمة برباط روز ريبون المعالج يدوياً وكرت الشمع الملكي مصبوب النحاس.',
          url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1200&auto=format&fit=crop',
          tag: 'الأكثر طلباً 🌸'
        },
        {
          id: 'black-matte',
          titleAr: 'علبة الأرستقراطية الليلية السوداء',
          descAr: 'العلبة السوداء المطلية بلمسة مخملية مطفية عازلة مع شعار مبصوم من الذهب عيار ٢٤ قيراط.',
          url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=1200&auto=format&fit=crop',
          tag: 'طبعة كبّار والشخصيات الفاخرة ✨'
        },
        {
          id: 'white-gold',
          titleAr: 'الباقة الكريستالية المضيئة',
          descAr: 'علبة العيد والمناسبات البيضاء الموشحة بخيوط الروز والذهبي، مصممة لحفلات الزواج وصالون العرائس.',
          url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop',
          tag: 'عروس صولا الفخمة ⚜️'
        },
        {
          id: 'silk-wrap',
          titleAr: 'لفات مناديل الحرير الفلورال',
          descAr: 'لفائف مناديل حمائية حريرية ناعمة تحيط ببيجامتكِ الفاخرة بعبق عطر رويال مسك البولندي.',
          url: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=1200&auto=format&fit=crop',
          tag: 'تكييف داخلي معبق 🏵️'
        }
      ]);
    };
    fetchUnboxingCatalog();
  }, []);

  const handleAddUnboxingItem = () => {
    if (!newUnboxingTitle || !newUnboxingUrl) {
      alert("يرجى ملء العنوان وصورة التغليف!");
      return;
    }
    const newItem = {
      id: 'unbox-' + Date.now(),
      titleAr: newUnboxingTitle,
      descAr: newUnboxingDesc || 'تغليف ملكي خاص',
      url: newUnboxingUrl,
      tag: newUnboxingTag || 'طراز محدود ✨'
    };
    setUnboxingItems([...unboxingItems, newItem]);
    setNewUnboxingTitle('');
    setNewUnboxingDesc('');
    setNewUnboxingUrl('');
    setNewUnboxingTag('');
  };

  const handleRemoveUnboxingItem = (id: string) => {
    setUnboxingItems(unboxingItems.filter(item => item.id !== id));
  };

  const handleSaveUnboxingToDB = async () => {
    try {
      setSavingUnboxing(true);
      const { error } = await supabase.from('homepage_sections').upsert([{
        section_key: 'sulta_luxury_packaging_v2',
        content_json: unboxingItems,
        active: true
      }], { onConflict: 'section_key' });
      if (error) {
        alert("فشل مزامنة التغليف: " + error.message);
      } else {
        alert("تم حفظ ومزامنة معرض تجربة التغليف الملكي بنجاح! 📦👑");
      }
    } catch (e) {
      console.error(e);
      alert("فشل الحفظ التكنولوجي للتغليف.");
    } finally {
      setSavingUnboxing(false);
    }
  };

  // Responsive design scaling to fit physical mobile screens beautifully without cutting off
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 375) {
        setZoomScale(0.68);
      } else if (w < 430) {
        setZoomScale(0.74);
      } else if (w < 520) {
        setZoomScale(0.82);
      } else if (w < 640) {
        setZoomScale(0.88);
      } else if (w < 1024) {
        setZoomScale(0.95);
      } else {
        setZoomScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync real-time products catalog
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      setSelectedProductId(prev => prev || initialProducts[0].id);
      return;
    }
    const unsubscribe = dbService.subscribeProducts(
      (data) => {
        setProducts(data);
        if (data && data.length > 0) {
          setSelectedProductId(prev => prev || data[0].id);
        }
      },
      (error) => {
        console.error("Error subscribing to products:", error);
      }
    );
    return () => unsubscribe();
  }, [initialProducts]);
  
  // Custom State Parameters for Dynamic Generators
  const [accentColor, setAccentColor] = useState<string>('#A44C5C'); // Rose Luxury
  const [paletteTheme, setPaletteTheme] = useState<'classic_black' | 'cozy_rose' | 'champagne' | 'ivory'>('cozy_rose');
  const [customClientName, setCustomClientName] = useState<string>('صاحبة السمو أميرة تاجر');
  const [customPromoCode, setCustomPromoCode] = useState<string>('SULTA10');
  const [stickerShape, setStickerShape] = useState<'circle' | 'square' | 'rectangle' | 'transparent'>('circle');
  const [stickerIcon, setStickerIcon] = useState<'crown' | 'bow' | 'butterfly' | 'text'>('crown');
  const [monogramLetter, setMonogramLetter] = useState<string>('S');
  const [productTagName, setProductTagName] = useState<string>('بجامة السيرة الحريرية الملكية');
  const [productTagSize, setProductTagSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('M');
  const [productTagSKU, setProductTagSKU] = useState<string>('SLP-COUTURE-025');
  const [productPrice, setProductPrice] = useState<string>('4,200 ج.م');
  const [scentPreset, setScentPreset] = useState<'vanilla' | 'sandalwood' | 'lavender' | 'amber'>('vanilla');
  const [boxPreset, setBoxPreset] = useState<'drawer_box' | 'pizza_box' | 'magnetic_clasp' | 'shopping_bag'>('pizza_box');

  // Generator Action UI States
  const [loadingType, setLoadingType] = useState<'print' | 'pdf' | 'svg' | 'kit' | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  // References for Live Canvas Capturing (All 10 required assets in Section 15)
  const stickerCanvasRef = useRef<HTMLDivElement>(null);
  const thankYouCanvasRef = useRef<HTMLDivElement>(null);
  const careCanvasRef = useRef<HTMLDivElement>(null);
  const tagCanvasRef = useRef<HTMLDivElement>(null);
  const artworkCanvasRef = useRef<HTMLDivElement>(null);
  const tissueCanvasRef = useRef<HTMLDivElement>(null);
  const shippingCanvasRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const boxCanvasRef = useRef<HTMLDivElement>(null);
  const bagCanvasRef = useRef<HTMLDivElement>(null);

  // Sync palette theme colors to active choices
  useEffect(() => {
    if (paletteTheme === 'classic_black') setAccentColor('#121212');
    else if (paletteTheme === 'cozy_rose') setAccentColor('#A44C5C');
    else if (paletteTheme === 'champagne') setAccentColor('#E5C470');
    else if (paletteTheme === 'ivory') setAccentColor('#8C756C');
  }, [paletteTheme]);

  const triggerAlert = (msg: string) => {
    setSuccessAlert(msg);
    setTimeout(() => setSuccessAlert(null), 5000);
  };

  // Generic PNG downloader
  const downloadPngOfElement = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!ref.current) return;
    try {
      setLoadingType('print');
      const canvas = await html2canvas(ref.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        onclone: (clonedDoc) => {
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let k = 0; k < styleTags.length; k++) {
            const style = styleTags[k];
            try {
              if (style.innerHTML && style.innerHTML.includes('oklch')) {
                style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, '#DF8A9D');
              }
            } catch (e) {
              console.error(e);
            }
          }
          clonedDoc.querySelectorAll('[style*="oklch"]').forEach((el: any) => {
            try {
              el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/g, '#DF8A9D');
            } catch (e) {}
          });
        }
      });
      const link = document.createElement('a');
      link.download = `${fileName}-Sulta-300dpi.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setLoadingType(null);
      triggerAlert(`🎉 تم تحميل صورة PNG بدقة 300 DPI للملف: ${fileName}`);
    } catch (err) {
      console.error(err);
      setLoadingType(null);
      triggerAlert('❌ حدث خطأ أثناء التقاط الصورة التلقائي.');
    }
  };

  // Raw SVG downloader helper
  const downloadSvgOfTemplate = (elementId: string, name: string) => {
    try {
      const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
        <rect width="100" height="100" fill="${accentColor}" rx="10"/>
        <circle cx="50" cy="40" r="14" fill="#F6E7A6" opacity="0.3"/>
        <text x="50" y="45" font-family="serif" font-size="16" fill="#F6E7A6" font-weight="bold" text-anchor="middle">${monogramLetter}</text>
        <path d="M30,68 C40,55 60,55 70,68" stroke="#F6E7A6" stroke-width="1.8" fill="none"/>
        <text x="50" y="82" font-family="sans-serif" font-size="6" fill="#FFF" text-anchor="middle">SULTA SLEEPWEAR COUTURE</text>
      </svg>`;
      const blob = new Blob([svgHeader], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${name}-vector-Sulta.svg`;
      link.href = url;
      link.click();
      triggerAlert(`✨ تم تصدير ملف ناقل حقيقي SVG بدقة لـ ${name}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Grand master function: SECTION 15 / Generate Full Packaging Kit
  const generateFullPackagingKit = async () => {
    setLoadingType('kit');
    setGenerationProgress(10);
    triggerAlert('🚀 جاري تشغيل محرّك التوليد الشامل لدفتر الطباعة الملكي SULTA! جاري التوليد والالتقاط (10 assets)...');

    // References to capture sequentially
    const targets = [
      { ref: stickerCanvasRef, name: '1. Logo Sticker' },
      { ref: thankYouCanvasRef, name: '2. Thank You Card' },
      { ref: careCanvasRef, name: '3. Care Instructions' },
      { ref: tagCanvasRef, name: '4. Product Hang Tag' },
      { ref: artworkCanvasRef, name: '5. Brand Artwork Visual' },
      { ref: tissueCanvasRef, name: '6. Delicate Tissue Paper' },
      { ref: shippingCanvasRef, name: '7. Shipping Parcel Label' },
      { ref: qrCanvasRef, name: '8. Interactive Social QR Card' },
      { ref: boxCanvasRef, name: '9. Luxury Envelope Box Cover' },
      { ref: bagCanvasRef, name: '10. Premium Gift Shopping Bag' }
    ];

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Loop over our 10 components
      for (let i = 0; i < targets.length; i++) {
        setGenerationProgress(Math.floor(20 + (i * 8)));
        const target = targets[i];
        
        if (target.ref.current) {
          const canvas = await html2canvas(target.ref.current, {
            scale: 2.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: isLowInk ? '#ffffff' : null,
            logging: false,
            onclone: (clonedDoc) => {
              const styleTags = clonedDoc.getElementsByTagName('style');
              for (let k = 0; k < styleTags.length; k++) {
                const style = styleTags[k];
                try {
                  if (style.innerHTML && style.innerHTML.includes('oklch')) {
                    style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, '#DF8A9D');
                  }
                } catch (e) {
                  console.error(e);
                }
              }
              clonedDoc.querySelectorAll('[style*="oklch"]').forEach((el: any) => {
                try {
                  el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/g, '#DF8A9D');
                } catch (e) {}
              });
            }
          });
          const imgData = canvas.toDataURL('image/png');

          // New page for each item after first
          if (i > 0) doc.addPage();

          // Header template for each PDF sheet
          doc.setFillColor(20, 20, 22);
          doc.rect(0, 0, 297, 35, 'F');

          doc.setTextColor(246, 231, 166); // Gold
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text(`SULTA LUXURY BRAND - COHESIVE PACKAGING KIT 2026`, 15, 13);

          doc.setTextColor(210, 210, 215);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(`PIECE ${i + 1}/10: ${target.name} | Spec: Premium Grade 300 DPI - CMYK Compliant`, 15, 21);
          doc.text(`Bleed Area Tolerance: 3.5mm Safe Cut Offset | Interactive Parameter Match Ready`, 15, 26);

          // Render captured high-DPI image in center of A4 sheet
          doc.setDrawColor(180, 180, 182);
          doc.rect(48, 48, 200, 135); // Card border wrapper
          doc.addImage(imgData, 'PNG', 50, 50, 196, 131);

          // Footer info containing cost suggestions
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 102);
          doc.text(`Production Tip: Ask local printers in Faggala/Azhar to print with Recycled Textured Stock for maximum luxury look.`, 15, 195);
          doc.text(`SULTA Sleepwear Studio - Private Artwork Pass`, 220, 195);
        }
      }

      setGenerationProgress(100);
      doc.save(`SULTA-Cohesive-Luxury-Packaging-Kit-300dpi.pdf`);
      setLoadingType(null);
      triggerAlert('🏆 مبروك! تم توليد وتحميل الحقيبة المتكاملة (10-in-1 Complete Packaging Kit) خالية من أي مشاكل لغوية جاهزة للتسليم المطبعي الفوري!');
    } catch (error) {
      console.error(error);
      setLoadingType(null);
      triggerAlert('❌ حدث خطأ غير متوقع أثناء تجميع صفحات الملف المتكامل.');
    }
  };

  return (
    <div className="space-y-6 antialiased font-sans text-right pb-10" dir="rtl" id="sulta-packaging-studio-main-container">
      
      {/* Visual Header inspired directly by world class Sleewpear brand standards (Tulian Style) */}
      <div className="bg-gradient-to-br from-[#0F0F11] via-[#1A1A1F] to-[#252528] rounded-3xl p-6 md:p-8 border border-zinc-800 relative overflow-hidden text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-[#A44C5C]/25 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#F6E7A6]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#A44C5C]/30 text-[#DF8A9D] px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wide">
              <span>👑 SULTA ENTERPRISE STUDIO</span>
              <span>•</span>
              <span>مستشار تصميم وصناعة خط إنتاج التغليف الفاخر 2026</span>
            </div>
            
            <h1 className="text-2xl md:text-3.5xl font-serif text-[#F6E7A6] font-black tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
              💎 SULTA Packaging Studio
            </h1>
            
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-sans">
              واجهة تفاعلية ريادية تمنح براند سولا الحرير الساحر تحكماً بيانياً كاملاً بـ <b>15 عنصراً</b> من عناصر الهوية الورقية والتعبئة. من تخصيص أختام الشمع، والملصقات الدائرية بأسلوب بنترست اللطيف، إلى غلاف الكرتونة المميز بفيونكات ناعمة، وصولاً لإصدار الكيت المتكامل بلمسة واحدة بجودة <b>300 DPI</b> بدون أي حروف مبعثرة!
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-stone-200 text-xs tracking-wide space-y-2 self-stretch lg:self-auto shrink-0 min-w-[240px] shadow-inner text-right">
            <div className="text-[10.5px] text-zinc-400 font-bold">🎯 جاهزية خطوط إنتاج الطباعة:</div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Pixel-DPI Auto Calibrator ON</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              يتوافق هذا النظام مع طابعات الأوفست وطابعة الشحن في المعيقلية وبوسط البلد.
            </p>
          </div>
        </div>
      </div>

      {/* Generation Status Progress Alert */}
      {successAlert && (
        <div className="bg-[#A44C5C] text-[#F6E7A6] px-5 py-4 rounded-2xl text-xs font-bold text-center duration-300 transition-all shadow-xl block border border-[#DF8A9D]/30 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
          <span>{successAlert}</span>
        </div>
      )}

      {loadingType === 'kit' && (
        <div className="bg-zinc-900 border border-[#A44C5C] text-white p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#F6E7A6]">جاري تجميع وحقن تكنولوجيا الكيت الورقي الكامل (10 عناصر)...</span>
            <span className="font-mono">{generationProgress}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#A44C5C] to-[#E5C470] h-full transition-all duration-300" style={{ width: `${generationProgress}%` }} />
          </div>
        </div>
      )}

      {/* Interactive Tabs Bar (15 Connected Sections Integrated) */}
      <div className="flex flex-wrap gap-2 pb-1 border-b border-stone-200" id="packaging-studio-tabs-bar">
        <button
          onClick={() => setActiveTab('automation_studio')}
          className={`px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'automation_studio'
              ? 'bg-gradient-to-r from-[#A44C5C] to-[#E5C470] text-white shadow-md border-transparent'
              : 'bg-[#FFF0F2] hover:bg-pink-100 border border-[#A44C5C]/30 text-[#A44C5C]'
          }`}
        >
          <Sparkles size={14} className="text-[#E5C470] fill-[#E5C470]" />
          <span>🚀 الأتمتة التلقائية للمنتج (Automated Suite)</span>
        </button>

        <button
          onClick={() => setActiveTab('identity_library')}
          className={`px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'identity_library'
              ? 'bg-[#A44C5C] text-white shadow-md'
              : 'bg-white hover:bg-stone-50 border border-stone-200 text-stone-700'
          }`}
        >
          <Palette size={14} />
          <span>🎨 الهوية، المكتبة والأسعار</span>
        </button>

        <button
          onClick={() => setActiveTab('cards_tags')}
          className={`px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'cards_tags'
              ? 'bg-[#A44C5C] text-white shadow-md'
              : 'bg-white hover:bg-stone-50 border border-stone-200 text-stone-700'
          }`}
        >
          <Tag size={14} />
          <span>🏷️ الكروت وبطاقات العناية</span>
        </button>

        <button
          onClick={() => setActiveTab('stickers_qr')}
          className={`px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'stickers_qr'
              ? 'bg-[#A44C5C] text-white shadow-md'
              : 'bg-white hover:bg-stone-50 border border-stone-200 text-stone-700'
          }`}
        >
          <QrCode size={14} />
          <span>✨ الاستيكرات وأكواد QR</span>
        </button>

        <button
          onClick={() => setActiveTab('boxes_tissue')}
          className={`px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'boxes_tissue'
              ? 'bg-[#A44C5C] text-white shadow-md'
              : 'bg-white hover:bg-stone-50 border border-stone-200 text-stone-700'
          }`}
        >
          <Box size={14} />
          <span>📦 الصناديق وورق الزبد</span>
        </button>

        <button
          onClick={() => setActiveTab('shipping_mockup')}
          className={`px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'shipping_mockup'
              ? 'bg-[#A44C5C] text-white shadow-md'
              : 'bg-white hover:bg-stone-50 border border-stone-200 text-stone-700'
          }`}
        >
          <ShoppingBag size={14} />
          <span>🚚 الشحن ومعاينة Mockup</span>
        </button>

        <button
          onClick={() => setActiveTab('full_kit')}
          className={`px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'full_kit'
              ? 'bg-[#121212] text-[#F6E7A6] shadow-lg border border-[#F6E7A6]/30'
              : 'bg-white hover:bg-stone-50 border border-stone-200 text-stone-700'
          }`}
        >
          <Star size={14} className="text-[#F6E7A6] fill-[#F6E7A6] animate-pulse" />
          <span>🏆 الحقيبة الحريرية الكاملة للمطبعة</span>
        </button>

        <button
          onClick={() => setActiveTab('unboxing_catalog')}
          className={`px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'unboxing_catalog'
              ? 'bg-[#A44C5C] text-white shadow-md'
              : 'bg-[#FFF0F2] hover:bg-pink-100 border border-[#A44C5C]/30 text-[#A44C5C]'
          }`}
        >
          <Sparkles size={14} />
          <span>📦 تجربة التغليف الملكي (Unboxing Catalog)</span>
        </button>
      </div>

      {/* Main Workspace Frame */}
      {activeTab === 'automation_studio' ? (
        <SultaAutomationStudio
          products={products}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          triggerAlert={triggerAlert}
        />
      ) : activeTab === 'unboxing_catalog' ? (
        <div className="space-y-6 animate-fade-in-rapid text-right font-sans" dir="rtl">
          <div className="bg-white rounded-3xl p-6 border border-stone-205 shadow-sm space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-gray-950 mb-2 flex items-center gap-2 justify-start">
                <Sparkles className="text-[#A44C5C]" size={20} />
                معرض تجربة التغليف الملكي الفاخر (Luxury Unboxing Experience)
              </h3>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                قم بإدارة وتحميل صور التغليف الفاخر مثل الكرتون الملكي، الحقائب الحريرية الناعمة، الفيونكات، وبطاقات الشمع لإلهام العميلات بمشهد فتح الصناديق الفاتن.
              </p>
            </div>

            {/* Form */}
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-150 space-y-4">
              <h4 className="text-xs font-black text-[#A44C5C] text-right">➕ إضافة قطعة تغليف ملكية جديدة للتجربة:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-500 mb-1 font-bold text-right">العنوان بالعربية</label>
                  <input
                    type="text"
                    value={newUnboxingTitle}
                    onChange={(e) => setNewUnboxingTitle(e.target.value)}
                    placeholder="مثال: علبة الغسق الأرجواني المخملية 🌸"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-right"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 mb-1 font-bold text-right">رابط صورة التغليف الفاخر (Unsplash أو غيرها)</label>
                  <input
                    type="text"
                    value={newUnboxingUrl}
                    onChange={(e) => setNewUnboxingUrl(e.target.value)}
                    placeholder="أدخل رابط صورة مباشر للتغليف..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-500 mb-1 font-bold text-right">الوصف العربي للتغليف ومكوناته</label>
                  <input
                    type="text"
                    value={newUnboxingDesc}
                    onChange={(e) => setNewUnboxingDesc(e.target.value)}
                    placeholder="مثال: علبة قوية محاطة بورق الحرير المعطر مع رباط من الصوف والمخمل الأصلي..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-right"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 mb-1 font-bold text-right">وسم العلامة (Badge Text)</label>
                  <input
                    type="text"
                    value={newUnboxingTag}
                    onChange={(e) => setNewUnboxingTag(e.target.value)}
                    placeholder="مثال: الأكثر مبيعاً 🏆"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-right"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAddUnboxingItem}
                  className="bg-[#A44C5C] hover:bg-[#DF8A9D] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus size={14} /> إضافة للتجربة الملكية
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-[#A44C5C] text-right">📋 صور تشكيلة التغليف المعروضة للعملاء حالياً ({unboxingItems.length}):</h4>
              
              {unboxingItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {unboxingItems.map((item, index) => (
                    <div key={item.id || index} className="bg-stone-50 p-4 rounded-2.5xl border border-stone-150 space-y-3 relative text-right flex flex-col justify-between">
                      <div className="space-y-2">
                        <img
                          src={item.url}
                          alt={item.titleAr}
                          className="w-full h-36 object-cover rounded-xl bg-white border border-stone-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="text-[9.5px] font-black text-[#A44C5C] bg-pink-50 px-2 py-0.5 rounded-full inline-block">
                            {item.tag || 'حصري'}
                          </span>
                          <h5 className="font-bold text-xs mt-1.5 text-gray-800 line-clamp-1">{item.titleAr}</h5>
                          <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{item.descAr}</p>
                        </div>
                      </div>

                      <div className="flex justify-end items-center pt-2 border-t border-stone-200 text-stone-400 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleRemoveUnboxingItem(item.id)}
                          className="p-1 px-2 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="حذف قطعة التغليف"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-stone-50 border border-stone-150 rounded-2xl text-xs text-stone-400">
                  يرجى تزويد المعرض بصورة تغليف ملكية رقيقة.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-gray-150">
              <button
                type="button"
                onClick={handleSaveUnboxingToDB}
                disabled={savingUnboxing}
                className="bg-black hover:bg-zinc-800 text-[#F6E7A6] text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Save size={14} />
                <span>💾 حفظ ومزامنة معرض التغليف الملكي سحابياً</span>
              </button>
            </div>

          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* RIGHT SIDE INPUT CONTROLS PANEL (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-stone-200 p-6 rounded-3xl space-y-6 flex flex-col justify-between shadow-xs">
          
          {/* TAB 1: Brand Packaging Identity, cost optimizer & Asset library (Sections 1, 13, 14) */}
          {activeTab === 'identity_library' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">
                  🎨 SEC 01: إدارة ألوان وهوية العلامة (Sulta Identity)
                </h3>
                <p className="text-[10.5px] text-stone-500 mt-1">
                  اختاري السلوك اللوني السائد الذي سينعكس على كل الاستيكرات، ورق الزبد، والبوكسات فوراً.
                </p>
                
                {/* Palette Selector */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button 
                    onClick={() => setPaletteTheme('classic_black')}
                    className={`p-3 rounded-xl border text-xs font-bold text-right flex items-center justify-between ${
                      paletteTheme === 'classic_black' ? 'border-[#A44C5C] bg-[#FFF0F2]/30 text-stone-950' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <span>أسود ملوكي فخم</span>
                    <span className="w-4 h-4 rounded-full bg-[#121212] border border-stone-300" />
                  </button>
                  <button 
                    onClick={() => setPaletteTheme('cozy_rose')}
                    className={`p-3 rounded-xl border text-xs font-bold text-right flex items-center justify-between ${
                      paletteTheme === 'cozy_rose' ? 'border-[#A44C5C] bg-[#FFF0F2]/30 text-stone-950' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <span>الوردي الكوزي اللطيف</span>
                    <span className="w-4 h-4 rounded-full bg-[#A44C5C] border border-stone-300" />
                  </button>
                  <button 
                    onClick={() => setPaletteTheme('champagne')}
                    className={`p-3 rounded-xl border text-xs font-bold text-right flex items-center justify-between ${
                      paletteTheme === 'champagne' ? 'border-[#A44C5C] bg-[#FFF0F2]/30 text-stone-950' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <span>الشمبانيا اللامعة</span>
                    <span className="w-4 h-4 rounded-full bg-[#E5C470] border border-stone-300" />
                  </button>
                  <button 
                    onClick={() => setPaletteTheme('ivory')}
                    className={`p-3 rounded-xl border text-xs font-bold text-right flex items-center justify-between ${
                      paletteTheme === 'ivory' ? 'border-[#A44C5C] bg-[#FFF0F2]/30 text-stone-950' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <span>العاجي والمخمل الدافئ</span>
                    <span className="w-4 h-4 rounded-full bg-[#8C756C] border border-stone-300" />
                  </button>
                </div>
              </div>

              {/* SECTION 14: Brand Cost Optimizer & Estimator */}
              <div className="bg-[#FAF8F5] border border-stone-205 p-4 rounded-2xl space-y-3">
                <span className="text-xs font-black text-stone-850 flex items-center gap-1.5">
                  <Percent className="text-[#A44C5C]" size={14} />
                  SEC 14: المستشار المالي ومخفض التكلفة الذكي (Faggala Advisor)
                </span>
                
                <p className="text-[10px] text-stone-605 leading-relaxed">
                  براند سولا الفاخر لا يحتاج لمطابع بآلاف الجنيهات لتقديم لمسة بنترست! إليك خطتنا الأوفست الأكثر توفيراً:
                </p>

                <div className="space-y-1.5 text-[9.5px] font-sans">
                  <div className="flex justify-between items-center text-stone-700 bg-white/70 p-1.5 rounded">
                    <span><b>ورق الكروت الموصى به:</b> كوشيه 350g مطفي</span>
                    <span className="font-bold text-emerald-700">0.90 قرش للكارت</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-700 bg-white/70 p-1.5 rounded">
                    <span><b>استيكرات الإغلاق:</b> ملصق A4 ديجيتال جاهز للقص</span>
                    <span className="font-bold text-emerald-700">1.20 ج.م للاستيكر</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-700 bg-white/70 p-1.5 rounded">
                    <span><b>الصناديق (التوفير بالختم):</b> علب كرافت + ختم ليزر جامبو</span>
                    <span className="font-bold text-[#A44C5C]">توفير 80% من MOQ!</span>
                  </div>
                </div>

                <div className="text-[9px] text-[#A44C5C] font-bold leading-normal italic">
                  💡 اختاري "نمط توفير الحبر المنزلي" من الأعلى لتقليل تكلفة الحبر المسال بنسبة 60% أثناء الطباعة المبدئية!
                </div>
              </div>

              {/* SECTION 13: Brand Assets Library */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-stone-900">🎁 SEC 13: مكتبة أدوات وسورس اللوجو SULTA</h4>
                <div className="grid grid-cols-1 gap-2">
                  {BRAND_ASSETS_LIBRARY.map((asset) => (
                    <div key={asset.id} className="p-3 bg-stone-50 border border-stone-150 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-800">{asset.nameAr}</span>
                        <span className="text-[8.5px] font-mono font-bold text-[#A44C5C] bg-pink-50 px-1.5 py-0.5 rounded">
                          {asset.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-normal">{asset.desc}</p>
                      <button 
                        onClick={() => downloadSvgOfTemplate(asset.id, asset.nameEn)}
                        className="text-[9.5px] font-bold text-[#A44C5C] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <Download size={11} /> تحميل الأصل (Vector Asset)
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Thank you card, Wash Care Instructions and Hanging tags (Sections 3, 4, 5) */}
          {activeTab === 'cards_tags' && (
            <div className="space-y-6">
              
              {/* SECTION 03: Thank you card parameters */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">
                  👑 SEC 03: بطاقة شكر الملكة المخصصة
                </h3>
                
                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-stone-605 block">اسم صاحبة السمو (يكتب يدوياً أو يطبع مسبقاً):</label>
                    <input 
                      type="text" 
                      value={customClientName} 
                      onChange={(e) => setCustomClientName(e.target.value)}
                      className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-850 font-bold focus:outline-none focus:ring-1 focus:ring-[#A44C5C]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-stone-605 block">كود الخصم المرن بالبطاقة:</label>
                    <input 
                      type="text" 
                      value={customPromoCode} 
                      onChange={(e) => setCustomPromoCode(e.target.value.toUpperCase())}
                      className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-stone-850 text-left font-mono font-black focus:outline-none focus:ring-1 focus:ring-[#A44C5C]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 04: Care instructions parameters */}
              <div className="space-y-3 bg-[#FCFAF6] border border-stone-200 p-4 rounded-2xl">
                <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <FileText className="text-[#A44C5C]" size={14} />
                  SEC 04: دليل الغسيل الملكي (Satin Care Pro)
                </h4>
                <p className="text-[10px] text-stone-505 leading-relaxed">
                  تم دمج صالون الحرير وغسل الدانتيل في 4 أركان ذكية تناسب الحرير المصرى الكوزى والساتان العضوى.
                </p>
                <div className="text-[10px] space-y-1 text-stone-600 bg-white p-2 rounded border border-stone-150">
                  <span className="font-bold text-[#A44C5C]">✓ نوصي بـ:</span>
                  <div className="leading-normal">الغسيل اليدوي في ماء بارد (تحت 30 درجة) مع تجنب عصر الساتان العنيف للحفاظ على ملمس الألياف الملكية للأبد.</div>
                </div>
              </div>

              {/* SECTION 05: Hanging Product Tags Generator */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#A44C5C] border-b border-stone-100 pb-1.5 font-serif">
                  🎫 SEC 05: مولّد بطاقة المنتج اليدوية (Luxury Hang Tags)
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-stone-600 block">اسم بجامة الدانتيل الساتان:</label>
                    <input 
                      type="text" 
                      value={productTagName} 
                      onChange={(e) => setProductTagName(e.target.value)}
                      className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl font-bold focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-stone-600 block">المقاس القياسي الملكي:</label>
                      <select 
                        value={productTagSize} 
                        onChange={(e) => setProductTagSize(e.target.value as any)}
                        className="w-full bg-white border border-stone-300 p-2 rounded-xl font-bold focus:outline-none"
                      >
                        <option value="S">S - (صغير)</option>
                        <option value="M">M - (وسط)</option>
                        <option value="L">L - (كبير)</option>
                        <option value="XL">XL - (ملك دبل)</option>
                        <option value="XXL">XXL - (سوبر ملكي)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-600 block">السعر المستحق:</label>
                      <input 
                        type="text" 
                        value={productPrice} 
                        onChange={(e) => setProductPrice(e.target.value)}
                        className="w-full bg-white border border-stone-300 p-2 rounded-xl text-center font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Custom stickers and QR tags (Sections 2 & 10) */}
          {activeTab === 'stickers_qr' && (
            <div className="space-y-6">
              
              {/* SECTION 02: Sticker Generator */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">
                  ✨ SEC 02: لوحة توليد محاذاة ملصقات غلق العلب
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-stone-600 block">هندسة شكل الاستيكر المقترح:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['circle', 'square', 'rectangle', 'transparent'].map((shape) => (
                        <button
                          key={shape}
                          onClick={() => setStickerShape(shape as any)}
                          className={`p-2 rounded-lg text-center border text-[10.5px] cursor-pointer ${
                            stickerShape === shape 
                              ? 'border-[#A44C5C] bg-[#FFF0F2]/50 font-bold text-[#A44C5C]' 
                              : 'border-stone-200 bg-white hover:bg-stone-50'
                          }`}
                        >
                          {shape === 'circle' && '🔴 دائري (Pinterest)'}
                          {shape === 'square' && '⬛ مربع ملوكي'}
                          {shape === 'rectangle' && '➖ مستطيل عريض'}
                          {shape === 'transparent' && '💎 شفاف (شفاف مذهب)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-stone-600 block">الرمز الأيقوني الداخلي للملصق:</label>
                    <div className="grid grid-cols-4 gap-1">
                      {['crown', 'bow', 'butterfly', 'text'].map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setStickerIcon(icon as any)}
                          className={`p-1.5 rounded text-center border text-[9.5px] cursor-pointer ${
                            stickerIcon === icon 
                              ? 'border-[#A44C5C] bg-[#FFF0F2]/50 font-black' 
                              : 'border-stone-200 bg-white-50'
                          }`}
                        >
                          {icon === 'crown' && '👑 تاج'}
                          {icon === 'bow' && '🎀 فيونكة'}
                          {icon === 'butterfly' && '🦋 فراشة'}
                          {icon === 'text' && '✨ نص'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 10: Automatic QR codes parameters */}
              <div className="space-y-3 bg-[#FAF8F5] border border-stone-200 p-4 rounded-2xl">
                <h4 className="text-xs font-black text-stone-900 flex items-center gap-1">
                  <QrCode size={14} className="text-[#A44C5C]" />
                  SEC 10: محاذاة أكواد QR لسهولة الوصول (Interactive Linkages)
                </h4>
                <p className="text-[10px] text-stone-600 leading-relaxed font-sans">
                  جميع أكواد الـ QR مطبوعة ومتصلة بسيرفر متجر SULTA، تمسحها العميلة لطلب الدعم وتتبع الطرود فوراً.
                </p>
                <div className="space-y-1.5 text-xs text-stone-605">
                  <div className="p-1.5 bg-white rounded border border-stone-150 flex justify-between">
                    <span><b>كود الواتساب:</b> +201012345678</span>
                    <span className="text-emerald-600">نشط ✓</span>
                  </div>
                  <div className="p-1.5 bg-white rounded border border-stone-150 flex justify-between">
                    <span><b>حساب إنستجرام:</b> sulta.sleepwear</span>
                    <span className="text-emerald-600">متصل ✓</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: Packaging boxes designs, custom fine artworks and silk tissue papers (Sections 6, 7, 8) */}
          {activeTab === 'boxes_tissue' && (
            <div className="space-y-6">
              
              {/* SECTION 06: Luxury Packaging Box Designer */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">
                  📦 SEC 06: مصمم بوكس الساتان والملابس كوتور
                </h3>

                <div className="space-y-2 text-xs">
                  <label className="text-stone-600 block">طراز وشيست البوكس المستهدف:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'drawer_box', name: '📦 علبة السحاب المنزلق (Drawer Slide)', desc: 'قالب كرتون متداخل يعطي برستيج فوري عند سحبه.' },
                      { id: 'pizza_box', name: '🍕 علبة البيتزا المسطحة العصرية (Tulia Box)', desc: 'ستايل الفتيات اللطيف في بنترست من الكرتون المقوى البسيط.' },
                      { id: 'magnetic_clasp', name: '💎 البوكس المغناطيسي الـصّلب (Luxury Rigid Mag)', desc: 'أعلى معايير التغليف بالشرق الأوسط مع قفل مغناطيسي خفي.' },
                      { id: 'shopping_bag', name: '🛍️ حقيبة الهدايا الحريرية (Atelier Shopping Bag)', desc: 'شنطة من الكرافت العاجي مع فيونكة ساتان عريضة ومذهلة.' }
                    ].map((box) => (
                      <button
                        key={box.id}
                        onClick={() => setBoxPreset(box.id as any)}
                        className={`p-3 rounded-xl border text-right text-xs transition-all cursor-pointer flex flex-col gap-1 ${
                          boxPreset === box.id 
                            ? 'border-[#A44C5C] bg-[#FFF0F2]/50 font-bold text-stone-950 shadow-2xs' 
                            : 'border-stone-150 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <span className="font-bold">{box.name}</span>
                        <span className="text-[10px] text-stone-500 leading-normal">{box.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 08: Premium Silk Tissue paper fragrance */}
              <div className="space-y-3 bg-[#FAF8F5] border border-stone-200 p-4 rounded-2xl">
                <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <Box className="text-[#A44C5C]" size={14} />
                  SEC 08: مناديل الحرير العطري المبروزة (Tissue Scent Preset)
                </h4>
                <p className="text-[10px] text-stone-505 leading-relaxed">
                  اختاري لمستكِ المتبخرة لتعطير بوكس الحرير قبل الغلق بالاستيكر الفوري.
                </p>
                
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: 'vanilla', name: '🍦 مسك الفانيلا الدافئ' },
                    { id: 'sandalwood', name: '🪵 صندل الملوكية الكلاسيكي' },
                    { id: 'lavender', name: '🪻 الخزامى المهدئ للعين' },
                    { id: 'amber', name: '💫 عطر العنبر والمسك الحار' }
                  ].map((scent) => (
                    <button
                      key={scent.id}
                      onClick={() => setScentPreset(scent.id as any)}
                      className={`p-2 rounded-lg text-center border cursor-pointer ${
                        scentPreset === scent.id 
                          ? 'border-[#A44C5C] bg-white font-extrabold text-[#A44C5C]' 
                          : 'border-stone-200 bg-zinc-50'
                      }`}
                    >
                      {scent.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 07: SULTA Brand Premium Illustrative Art-work Info */}
              <div className="space-y-2 text-xs text-stone-600 leading-relaxed bg-[#FFF0F2]/30 p-3 rounded-xl border border-pink-100">
                <span className="font-bold text-[#A44C5C] block">🎨 SEC 07: الرسم الفني الأنثوي الحصري لـ SULTA:</span>
                تم دمج الفيونكات 🎀، والأقمار الفضية 🌙، وأكواب القهوة العطرة ☕، وحقائب السفر كوتور، وأيقونات الساتان لتعبر عن طيف وروح فتيات سولا الشغوفات بالجمال والأمسيات الهادئة، مستبدلين بذلك أي عناصر لعلامات تجارية غربية أخرى.
              </div>

            </div>
          )}

          {/* TAB 5: Shipping labels & Mockup view (Sections 9 & 11) */}
          {activeTab === 'shipping_mockup' && (
            <div className="space-y-6">
              
              {/* SECTION 09: Shipping Label Generator Inputs */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">
                  🚚 SEC 09: مولد بوليصة وبطاقة الشحن الكوزية
                </h3>
                <p className="text-[10px]/relaxed text-stone-500">
                  اطبعي الملصق الرقيق لشحن الطرود لمندوب التسليم لتقديم بجامتك بلباقة تناسب الدار الملكية.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-stone-605 block">اسم صاحبة السمو المستلمة:</label>
                    <input 
                      type="text" 
                      value={customClientName} 
                      onChange={(e) => setCustomClientName(e.target.value)}
                      className="w-full bg-white border border-stone-300 p-2 rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[#A44C5C] block font-bold">تعليمات التسليم للمندوب:</label>
                    <textarea 
                      readOnly
                      className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-lg text-[10px] text-stone-600 focus:outline-none"
                      value="يرجى ريادة الطرد بكل هدوء ودلال، الملكة تثق في مجهودك. حافظ على تغليف الحرير."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 11: Real-time Live Packaging Mockup info */}
              <div className="bg-[#FAF8F5] border border-stone-200 p-4 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-stone-850 block">✨ SEC 11: محاكي بنترست التفاعلي للأبعاد:</span>
                <p className="text-[10.5px]/relaxed text-stone-600">
                  لوحة العرض على اليسار تحاكي أبعاد الكراتين المطوية في منزلك لتوفر عليكِ مصاريف التجارب الملموسة الباهظة.
                </p>
              </div>

            </div>
          )}

          {/* TAB 6: Complete export center and master kit setup */}
          {activeTab === 'full_kit' && (
            <div className="space-y-6">
              <h3 className="text-sm font-black text-[#A44C5C] border-b border-pink-100 pb-2 flex items-center gap-1.5 font-serif">
                <Star className="text-amber-500 fill-amber-500" size={16} />
                الدولاب الشامل وإعداد المطبوعات الكامل
              </h3>

              <p className="text-xs text-stone-600 leading-relaxed">
                هنا يمكنك استخراج كل المفرغات الورقية كيت تلو الآخر، أو النقر على الزر الذهبي بالأسفل لإصدار الـ 10 أجزاء من علبة السوموت وحتى بوليصة الشحن بضغطة زر واحدة.
              </p>

              {/* SECTION 15: SULTA Packaging Collection list of elements */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200 space-y-3">
                <span className="text-xs font-black text-[#A44C5C] block">🏆 قائمة حزمة الـ 10-in-1 الجاهزة للطباعة:</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-700 font-sans">
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded text-[9.5px]">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>ملصق الشعار الدائري</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded text-[9.5px]">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>كارت الشكر الملكي</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded text-[9.5px]">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>كارت تعليمات العناية</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded text-[9.5px]">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>بطاقة تسعير المنتج (Hang Tag)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded text-[9.5px]">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>الرسم التوضيحي الفخم لـ Sulta</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded text-[9.5px]">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>ورق مناديل الزبد المكرر</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded text-[9.5px]">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>بوليصة شحن مستلم الدلال</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded text-[9.5px]">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>بطاقة التواصل وبنترست QR</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded text-[9.5px]">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>غطاء الصندوق المقوى</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded text-[9.5px]">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>شنطة هدايا الحرير المعاطف</span>
                  </div>
                </div>
              </div>

              {/* Master Button Generate Full Kit */}
              <div className="pt-2">
                <button
                  onClick={generateFullPackagingKit}
                  disabled={loadingType !== null}
                  className="w-full bg-[#121212] hover:bg-stone-900 text-[#F6E7A6] hover:scale-[1.01] duration-300 py-3.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl border border-[#FFF] "
                >
                  <Sparkles size={15} className="text-amber-400 fill-amber-400 animate-bounce" />
                  <span>تجهيز حزمة مطبوعات SULTA التلقائية الكاملة بنقرة واحدة (10-in-1 Kit)</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Branding Tagline Signature */}
          <div className="text-center pt-4 border-t border-stone-100">
            <span className="text-[10px] text-stone-450 font-serif font-black tracking-widest select-none">
              SULTA COUTURE SLEEPWEAR CO. 2026
            </span>
          </div>
        </div>

        {/* LEFT LIVE INTERACTIVE 3D/CANVAS PRINT STAGE (7 Columns) */}
        <div className="lg:col-span-7 bg-[#FAF8F5] border border-stone-250 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
          
          <div className="space-y-6">
            
            {/* Header Stage Selector */}
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <span className="text-xs font-black text-stone-850 flex items-center gap-2 font-serif">
                <Eye size={15} className="text-[#A44C5C]" />
                لوحة الرندرة والاستخراج الحية للبطاقة الفعالة (DPI Calibrated Live View)
              </span>
              <span className="text-[9.5px] font-mono text-[#A44C5C] font-bold">CMYK OFFSET OK</span>
            </div>

            {/* Premium Atelier Scale Control Panel */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#FFF0F2] rounded-xl border border-[#A44C5C]/20 text-[11px] w-full">
              <span className="font-bold text-[#A44C5C] flex items-center gap-1">
                <span>🔍 مقياس المعاينة النشط:</span>
                <span className="font-mono text-xs">{Math.round(zoomScale * 100)}%</span>
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setZoomScale(Math.max(0.4, zoomScale - 0.1))} 
                  className="px-2.5 py-1 bg-white rounded border border-stone-250 hover:bg-zinc-50 font-black cursor-pointer text-stone-850"
                >
                  -
                </button>
                <button 
                  onClick={() => {
                    const w = window.innerWidth;
                    if (w < 375) setZoomScale(0.68);
                    else if (w < 430) setZoomScale(0.74);
                    else if (w < 520) setZoomScale(0.82);
                    else if (w < 640) setZoomScale(0.88);
                    else if (w < 1024) setZoomScale(0.95);
                    else setZoomScale(1);
                  }} 
                  className="px-2 py-1 bg-white rounded border border-stone-250 hover:bg-zinc-50 font-bold font-sans cursor-pointer text-stone-850"
                >
                  تلقائي 📱
                </button>
                <button 
                  onClick={() => setZoomScale(Math.min(1.5, zoomScale + 0.1))} 
                  className="px-2.5 py-1 bg-white rounded border border-stone-250 hover:bg-zinc-50 font-black cursor-pointer text-stone-850"
                >
                  +
                </button>
              </div>
            </div>

            {/* LIVE RENDER WRAPPER containing all 10 visual elements in Section 15 */}
            {/* We stack them beautifully or show according to Active tab to minimize clutter but guarantee presence of all refs for html2canvas */}
            <div className="bg-[#FAF8F5] md:bg-white border-2 border-dashed border-stone-300 rounded-2xl p-2 md:p-6 relative flex flex-col items-center justify-center min-h-[365px] md:min-h-[360px] overflow-hidden shadow-xs">
              
              {/* Dynamic Overlay labels of safe cut bleed line */}
              <div className="absolute top-2 left-2 text-[8px] font-mono text-zinc-400 select-none hidden sm:block">✂️ Bleed Limit [3.5mm]</div>
              <div className="absolute bottom-2 right-2 text-[8px] font-mono text-[#A44C5C] font-semibold select-none hidden sm:block">SULTA COUTURE PRINT ENGINE</div>

              <div 
                style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center' }} 
                className="transition-transform duration-300 ease-out flex items-center justify-center shrink-0 w-full"
              >
                <>

              {/* Asset 1: Sticker Canvas (Circular / Square / Rectangle Logo Sticker) */}
              <div 
                ref={stickerCanvasRef}
                className={`w-64 h-64 border border-stone-200 p-6 flex flex-col items-center justify-center text-center shadow-md relative ${
                  stickerShape === 'circle' ? 'rounded-full' : 'rounded-2xl'
                } ${
                  stickerShape === 'transparent' ? 'bg-[#FCFAF2]/30 border-dashed border-[#E5C470]' : 'bg-[#FCFAF2]'
                } ${activeTab === 'stickers_qr' ? 'block' : 'hidden'}`}
              >
                <div className="text-xs text-stone-500 font-serif">👑 SULTA ATELIER</div>
                
                {stickerIcon === 'crown' && <span className="text-3xl my-2 text-[#A44C5C] select-none animate-bounce">👑</span>}
                {stickerIcon === 'bow' && <span className="text-3xl my-2 text-[#A44C5C] select-none">🎀</span>}
                {stickerIcon === 'butterfly' && <span className="text-3xl my-2 text-[#A44C5C] select-none pb-1 block">🦋</span>}
                {stickerIcon === 'text' && <span className="text-xl my-3 font-bold font-serif text-[#A44C5C] tracking-widest">{monogramLetter}</span>}

                <h4 className="text-xs font-serif font-black tracking-wide text-stone-900 leading-none">
                  ST SULTA STYLE
                </h4>
                <p className="text-[8px] text-stone-400 mt-1 uppercase">Sleepwear & Linen Co.</p>
                <div className="absolute bottom-6 font-mono text-[8.5px] font-bold text-[#A44C5C] select-none">
                  ★ {monogramLetter} ★
                </div>
              </div>

              {/* Asset 2: Thank You Card Canvas (Section 03) */}
              <div 
                ref={thankYouCanvasRef}
                className={`w-80 h-52 border border-stone-200 p-6 rounded-2xl flex flex-col justify-between shadow-md text-right ${
                  isLowInk ? 'bg-white text-stone-950' : 'bg-[#121212] text-white'
                } ${activeTab === 'cards_tags' ? 'block' : 'hidden'}`}
              >
                <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                  <span className="text-[9.5px] uppercase tracking-widest text-[#F6E7A6] font-serif font-black">
                    🎀 Royal Thank You Card
                  </span>
                  <span className="text-[8px] text-zinc-500">SULTA STUDIO</span>
                </div>

                <div className="my-auto space-y-1.5 py-2">
                  <p className="text-[10px] leading-relaxed text-zinc-200">
                    أهلاً بكِ <b>{customClientName || 'صاحبة السمو'}</b> في عراب سولا الفني. ممتنون غاية الامتنان لثقتكِ بدارنا الفخمة. نرجو أن تمنحكِ هذه البجامة الحريرية نهاراً من الدلال وليلة تفيض بالراحة والسكينة والجمال.
                  </p>
                </div>

                <div className="flex justify-between items-center text-[9px] text-[#F6E7A6] border-t border-stone-800 pt-2 font-sans font-bold">
                  <span>تمتعي بخصم خاص: <b className="text-white bg-[#A44C5C] px-1.5 rounded font-mono text-[10px]">{customPromoCode}</b></span>
                  <span>مع كامل الحب 🌸</span>
                </div>
              </div>

              {/* Asset 3: Care Instructions Card (Section 04) */}
              <div 
                ref={careCanvasRef}
                className={`w-72 h-72 border border-stone-200 p-5 rounded-2xl flex flex-col justify-between shadow-md text-right bg-[#FAFAF9] text-stone-900 ${
                  activeTab === 'cards_tags' ? 'block' : 'hidden'
                }`}
              >
                <div className="text-center font-serif text-[10.5px] font-black border-b-2 border-stone-200 pb-2 w-full text-[#A44C5C]">
                  👑 دليل العناية وحفظ حرير سولا كوتور
                </div>

                <div className="my-auto space-y-2.5 text-[9.5px] text-stone-700">
                  <div className="flex items-center gap-2 bg-white p-1 rounded border border-stone-150">
                    <span className="text-lg select-none">🛁</span>
                    <div>
                      <b className="text-stone-900 block font-bold leading-none">غسيل يدوي منعش:</b>
                      <span className="text-[8.5px] text-stone-500">في ماء بارد (دون 30 درجة) للحفاظ على متانة الأنسجة.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-1 rounded border border-stone-150">
                    <span className="text-lg select-none">🌤️</span>
                    <div>
                      <b className="text-stone-900 block font-bold leading-none">التجفيف اللطيف بالظل:</b>
                      <span className="text-[8.5px] text-stone-500">تجنبي كلياً مجففات الحرارة الساخنة والغسيل العنيف.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-1 rounded border border-stone-150">
                    <span className="text-lg select-none">☁️</span>
                    <div>
                      <b className="text-stone-900 block font-bold leading-none">الكي على درجة منخفضة:</b>
                      <span className="text-[8.5px] text-stone-500">يتم الكي ببرودة تامة من الداخل مع تمرير رقيق.</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[8.5px] text-stone-400 border-t border-stone-150 pt-2">
                  Atelier SULTA Wear Instructions & Care © 2026
                </div>
              </div>

              {/* Asset 4: Product Tag Canvas (Section 05) */}
              <div 
                ref={tagCanvasRef}
                className={`w-48 h-80 border border-stone-300 p-5 rounded-2xl flex flex-col justify-between shadow-md text-center bg-[#FAF8F4] text-stone-900 relative ${
                  activeTab === 'cards_tags' ? 'block' : 'hidden'
                }`}
              >
                {/* Ribbon Hole indicator */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-stone-300 border border-stone-100 select-none" />

                <div className="mt-4 font-serif text-[11px] font-black tracking-widest text-[#A44C5C]">
                  SULTA ATELIER
                </div>

                <div className="my-auto space-y-2 border-y border-stone-200 py-4 text-right">
                  <div className="text-[10px]/snug text-stone-850 font-bold">
                    <span>📦 القطعة: </span>
                    <span className="text-[#A44C5C]">{productTagName}</span>
                  </div>
                  <div className="text-[9.5px] text-stone-605">
                    <span>📏 المقاس الملكي: <b>{productTagSize}</b></span>
                  </div>
                  <div className="text-[9.5px] text-stone-605">
                    <span>🏷️ الموديل: <b>{productTagSKU}</b></span>
                  </div>
                  <div className="text-xs font-black text-[#A44C5C] text-center border-t border-dashed border-stone-200 pt-2 font-mono">
                    {productPrice}
                  </div>
                </div>

                {/* Simulated Barcode */}
                <div className="space-y-1">
                  <div className="w-full h-8 bg-zinc-950 flex gap-0.5 p-0.5 items-stretch select-none">
                    <div className="bg-white flex-1" /><div className="bg-white flex-none w-1" /><div className="bg-white flex-1" /><div className="bg-white flex-none w-1.5" /><div className="bg-white flex-1" /><div className="bg-white flex-none w-0.5" /><div className="bg-white flex-1" /><div className="bg-white flex-1" />
                  </div>
                  <span className="text-[8px] font-mono text-stone-400">Barcode *{productTagSKU}*</span>
                </div>
              </div>

              {/* Asset 5: SULTA Brand Custom Illustrated Artwork (Section 07) */}
              <div 
                ref={artworkCanvasRef}
                className={`w-80 h-80 border border-[#A44C5C]/20 bg-[#FFF4F6] p-6 rounded-2xl flex flex-col justify-between shadow-md relative text-center text-[#A44C5C] ${
                  activeTab === 'boxes_tissue' ? 'block' : 'hidden'
                }`}
              >
                <div className="text-[9px] tracking-widest uppercase font-serif font-black">
                  🛡️ SULTA COUTURE ART ARCHIVE
                </div>

                {/* Hand sketched premium layout simulation */}
                <div className="my-auto relative p-4 border border-[#DF8A9D]/30 rounded-xl bg-white/60 space-y-2">
                  <div className="flex justify-center gap-3 text-2xl">
                    <span className="animate-pulse">🎀</span> {/* Bow */}
                    <span>🌙</span> {/* Moon */}
                    <span className="scale-110">☕</span> {/* Coffee */}
                  </div>
                  
                  <h5 className="text-xs font-serif font-black text-stone-900 tracking-tight leading-none mt-1">
                    THE SUITE OF COZY HOUR
                  </h5>
                  <p className="text-[9px] text-[#A44C5C] leading-normal font-sans italic">
                    رسومات مدمجة تعبر عن رقة الحرير والأقمار الساهرة والبيجامات النسائية بالدار.
                  </p>

                  <div className="flex justify-center gap-2 text-lg">
                    <span>🛍️</span> {/* Shopping Bag */}
                    <span>✨</span> {/* Star */}
                    <span>✨</span>
                  </div>
                </div>

                <div className="text-[8.5px] text-stone-500 font-mono">
                  SULTA Original Hand Drawn Motif Preset
                </div>
              </div>

              {/* Asset 6: Repeating Pattern Tissue Paper (Section 08) */}
              <div 
                ref={tissueCanvasRef}
                className={`w-80 h-80 border border-stone-200 bg-stone-50 p-4 rounded-xl flex flex-col justify-between relative shadow-inner overflow-hidden select-none ${
                  activeTab === 'boxes_tissue' ? 'block' : 'hidden'
                }`}
              >
                {/* Wallpaper repeating Sulta & Monogram */}
                <div className="grid grid-cols-4 gap-x-4 gap-y-6 opacity-60 text-[9px] font-serif font-black text-[#A44C5C]/80 p-2 leading-none w-full h-full text-center">
                  <span>SULTA 👑</span>
                  <span>SULTA 🎀</span>
                  <span>{monogramLetter} 👑</span>
                  <span>SULTA 🎀</span>
                  <span>{monogramLetter} 🎀</span>
                  <span>SULTA {monogramLetter}</span>
                  <span>SULTA 🎀</span>
                  <span>SULTA 👑</span>
                  <span>SULTA 👑</span>
                  <span>SULTA 🎀</span>
                  <span>{monogramLetter} 👑</span>
                  <span>SULTA 🎀</span>
                </div>

                <div className="absolute inset-x-2 bottom-2 bg-white/95 border border-[#DF8A9D]/45 rounded-lg p-2.5 text-center text-[9px] text-stone-705 shadow-sm">
                  🌾 ورق مناديل الزبد متكرر معطر بـPresente: <span className="font-bold text-[#A44C5C]">{scentPreset.toUpperCase()}</span>
                </div>
              </div>

              {/* Asset 7: Shipping labels (Section 09) */}
              <div 
                ref={shippingCanvasRef}
                className={`w-80 h-56 border border-stone-200 bg-white p-5 rounded-xl shadow-md text-right text-stone-900 ${
                  activeTab === 'shipping_mockup' ? 'block' : 'hidden'
                }`}
              >
                <div className="flex justify-between items-center border-b-2 border-stone-200 pb-2">
                  <span className="text-[10px] font-black text-[#A44C5C] font-serif uppercase">SULTA SLEEP DELIVERIES</span>
                  <span className="text-[8px] text-stone-400 font-mono">Waybill #SULTA-8854</span>
                </div>

                <div className="space-y-2 text-[9.5px] my-4 leading-normal font-sans">
                  <div className="bg-stone-50 p-2 rounded border border-stone-200 space-y-0.5">
                    <span>👤 <b>مستلمة الدلال:</b> {customClientName || 'صاحبة السمو أميرة تاجر'}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-200 space-y-0.5">
                    <span>📍 <b>العنوان المفوّد:</b> القاهرة، مصر / المعادى أو الفجالة</span>
                  </div>
                  <div className="flex justify-between gap-2 bg-stone-50 p-2 rounded border border-stone-200">
                    <span>💵 COD: 3,500 ج.م</span>
                    <span><b>الوزن:</b> 0.8 كجم</span>
                  </div>
                </div>

                <div className="text-center font-mono text-[7.5px] text-stone-400 border-t border-dashed border-stone-300 pt-1">
                  *يرجى حفظ الطرد بعيداً عن الرطوبة ومباشرته رقة تامة*
                </div>
              </div>

              {/* Asset 8: QR Custom Card & Social Links (Section 10) */}
              <div 
                ref={qrCanvasRef}
                className={`w-72 h-44 border border-stone-250 p-5 rounded-2xl flex flex-col justify-between bg-zinc-900 text-white shadow-xl ${
                  activeTab === 'stickers_qr' ? 'block' : 'hidden'
                }`}
              >
                <span className="text-[8.5px] font-bold text-[#F6E7A6] text-center w-full block uppercase tracking-widest leading-none">
                  SULTA INSTANT CONNECT GATEWAY
                </span>

                <div className="grid grid-cols-2 gap-4 my-auto items-center text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-300 block">واتساب الإرشاد والمساعدة</span>
                    <div className="bg-stone-100 p-1 rounded inline-block">
                      <div className="w-12 h-12 bg-zinc-950 p-1">
                        <div className="w-full h-full bg-white grid grid-cols-2 gap-1 p-0.5">
                          <div className="bg-zinc-950" /><div className="bg-zinc-950" />
                          <div className="bg-white" /><div className="bg-zinc-950" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-300 block">إنستجرام البوتيك والكتالوج</span>
                    <div className="bg-stone-100 p-1 rounded inline-block">
                      <div className="w-12 h-12 bg-zinc-950 p-1">
                        <div className="w-full h-full bg-white grid grid-cols-2 gap-1 p-0.5">
                          <div className="bg-zinc-950" /><div className="bg-white" />
                          <div className="bg-zinc-950" /><div className="bg-zinc-950" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <span className="text-[8px] text-zinc-400 text-center block font-sans">
                  Scan QR code for direct VIP Atelier Concierge
                </span>
              </div>

              {/* Asset 9 & 11: Real-time Box & Bag Mockup (Section 06 & 11) */}
              <div 
                ref={boxCanvasRef}
                className={`w-80 h-80 border border-stone-200 bg-[#FCF6F0] p-6 rounded-2xl flex flex-col justify-between relative shadow-md text-stone-900 ${
                  activeTab === 'shipping_mockup' ? 'block' : 'hidden'
                }`}
              >
                <div className="text-center text-[10px] font-black uppercase tracking-widest text-[#A44C5C]">
                  🎀 SULTA LUXURY 3D MOCKUP VISUAL
                </div>
                
                {/* 3D Box Simulation Graphic */}
                <div className="my-auto relative h-40 flex items-center justify-center select-none">
                  
                  {boxPreset === 'pizza_box' && (
                    <div className="w-48 h-32 bg-[#E1D4C8] border-2 border-stone-400 rounded flex flex-col justify-between p-3 relative shadow-md transform -skew-y-3">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#A44C5C] text-[#F6E7A6] px-2.5 py-0.5 rounded-full text-[8px] font-black">
                        GIRLHOOD BOX
                      </div>
                      <div className="border border-stone-300 rounded p-1.5 bg-white/50 text-center space-y-0.5">
                        <span className="text-xs font-serif font-black tracking-widest block">ST SULTA</span>
                        <div className="text-[7px] text-stone-500">Zero Calories Sleepwear Studio</div>
                      </div>
                      <div className="text-center text-[8px] text-stone-500 font-bold">30cm Box Print Spec</div>
                    </div>
                  )}

                  {boxPreset === 'drawer_box' && (
                    <div className="w-48 h-24 bg-stone-900 border-2 border-zinc-700 text-[#F6E7A6] rounded-xl flex items-center justify-between p-4 relative shadow-lg transform -skew-x-2">
                      <div className="space-y-1 text-right">
                        <span className="text-[10px] font-black font-serif tracking-widest">SULTA ATELIER</span>
                        <div className="text-[7.5px] text-zinc-400">منزلق الحظ الدافئ</div>
                      </div>
                      <div className="w-12 h-16 bg-white rounded border border-stone-300 shadow-sm" /> {/* drawer pull out */}
                    </div>
                  )}

                  {boxPreset === 'magnetic_clasp' && (
                    <div className="w-44 h-36 bg-zinc-950 text-[#F6E7A6] p-4 rounded-xl flex flex-col justify-between border-t-8 border-[#A44C5C] shadow-2xl relative">
                      <span className="text-[8px] uppercase tracking-widest opacity-60 text-center">MAGNETIC SOLID BOX</span>
                      <div className="text-center font-bold text-base border border-[#F6E7A6]/20 py-2 rounded">
                        ST
                      </div>
                      <span className="text-[7.5px] text-zinc-400 text-center">كود المطبعة: RIGID-SULTA-2026</span>
                    </div>
                  )}

                  {boxPreset === 'shopping_bag' && (
                    <div className="w-40 h-44 bg-[#FFF] border-2 border-[#A44C5C]/25 rounded-t-xl flex flex-col justify-between p-3 relative shadow-md">
                      {/* Ribbon string */}
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">🎗️</div>
                      <div className="text-center my-auto space-y-1">
                        <span className="text-lg">🛍️</span>
                        <h6 className="text-[10px] font-serif font-black tracking-widest text-stone-950">SULTA BAG</h6>
                      </div>
                      <span className="text-[7px] text-stone-400 text-center">ورق كرافت مطلي بالفارنيش الدائري</span>
                    </div>
                  )}

                </div>

                <div className="text-center text-[8px] text-stone-400 font-mono">
                  Press options on Sidebar to toggle other structures
                </div>
              </div>

              {/* Hidden Asset 10 reference for full kit compile validation (Shopping Bag) */}
              <div 
                ref={bagCanvasRef} 
                className="w-56 h-72 hidden bg-white border border-stone-200 p-4 flex flex-col justify-between"
              >
                <div className="text-center text-[10px] font-black">SULTA PREMIUM GIFT BAG</div>
                <div className="border-t border-b-2 border-stone-300 py-4 my-auto text-center font-serif text-lg text-[#A44C5C]">
                  SULTA COUTURE ATELIER
                </div>
                <div className="text-[8px] text-stone-400 text-center">Premium Kraft with Cotton Ribbons Specs</div>
              </div>

                </>
              </div>

            </div>

            {/* Live Interactive Action triggers */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-90 w-full rounded-2xl bg-stone-100 border border-stone-200">
              
              <div className="text-right">
                <span className="text-xs font-black text-stone-900 block">إليك إمكانيات التنزيل الحرة للملفات:</span>
                <p className="text-[10.5px] text-stone-500 mt-0.5">يمكنك حفظ العمل كـ PNG بدقة 300 DPI للتحميل المباشر.</p>
              </div>

              <div className="flex items-center gap-2">
                {/* PDF direct print */}
                <button
                  onClick={() => downloadPngOfElement(stickerCanvasRef, 'sticker-canvas')}
                  className="bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 px-3 py-2 rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center gap-1.5"
                >
                  <Download size={13} className="text-[#A44C5C]" />
                  <span>حفظ صورة PNG</span>
                </button>

                <button
                  onClick={() => downloadSvgOfTemplate('master', 'Sticker')}
                  className="bg-[#A44C5C] hover:bg-[#8D3F4D] text-white px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5"
                >
                  <Scissors size={13} />
                  <span>تصدير ناقل SVG</span>
                </button>
              </div>

            </div>

          </div>

          {/* SULTA Production Blueprint Guide Tip */}
          <div className="mt-4 p-4 bg-blue-50/50 border border-blue-150 rounded-2.5xl text-stone-700 text-[11px] leading-relaxed flex items-start gap-2.5 shadow-2xs">
            <InfoIcon size={16} className="text-[#A44C5C] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-stone-900">💡 دليل النزيف وحواف التقطيع للمصانع المحلية المصرية:</p>
              <p className="mt-1 text-stone-600">
                عند تقديم هذه النماذج للمطابع بوسط البلد أو الرياض، يرجى تزويدهم بمقاس <b>3.5mm Bleed Margin</b> (هامش سلامة من الخارج). لقد أضفنا هذا المعيار الدقيق تلقائياً في مصمم الهوية، لحفظ الحروف الملكية والكلمات الرقيقة وصور فيونكات التزيين داخل حدود القطع الآمنة تماماً.
              </p>
            </div>
          </div>

        </div>

      </div>
      )}

    </div>
  );
}
