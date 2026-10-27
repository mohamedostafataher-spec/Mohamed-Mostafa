import React, { useState, useEffect } from 'react';
import { Activity, Users, Calendar, TrendingUp, Globe, Clock, ShieldCheck, RefreshCw, Trash2, Zap } from 'lucide-react';
import { getComprehensiveVisitorStats, subscribeVisitorCount, ComprehensiveVisitorStats } from '../utils/analytics';

interface LiveTrafficMonitorProps {
  compact?: boolean;
  onClearLogs?: () => void;
}

export default function LiveTrafficMonitor({ compact = false, onClearLogs }: LiveTrafficMonitorProps) {
  const [liveCount, setLiveCount] = useState<number>(1);
  const [stats, setStats] = useState<ComprehensiveVisitorStats>(() => getComprehensiveVisitorStats());
  const [activeTab, setActiveTab] = useState<'live' | 'today' | 'weekly' | 'monthly'>('live');

  useEffect(() => {
    const unsub = subscribeVisitorCount((count) => {
      setLiveCount(count);
      setStats(getComprehensiveVisitorStats());
    });
    // Interval refresh to keep historical tracking live
    const interval = setInterval(() => {
      setStats(getComprehensiveVisitorStats());
    }, 5000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const weeklyTotal = stats.dailyHistory.reduce((sum, d) => sum + d.visitors, 0);
  const monthlyEstimated = weeklyTotal * 4; // Monthly projected/aggregated

  if (compact) {
    return (
      <div className="flex items-center gap-2.5 bg-gray-900/90 text-white px-3 py-1.5 rounded-full border border-gray-800 text-xs font-sans shadow-lg" dir="rtl">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="font-bold">{liveCount} زائر نشط الآن</span>
        <span className="text-gray-400">•</span>
        <span className="text-emerald-400 font-mono font-bold">{stats.todayCount} زوار اليوم</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg space-y-6 text-right" dir="rtl">
      {/* Header & Mode Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
            <Activity size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-gray-950">مراقب الحركة والزوار الحقيقيين (LiveTrafficMonitor)</h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                متصل 24/7
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">تتبع حي ومستمر لحركة الزوار، الجلسات اليومية، والأحداث المسجلة بدون حذف تلقائي</p>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-2xl text-xs font-bold self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'live' ? 'bg-black text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
          >
            الآن (Live)
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'today' ? 'bg-black text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
          >
            اليوم (Today)
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'weekly' ? 'bg-black text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
          >
            الأسبوع (Weekly)
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'monthly' ? 'bg-black text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
          >
            الشهر (Monthly)
          </button>
        </div>
      </div>

      {/* Main Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 border border-emerald-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">زوار نشطون الآن</span>
            <Users size={20} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-gray-950 font-mono tracking-tight">{liveCount}</div>
          <p className="text-xs text-emerald-700 font-bold">جلسات متصلة بالمتجر حالياً</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 border border-blue-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">زوار اليوم (Day Traffic)</span>
            <Calendar size={20} className="text-blue-600" />
          </div>
          <div className="text-3xl font-black text-gray-950 font-mono tracking-tight">{stats.todayCount}</div>
          <p className="text-xs text-blue-700 font-bold">زائر فريد زاروا البوتيك اليوم</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-5 border border-purple-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">إجمالي الأسبوع</span>
            <TrendingUp size={20} className="text-purple-600" />
          </div>
          <div className="text-3xl font-black text-gray-950 font-mono tracking-tight">{weeklyTotal}</div>
          <p className="text-xs text-purple-700 font-bold">آخر 7 أيام مسجلة بدقة</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-5 border border-amber-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">التراكمي الشهري</span>
            <Globe size={20} className="text-amber-600" />
          </div>
          <div className="text-3xl font-black text-gray-950 font-mono tracking-tight">{monthlyEstimated}</div>
          <p className="text-xs text-amber-700 font-bold">حركة المرور التقديرية للشهر</p>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-gray-950 flex items-center gap-2">
            <span>سجل الزوار اليومي (تحديث مستمر)</span>
            <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-md font-mono">24/7 Active</span>
          </h4>
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-all cursor-pointer border border-red-200"
            >
              <Trash2 size={13} />
              <span>مسح السجل بناءً على طلبي</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {stats.dailyHistory.map((h, i) => (
            <div key={i} className="bg-white p-3.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-gray-700 font-sans">{h.date}</span>
              <div className="flex items-center gap-6">
                <span>الزوار: <strong className="text-black">{h.visitors}</strong></span>
                <span>الطلبات: <strong className="text-emerald-600">{h.orders || 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
