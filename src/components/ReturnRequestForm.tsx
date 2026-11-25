import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

const WA = '966552823677';

/** Builds a WhatsApp message with the request. Nothing is stored on the site. */
export default function ReturnRequestForm() {
  const [type, setType] = useState('استرجاع');
  const [order, setOrder] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      `طلب ${type} من متجر سولته`,
      `رقم الطلب: ${order.trim()}`,
      name.trim() ? `الاسم: ${name.trim()}` : '',
      reason.trim() ? `السبب: ${reason.trim()}` : '',
      'سأرسل صور القطعة هنا.'
    ].filter(Boolean);
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  };

  const field = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white';
  return (
    <section id="return-form" className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-150">
      <h2 className="font-serif text-2xl font-bold text-[#0B0B0B] mb-2">اطلبي استبدال أو استرجاع</h2>
      <p className="text-sm text-gray-600 mb-5">عبّي البيانات ونفتح لك محادثة واتساب جاهزة. ما نحفظ شي من بياناتك في الموقع.</p>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          {['استرجاع', 'استبدال'].map((t) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold border ${type === t ? 'bg-[#A44C5C] text-white border-[#A44C5C]' : 'bg-white text-gray-700 border-gray-200'}`}>{t}</button>
          ))}
        </div>
        <input className={field} value={order} onChange={(e) => setOrder(e.target.value)} placeholder="رقم الطلب" required aria-label="رقم الطلب" />
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم (اختياري)" aria-label="الاسم" />
        <textarea className={field} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="السبب (اختياري)" aria-label="السبب" />
        <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 rounded-2xl">
          <MessageCircle size={19} /><span>إرسال الطلب عبر واتساب</span>
        </button>
        <p className="text-[11px] text-gray-500">الاسترجاع والاستبدال خلال 14 يوماً من الاستلام وبحالة القطعة الأصلية. أي عيب أو كسر نبلغ عنه خلال 48 ساعة.</p>
      </form>
    </section>
  );
}
