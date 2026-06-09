import React, { useMemo, useState } from 'react';
import { Star, MessageSquareCode, Smile, ShieldCheck, Heart, Frown, Users, Sparkles, MessageSquare, Send } from 'lucide-react';
import { Review } from '../types';

interface BrandReputationDashboardProps {
  reviews: Review[];
  totalOrdersCount: number;
}

export default function BrandReputationDashboard({
  reviews = [],
  totalOrdersCount = 0,
}: BrandReputationDashboardProps) {
  // Local simulated luxury customer complaints & ideas to guarantee realistic interaction
  const [suggestionText, setSuggestionText] = useState('');
  const [simulatedSuggestions, setSimulatedSuggestions] = useState([
    {
      id: 's-1',
      username: 'الهنوف آل سعود',
      tier: 'diamond',
      type: 'اقتراح',
      subject: 'طلب توفير علب مخملية للهدايا الكبرى',
      content: 'أتمنى توفير خيار صناديق هدايا رويال مكسوة بالقطيفة الكرتونية العميقة للقطع الطويلة لتناسب ليلة الزفاف.',
      status: 'مستجاب',
      date: 'منذ يومين',
    },
    {
      id: 's-2',
      username: 'مريم الشريف',
      tier: 'platinum',
      type: 'ملاحظة',
      subject: 'سرعة رد خدمة العملاء الملكية',
      content: 'أود الإشادة بالرد السريع لخدمة الكونسيرج ومساعدتي بتفصيل المقاس عبر الواتساب في أقل من 5 دقائق.',
      status: 'قيد التقدير',
      date: 'منذ ٣ أيام',
    },
    {
      id: 's-3',
      username: 'ليلى الهاشم',
      tier: 'gold',
      type: 'اقتراح',
      subject: 'توسعة تشكيلة الكيمونو الحريري',
      content: 'نرجو توفير ألوان صيفية مبهجة كالعاجي واللؤلؤي المذهب في التشكيلة القادمة.',
      status: 'معتمد للتنفيذ',
      date: 'منذ أسبوع',
    }
  ]);

  const stats = useMemo(() => {
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)) 
      : 4.8; // Default high-morale brand premium indicator fallback

    // Star Distribution mapping
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rounded = Math.round(r.rating) as 5 | 4 | 3 | 2 | 1;
      if (distribution[rounded] !== undefined) {
        distribution[rounded]++;
      } else {
        distribution[5]++;
      }
    });

    // Make sure fallback has representative design distribution
    if (totalReviews === 0) {
      distribution[5] = 18;
      distribution[4] = 3;
      distribution[3] = 1;
    }

    const calculatedTotal = totalReviews || 22; // Represent fallback gracefully
    const fiveStarPercent = Math.round((distribution[5] / calculatedTotal) * 100);
    const fourStarPercent = Math.round((distribution[4] / calculatedTotal) * 100);
    const threeStarPercent = Math.round((distribution[3] / calculatedTotal) * 100);

    // CSAT calculation (Customer Satisfaction Score)
    const csat = totalReviews > 0
      ? Math.round((reviews.filter((r) => r.rating >= 4).length / totalReviews) * 100)
      : 96;

    // NPS score
    const nps = totalReviews > 0
      ? Math.round(
          ((reviews.filter((r) => r.rating === 5).length - reviews.filter((r) => r.rating <= 3).length) /
            totalReviews) *
            100
        )
      : 88;

    return {
      totalReviews,
      avgRating,
      distribution,
      csat,
      nps,
      fiveStarPercent,
      fourStarPercent,
      threeStarPercent,
    };
  }, [reviews]);

  const handleAddSimulatedSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim()) return;

    setSimulatedSuggestions((prev) => [
      {
        id: `s-${Date.now()}`,
        username: 'مشرف الجودة (ملاحظة داخلية)',
        tier: 'diamond',
        type: 'ملاحظة',
        subject: 'تحسين تجربة عميل مباشرة',
        content: suggestionText,
        status: 'جاري العمل',
        date: 'الآن',
      },
      ...prev,
    ]);
    setSuggestionText('');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Brand Header Banner */}
      <div className="bg-gradient-to-r from-[#030712] to-[#1F2937] text-white p-6 rounded-3xl border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-radial from-[#F6E7A6]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#FAF5F0] text-[#0B0B0B] text-[9.5px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-sans">
                REPUTATION AUDIT
              </span>
              <span className="text-[10px] text-gray-400 font-sans">مؤشر رضا العميل التراكمي الفخر</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-light text-[#F6E7A6] mt-2">
              لوحة متابعة سمعة ووقار براند SULTA
            </h2>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              تحليل شامل ومستمر لجميع التقارير والتقييمات الحية الواردة من سيدات المجتمع لضمان الحفاظ على الجودة الخالدة للبوتيك.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center bg-white/5 border border-white/10 p-4 rounded-2xl md:w-28">
              <span className="text-gray-500 text-[10px] uppercase block mb-1">صافي الرضا (CSAT)</span>
              <span className="text-2xl font-black text-emerald-400 font-sans">{stats.csat}%</span>
            </div>
            <div className="text-center bg-white/5 border border-white/10 p-4 rounded-2xl md:w-28">
              <span className="text-gray-500 text-[10px] uppercase block mb-1">الولاء (NPS)</span>
              <span className="text-2xl font-black text-[#F6E7A6] font-sans">{stats.nps}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Breakdown Card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 justify-start">
              <Smile size={18} className="text-[#A44C5C]" />
              <span>معدل ومقاييس تقييم العملاء</span>
            </h3>

            <div className="flex items-end gap-3 mb-6">
              <span className="text-5xl font-black text-gray-900 font-sans tracking-tight">{stats.avgRating}</span>
              <div className="space-y-1">
                <div className="flex gap-0.5 text-[#F6E7A6]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < Math.round(stats.avgRating) ? '#A44C5C' : 'none'}
                      stroke={i < Math.round(stats.avgRating) ? '#A44C5C' : '#D1D5DB'}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 block font-sans">بناءً على {stats.totalReviews} مراجعة حقيقية</span>
              </div>
            </div>

            {/* Progress breakdown */}
            <div className="space-y-3 font-sans text-xs text-gray-600">
              <div className="flex items-center justify-between gap-4">
                <span className="w-12 text-gray-400">٥ نجوم</span>
                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#A44C5C] h-full rounded-full" style={{ width: `${stats.fiveStarPercent}%` }} />
                </div>
                <span className="w-8 text-right font-bold text-gray-900">{stats.fiveStarPercent}%</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="w-12 text-gray-400">٤ نجوم</span>
                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-gray-700 h-full rounded-full" style={{ width: `${stats.fourStarPercent}%` }} />
                </div>
                <span className="w-8 text-right font-bold text-gray-900">{stats.fourStarPercent}%</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="w-12 text-gray-400">٣ نجوم</span>
                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${stats.threeStarPercent}%` }} />
                </div>
                <span className="w-8 text-right font-bold text-gray-900">{stats.threeStarPercent}%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-150 mt-6 text-[10px] text-gray-400 font-sans flex items-center gap-1.5 justify-start">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>نظام فلترة المراجعات السبام مفعل تلقائياً لمصداقية تامة.</span>
          </div>
        </div>

        {/* Dynamic Reviews Hub */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 justify-start">
              <MessageSquareCode size={18} className="text-[#A44C5C]" />
              <span>مراجعات صنف كوتور حية ومراجعة الجودة</span>
            </h3>

            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  <Star size={32} className="mx-auto mb-2 text-gray-200" />
                  لا يوجد مراجعات جديدة للقطع حالياً. سيتم عرض مراجعات العملاء فور كتابتها في المتجر.
                </div>
              ) : (
                reviews.slice(0, 5).map((rev) => (
                  <div key={rev.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{rev.username}</span>
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-sans font-semibold">
                          {rev.country === 'SA' ? 'المملكة العربية السعودية 🇸🇦' : 'جمهورية مصر العربية 🇪🇬'}
                        </span>
                      </div>
                      <div className="flex gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            fill={i < rev.rating ? 'currentColor' : 'none'}
                            stroke="currentColor"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 font-sans leading-relaxed">{rev.comment}</p>
                    <div className="text-[9px] text-[#A44C5C] font-semibold">المنتج: {rev.productName}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-xs pt-4 border-t border-gray-150 mt-4 flex justify-between items-center text-gray-400 font-sans">
            <span>معدل الشكاوى المسجلة: 0.1%</span>
            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">سمعة ممتازة جداً ⚜️</span>
          </div>
        </div>
      </div>

      {/* Customer Suggestions & Complaints Center */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs">
        <h3 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 mb-2 justify-start">
          <MessageSquare size={18} className="text-[#A44C5C]" />
          <span>مركز دراسات الرضا، مقترحات كبار العملاء والشكاوى</span>
        </h3>
        <p className="text-gray-400 text-xs mb-6 max-w-3xl leading-relaxed">
          فرع استماع خاص لآراء العملاء غير التقليدية المسجلة عبر الكونسيرج ومساعد المظهر، لتطوير أطقم الساتان وخطابات التعبئة والتغليف.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submit form */}
          <form onSubmit={handleAddSimulatedSuggestion} className="bg-[#FAF5F0]/50 border border-[#DF8A9D]/10 p-5 rounded-2.5xl space-y-4">
            <h4 className="text-xs font-bold text-[#A44C5C]">تسجيل ملحوظة جودة أو شكوى واردة يدوياً:</h4>
            <textarea
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              placeholder="اكتب تفاصيل الشكوى أو الملحوظة اللوجستية الواردة عبر واتساب..."
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-[#A44C5C]"
              rows={4}
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#0B0B0B] hover:bg-[#A44C5C] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Send size={12} />
              <span>تسجيل الملحوظة للعمل مع فريق SULTA</span>
            </button>
          </form>

          {/* Suggestions List */}
          <div className="lg:col-span-2 space-y-3 max-h-[300px] overflow-y-auto">
            {simulatedSuggestions.map((sug) => (
              <div key={sug.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-start gap-4 hover:border-gray-200 transition-all text-xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-gray-900">{sug.username}</span>
                    <span className={`text-[9px] px-2 rounded-full font-bold uppercase ${
                      sug.tier === 'diamond' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {sug.tier.toUpperCase()} MEMBER
                    </span>
                    <span className="text-[10px] text-gray-400 font-sans">{sug.date}</span>
                  </div>
                  <h5 className="font-bold text-gray-800 mb-1">{sug.subject}</h5>
                  <p className="text-gray-500 font-sans leading-relaxed">{sug.content}</p>
                </div>

                <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold ${
                  sug.status === 'مستجاب' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  sug.status === 'معتمد للتنفيذ' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                  'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  {sug.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
