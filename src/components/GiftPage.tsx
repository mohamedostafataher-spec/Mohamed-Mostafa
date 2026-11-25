import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from './SEO';

const WA = '966552823677';

export default function GiftPage() {
  const [who, setWho] = useState('');
  const [note, setNote] = useState('');
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = [
      'مرحباً سولته، أبغى أطلب هدية.',
      who.trim() ? `الهدية لـ: ${who.trim()}` : '',
      note.trim() ? `رسالة الهدية: ${note.trim()}` : '',
      'أبغى أسأل عن توصيلها لعنوان المستلمة.'
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  const field = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white';
  return (
    <div className="bg-gray-50 min-h-screen pb-20" dir="rtl">
      <SEO
        title="هدية بيجامة نسائية من سولته"
        description="اطلبي بيجامة نسائية من سولته كهدية. وان سايز يناسب من 45 إلى 80 كيلو، توصيل لجميع مدن المملكة، واستبدال خلال 14 يوم."
        path="/gift"
      />
      <header className="bg-[#FAF5F0] py-14 px-6 text-center border-b border-[#DF8A9D]/20">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B0B0B]">بيجامة هدية من سولته</h1>
        <p className="mt-3 text-gray-600 max-w-xl mx-auto text-sm">مقاس واحد يناسب من 45 إلى 80 كيلو، فما تحتارين في المقاس.</p>
        <Link to="/store" className="inline-block mt-5 bg-[#111827] text-white font-bold py-3 px-6 rounded-2xl text-sm">تصفحي البيجامات</Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 mt-8 space-y-4">
        <section className="bg-white rounded-3xl border border-gray-150 p-6">
          <h2 className="text-lg font-bold mb-3">كيف تطلبين هدية</h2>
          <ol className="list-decimal pe-5 text-sm text-gray-700 space-y-2">
            <li>اختاري البيجامة واللون وأضيفيها للسلة.</li>
            <li>في الطلب اكتبي اسم وعنوان ورقم المستلمة بدل بياناتك.</li>
            <li>إذا تبين تضيفين رسالة، اكتبيها هنا وأرسليها لنا على واتساب ونتفق معك.</li>
          </ol>
          <p className="text-xs text-gray-500 mt-3">التوصيل 2 إلى 4 أيام عمل. الشحن 40 ر.س ومجاني فوق 299 ر.س. الدفع عند الاستلام أو تحويل بنكي. الاستبدال والاسترجاع خلال 14 يوم من الاستلام.</p>
        </section>
        <section className="bg-white rounded-3xl border border-gray-150 p-6">
          <h2 className="text-lg font-bold mb-3">اسألينا عن الهدية</h2>
          <form onSubmit={send} className="space-y-3">
            <input className={field} value={who} onChange={(e) => setWho(e.target.value)} placeholder="الهدية لمن؟ (اختياري)" aria-label="الهدية لمن" />
            <textarea className={field} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="رسالة الهدية (اختياري)" aria-label="رسالة الهدية" />
            <button type="submit" className="w-full bg-[#25D366] text-white font-bold py-3.5 rounded-2xl">إرسال عبر واتساب</button>
            <p className="text-[11px] text-gray-500">نفتح لك محادثة واتساب جاهزة. ما نحفظ شي من بياناتك في الموقع.</p>
          </form>
        </section>
      </main>
    </div>
  );
}
