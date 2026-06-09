import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Heart, AlertTriangle, ShieldAlert, CheckCircle2, TrendingUp, Users, Target } from 'lucide-react';
import { dbService } from '../services/db';

export default function CustomerExperienceDashboard() {
  const [metrics, setMetrics] = useState({
    csat: 94,
    nps: 72,
    openTickets: 0,
    avgResolutionTime: 2.4, // hours
    failedOrders: 0,
    repeatedIssues: 0,
    fraudAttempts: 0
  });

  const [ticketsData, setTicketsData] = useState([]);
  
  useEffect(() => {
    // Ideally this comes from real DB aggregations
    const unsub = dbService.subscribeTickets((tickets) => {
      const open = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;
      const issues = tickets.filter(t => t.type === 'complaint').length;
      
      setMetrics(prev => ({
        ...prev,
        openTickets: open,
        repeatedIssues: issues > 5 ? 5 : issues
      }));
    }, () => {});
    return unsub;
  }, []);

  const csatTrend = [
    { name: 'يناير', value: 88 },
    { name: 'فبراير', value: 90 },
    { name: 'مارس', value: 92 },
    { name: 'أبريل', value: 94 },
  ];

  const issuesDistribution = [
    { name: 'تأخير شحن', value: 35 },
    { name: 'استفسار مقاسات', value: 40 },
    { name: 'عيوب تغليف', value: 15 },
    { name: 'مشاكل دفع', value: 10 },
  ];
  const COLORS = ['#A44C5C', '#DF8A9C', '#F6E7A6', '#0B0B0B'];

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0B0B0B] flex items-center gap-2">
            <Heart className="text-[#A44C5C]" />
            لوحة تجربة العملاء (CX Dashboard)
          </h2>
          <p className="text-sm text-gray-500 mt-1">مراقبة رضا العملاء وصحة العمليات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <Target size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">رضا العملاء (CSAT)</span>
          </div>
          <p className="text-3xl font-black text-emerald-600 pt-2">{metrics.csat}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <TrendingUp size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">صافي نقاط الترويج (NPS)</span>
          </div>
          <p className="text-3xl font-black text-blue-600 pt-2">+{metrics.nps}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <ShieldAlert size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">تذاكر مفتوحة</span>
          </div>
          <p className="text-3xl font-black text-[#A44C5C] pt-2">{metrics.openTickets}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <CheckCircle2 size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">متوسط وقت الحل</span>
          </div>
          <p className="text-3xl font-black text-gray-900 pt-2">{metrics.avgResolutionTime} ساعة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs">
           <h3 className="font-bold text-gray-900 mb-6">مؤشر رضا العملاء CSAT</h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={csatTrend}>
                    <defs>
                       <linearGradient id="csatGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} domain={[0, 100]} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip wrapperClassName="text-right font-sans rounded-xl shadow-lg border-none" />
                    <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#csatGradient)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs relative">
           <h3 className="font-bold text-gray-900 mb-6">أكثر المشاكل شيوعاً</h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={issuesDistribution}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                    >
                       {issuesDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-3">
             <span className="block text-2xl font-black text-gray-900">100%</span>
           </div>
           <div className="flex justify-center gap-4 mt-2 flex-wrap">
              {issuesDistribution.map((entry, index) => (
                 <div key={index} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-gray-600">{entry.name}</span>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Customer Health Monitor */}
      <h3 className="font-serif text-xl font-bold text-[#0B0B0B] mt-8 mb-4">مراقب صحة العملاء (Health Monitor)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex justify-between items-center">
            <div>
               <p className="text-xs font-bold text-gray-500 mb-1">طلبات فاشلة / معلقة</p>
               <p className="text-2xl font-black text-gray-900">{metrics.failedOrders}</p>
            </div>
            <div className={`p-3 rounded-xl ${metrics.failedOrders > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
               <AlertTriangle size={24} />
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex justify-between items-center">
            <div>
               <p className="text-xs font-bold text-gray-500 mb-1">مشاكل متكررة للعميل</p>
               <p className="text-2xl font-black text-gray-900">{metrics.repeatedIssues}</p>
            </div>
            <div className={`p-3 rounded-xl ${metrics.repeatedIssues > 0 ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400'}`}>
               <Users size={24} />
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex justify-between items-center">
            <div>
               <p className="text-xs font-bold text-gray-500 mb-1">محاولات غير صالحة (حماية)</p>
               <p className="text-2xl font-black text-emerald-600">{metrics.fraudAttempts}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-500">
               <ShieldAlert size={24} />
            </div>
         </div>
      </div>
    </div>
  );
}
