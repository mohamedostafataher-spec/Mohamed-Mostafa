import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, ShieldCheck, Send, Check } from 'lucide-react';

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
      setSuccess(false);
      setOrderNumber('');
      setPhone('');
      setComment('');
    }, 4000);
  };

  return (
    <div className="bg-white min-h-screen">
      
      {/* Editorial Header */}
      <div className="bg-[#FAF5F0] py-24 md:py-32 border-b border-[#DF8A9D]/20" dir="rtl">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="font-serif italic text-xs tracking-[0.2em] text-[#A44C5C] block mb-3 uppercase">
            خدمة استرجاع سُلْطَة الفاخرة
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[#0B0B0B] tracking-wide mb-6 uppercase">
            الاسترجاع والاستبدال
          </h2>
          <div className="w-12 h-[1px] bg-[#A44C5C] mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-sans max-w-xl mx-auto leading-relaxed">
            راحتكِ وأناقتكِ هما جوهر علامتنا التجارية. نضمن لكِ حق الاسترجاع أو استبدال المقاسات بكل سهولة ورقي.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          
          {/* Policy Details column */}
          <div className="space-y-12 font-sans md:pl-8 border-l-0 md:border-l border-gray-100">
            <div>
              <div className="flex items-center gap-3 justify-start mb-6">
                <RefreshCw size={24} className="text-[#A44C5C]" strokeWidth={1} />
                <h4 className="font-serif text-2xl font-normal text-[#0B0B0B] tracking-wide">شروط الاسترجاع السهلة</h4>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                يرجى قراءة الشروط التالية المصممة لتعزيز العناية بقطعتكِ وضمان سلامة جودة منتجاتنا لعميلاتنا المتميزات:
              </p>

              <ul className="space-y-4 text-sm text-gray-500 mr-1">
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A44C5C] shrink-0 mt-2" />
                  <span className="leading-relaxed">يجب تقديم طلبات الاسترجاع خلال <strong>14 يوماً</strong> من تاريخ استلام الطلب.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A44C5C] shrink-0 mt-2" />
                  <span className="leading-relaxed">يجب أن تظل القطع في حالتها الأصلية غير مغسولة، وبدون أي تعرض للعطور أو الكريمات.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A44C5C] shrink-0 mt-2" />
                  <span className="leading-relaxed">يجب أن يكون ورق الحرير الفاخر وتاغ "سُلْطَة" المرفق بالقطعة سليماً تماماً.</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#FAF5F0] border border-[#DF8A9D]/10 rounded-sm p-8 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <AlertTriangle size={18} className="text-[#A44C5C]" />
                 <h5 className="font-serif font-semibold text-[#0B0B0B] uppercase tracking-wider text-sm">أسباب رفض الاسترجاع</h5>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                لأسباب صحية، سيرفض فريق مراقبة الجودة الصارم لدينا أي قطعة تظهر عليها علامات الارتداء، أو بقع المكياج، أو التاغات المفقودة. نطلب تفهمكم للحفاظ على المعايير الصحية العالمية لقطعنا الفاخرة.
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm font-semibold text-[#0B0B0B] bg-white border border-[#DF8A9D]/30 px-6 py-4 rounded-sm shadow-sm">
                <ShieldCheck size={20} className="text-[#A44C5C]" />
                <span className="uppercase tracking-widest font-serif text-xs">ضمان استعادة الأموال بالكامل بعد التحقق من القطعة.</span>
            </div>
          </div>

          {/* Return Form Column */}
          <div className="bg-[#0B0B0B] text-[#FAF5F0] rounded-sm p-10 px-8 shadow-xl text-right">
            <h3 className="font-serif text-2xl font-light mb-2 tracking-wider">تقديم طلب</h3>
            <p className="text-xs text-gray-400 mb-8 font-sans font-light leading-relaxed">
              هل تواجهين مشكلة في قطعتكِ؟ قدمي طلباً وسيقوم فريق العناية بالعملاء لدينا بمعالجة استرجاعكِ بسلاسة.
            </p>

            {success ? (
               <div className="bg-[#DF8A9D]/10 border border-[#DF8A9D]/30 rounded-sm p-6 text-center space-y-4 my-8">
                  <div className="w-12 h-12 rounded-full bg-[#DF8A9D]/20 text-[#DF8A9D] flex items-center justify-center mx-auto mb-2">
                     <Check size={20} />
                  </div>
                  <h4 className="font-serif text-lg text-[#FAF5F0]">تم استلام الطلب</h4>
                  <p className="text-xs text-gray-400 font-sans leading-relaxed">
                     شكراً لكِ. لقد استلمنا طلبكِ. وسيتواصل معكِ مبعوثنا الملكي قريباً لتنسيق عملية الاستلام.
                  </p>
               </div>
            ) : (
               <form onSubmit={handleSubmit} className="space-y-6 font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#FAF5F0]/60 block mr-2">رقم الطلب (#)</label>
                        <input
                           type="text"
                           placeholder="مثال: 50403"
                           value={orderNumber}
                           onChange={(e) => setOrderNumber(e.target.value)}
                           className="w-full border-b border-[#FAF5F0]/20 px-2 py-3 bg-transparent text-[#FAF5F0] placeholder-gray-500 focus:outline-none focus:border-[#DF8A9D] transition-colors text-sm text-right"
                           required
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#FAF5F0]/60 block mr-2">رقم الجوال</label>
                        <input
                           type="tel"
                           placeholder="رقم الهاتف"
                           value={phone}
                           onChange={(e) => setPhone(e.target.value)}
                           className="w-full border-b border-[#FAF5F0]/20 px-2 py-3 bg-transparent text-[#FAF5F0] placeholder-gray-500 focus:outline-none focus:border-[#DF8A9D] transition-colors text-sm text-right"
                           required
                        />
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] uppercase tracking-widest text-[#FAF5F0]/60 block mr-2">السبب</label>
                     <div className="relative">
                        <select
                           value={reason}
                           onChange={(e) => setReason(e.target.value)}
                           className="w-full border-b border-[#FAF5F0]/20 pl-8 pr-2 py-3 bg-transparent text-[#FAF5F0] focus:outline-none focus:border-[#DF8A9D] transition-colors text-sm appearance-none rounded-none cursor-pointer text-right"
                           dir="rtl"
                        >
                           <option value="size" className="text-black">مقاس غير مناسب</option>
                           <option value="color" className="text-black">لم يعجبني اللون على الطبيعة</option>
                           <option value="defect" className="text-black">عيب مصنعي</option>
                           <option value="other" className="text-black">أخرى</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] uppercase tracking-widest text-[#FAF5F0]/60 block mr-2">ملاحظات إضافية</label>
                     <textarea
                        placeholder="التفاصيل..."
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full border-b border-[#FAF5F0]/20 px-2 py-3 bg-transparent text-[#FAF5F0] placeholder-gray-500 focus:outline-none focus:border-[#DF8A9D] transition-colors text-sm resize-none text-right"
                     ></textarea>
                  </div>

                  <button
                     type="submit"
                     className="w-full bg-[#FAF5F0] text-[#0B0B0B] hover:bg-[#A44C5C] hover:text-[#FAF5F0] py-4 rounded-sm text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group mt-4"
                  >
                     <span>إرسال الطلب</span>
                     <Send size={14} className="group-hover:-translate-x-1 transition-transform rotate-180" />
                  </button>
               </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
