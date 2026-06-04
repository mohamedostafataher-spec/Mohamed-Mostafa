import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, HelpCircle, Send } from 'lucide-react';

export default function ReturnsExchanges() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('size');
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !phone) return;
    setSuccess(true);
    setTimeout(() => {
      setOrderNumber('');
      setPhone('');
      setComment('');
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      
      {/* Editorial Header */}
      <div className="text-center space-y-4 mb-16">
        <span className="text-xs uppercase tracking-[0.2em] text-[#F4B6C2] font-serif block font-medium">SULTA Returns Service • الضمان الملكي للبدائل</span>
        <h2 className="font-serif text-3xl md:text-5xl font-light text-[#0B0B0B] tracking-wide">
          سياسة الاسترجاع والتبديل الموثقة
        </h2>
        <div className="w-16 h-0.5 bg-[#F6E7A6] mx-auto mt-4" />
        <p className="max-w-xl mx-auto text-gray-500 text-xs md:text-sm font-sans leading-relaxed">
          راحتكِ وأناقتكِ هما صميم علامتنا التجارية. نضمن لكِ حق الاسترداد أو تبديل المقاس بكل رقي وسهولة لكي تكوني مطمئنة تماماً.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        
        {/* Policy Details column */}
        <div className="space-y-6 text-center md:text-right font-sans">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <RefreshCw size={24} className="text-[#F4B6C2]" />
            <h4 className="font-serif text-xl font-light text-gray-900">شروط الاسترجاع السهلة</h4>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            يُرجى قراءة الشروط التالية الصادرة لتعزيز الرعاية والسلامة لزبوناتنا الفاخرين:
          </p>

          <ul className="space-y-4 text-xs text-gray-500">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4B6C2] shrink-0 mt-2" />
              <span><strong>المدة المتاحة:</strong> يقبل النظام الاسترجاع والتبديل خلال <strong>١٤ يوماً</strong> كاملاً من تاريخ وموعد استلام الطلبية الفاخرة.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4B6C2] shrink-0 mt-2" />
              <span><strong>حالة القطعة:</strong> يجب أن تكون المنسوجة غير ملبوسة أو مستخدمة أو مغسولة، وخالية تماماً من آثار المكياج أو العطور، ومجهزة بالبطاقة الداخلية الأصلية (SULTA Tag).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4B6C2] shrink-0 mt-2" />
              <span><strong>علبة الشحن الفاخرة:</strong> يُرجى إعادة القطعة معبأة داخل الصندوق الأسود المطفي الأصلي وبطاقة الشكر لضمان حماية الخامة أثناء رحلة المرتجعات.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F3B6C2] shrink-0 mt-2" />
              <span><strong>رسوم الشحن:</strong> التبديل أو الاسترجاع في حال وجود عيب فني يكون مجانياً بالكامل. لأسباب أخرى كالمقاس أو تبديل الرأي، يتحمل العميل رسوماً رمزية لسرعة النقل والتأمين (٢٠ SAR في السعودية / ٦٠ EGP في مصر).</span>
            </li>
          </ul>

          <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-250 text-gray-800 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <AlertTriangle size={12} className="text-yellow-600" />
              <span>ملاحظة صحية هامة:</span>
            </div>
            <p>لدواعي الصحة والسلامة العامة للملابس الحساسة واللانج وير المستفاد، لا يقبل المتجر نهائياً استرجاع الملابس التي تلامس المناطق الحساسة الحرة بشكل مباشر إلا إذا كان هناك تلف فني موثق عند فتح البكج الفاخر.</p>
          </div>
        </div>

        {/* Interactive request form column */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150 shadow-xs flex flex-col justify-between">
          <div className="mb-6">
            <h4 className="font-serif text-lg text-[#0B0B0B] font-medium mb-1 flex items-center gap-1.5">
              <ShieldCheck size={18} className="text-[#F4B6C2]" />
              <span>سجلي طلب استرجاع / تبديل إلكتروني</span>
            </h4>
            <p className="text-[11px] text-gray-400 font-sans leading-relaxed">أدخلي تفاصيل طلب الشراء لنقوم بجدولة مندوب الشحن الملكي لاستلام وفحص الطرد من عتبة منزلِك.</p>
          </div>

          {success ? (
            <div className="bg-[#FAFAF7] p-8 rounded-2xl text-center space-y-4 border border-[#F4B6C2]/30 animate-fade-in text-gray-800 font-sans">
              <span className="text-4xl block">🌸</span>
              <h5 className="font-bold text-sm text-[#0B0B0B]">تم تسجيل الطلب واستلامه بنجاح!</h5>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                يقوم حالياً مسؤولو الخدمة في سولتا بمراجعة الفاتورة والمقاسات، وسيتواصل معكِ مندوب الجدولة المباشرة عبر واتساب أو الهاتف خلال ٢٤ ساعة عمل للتنسيق. شكرًا لتفهمِك الراقي.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1 text-right">
                <label className="font-bold text-gray-700">رقم الفاتورة / الطلب الفاخر (مثال: SUL-884210)</label>
                <input
                  type="text"
                  placeholder="SUL-XXXXXX"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-[#0B0B0B] focus:outline-none focus:ring-1 focus:ring-[#F4B6C2] focus:bg-white text-right"
                  required
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="font-bold text-gray-700">رقم جوال التواصل المسجل</label>
                <input
                  type="tel"
                  placeholder="+966 50 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-left focus:outline-none focus:ring-1 focus:ring-[#F4B6C2] focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="font-bold text-gray-700">نوع الخدمة المطلوبة</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#F4B6C2] focus:bg-white text-right text-xs"
                >
                  <option value="size">استبدال مقاس القطعة بمقاس أخر ملاءم</option>
                  <option value="color">استبدال اللون بآخر يعكس شخصيتي بشكل أفضل</option>
                  <option value="refund">استرجاع كلي للمبلغ وإرجاع المنسوجة</option>
                  <option value="defect">تلف أو خطأ فني غير مسجل في الخامة</option>
                </select>
              </div>

              <div className="space-y-1 text-right">
                <label className="font-bold text-gray-700">ملاحظاتكِ الإضافية (اختياري)</label>
                <textarea
                  rows={3}
                  placeholder="صفي رغبتكِ بخصوص المقاس المناسب أو التلف بالتفصيل لسرعة الخدمة..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-[#0B0B0B] focus:outline-none focus:ring-1 focus:ring-[#F4B6C2] focus:bg-white text-right resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#F4B6C2] hover:text-white py-3 rounded-lg font-bold font-sans transition-all flex items-center justify-center gap-2 mt-2 shadow-xs cursor-pointer"
              >
                <Send size={13} className="rotate-220" />
                <span>إرسال طلب الاسترجاع الفوري</span>
              </button>
            </form>
          )}

        </div>

      </div>

      {/* Support details */}
      <div className="bg-[#FAFAF7] rounded-3xl p-6 text-center border space-y-3 font-sans max-w-2xl mx-auto">
        <h5 className="font-serif text-base text-[#0B0B0B] font-medium flex items-center justify-center gap-1.5">
          <HelpCircle size={15} className="text-[#F4B6C2]" />
          <span>هل تحتاجين لمساعدة كونسيرج مخصصة؟</span>
        </h5>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          فريق خدمة عملاء بيع الأزياء SULTA الفائقة متاح دائماً على مدار ٢٤ ساعة طيلة الأسبوع. يمكنك الاتصال المباشر لترتيب المرتجعات أو الرد على استفسارك ومقترحاتك بكل احترام.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs font-bold font-sans pt-2">
          <span>البريد الإلكتروني: support@sulta-couture.com</span>
          <span className="text-gray-300">•</span>
          <span>رقم الدعم (واتساب): +966 50 000 0000 / +20 10 0000 0000</span>
        </div>
      </div>

    </div>
  );
}
