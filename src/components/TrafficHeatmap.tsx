import React, { useState, useEffect, useMemo } from 'react';
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
import { Globe, Users, Navigation, MapPin, Clock, Search } from 'lucide-react';

interface TrafficData {
  source: string;
  count: number;
  color: string;
}

interface Visit {
  id: string;
  sessionId: string;
  page: string;
  referrer: string;
  utm_source: string;
  city: string;
  created_at: string;
}

export default function TrafficHeatmap() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/analytics/visit');
        const data = await res.json();
        if (data && data.recentVisits) {
          setVisits(data.recentVisits);
        }
      } catch (err) {
        console.error('Failed to fetch traffic data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const sourceChartData = useMemo(() => {
    const counts: Record<string, number> = {
      'Instagram': 0,
      'TikTok': 0,
      'Meta / FB': 0,
      'Snapchat': 0,
      'Google': 0,
      'Direct': 0
    };

    visits.forEach(v => {
      const src = (v.utm_source || '').toLowerCase();
      if (src.includes('instagram') || src.includes('ig')) counts['Instagram']++;
      else if (src.includes('tiktok')) counts['TikTok']++;
      else if (src.includes('facebook') || src.includes('meta')) counts['Meta / FB']++;
      else if (src.includes('snapchat') || src.includes('snap')) counts['Snapchat']++;
      else if (src.includes('google')) counts['Google']++;
      else counts['Direct']++;
    });

    return [
      { source: 'إنستقرام', count: counts['Instagram'], color: '#E1306C' },
      { source: 'تيك توك', count: counts['TikTok'], color: '#000000' },
      { source: 'فيسبوك', count: counts['Meta / FB'], color: '#1877F2' },
      { source: 'سناب شات', count: counts['Snapchat'], color: '#FFFC00' },
      { source: 'جوجل', count: counts['Google'], color: '#4285F4' },
      { source: 'مباشر', count: counts['Direct'], color: '#A44C5C' }
    ].sort((a, b) => b.count - a.count);
  }, [visits]);

  const activeCities = useMemo(() => {
    const cities: Record<string, number> = {};
    visits.forEach(v => {
      const city = v.city || 'الرياض';
      cities[city] = (cities[city] || 0) + 1;
    });
    return Object.entries(cities)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [visits]);

  if (loading && visits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center justify-center space-y-3">
        <Globe className="text-[#A44C5C] animate-spin" size={32} />
        <p className="text-gray-500 text-sm font-bold">جاري تحليل مسارات الزوار...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#A44C5C]/10 flex items-center justify-center text-[#A44C5C]">
            <Navigation size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">خريطة تدفق الزوار (Traffic Sources)</h3>
            <p className="text-[10px] text-gray-500">تحليل حي لمصادر الدخول وتفاعل القنوات</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          تحديث تلقائي
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Source Breakdown Chart */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="source" 
                type="category" 
                tick={{ fontSize: 10, fontWeight: 'bold' }} 
                width={80}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {sourceChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Geographic Presence */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin size={12} />
              أكثر المدن نشاطاً
            </h4>
            <div className="space-y-2">
              {activeCities.length > 0 ? activeCities.map((city, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">{city.name}</span>
                  <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded-md">
                    {city.count}
                  </span>
                </div>
              )) : (
                <p className="text-[10px] text-gray-400">لا توجد بيانات جغرافية كافية</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Users size={12} />
              الجلسات الأخيرة
            </h4>
            <div className="space-y-1.5">
              {visits.slice(0, 4).map((v, i) => (
                <div key={i} className="flex items-center gap-2 overflow-hidden">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${v.utm_source ? 'bg-blue-400' : 'bg-gray-300'}`} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-600 truncate">
                      {v.page === '/' ? 'الرئيسية' : v.page.split('/').pop() || 'المتجر'}
                    </p>
                    <p className="text-[8px] text-gray-400">
                      {new Date(v.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
        <p className="text-[9px] text-gray-400 font-bold">
          بيانات دقيقة من Supabase مستندة إلى معرفات الجلسة (Session IDs)
        </p>
      </div>
    </div>
  );
}
