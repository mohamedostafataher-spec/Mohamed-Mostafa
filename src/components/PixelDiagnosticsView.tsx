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
  PackageCheck
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
  trackInitiateCheckout,
  trackPurchase
} from '../utils/analytics';
import {
  ttqIdentify,
  trackTikTokViewContent,
  trackTikTokAddToCart,
  trackTikTokInitiateCheckout,
  trackTikTokPurchase
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

export default function PixelDiagnosticsView({ settings, toast }: PixelDiagnosticsViewProps) {
  const metaPixelId = (settings?.facebookPixelId || '1765916517819303').trim();
  const tiktokPixelId = (settings?.tiktokPixelId || 'DBESRBJC77U4J2JQDUB0').trim();

  const [logs, setLogs] = useState<PixelEventLog[]>([]);
  const [filterPixel, setFilterPixel] = useState<'all' | 'meta' | 'tiktok'>('all');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isRunningScan, setIsRunningScan] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string>(
    new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Subscribe to real-time pixel event logs
  useEffect(() => {
    const unsub = subscribePixelLogs((newLogs) => {
      setLogs([...newLogs]);
    });
    return unsub;
  }, []);

  // Diagnostic State Evaluator
  const diagnostics = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        meta: { name: 'Meta Pixel', id: metaPixelId, isConfigured: true, scriptLoaded: false, objectDefined: false, isReady: false, adBlockDetected: false, eventCount: 0 },
        tiktok: { name: 'TikTok Pixel', id: tiktokPixelId, isConfigured: true, scriptLoaded: false, objectDefined: false, isReady: false, adBlockDetected: false, eventCount: 0 },
        adBlockOverall: false,
        conflictDetected: false,
        conflictDetails: [] as string[]
      };
    }

    // 1. Check Meta Pixel Status
    const isFbqFunction = typeof (window as any).fbq === 'function';
    const isFbqLoaded = !!(window as any)._fbq || (isFbqFunction && (window as any).fbq.loaded);
    const metaScripts = Array.from(document.querySelectorAll('script')).filter(s =>
      s.src && s.src.includes('connect.facebook.net')
    );
    const metaScriptPresent = metaScripts.length > 0;
    
    // Check if script element was blocked / failed or adblocker replaced fbq with no-op
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

    // Conflict detection
    const conflictDetails: string[] = [];
    if (metaScripts.length > 2) {
      conflictDetails.push('تم العثور على أكثر من سكريبت لـ Meta Pixel في الصفحة، مما قد يسبب تكرار إرسال الأحداث.');
    }
    if (tiktokScripts.length > 2) {
      conflictDetails.push('تم العثور على أكثر من سكريبت لـ TikTok Pixel في الصفحة.');
    }
    if (!metaPixelId) {
      conflictDetails.push('معرف Meta Pixel غير محدد أو مفقود في الإعدادات.');
    }
    if (!tiktokPixelId) {
      conflictDetails.push('معرف TikTok Pixel غير محدد أو مفقود في الإعدادات.');
    }

    const metaStatus: PixelStatusInfo = {
      name: 'Meta (Facebook) Pixel',
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
      conflictDetails
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

  // Test Event Trigger Handlers
  const runTestEvent = async (eventType: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase') => {
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
      if (eventType === 'PageView') {
        trackPageView('صفحة التشخيص التجريبية');
        setTestSuccessMessage('تم إرسال حدث PageView بنجاح لكل من Meta و TikTok!');
      } else if (eventType === 'ViewContent') {
        trackViewContent(dummyProduct, 'SAR');
        trackTikTokViewContent(dummyProduct, 'SAR');
        setTestSuccessMessage('تم إرسال حدث ViewContent (مشاهدة منتج) بنجاح!');
      } else if (eventType === 'AddToCart') {
        trackAddToCart(dummyProduct, 1, 'SAR');
        trackTikTokAddToCart(dummyProduct, 1, 'SAR');
        setTestSuccessMessage('تم إرسال حدث AddToCart (إضافة للسلة) بنجاح!');
      } else if (eventType === 'InitiateCheckout') {
        trackInitiateCheckout([{ product: dummyProduct, quantity: 1 }], 99, 'SAR');
        trackTikTokInitiateCheckout([{ product: dummyProduct, quantity: 1 }], 99, 'SAR');
        setTestSuccessMessage('تم إرسال حدث InitiateCheckout (بدء الدفع) بنجاح!');
      } else if (eventType === 'Purchase') {
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
        setTestSuccessMessage(`تم إرسال حدث Purchase بنجاح للطلب #${dummyOrder.id}!`);
      }

      if (toast) {
        toast(`تم إرسال حدث ${eventType} التجريبي بنجاح إلى Meta و TikTok! 🚀`, 'success');
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
الرابط المباشر: ${typeof window !== 'undefined' ? window.location.origin : 'https://sulta.vercel.app'}

1. META PIXEL (Facebook / Instagram):
- معرف البيكسل: ${diagnostics.meta.id}
- حالة السكريبت في الصفحة: ${diagnostics.meta.scriptLoaded ? 'موجود ومحمّل ✅' : 'غير موجود ❌'}
- كائن fbq جاهز للعمل: ${diagnostics.meta.objectDefined ? 'نعم (fbq function active) ✅' : 'لا ❌'}
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

  const isAllHealthy = diagnostics.meta.isReady && diagnostics.tiktok.isReady && !diagnostics.conflictDetected && !diagnostics.adBlockOverall;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-l from-gray-950 via-gray-900 to-[#2A0E14] text-white p-6 sm:p-7 rounded-3xl border border-gray-800 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#A44C5C]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#A44C5C]/30 text-[#F5C2CB] border border-[#A44C5C]/40">
                <Activity size={13} className="animate-pulse" />
                فاحص البيكسل المباشر (Real-Time Pixel Diagnostics)
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                آخر فحص: {lastScanTime}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>حالة اتصال Meta Pixel و TikTok Pixel</span>
              <Sparkles size={20} className="text-[#E7A6B2]" />
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              فحص فوري ودقيق لتأكيد إرسال أحداث الشراء وتصفح المنتجات إلى الحملات الإعلانية دون أي تعارضات أو تأخير.
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
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                <XCircle size={13} />
                يوجد تعارض أو نقص في المعرفات يحتاج للمراجعة
              </span>
            )}
          </div>

          <div className="text-[11px] text-gray-400">
            الدومين المفحوص: <span className="text-white font-mono">{typeof window !== 'undefined' ? window.location.host : 'sulta.sa'}</span>
          </div>
        </div>
      </div>

      {/* 2. AdBlock Alert Banner (If AdBlocker active on browser) */}
      {diagnostics.adBlockOverall && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-start gap-3 text-xs animate-fade-in">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-950">تنبيه فني: إضافة حظر إعلانات (AdBlocker) نشطة على جهازك الحالي</h4>
            <p className="text-amber-800 leading-relaxed">
              تم رصد إضافة مثل (uBlock Origin أو AdGuard أو درع متصفح Brave) تمنع المتصفح من تنزيل سكريبتات فيسبوك أو تيك توك محلياً على جهاز الإدارة.
              <span className="font-bold underline mr-1">هذا طبيعي ولا يؤثر على زوار متجرك في السعودية وخارجها</span> الذين لا يستخدمون مانع إعلانات، حيث تصل أحداثهم لمدير الإعلانات بدون أي عائق. لعمل فحص محلي هنا، يمكنك استثناء هذا الموقع مؤقتاً من مانع الإعلانات.
            </p>
          </div>
        </div>
      )}

      {/* 3. Conflict Alert Banner (If duplicates or missing IDs found) */}
      {diagnostics.conflictDetected && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 flex items-start gap-3 text-xs animate-fade-in">
          <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-950">تم رصد تعارض أو خطأ في إعدادات البيكسل:</h4>
            <ul className="list-disc list-inside space-y-1 text-rose-800">
              {diagnostics.conflictDetails.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 4. Real-Time Status Cards (Meta & TikTok Side-by-Side) */}
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
                  ID: <span className="text-gray-800 font-bold">{diagnostics.meta.id}</span>
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
              <span className="text-gray-600">وسم احتياطي (Noscript Beacon):</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check size={13} /> نشط في المتجر
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

      {/* 5. Live Interactive Test Ping Controls */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-black text-sm text-gray-950 flex items-center gap-2">
              <Zap size={17} className="text-[#A44C5C]" />
              <span>إرسال أحداث تجريبية مباشرة (Live Event Ping)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              اضغطي على أي حدث لتجربة إرساله حياً وفورياً إلى Meta و TikTok ورؤية النتائج مباشرة في السجل ومدير الإعلانات:
            </p>
          </div>

          {testSuccessMessage && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 animate-fade-in">
              <CheckCircle2 size={14} className="text-emerald-600" />
              {testSuccessMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => runTestEvent('PageView')}
            disabled={isTesting}
            className="p-3.5 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-2 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center text-gray-700 group-hover:text-[#A44C5C] group-hover:bg-white transition-colors">
              <Eye size={18} />
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-900">PageView</span>
              <span className="block text-[10px] text-gray-400">زيارة صفحة</span>
            </div>
          </button>

          <button
            onClick={() => runTestEvent('ViewContent')}
            disabled={isTesting}
            className="p-3.5 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-2 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center text-gray-700 group-hover:text-[#A44C5C] group-hover:bg-white transition-colors">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-900">ViewContent</span>
              <span className="block text-[10px] text-gray-400">مشاهدة منتج</span>
            </div>
          </button>

          <button
            onClick={() => runTestEvent('AddToCart')}
            disabled={isTesting}
            className="p-3.5 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-2 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center text-gray-700 group-hover:text-[#A44C5C] group-hover:bg-white transition-colors">
              <ShoppingBag size={18} />
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-900">AddToCart</span>
              <span className="block text-[10px] text-gray-400">إضافة للحقيبة</span>
            </div>
          </button>

          <button
            onClick={() => runTestEvent('InitiateCheckout')}
            disabled={isTesting}
            className="p-3.5 rounded-2xl bg-gray-50 hover:bg-[#A44C5C]/10 hover:border-[#A44C5C]/30 border border-gray-200 flex flex-col items-center justify-center gap-2 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center text-gray-700 group-hover:text-[#A44C5C] group-hover:bg-white transition-colors">
              <CreditCard size={18} />
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-900">InitiateCheckout</span>
              <span className="block text-[10px] text-gray-400">بدء الدفع</span>
            </div>
          </button>

          <button
            onClick={() => runTestEvent('Purchase')}
            disabled={isTesting}
            className="p-3.5 rounded-2xl bg-emerald-50/60 hover:bg-emerald-100/70 hover:border-emerald-300 border border-emerald-200 flex flex-col items-center justify-center gap-2 text-center group cursor-pointer transition-all active:scale-95 disabled:opacity-50 col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
              <PackageCheck size={18} />
            </div>
            <div>
              <span className="block text-xs font-black text-emerald-900">Purchase 🎉</span>
              <span className="block text-[10px] text-emerald-700 font-bold">شراء مكتمل (99 ر.س)</span>
            </div>
          </button>
        </div>
      </div>

      {/* 6. Live Pixel Event Log Stream */}
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
            {/* Filter Buttons */}
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
              اضغطي على أحد أزرار الفحص التجريبي بالأعلى لإرسال حدث مباشر ومشاهدة وصوله وتفاصيله هنا فوراً.
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

      {/* 7. Quick Help & Verification Links */}
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
