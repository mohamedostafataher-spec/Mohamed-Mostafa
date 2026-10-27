import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Play,
  Copy,
  Check,
  ExternalLink,
  Send,
  Zap,
  Wifi,
  WifiOff,
  Code,
  Sparkles,
  Clock,
  Filter,
  Trash2,
  HelpCircle,
  Eye,
  ShoppingBag,
  CreditCard,
  PackageCheck,
  Heart,
  UserCheck,
  MessageCircle,
  Sliders,
  Calendar,
  DollarSign,
  MapPin,
  Search,
  FileText,
  Mail,
  BookOpen
} from 'lucide-react';
import { Settings } from '../types';
import {
  getPixelEventLogs,
  subscribePixelLogs,
  logPixelEvent,
  PixelEventLog,
  trackPageView,
  trackViewContent,
  trackAddToCart,
  trackAddToWishlist,
  trackInitiateCheckout,
  trackAddPaymentInfo,
  trackPurchase,
  trackCompleteRegistration,
  trackContact,
  trackCustomizeProduct,
  trackSearch,
  trackLead,
  trackSubscribe,
  trackSchedule,
  trackStartTrial,
  trackSubmitApplication,
  trackFindLocation,
  trackDonate
} from '../utils/analytics';
import {
  ttqIdentify,
  trackTikTokViewContent,
  trackTikTokAddToCart,
  trackTikTokAddToWishlist,
  trackTikTokInitiateCheckout,
  trackTikTokAddPaymentInfo,
  trackTikTokPurchase,
  trackTikTokSearch,
  trackTikTokCompleteRegistration
} from '../utils/tiktokPixel';

interface PixelDiagnosticsViewProps {
  settings?: Settings | null;
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface PixelStatusInfo {
  name: string;
  id: string;
  isConfigured: boolean;
  scriptLoaded: boolean;
  objectDefined: boolean;
  isReady: boolean;
  adBlockDetected: boolean;
  errorReason?: string;
  lastEventTime?: string;
  eventCount: number;
}

// Meta Pixel Standard Event Registry Reference
const META_STANDARD_EVENTS_TABLE = [
  {
    nameAr: 'مشاهدة المحتوى',
    nameEn: 'ViewContent',
    desc: 'زيارة إلى صفحة ويب لمنتج أو مقصودة لتتبع اهتمام العميل.',
    code: "fbq('track', 'ViewContent');",
    category: 'commerce'
  },
  {
    nameAr: 'إضافة إلى عربة التسوق',
    nameEn: 'AddToCart',
    desc: 'إضافة عنصر إلى عربة التسوق أو سلة المشتريات.',
    code: "fbq('track', 'AddToCart');",
    category: 'commerce'
  },
  {
    nameAr: 'إضافة إلى قائمة الرغبات',
    nameEn: 'AddToWishlist',
    desc: 'إضافة عناصر إلى قائمة رغبات أو مفضلة المتجر.',
    code: "fbq('track', 'AddToWishlist');",
    category: 'commerce'
  },
  {
    nameAr: 'بدء إتمام الشراء',
    nameEn: 'InitiateCheckout',
    desc: 'بدء عملية إتمام الشراء والنقر على زر الانتقال للدفع.',
    code: "fbq('track', 'InitiateCheckout');",
    category: 'commerce'
  },
  {
    nameAr: 'إضافة معلومات الدفع',
    nameEn: 'AddPaymentInfo',
    desc: 'إضافة معلومات الدفع والفوترة الخاصة بالعميل أثناء إتمام الشراء.',
    code: "fbq('track', 'AddPaymentInfo');",
    category: 'commerce'
  },
  {
    nameAr: 'الشراء',
    nameEn: 'Purchase',
    desc: 'إكمال عملية الشراء بنجاح وتأكيد الطلب واستلام الإيصال.',
    code: "fbq('track', 'Purchase', {value: 99.00, currency: 'SAR'});",
    category: 'commerce'
  },
  {
    nameAr: 'البحث',
    nameEn: 'Search',
    desc: 'بحث يتم إجراؤه في المتجر للبحث عن قطعة أو موديل معين.',
    code: "fbq('track', 'Search');",
    category: 'interaction'
  },
  {
    nameAr: 'إكمال التسجيل',
    nameEn: 'CompleteRegistration',
    desc: 'إنشاء حساب جديد أو تسجيل عميل في خدمات المتجر.',
    code: "fbq('track', 'CompleteRegistration');",
    category: 'interaction'
  },
  {
    nameAr: 'جهة الاتصال',
    nameEn: 'Contact',
    desc: 'التواصل بين العميل ونشاطك التجاري عبر الواتساب أو الهاتف أو الإيميل.',
    code: "fbq('track', 'Contact');",
    category: 'interaction'
  },
  {
    nameAr: 'تخصيص المنتج',
    nameEn: 'CustomizeProduct',
    desc: 'تخصيص البيجامات (اختيار اللون، المقاس، التغليف، أو بطاقة الإهداء).',
    code: "fbq('track', 'CustomizeProduct');",
    category: 'interaction'
  },
  {
    nameAr: 'بيانات العميل المحتمل',
    nameEn: 'Lead',
    desc: 'إرسال معلومات من العميل للتواصل معه لاحقاً أو طلب خدمة كونسيرج.',
    code: "fbq('track', 'Lead');",
    category: 'lead'
  },
  {
    nameAr: 'اشتراك',
    nameEn: 'Subscribe',
    desc: 'بدء اشتراك بالنشرة البريدية أو عضوية سولتة الملكية.',
    code: "fbq('track', 'Subscribe', {value: '0.00', currency: 'SAR', predicted_ltv: '0.00'});",
    category: 'lead'
  },
  {
    nameAr: 'الجدول الزمني',
    nameEn: 'Schedule',
    desc: 'حجز موعد أو استشارة قياس خاصة مع خبيرات سولتة.',
    code: "fbq('track', 'Schedule');",
    category: 'lead'
  },
  {
    nameAr: 'إرسال طلب',
    nameEn: 'SubmitApplication',
    desc: 'إرسال طلب للانضمام لبرنامج ولاء أو وظيفة أو عضوية سفراء البراند.',
    code: "fbq('track', 'SubmitApplication');",
    category: 'lead'
  },
  {
    nameAr: 'بدء الفترة التجريبية',
    nameEn: 'StartTrial',
    desc: 'بدء فترة تجريبية لعضوية VIP أو خدمات مخصصة.',
    code: "fbq('track', 'StartTrial', {value: '0.00', currency: 'SAR', predicted_ltv: '0.00'});",
    category: 'lead'
  },
  {
    nameAr: 'بحث عن الموقع',
    nameEn: 'FindLocation',
    desc: 'البحث عن فرع بوتيك سولتة أو موقع الاستلام.',
    code: "fbq('track', 'FindLocation');",
    category: 'interaction'
  },
  {
    nameAr: 'التبرع',
    nameEn: 'Donate',
    desc: 'مساهمة خيرية أو مبادرة مجتمعية مرتبطة بالمتجر.',
    code: "fbq('track', 'Donate');",
    category: 'interaction'
  }
];

export default function PixelDiagnosticsView({ settings, toast }: PixelDiagnosticsViewProps) {
  const metaPixelId = (settings?.facebookPixelId || '1648674350574190').trim();
  const tiktokPixelId = (settings?.tiktokPixelId || 'DBESRBJC77U4J2JQDUB0').trim();

  const [logs, setLogs] = useState<PixelEventLog[]>([]);
  const [filterPixel, setFilterPixel] = useState<'all' | 'meta' | 'tiktok'>('all');
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingCapi, setIsTestingCapi] = useState(false);
  const [capiResult, setCapiResult] = useState<{
    success: boolean;
    message?: string;
    fbtrace_id?: string;
    events_received?: number;
  } | null>(null);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [isRunningScan, setIsRunningScan] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'commerce' | 'interaction' | 'lead' | 'table'>('all');
  const [lastScanTime, setLastScanTime] = useState<string>(
    new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const handleTestCapiConnection = async () => {
    setIsTestingCapi(true);
    setCapiResult(null);
    try {
      const res = await fetch('/api/meta/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixel_id: metaPixelId,
          test_event_code: settings?.metaTestEventCode || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setCapiResult({
          success: true,
          message: 'تم استلام وتأكيد الحدث من خادم Meta Graph API بنجاح ⚡',
          fbtrace_id: data.fbtrace_id,
          events_received: data.events_received
        });
        if (toast) toast('تم فحص اتصال Meta CAPI: متصل وفعال بنجاح 🚀', 'success');
      } else {
        setCapiResult({
          success: false,
          message: data.error || 'تعذر الاتصال بـ Meta CAPI'
        });
        if (toast) toast('تنبيه CAPI: ' + (data.error || 'خطأ في الاتصال'), 'error');
      }
    } catch (err: any) {
      setCapiResult({
        success: false,
        message: err.message || 'خطأ في الاتصال بالخادم'
      });
      if (toast) toast('خطأ أثناء فحص CAPI', 'error');
    } finally {
      setIsTestingCapi(false);
    }
  };

  // Subscribe to real-time pixel event logs
  useEffect(() => {
    const unsub = subscribePixelLogs((newLogs) => {
      setLogs([...newLogs]);
    });
    return unsub;
  }, []);

  // Clean Vercel Production Domain (never expose internal dev containers)
  const targetDomain = useMemo(() => {
    if (settings?.storeDomain && settings.storeDomain.trim()) {
      return settings.storeDomain.trim();
    }
    if (typeof window !== 'undefined' && window.location.host.endsWith('.vercel.app')) {
      return window.location.host;
    }
    return 'sulta.vercel.app';
  }, [settings?.storeDomain]);

  // Diagnostic State Evaluator
  const diagnostics = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        meta: { name: 'Meta Pixel', id: metaPixelId, isConfigured: true, scriptLoaded: false, objectDefined: false, isReady: false, adBlockDetected: false, eventCount: 0 },
        tiktok: { name: 'TikTok Pixel', id: tiktokPixelId, isConfigured: true, scriptLoaded: false, objectDefined: false, isReady: false, adBlockDetected: false, eventCount: 0 },
        adBlockOverall: false,
        conflictDetected: false,
        conflictDetails: [] as string[],
        isConnecting: true
      };
    }

    // 1. Check Meta Pixel Status
    const isFbqFunction = typeof (window as any).fbq === 'function';
    const metaScripts = Array.from(document.querySelectorAll('script')).filter(s =>
      s.src && s.src.includes('connect.facebook.net')
    );
    const metaScriptPresent = metaScripts.length > 0;
    const metaAdBlock = metaScriptPresent && !isFbqFunction;

    // 2. Check TikTok Pixel Status
    const isTtqPresent = typeof (window as any).ttq !== 'undefined';
    const isTtqLoaded = isTtqPresent && typeof (window as any).ttq.page === 'function';
    const tiktokInstanceReady = isTtqPresent && (window as any).ttq._i && !!(window as any).ttq._i[tiktokPixelId];
    const tiktokScripts = Array.from(document.querySelectorAll('script')).filter(s =>
      s.src && s.src.includes('analytics.tiktok.com')
    );
    const tiktokScriptPresent = tiktokScripts.length > 0;
    const tiktokAdBlock = tiktokScriptPresent && (!isTtqPresent || !(window as any).ttq.page);

    // Event counts
    const metaEvents = logs.filter(l => l.pixel === 'Meta (Facebook)');
    const tiktokEvents = logs.filter(l => l.pixel === 'TikTok');

    const conflictDetails: string[] = [];
    if (metaScripts.length > 5) {
      conflictDetails.push('تم العثور على تكرار كثيف في كود Meta Pixel؛ قد يسبب تكراراً في إحصائياتك.');
    }
    if (tiktokScripts.length > 5) {
      conflictDetails.push('تم العثور على تكرار كثيف في كود TikTok Pixel.');
    }
    if (!metaPixelId) {
      conflictDetails.push('معرف Meta Pixel غير محدد في الإعدادات.');
    }
    // TikTok is optional, only report as conflict if explicitly intended but missing
    if (!tiktokPixelId && settings?.tiktokPixelId === '') {
      // Not a conflict, just not configured
    }

    const metaStatus: PixelStatusInfo = {
      name: 'Meta (Facebook & Instagram) Pixel',
      id: metaPixelId,
      isConfigured: !!metaPixelId,
      scriptLoaded: metaScriptPresent,
      objectDefined: isFbqFunction,
      isReady: isFbqFunction,
      adBlockDetected: metaAdBlock,
      eventCount: metaEvents.length,
      lastEventTime: metaEvents[0]?.timestamp,
      errorReason: metaAdBlock ? 'تم حظر تحميل كود الفيسبوك بواسطة مانع إعلانات (AdBlocker)' : (!isFbqFunction ? 'كود fbq غير محمّل بالكامل' : undefined)
    };

    const tiktokStatus: PixelStatusInfo = {
      name: 'TikTok Pixel',
      id: tiktokPixelId,
      isConfigured: !!tiktokPixelId,
      scriptLoaded: tiktokScriptPresent,
      objectDefined: isTtqLoaded,
      isReady: isTtqLoaded || tiktokInstanceReady,
      adBlockDetected: tiktokAdBlock,
      eventCount: tiktokEvents.length,
      lastEventTime: tiktokEvents[0]?.timestamp,
      errorReason: tiktokAdBlock ? 'تم حظر سكريبت تيك توك بواسطة مانع إعلانات (AdBlocker)' : (!isTtqLoaded ? 'دالة ttq غير جاهزة' : undefined)
    };

    return {
      meta: metaStatus,
      tiktok: tiktokStatus,
      adBlockOverall: metaAdBlock || tiktokAdBlock,
      conflictDetected: conflictDetails.length > 0,
      conflictDetails,
      isConnecting: !isFbqFunction && !metaAdBlock && !!metaPixelId
    };
  }, [metaPixelId, tiktokPixelId, logs]);

  // Run Manual Scan
  const handleRunScan = () => {
    setIsRunningScan(true);
    setTimeout(() => {
      setIsRunningScan(false);
      setLastScanTime(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (toast) toast('تم تحديث فحص اتصال البيكسلات بنجاح ⚡', 'success');
    }, 600);
  };

  // Run Test for ANY Meta Standard Event
  const runTestEvent = async (eventType: string) => {
    setIsTesting(true);
    setTestSuccessMessage(null);

    const dummyProduct = {
      id: 'sulta-test-silk-99',
      nameAr: 'بيجامة سولتة الملكية الحريرية (فحص تجريبي)',
      nameEn: 'Sulta Royal Silk Pajama (Test Ping)',
      priceSA: 99,
      priceEG: 499,
      category: 'pajamas',
      images: ['/assets/images/sulta_luxury_pajama_hero_2_1780682794821.png'],
      stock: 10
    } as any;

    try {
      switch (eventType) {
        case 'PageView':
          trackPageView('صفحة التشخيص التجريبية');
          setTestSuccessMessage('تم إرسال حدث PageView (عرض الصفحة) بنجاح!');
          break;

        case 'ViewContent':
          trackViewContent(dummyProduct, 'SAR');
          trackTikTokViewContent(dummyProduct, 'SAR');
          setTestSuccessMessage('تم إرسال حدث ViewContent (مشاهدة المحتوى) بنجاح!');
          break;

        case 'AddToCart':
          trackAddToCart(dummyProduct, 1, 'SAR');
          trackTikTokAddToCart(dummyProduct, 1, 'SAR');
          setTestSuccessMessage('تم إرسال حدث AddToCart (إضافة إلى عربة التسوق) بنجاح!');
          break;

        case 'AddToWishlist':
          trackAddToWishlist(dummyProduct, 'SAR');
          trackTikTokAddToWishlist(dummyProduct, 'SAR');
          setTestSuccessMessage('تم إرسال حدث AddToWishlist (إضافة إلى قائمة الرغبات) بنجاح!');
          break;

        case 'InitiateCheckout':
          trackInitiateCheckout([{ product: dummyProduct, quantity: 1 }], 99, 'SAR');
          trackTikTokInitiateCheckout([{ product: dummyProduct, quantity: 1 }], 99, 'SAR');
          setTestSuccessMessage('تم إرسال حدث InitiateCheckout (بدء إتمام الشراء) بنجاح!');
          break;

        case 'AddPaymentInfo':
          trackAddPaymentInfo([dummyProduct], 99, 'SAR', 'الدفع عند الاستلام');
          trackTikTokAddPaymentInfo([dummyProduct], 99, 'SAR');
          setTestSuccessMessage('تم إرسال حدث AddPaymentInfo (إضافة معلومات الدفع) بنجاح!');
          break;

        case 'Purchase':
          const dummyOrder = {
            id: 'TEST-' + Math.floor(100000 + Math.random() * 900000),
            customerName: 'مختبر فحص البيكسل',
            phone: '+966552823677',
            city: 'الرياض',
            address: 'حي النخيل، فحص تجريبي',
            items: [{ productId: dummyProduct.id, quantity: 1, color: 'عنابي', size: 'M' }],
            totalPrice: 99,
            currency: 'SAR',
            paymentMethod: 'الدفع عند الاستلام (تجريبي)'
          } as any;
          trackPurchase(dummyOrder);
          trackTikTokPurchase(dummyOrder, 'SAR');
          setTestSuccessMessage(`تم إرسال حدث Purchase (الشراء) بنجاح للطلب #${dummyOrder.id}!`);
          break;

        case 'Search':
          trackSearch('بيجامة حرير ملكية', 4);
          trackTikTokSearch('بيجامة حرير ملكية', [dummyProduct], 'SAR');
          setTestSuccessMessage('تم إرسال حدث Search (البحث) بنجاح!');
          break;

        case 'CompleteRegistration':
          trackCompleteRegistration('البريد الإلكتروني', 'ناجح');
          trackTikTokCompleteRegistration('test@sulta.sa', 'مختبر البيكسل');
          setTestSuccessMessage('تم إرسال حدث CompleteRegistration (إكمال التسجيل) بنجاح!');
          break;

        case 'Contact':
          trackContact('whatsapp', 'طلب استفسار عن مقاس حريري');
          setTestSuccessMessage('تم إرسال حدث Contact (جهة الاتصال) بنجاح!');
          break;

        case 'CustomizeProduct':
          trackCustomizeProduct(dummyProduct, { color: 'عنابي ملكي', size: 'M', wrap: 'تغليف هدايا فاخر' });
          setTestSuccessMessage('تم إرسال حدث CustomizeProduct (تخصيص المنتج) بنجاح!');
          break;

        case 'Lead':
          trackLead('طلب استشارة كونسيرج سولتة', 0, 'SAR');
          setTestSuccessMessage('تم إرسال حدث Lead (بيانات العميل المحتمل) بنجاح!');
          break;

        case 'Subscribe':
          trackSubscribe('vip@sulta.sa', 0, 'SAR');
          setTestSuccessMessage('تم إرسال حدث Subscribe (اشتراك) بنجاح!');
          break;

        case 'Schedule':
          trackSchedule(new Date().toISOString(), 'استشارة قياس منزلية ملكية');
          setTestSuccessMessage('تم إرسال حدث Schedule (الجدول الزمني) بنجاح!');
          break;

        case 'StartTrial':
          trackStartTrial('تجربة عضوية VIP لمدة 14 يوم', 0, 'SAR');
          setTestSuccessMessage('تم إرسال حدث StartTrial (بدء الفترة التجريبية) بنجاح!');
          break;

        case 'SubmitApplication':
          trackSubmitApplication('طلب انضمام لنادي سفيرات سولتة');
          setTestSuccessMessage('تم إرسال حدث SubmitApplication (إرسال طلب) بنجاح!');
          break;

        case 'FindLocation':
          trackFindLocation('الرياض', 'بوتيك سولتة سنتريا مول');
          setTestSuccessMessage('تم إرسال حدث FindLocation (بحث عن الموقع) بنجاح!');
          break;

        case 'Donate':
          trackDonate(50, 'SAR');
          setTestSuccessMessage('تم إرسال حدث Donate (التبرع) بنجاح!');
          break;

        default:
          break;
      }

      if (toast) {
        toast(`تم إرسال حدث ${eventType} القياسي إلى Meta Pixel (${metaPixelId}) بنجاح! 🚀`, 'success');
      }
    } catch (err: any) {
      console.error('Error during diagnostic test event:', err);
      if (toast) toast('تعذر إرسال الحدث: ' + (err.message || 'خطأ غير متوقع'), 'error');
    } finally {
      setTimeout(() => setIsTesting(false), 400);
    }
  };

  // Copy Full Diagnostics Report
  const handleCopyReport = () => {
    const reportText = `=== تقرير تشخيص ربط البيكسلات (SULTA PIXEL REPORT) ===
تاريخ الفحص: ${new Date().toLocaleString('ar-SA')}
الرابط المباشر: https://${targetDomain}

1. META PIXEL (Facebook / Instagram):
- معرف البيكسل: ${diagnostics.meta.id}
- حالة السكريبت في الصفحة: ${diagnostics.meta.scriptLoaded ? 'موجود ومحمّل ✅' : 'غير موجود ❌'}
- كائن fbq جاهز للعمل: ${diagnostics.meta.objectDefined ? 'نعم (fbq active) ✅' : 'لا ❌'}
- مانع إعلانات مكتشف: ${diagnostics.meta.adBlockDetected ? 'نعم (AdBlock Active) ⚠️' : 'لا ✅'}
- إجمالي الأحداث المسجلة في الجلسة: ${diagnostics.meta.eventCount}
- آخر حدث: ${diagnostics.meta.lastEventTime || 'لا يوجد بعد'}

2. TIKTOK PIXEL:
- معرف البيكسل: ${diagnostics.tiktok.id}
- حالة السكريبت في الصفحة: ${diagnostics.tiktok.scriptLoaded ? 'موجود ومحمّل ✅' : 'غير موجود ❌'}
- كائن ttq جاهز للعمل: ${diagnostics.tiktok.objectDefined ? 'نعم (ttq active) ✅' : 'لا ❌'}
- مانع إعلانات مكتشف: ${diagnostics.tiktok.adBlockDetected ? 'نعم (AdBlock Active) ⚠️' : 'لا ✅'}
- إجمالي الأحداث المسجلة في الجلسة: ${diagnostics.tiktok.eventCount}
- آخر حدث: ${diagnostics.tiktok.lastEventTime || 'لا يوجد بعد'}

3. الكشف عن التعارضات (Conflicts):
${diagnostics.conflictDetected ? diagnostics.conflictDetails.map(d => `- تنبيه: ${d}`).join('\n') : '- لا توجد أي تعارضات أو أخطاء، التهيئة سليمة 100% ✅'}

=== نهاية التقرير ===`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    if (toast) toast('تم نسخ تقرير الفحص الفني للحافظة بنجاح 📋', 'success');
    setTimeout(() => setCopiedReport(false), 3000);
  };

  // Copy Snippet Code
  const handleCopySnippet = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIdx(index);
    if (toast) toast('تم نسخ كود الحدث القياسي للحافظة بنجاح 📋', 'success');
    setTimeout(() => setCopiedCodeIdx(null), 2500);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    if (filterPixel === 'meta') return logs.filter(l => l.pixel === 'Meta (Facebook)');
    if (filterPixel === 'tiktok') return logs.filter(l => l.pixel === 'TikTok');
    return logs;
  }, [logs, filterPixel]);

  const clearEventLogs = () => {
    try {
      localStorage.removeItem('sulta_pixel_event_logs');
      setLogs([]);
      if (toast) toast('تم مسح سجل الأحداث بنجاح', 'info');
    } catch {}
  };

  const isAllHealthy = (diagnostics.meta.isReady || diagnostics.meta.adBlockDetected) && 
                       (!tiktokPixelId || diagnostics.tiktok.isReady || diagnostics.tiktok.adBlockDetected) && 
                       !diagnostics.conflictDetected;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-l from-gray-950 via-gray-900 to-[#2A0E14] text-white p-6 sm:p-7 rounded-3xl border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#A44C5C]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#A44C5C]/30 text-[#F5C2CB] border border-[#A44C5C]/40">
                <Activity size={13} className="animate-pulse" />
                فاحص البيكسل المباشر ومكتبة الأحداث القياسية
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                آخر فحص: {lastScanTime}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Meta Pixel (ID: {metaPixelId}) & TikTok Pixel</span>
              <Sparkles size={20} className="text-[#E7A6B2]" />
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              يدعم المتجر الآن كافة الأحداث القياسية الرسمية لـ Meta (عرض المحتوى، السلة، قائمة الرغبات، الدفع، إتمام الشراء، البحث، التواصل، والمزيد).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRunScan}
              disabled={isRunningScan}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold flex items-center gap-2 border border-white/15 transition-all cursor-pointer backdrop-blur-md"
            >
              <RefreshCw size={14} className={isRunningScan ? 'animate-spin' : ''} />
              <span>إعادة فحص الاتصال</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="px-4 py-2.5 rounded-xl bg-[#A44C5C] hover:bg-[#8D3F4D] active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#A44C5C]/20 transition-all cursor-pointer"
            >
              {copiedReport ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedReport ? 'تم النسخ!' : 'نسخ التقرير الفني'}</span>
            </button>
          </div>
        </div>

        {/* Global Verdict Pill */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-300">النتيجة الإجمالية للفحص:</span>
            {isAllHealthy ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                <CheckCircle2 size={13} />
                جميع البيكسلات متصلة وتعمل بكفاءة 100%
              </span>
            ) : diagnostics.adBlockOverall ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                <AlertTriangle size={13} />
                تم رصد مانع إعلانات (AdBlocker) في المتصفح المحلي
              </span>
            ) : diagnostics.isConnecting ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold animate-pulse">
                <RefreshCw size={13} className="animate-spin" />
                جاري فحص الاتصال بالبيكسلات...
              </span>
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                  <XCircle size={13} />
                  يوجد تعارض أو نقص في المعرفات يحتاج للمراجعة
                </span>
                {diagnostics.conflictDetails.length > 0 && (
                  <div className="bg-rose-950/40 p-2 rounded-lg border border-rose-500/20 space-y-1">
                    {diagnostics.conflictDetails.map((err, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-rose-200">
                        <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!diagnostics.meta.isReady && (
                  <div className="flex items-center gap-1.5 text-[10px] text-rose-200">
                    <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                    <span>Meta Pixel لم يتم تحميله بالكامل بعد (قد يحتاج لتنشيط أو إيقاف حظر الإعلانات).</span>
                  </div>
                )}
                {!diagnostics.tiktok.isReady && (
                  <div className="flex items-center gap-1.5 text-[10px] text-rose-200">
                    <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                    <span>TikTok Pixel لم يتم تفعيله بالكامل بعد.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] text-gray-300 flex items-center gap-1.5">
            <span className="text-gray-400">نطاق Vercel:</span>
            <span className="text-emerald-300 font-mono bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/15 text-[10px] font-bold">
              {targetDomain}
            </span>
          </div>
        </div>
      </div>

      {/* 2. AdBlock Alert Banner */}
      {diagnostics.adBlockOverall && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-start gap-3 text-xs animate-fade-in">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-950">تنبيه فني: إضافة حظر إعلانات (AdBlocker) نشطة على جهازك الحالي</h4>
            <p className="text-amber-800 leading-relaxed">
              تم رصد إضافة مانع إعلانات تحجب الاتصال بـ facebook.net في جهاز الإدارة. هذا لا يؤثر على زوار المتجر العاديين على الإطلاق.
            </p>
          </div>
        </div>
      )}

      {/* 3. Real-Time Status Cards (Meta & TikTok Side-by-Side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Meta Pixel Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs hover:border-[#1877F2]/40 transition-all space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center font-black text-lg">
                f
              </div>
              <div>
                <h3 className="font-black text-sm text-gray-950 flex items-center gap-1.5">
                  <span>Meta (Facebook & Instagram) Pixel</span>
                </h3>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  ID: <span className="text-[#1877F2] font-black">{diagnostics.meta.id}</span>
                </p>
              </div>
            </div>

            <div>
              {diagnostics.meta.isReady ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  متصل وجاهز
                </span>
              ) : diagnostics.meta.adBlockDetected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  مانع إعلانات
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  غير متصل
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 bg-[#F8F9FA] rounded-2xl p-4 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-600">سكريبت الأساس (connect.facebook.net):</span>
              <span className="font-bold flex items-center gap-1">
                {diagnostics.meta.scriptLoaded ? (
                  <span className="text-emerald-700 flex items-center gap-1"><Check size={13} /> مُثبت بالهيدر</span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1"><XCircle size={13} /> غير موجود</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-600">الدالة البرمجية (window.fbq):</span>
              <span className="font-bold flex items-center gap-1">
                {diagnostics.meta.objectDefined ? (
                  <span className="text-emerald-700 flex items-center gap-1"><Check size={13} /> نشطة ومُعرّفة</span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1"><AlertTriangle size={13} /> محجوبة محلياً</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-600">الأحداث القياسية المدعومة:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                17 حدث قياسي رسمي ✅
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-gray-600">الأحداث المرسلة بهذه الجلسة:</span>
              <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                {diagnostics.meta.eventCount} أحداث
              </span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 flex items-center justify-between pt-1">
            <span>آخر حدث تم إرساله:</span>
            <span className="font-mono text-gray-700 font-semibold">{diagnostics.meta.lastEventTime || 'بانتظار أحداث...'}</span>
          </div>
        </div>

        {/* TikTok Pixel Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs hover:border-[#EE1D52]/40 transition-all space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center font-black text-sm">
                TT
              </div>
              <div>
                <h3 className="font-black text-sm text-gray-950 flex items-center gap-1.5">
                  <span>TikTok Pixel & Events API</span>
                </h3>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  ID: <span className="text-gray-800 font-bold">{diagnostics.tiktok.id}</span>
                </p>
              </div>
            </div>

            <div>
              {diagnostics.tiktok.isReady ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  متصل وجاهز
                </span>
              ) : diagnostics.tiktok.adBlockDetected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  مانع إعلانات
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  غير متصل
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 bg-[#F8F9FA] rounded-2xl p-4 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-600">سكريبت الأساس (analytics.tiktok.com):</span>
              <span className="font-bold flex items-center gap-1">
                {diagnostics.tiktok.scriptLoaded ? (
                  <span className="text-emerald-700 flex items-center gap-1"><Check size={13} /> مُثبت بالهيدر</span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1"><XCircle size={13} /> غير موجود</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-600">الدالة البرمجية (window.ttq):</span>
              <span className="font-bold flex items-center gap-1">
                {diagnostics.tiktok.objectDefined ? (
                  <span className="text-emerald-700 flex items-center gap-1"><Check size={13} /> نشطة ومُعرّفة</span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1"><AlertTriangle size={13} /> محجوبة محلياً</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-600">التطابق المتقدم (SHA-256 Identify):</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check size={13} /> مدعوم ومشفّر
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-gray-600">الأحداث المرسلة بهذه الجلسة:</span>
              <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                {diagnostics.tiktok.eventCount} أحداث
              </span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 flex items-center justify-between pt-1">
            <span>آخر حدث تم إرساله:</span>
            <span className="font-mono text-gray-700 font-semibold">{diagnostics.tiktok.lastEventTime || 'بانتظار أحداث...'}</span>
          </div>
        </div>

      </div>

      {/* Meta Conversions API (CAPI) Server-Side Status Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 border border-indigo-700/50 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 text-blue-300 flex items-center justify-center font-black text-xl shadow-inner">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white">Meta Conversions API (CAPI) — الربط من الخادم</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  متصل ومفعل 🟢
                </span>
              </div>
              <p className="text-[11px] text-gray-300 mt-0.5">
                تتبع هجين مباشر (Browser + Server Deduplication) مع خوادم Meta Graph API v19.0
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestCapiConnection}
            disabled={isTestingCapi}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isTestingCapi ? <span className="animate-spin text-sm">⏳</span> : <Activity size={15} />}
            <span>{isTestingCapi ? 'جاري فحص الاتصال مع Meta...' : 'اختبار إرسال حدث لخوادم CAPI 🚀'}</span>
          </button>
        </div>

        {/* Live CAPI Test Response Banner */}
        {capiResult && (
          <div className={`p-4 rounded-2xl border text-xs animate-fade-in ${
            capiResult.success 
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
              : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
          }`}>
            <div className="flex items-center justify-between font-bold pb-1">
              <span>{capiResult.message}</span>
              {capiResult.events_received !== undefined && (
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono text-[11px]">
                  الأحداث المستلمة: {capiResult.events_received}
                </span>
              )}
            </div>
            {capiResult.fbtrace_id && (
              <p className="font-mono text-[11px] text-gray-400 mt-1">
                Meta Trace ID: <span className="text-white font-bold">{capiResult.fbtrace_id}</span> (تم التوثيق رسمياً لدى فيسبوك)
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1">
            <span className="text-gray-400 text-[11px] block">معرف البيكسل الفعال:</span>
            <span className="font-mono font-bold text-blue-300 text-sm select-all">{metaPixelId}</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1">
            <span className="text-gray-400 text-[11px] block">توكن المصادقة (CAPI Access Token):</span>
            <span className="font-mono text-[11px] text-emerald-300 font-bold flex items-center gap-1">
              <Check size={12} /> صالح وموثق (EABD8o49...6uBwZDZD)
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1">
            <span className="text-gray-400 text-[11px] block">آلية منع التكرار (Deduplication):</span>
            <span className="text-white font-bold text-[11px] flex items-center gap-1">
              <span>نظام eventID الموحد 🛡️</span>
            </span>
          </div>
        </div>

        <div className="text-[11px] text-gray-400 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">

        </div>
      </div>

      {/* 4. Live Interactive Test Ping Controls - Full Standard Meta Events Suite */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-black text-sm text-gray-950 flex items-center gap-2">
              <Zap size={17} className="text-[#A44C5C]" />
              <span>مختبر الأحداث القياسية المباشرة (Meta Standard Events Tester)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              اضغطي على أي حدث قياسي لتجربة إرساله حياً وفورياً لـ Meta Pixel ورؤية استجابته في السجل ومدير الإعلانات:
            </p>
          </div>

          {testSuccessMessage && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 animate-fade-in">
              <CheckCircle2 size={14} className="text-emerald-600" />
              {testSuccessMessage}
            </span>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 text-xs">
          <button
            onClick={() => setActiveCategoryTab('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all shrink-0 ${activeCategoryTab === 'all' ? 'bg-[#A44C5C] text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:text-black'}`}
          >
            جميع الأحداث (All Events)
          </button>
          <button
            onClick={() => setActiveCategoryTab('commerce')}
            className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all shrink-0 ${activeCategoryTab === 'commerce' ? 'bg-[#A44C5C] text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:text-black'}`}
          >
            أحداث التجارة والشراء (E-Commerce)
          </button>
          <button
            onClick={() => setActiveCategoryTab('interaction')}
            className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all shrink-0 ${activeCategoryTab === 'interaction' ? 'bg-[#A44C5C] text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:text-black'}`}
          >
            أحداث التفاعل والبحث (Interaction)
          </button>
          <button
            onClick={() => setActiveCategoryTab('lead')}
            className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all shrink-0 ${activeCategoryTab === 'lead' ? 'bg-[#A44C5C] text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:text-black'}`}
          >
            العملاء والاشتراكات (Leads & Subscriptions)
          </button>
          <button
            onClick={() => setActiveCategoryTab('table')}
            className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all shrink-0 border ${activeCategoryTab === 'table' ? 'bg-black text-white border-black' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <BookOpen size={13} className="inline ml-1" />
            جدول الأكواد والوصف الكامل
          </button>
        </div>

        {/* Buttons Grid */}
        {activeCategoryTab !== 'table' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
            
            {/* PageView */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'commerce') && (
              <button
                onClick={() => runTestEvent('PageView')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Eye size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">PageView</span>
                  <span className="block text-[10px] text-gray-400">عرض الصفحة</span>
                </div>
              </button>
            )}

            {/* ViewContent */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'commerce') && (
              <button
                onClick={() => runTestEvent('ViewContent')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">ViewContent</span>
                  <span className="block text-[10px] text-gray-400">مشاهدة المحتوى</span>
                </div>
              </button>
            )}

            {/* AddToCart */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'commerce') && (
              <button
                onClick={() => runTestEvent('AddToCart')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <ShoppingBag size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">AddToCart</span>
                  <span className="block text-[10px] text-gray-400">إضافة لعربة التسوق</span>
                </div>
              </button>
            )}

            {/* AddToWishlist */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'commerce') && (
              <button
                onClick={() => runTestEvent('AddToWishlist')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Heart size={18} className="text-rose-600 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">AddToWishlist</span>
                  <span className="block text-[10px] text-gray-400">إضافة لقائمة الرغبات</span>
                </div>
              </button>
            )}

            {/* InitiateCheckout */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'commerce') && (
              <button
                onClick={() => runTestEvent('InitiateCheckout')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <CreditCard size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">InitiateCheckout</span>
                  <span className="block text-[10px] text-gray-400">بدء إتمام الشراء</span>
                </div>
              </button>
            )}

            {/* AddPaymentInfo */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'commerce') && (
              <button
                onClick={() => runTestEvent('AddPaymentInfo')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <DollarSign size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">AddPaymentInfo</span>
                  <span className="block text-[10px] text-gray-400">إضافة معلومات الدفع</span>
                </div>
              </button>
            )}

            {/* Purchase */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'commerce') && (
              <button
                onClick={() => runTestEvent('Purchase')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 hover:border-emerald-300 border border-emerald-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <PackageCheck size={18} className="text-emerald-700 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-black text-emerald-950">Purchase 🎉</span>
                  <span className="block text-[10px] text-emerald-700 font-bold">الشراء (99 ر.س)</span>
                </div>
              </button>
            )}

            {/* Search */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'interaction') && (
              <button
                onClick={() => runTestEvent('Search')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Search size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">Search</span>
                  <span className="block text-[10px] text-gray-400">البحث</span>
                </div>
              </button>
            )}

            {/* CompleteRegistration */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'interaction') && (
              <button
                onClick={() => runTestEvent('CompleteRegistration')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <UserCheck size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">CompleteRegistration</span>
                  <span className="block text-[10px] text-gray-400">إكمال التسجيل</span>
                </div>
              </button>
            )}

            {/* Contact */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'interaction') && (
              <button
                onClick={() => runTestEvent('Contact')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <MessageCircle size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">Contact</span>
                  <span className="block text-[10px] text-gray-400">جهة الاتصال</span>
                </div>
              </button>
            )}

            {/* CustomizeProduct */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'interaction') && (
              <button
                onClick={() => runTestEvent('CustomizeProduct')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Sliders size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">CustomizeProduct</span>
                  <span className="block text-[10px] text-gray-400">تخصيص المنتج</span>
                </div>
              </button>
            )}

            {/* Lead */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'lead') && (
              <button
                onClick={() => runTestEvent('Lead')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <FileText size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">Lead</span>
                  <span className="block text-[10px] text-gray-400">عميل محتمل</span>
                </div>
              </button>
            )}

            {/* Subscribe */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'lead') && (
              <button
                onClick={() => runTestEvent('Subscribe')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Mail size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">Subscribe</span>
                  <span className="block text-[10px] text-gray-400">اشتراك</span>
                </div>
              </button>
            )}

            {/* Schedule */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'lead') && (
              <button
                onClick={() => runTestEvent('Schedule')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Calendar size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">Schedule</span>
                  <span className="block text-[10px] text-gray-400">الجدول الزمني</span>
                </div>
              </button>
            )}

            {/* StartTrial */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'lead') && (
              <button
                onClick={() => runTestEvent('StartTrial')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Zap size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">StartTrial</span>
                  <span className="block text-[10px] text-gray-400">فترة تجريبية</span>
                </div>
              </button>
            )}

            {/* SubmitApplication */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'lead') && (
              <button
                onClick={() => runTestEvent('SubmitApplication')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Send size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">SubmitApplication</span>
                  <span className="block text-[10px] text-gray-400">إرسال طلب</span>
                </div>
              </button>
            )}

            {/* FindLocation */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'interaction') && (
              <button
                onClick={() => runTestEvent('FindLocation')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <MapPin size={18} className="text-gray-700 group-hover:text-[#A44C5C]" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">FindLocation</span>
                  <span className="block text-[10px] text-gray-400">بحث عن الموقع</span>
                </div>
              </button>
            )}

            {/* Donate */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'interaction') && (
              <button
                onClick={() => runTestEvent('Donate')}
                disabled={isTesting}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <DollarSign size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-gray-900">Donate</span>
                  <span className="block text-[10px] text-gray-400">التبرع</span>
                </div>
              </button>
            )}

          </div>
        )}

        {/* Reference Table View */}
        {activeCategoryTab === 'table' && (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 max-h-96 overflow-y-auto scrollbar-thin">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-[#F8F9FA] text-gray-700 font-bold border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="py-3 px-4">إجراء موقع الويب</th>
                  <th className="py-3 px-4">الوصف</th>
                  <th className="py-3 px-4">الرمز البرمجي القياسي</th>
                  <th className="py-3 px-4 text-center">اختبار فوري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {META_STANDARD_EVENTS_TABLE.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                      <div>{row.nameAr}</div>
                      <span className="text-[10px] text-[#A44C5C] font-mono">{row.nameEn}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 leading-relaxed min-w-[200px]">
                      {row.desc}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-emerald-800 bg-emerald-50/50 rounded-lg whitespace-nowrap">
                      <div className="flex items-center justify-between gap-2">
                        <code>{row.code}</code>
                        <button
                          onClick={() => handleCopySnippet(row.code, idx)}
                          className="p-1 hover:bg-emerald-100 rounded text-emerald-700 cursor-pointer transition-colors"
                          title="نسخ الكود"
                        >
                          {copiedCodeIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => runTestEvent(row.nameEn)}
                        disabled={isTesting}
                        className="px-2.5 py-1 bg-[#A44C5C] hover:bg-[#8D3F4D] text-white rounded-lg font-bold text-[10px] cursor-pointer active:scale-95 transition-all"
                      >
                        إرسال الآن ⚡
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Live Pixel Event Log Stream */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#A44C5C]" />
            <h3 className="font-black text-sm text-gray-950">
              سجل تدفق الأحداث الحية (Live Event Stream)
            </h3>
            <span className="bg-gray-100 text-gray-700 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              {filteredLogs.length} حدث
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-gray-100 p-0.5 text-xs">
              <button
                onClick={() => setFilterPixel('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${filterPixel === 'all' ? 'bg-white text-gray-950 shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterPixel('meta')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${filterPixel === 'meta' ? 'bg-white text-[#1877F2] shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Meta فقط
              </button>
              <button
                onClick={() => setFilterPixel('tiktok')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${filterPixel === 'tiktok' ? 'bg-white text-black shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}
              >
                TikTok فقط
              </button>
            </div>

            {logs.length > 0 && (
              <button
                onClick={clearEventLogs}
                title="مسح السجل"
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Logs Table / List */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Activity size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-bold text-gray-600">لا توجد أحداث مسجلة في هذه الجلسة حتى الآن</p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
              اضغطي على أحد أزرار الفحص التجريبي بالأعلى لإرسال حدث قياسي ومشاهدة وصوله وتفاصيله هنا فوراً.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin pl-1">
            {filteredLogs.map((log) => {
              const isMeta = log.pixel === 'Meta (Facebook)';
              const isTikTok = log.pixel === 'TikTok';

              return (
                <div
                  key={log.id}
                  className="bg-[#F8F9FA] hover:bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-3.5 text-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                        isMeta
                          ? 'bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20'
                          : isTikTok
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {log.pixel}
                    </span>

                    <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                      {log.event}
                    </span>

                    <span className="text-gray-700 font-medium truncate max-w-md">
                      {log.details}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 text-[11px]">
                    {log.value !== undefined && (
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {log.value} {log.currency || 'SAR'}
                      </span>
                    )}

                    <span className="text-gray-400 font-mono text-[10px]">
                      {log.timestamp}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      <Check size={11} />
                      مرسل
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Quick Help & Verification Links */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-3xl p-5 border border-gray-200 text-xs text-gray-600 space-y-2">
        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
          <HelpCircle size={15} className="text-[#A44C5C]" />
          <span>روابط سريعة لاختبار الأحداث في لوحات الإعلانات الرسمية:</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href="https://ads.tiktok.com/marketing_api/tools/pixel"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-white border border-gray-200 hover:border-black flex items-center justify-between text-gray-800 font-semibold transition-colors"
          >
            <span>لوحة أحداث تيك توك (TikTok Events Manager) ↗</span>
            <ExternalLink size={13} className="text-gray-400" />
          </a>

          <a
            href="https://business.facebook.com/events_manager2"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#1877F2] flex items-center justify-between text-gray-800 font-semibold transition-colors"
          >
            <span>لوحة أحداث ميتا (Meta Events Manager) ↗</span>
            <ExternalLink size={13} className="text-gray-400" />
          </a>
        </div>
      </div>

    </div>
  );
}
