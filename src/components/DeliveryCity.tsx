import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from './SEO';
import { DELIVERY_CITIES, cityTitle, cityDesc } from '../data/deliveryCities';

export default function DeliveryCity() {
  const { city } = useParams<{ city: string }>();
  const c = DELIVERY_CITIES.find((x) => x.slug === city);
  if (!c) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center" dir="rtl">
        <p className="mb-4">الصفحة غير موجودة.</p>
        <Link to="/store" className="text-[#A44C5C] font-bold">تصفحي البيجامات</Link>
      </div>
    );
  }
  return (
    <main className="max-w-3xl mx-auto px-6 py-12" dir="rtl">
      <SEO title={cityTitle(c.ar)} description={cityDesc(c.ar)} path={`/delivery/${c.slug}`} />
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">بيجامات سولته مع توصيل إلى {c.ar}</h1>
      <p className="text-gray-700 leading-loose mb-4">نوصّل بيجامات سولته النسائية إلى {c.ar} وإلى جميع مدن المملكة.</p>
      <ul className="list-disc pr-6 space-y-2 text-gray-700 mb-6">
        <li>التوصيل خلال 2 إلى 4 أيام عمل.</li>
        <li>الشحن 40 ر.س، ومجاني للطلبات فوق 299 ر.س.</li>
        <li>الدفع عند الاستلام أو بالتحويل البنكي.</li>
        <li>مقاس واحد يناسب من 45 إلى 80 كيلو.</li>
        <li>استبدال واسترجاع خلال 14 يوم من الاستلام، والقطعة بحالتها الأصلية.</li>
      </ul>
      <div className="flex flex-wrap gap-3">
        <Link to="/store" className="bg-[#111827] text-white font-bold py-3 px-6 rounded-2xl text-sm">تصفحي البيجامات</Link>
        <Link to="/shipping" className="border border-gray-300 font-bold py-3 px-6 rounded-2xl text-sm">تفاصيل الشحن</Link>
      </div>
      <p className="text-xs text-gray-500 mt-6">أسئلة عن طلبك؟ راسلينا على واتساب 0552823677.</p>
    </main>
  );
}
