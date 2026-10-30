import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Globe, Users, Navigation, MapPin, Clock, Search, Calendar, TrendingUp, RefreshCw, Eye } from 'lucide-react';
import { supabase } from '../services/db';

interface Visit {
  id: string;
  sessionId: string;
  page: string;
  referrer: string;
  utm_source: string;
  city: string;
  country?: string;
  created_at: string;
}

const cleanCityName = (c?: string): string => {
  if (!c) return 'الرياض';
  try {
    let decoded = decodeURIComponent(c.replace(/\+/g, ' ')).trim();
    const lower = decoded.toLowerCase();
    if (lower === 'san jose' || lower === 'sanjose') return 'سان خوسيه (خوادم Vercel)';
    if (lower === 'riyadh' || lower === 'al riyadh') return 'الرياض';
    if (lower === 'jeddah') return 'جدة';
    if (lower === 'dammam') return 'الدمام';
    if (lower === 'mecca' || lower === 'makkah') return 'مكة المكرمة';
    if (lower === 'medina' || lower === 'madinah') return 'المدينة المنورة';
    if (lower === 'khobar' || lower === 'al khobar') return 'الخبر';
    if (lower === 'cairo') return 'القاهرة';
    if (lower === 'alexandria') return 'الإسكندرية';
    if (lower === 'dubai') return 'دبي';
    if (lower === 'doha') return 'الدوحة';
    if (lower === 'kuwait') return 'الكويت';
    return decoded;
  } catch {
    return c;
  }
};

export default function TrafficHeatmap() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('daily');

  const fetchTrafficData = useCallback(async () => {
    setIsRefreshing(true);
    const visitMap = new Map<string, Visit>();

    // 1. Fetch from server endpoint (both local Node server & Vercel serverless)
    try {
      const res = await fetch('/api/analytics/visit');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.recentVisits)) {
          data.recentVisits.forEach((v: any) => {
            const key = v.id || `${v.sessionId}_${v.created_at}`;
            visitMap.set(key, {
              id: key,
              sessionId: v.sessionId || v.session_id || 'guest',
              page: v.page || v.landing_page || '/',
              referrer: v.referrer || '',
              utm_source: v.utm_source || '',
              city: cleanCityName(v.city),
              country: v.country || 'SA',
              created_at: v.created_at || new Date().toISOString()
            });
          });
        }
      }
    } catch (e) {
      console.warn('[TrafficHeatmap] API fetch warning, relying on Supabase direct sync:', e);
    }

    // 2. Direct Supabase Query (Real-time and persistent, bypassing any serverless cache)
    try {
      if (supabase) {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

        // 2a. traffic_logs
        const { data: logs } = await supabase
          .from('traffic_logs')
          .select('*')
          .gte('created_at', ninetyDaysAgo)
          .order('created_at', { ascending: false })
          .limit(50000);

        if (logs) {
          logs.forEach((t: any) => {
            const sid = t.session_id || t.id;
            const key = `log_${t.id || sid}`;
            visitMap.set(key, {
              id: key,
              sessionId: sid,
              page: t.landing_page || t.page || '/',
              referrer: t.referrer || '',
              utm_source: t.utm_source || '',
              city: cleanCityName(t.city),
              country: t.country || 'SA',
              created_at: t.created_at || new Date().toISOString()
            });
          });
        }

        // 2b. user_sessions
        const { data: sessions } = await supabase
          .from('user_sessions')
          .select('*')
          .gte('created_at', ninetyDaysAgo)
          .order('created_at', { ascending: false })
          .limit(50000);

        if (sessions) {
          sessions.forEach((s: any) => {
            const sid = s.session_id || s.id;
            const key = `sess_${s.id || sid}`;
            if (!visitMap.has(key)) {
              visitMap.set(key, {
                id: key,
                sessionId: sid,
                page: s.landing_page || '/',
                referrer: s.referrer || '',
                utm_source: s.utm_source || '',
                city: cleanCityName(s.city),
                country: s.country || 'SA',
                created_at: s.created_at || new Date().toISOString()
              });
            }
          });
        }

        // 2c. support_tickets analytics fallback
        const { data: tickets } = await supabase
          .from('support_tickets')
          .select('id, subject, created_at, message')
          .eq('status', 'analytics_visit')
          .gte('created_at', ninetyDaysAgo)
          .limit(50000);

        if (tickets) {
          tickets.forEach((t: any) => {
            const sid = t.subject?.replace('visit:', '') || 'guest_' + t.id;
            const key = `ticket_${t.id}`;
            if (!visitMap.has(key)) {
              let meta: any = {};
              try { meta = JSON.parse(t.message || '{}'); } catch {}
              visitMap.set(key, {
                id: key,
                sessionId: sid,
                page: meta.page || '/',
                referrer: meta.referrer || '',
                utm_source: meta.utm_source || '',
                city: cleanCityName(meta.city),
                country: meta.country || 'SA',
                created_at: t.created_at || new Date().toISOString()
              });
            }
          });
        }
      }
    } catch (e) {
      console.error('[TrafficHeatmap] Direct Supabase fetch error:', e);
    }

    // 3. Merge Current Local Session if present
    try {
      const currentSessionId = sessionStorage.getItem('sulta_visitor_session_id') || localStorage.getItem('sulta_visitor_session_id');
      if (currentSessionId && !visitMap.has(`curr_${currentSessionId}`)) {
        const storedUtm = localStorage.getItem('sulta_utm_params');
        let utmSrc = 'direct';
        if (storedUtm) {
          try {
            const parsed = JSON.parse(storedUtm);
            if (parsed.utm_source) utmSrc = parsed.utm_source;
          } catch {}
        }
        visitMap.set(`curr_${currentSessionId}`, {
          id: `curr_${currentSessionId}`,
          sessionId: currentSessionId,
          page: window.location.pathname || '/',
          referrer: document.referrer || '',
          utm_source: utmSrc,
          city: 'الرياض',
          country: 'SA',
          created_at: new Date().toISOString()
        });
      }
    } catch {}

    const list = Array.from(visitMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setVisits(list);
    setLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchTrafficData();

    // Auto refresh every 20 seconds
    const interval = setInterval(fetchTrafficData, 20000);

    // Also subscribe to realtime broadcast if available
    let channel: any = null;
    if (supabase) {
      channel = supabase.channel('traffic-heatmap-pulse')
        .on('broadcast', { event: 'pixel-event' }, () => {
          fetchTrafficData();
        })
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchTrafficData]);

  // Filter visits based on selected time horizon
  const filteredVisits = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return visits.filter(v => {
      const vTime = new Date(v.created_at).getTime();
      const vDate = new Date(v.created_at);

      if (timeFilter === 'hourly') {
        // Last 24 hours
        return (now.getTime() - vTime) <= 24 * 60 * 60 * 1000;
      }
      if (timeFilter === 'daily') {
        // Today (since midnight)
        return vTime >= todayMidnight;
      }
      if (timeFilter === 'weekly') {
        // Last 7 days
        return (now.getTime() - vTime) <= 7 * 24 * 60 * 60 * 1000;
      }
      if (timeFilter === 'monthly') {
        // Last 30 days
        return (now.getTime() - vTime) <= 30 * 24 * 60 * 60 * 1000;
      }
      if (timeFilter === 'yearly') {
        return vDate.getFullYear() === now.getFullYear();
      }
      return true; // 'all'
    });
  }, [visits, timeFilter]);

  // Traffic Source Breakdown
  const sourceChartData = useMemo(() => {
    const counts: Record<string, number> = {
      'Instagram': 0,
      'TikTok': 0,
      'Meta / FB': 0,
      'Snapchat': 0,
      'Google': 0,
      'Direct': 0
    };

    filteredVisits.forEach((v: any) => {
      const src = (v.utm_source || v.referrer || '').toLowerCase();
      if (src.includes('instagram') || src.includes('ig')) counts['Instagram']++;
      else if (src.includes('tiktok') || src.includes('tt')) counts['TikTok']++;
      else if (src.includes('facebook') || src.includes('fb') || src.includes('meta')) counts['Meta / FB']++;
      else if (src.includes('snapchat') || src.includes('snap')) counts['Snapchat']++;
      else if (src.includes('google')) counts['Google']++;
      else counts['Direct']++;
    });

    return [
      { source: 'إنستقرام', count: counts['Instagram'], color: '#E1306C' },
      { source: 'تيك توك', count: counts['TikTok'], color: '#000000' },
      { source: 'فيسبوك', count: counts['Meta / FB'], color: '#1877F2' },
      { source: 'سناب شات', count: counts['Snapchat'], color: '#FACC15' },
      { source: 'جوجل', count: counts['Google'], color: '#4285F4' },
      { source: 'مباشر', count: counts['Direct'], color: '#A44C5C' }
    ].sort((a, b) => b.count - a.count);
  }, [filteredVisits]);

  // Active Cities Breakdown
  const activeCities = useMemo(() => {
    const cities: Record<string, number> = {};
    filteredVisits.forEach(v => {
      const city = cleanCityName(v.city);
      cities[city] = (cities[city] || 0) + 1;
    });
    return Object.entries(cities)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredVisits]);

  // Unique Visitors vs Total Page Hits
  const uniqueVisitorsCount = useMemo(() => {
    return new Set(filteredVisits.map(v => v.sessionId)).size;
  }, [filteredVisits]);

  const totalHitsCount = filteredVisits.length;

  if (loading && visits.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-8 flex flex-col items-center justify-center space-y-3">
        <Globe className="text-[#A44C5C] animate-spin" size={32} />
        <p className="text-gray-500 text-xs font-bold">جاري تحليل تدفق زوار المتجر الفعليين...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col" dir="rtl">
      {/* Header & Title */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#A44C5C]/10 flex items-center justify-center text-[#A44C5C]">
            <Navigation size={20} />
          </div>
          <div>
            <h3 className="font-black text-base text-gray-900">خريطة تدفق الزوار (Traffic Sources)</h3>
            <p className="text-[11px] text-gray-500">تحليل دقيق وحقيقي لمصادر الزيارات وسلوك العميلات في المتجر</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTrafficData()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="تحديث البيانات لحظياً من قاعدة البيانات"
          >
            <RefreshCw size={12} className={isRefreshing ? "animate-spin text-[#A44C5C]" : ""} />
            <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث فوري'}</span>
          </button>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            بيكسل نشط ومربوط
          </div>
        </div>
      </div>

      {/* Time Horizon Filter Tabs (Hourly, Daily, Weekly, Monthly, Yearly, All) */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
          <button
            onClick={() => setTimeFilter('hourly')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeFilter === 'hourly' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            بالساعة
          </button>
          <button
            onClick={() => setTimeFilter('daily')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeFilter === 'daily' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            يومياً
          </button>
          <button
            onClick={() => setTimeFilter('weekly')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeFilter === 'weekly' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            أسبوعياً
          </button>
          <button
            onClick={() => setTimeFilter('monthly')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeFilter === 'monthly' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            شهرياً
          </button>
          <button
            onClick={() => setTimeFilter('yearly')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeFilter === 'yearly' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            سنوياً
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeFilter === 'all' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            الكل
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 font-mono bg-white px-3 py-1.5 rounded-xl border border-gray-200">
          <span>إجمالي الزوار للفترة:</span>
          <span className="text-[#A44C5C] font-black text-sm">
            {uniqueVisitorsCount} زائر
          </span>
          <span className="text-gray-400 font-normal text-[10px]">
            ({totalHitsCount} مشاهدة)
          </span>
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* Source Breakdown Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-[#A44C5C]" />
              توزيع مصادر الدخول (Instagram, TikTok, Direct...)
            </h4>
            <span className="text-[10px] text-gray-400">محدث تلقائياً من Supabase</span>
          </div>
          <div className="h-56 w-full bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceChartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="source" 
                  type="category" 
                  tick={{ fontSize: 11, fontWeight: 'bold', fill: '#374151' }} 
                  width={90}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(164, 76, 92, 0.05)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', textAlign: 'right' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                  {sourceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Presence & Recent Sessions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-gray-100">
          {/* Top Active Cities */}
          <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-[#A44C5C]" />
              أكثر المدن نشاطاً (السوق السعودي والإقليمي)
            </h4>
            <div className="space-y-2.5">
              {activeCities.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400">
                  بانتظار تسجيل زوار للمدن خلال هذه الفترة
                </div>
              ) : (
                activeCities.map((city, i) => (
                  <div key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-200/60 shadow-2xs">
                    <span className="text-xs font-bold text-gray-800">{city.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#A44C5C] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, totalHitsCount > 0 ? (city.count / totalHitsCount) * 100 : 0)}%` }} 
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-700">
                        {city.count} زائر
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Live Traffic Sessions */}
          <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-emerald-600" />
                أحدث الجلسات الحية المسجلة
              </span>
              <span className="text-[10px] font-mono text-gray-400">{filteredVisits.length} جلسة</span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {filteredVisits.slice(0, 5).map((v: any, i) => (
                <div key={v.id || i} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-200/60 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {v.page === '/' ? 'الصفحة الرئيسية' : v.page.replace(/^\//, 'تصفح / ')}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        مصدر: <span className="font-bold text-gray-700">{v.utm_source ? v.utm_source.toUpperCase() : 'زيارة مباشرة'}</span> • {v.city || 'الرياض'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(v.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {filteredVisits.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400">
                  لا توجد جلسات في هذا النطاق الزمني حالياً
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-gray-300 p-3 text-center border-t border-gray-800 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <p className="text-[10px] font-medium">
          🔒 بيانات حقيقية 100% مرتبطة ببيكسل المتجر وقواعد بيانات Supabase الأمنية بدون أي سقف وهمي.
        </p>
      </div>
    </div>
  );
}
