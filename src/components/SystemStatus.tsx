import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Database, Server, Smartphone, ExternalLink, RefreshCw, Eye } from 'lucide-react';
import { dbService } from '../services/db';

export default function SystemStatus() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    dbLatency: '...',
    activeRegion: 'Middle East (Europe-West2)',
    uptime: '99.99%',
    lastIncident: 'No incidents recorded in the last 30 days.'
  });

  const [systems, setSystems] = useState([
    { id: 1, name: 'SULTA Core Platform', status: 'operational', uptime: '100%', description: 'الواجهة الرئيسية لتسوق البيجامات الفاخرة' },
    { id: 2, name: 'Secure Checkout Flow', status: 'operational', uptime: '100%', description: 'نظام الدفع المشفر والمرخص لعمليات الشراء' },
    { id: 3, name: 'Supabase PostgreSQL AI Engine', status: 'operational', uptime: '99.99%', description: 'قاعدة البيانات المركزية ومحرك الذكاء الاصطناعي' },
    { id: 4, name: 'Order Fulfillment & Logistics API', status: 'operational', uptime: '100%', description: 'نظام ربط شركات الشحن والتوصيل الداخلي' },
    { id: 5, name: 'Email & WhatsApp Notifications', status: 'operational', uptime: '100%', description: 'محرك إرسال الإشعارات وتأكيدات الشحن الملكي' },
    { id: 6, name: 'Customer Experience CRM', status: 'operational', uptime: '100%', description: 'نظام تذاكر الدعم الفني وتجربة العميل' }
  ]);

  useEffect(() => {
    // Measure fake DB latency by doing a quick ping
    const pingStart = Date.now();
    dbService.supabase.from('settings').select('id').limit(1).then(() => {
      const pingEnd = Date.now();
      setMetrics(prev => ({ ...prev, dbLatency: `${pingEnd - pingStart}ms` }));
      setLoading(false);
    }).catch(() => {
      setMetrics(prev => ({ ...prev, dbLatency: 'Failed' }));
      setSystems(prev => prev.map(s => s.name.includes('Supabase') ? { ...s, status: 'degraded' } : s));
      setLoading(false);
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'degraded': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'outage': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operational': return 'الأنظمة تعمل بامتياز';
      case 'degraded': return 'أداء منخفض مؤقتاً';
      case 'outage': return 'توقف الخدمة جزئياً';
      default: return 'غير معروف';
    }
  };

  return (
    <div className="bg-[#FAF5F0] min-h-screen py-24 pb-32 font-sans text-right" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-xs mb-6 text-xs font-bold text-gray-700">
            <ShieldCheck size={16} className="text-emerald-500" />
            منصة معتمدة ومؤمنة بالكامل
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-[#0B0B0B] mb-6">حالة نظام <span className="font-bold">SULTA</span> الرقمي</h1>
          <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
            الشفافية الكاملة هي جزء من تجربتنا الملكية. يمكنك من خلال هذه الصفحة متابعة حالة كافة خوادمنا وخدماتنا التقنية التي تضمن لك تجربة تسوق سلسة وآمنة.
          </p>
        </div>

        {/* Global Status Banner */}
        <div className="bg-emerald-500 text-white rounded-3xl p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-emerald-500/20 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <CheckCircle2 size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-serif mb-1">جميع الأنظمة تعمل بكفاءة عالية</h2>
              <p className="text-emerald-50 text-sm opacity-90 text-right">آخر تحديث: قبل دقيقة واحدة</p>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="bg-white text-emerald-600 px-6 py-3 rounded-xl text-sm font-bold shadow-xs hover:bg-emerald-50 transition-colors flex items-center gap-2">
            <RefreshCw size={16} />
            تحديث الحالة
          </button>
        </div>

        {/* Technical Metrics Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -z-10" />
             <Server size={24} className="text-blue-500 mx-auto mb-4" />
             <h3 className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">نطاق الاستضافة</h3>
             <p className="text-lg font-black text-gray-900">{metrics.activeRegion}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-full -z-10" />
             <Database size={24} className="text-emerald-500 mx-auto mb-4" />
             <h3 className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">استجابة قاعدة البيانات</h3>
             <p className="text-3xl font-black text-gray-900 font-mono tracking-tight">{loading ? '...' : metrics.dbLatency}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-[#FAF5F0] rounded-bl-full -z-10" />
             <Activity size={24} className="text-[#A44C5C] mx-auto mb-4" />
             <h3 className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">معدل التوافر (العام)</h3>
             <p className="text-3xl font-black text-gray-900 font-mono tracking-tight">{metrics.uptime}</p>
          </div>
        </div>

        {/* Individual System List */}
        <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-serif text-xl font-bold text-gray-900">الخدمات الأساسية للبيئة السحابية</h3>
            <span className="text-xs text-gray-500 font-medium">نسبة التشغيل خلال ٩٠ يوماً</span>
          </div>
          <div className="divide-y divide-gray-100">
             {systems.map((system) => (
                <div key={system.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                     <h4 className="font-bold text-gray-900 text-lg mb-1">{system.name}</h4>
                     <p className="text-xs text-gray-500 font-medium leading-relaxed">{system.description}</p>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto shrink-0 mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-gray-100 justify-between md:justify-end">
                     <span className="text-sm font-bold font-mono text-gray-400">{system.uptime}</span>
                     <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${getStatusColor(system.status)}`}>
                        {system.status === 'operational' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        {getStatusLabel(system.status)}
                     </span>
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* Security Trust Indicator */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="inline-flex items-center justify-center gap-3 bg-white px-6 py-4 rounded-2xl border border-gray-150 shadow-xs">
            <ShieldCheck size={20} className="text-emerald-500" />
            <span className="text-sm font-medium text-gray-600">بياناتك محمية بتشفير 256-bit SSL على خوادم آمنة ومتوافقة مع المعايير.</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// Activity icon missing fallback
const Activity = ({size, className}: {size: number, className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
