import React from 'react';
import { Link } from 'react-router-dom';
import SEO from './SEO';
import { InfoPage as InfoPageData } from '../data/infoPages';

const WA = 'https://wa.me/966552823677';

export default function InfoPage({ page }: { page: InfoPageData }) {
  const faqJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
  return (
    <main dir="rtl" className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <SEO title={page.title} description={page.description} path={`/${page.path}`} jsonLd={[faqJsonLd]} />
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-950 mb-3">{page.h1}</h1>
      <p className="text-gray-700 leading-relaxed mb-6">{page.intro}</p>
      <div className="space-y-5">
        {page.sections.map(s => (
          <section key={s.h2} className="rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-bold text-gray-950 mb-2">{s.h2}</h2>
            {s.paras?.map(p => <p key={p} className="text-sm text-gray-700 leading-relaxed">{p}</p>)}
            {s.list && (
              <ul className="list-disc pr-5 space-y-1.5 text-sm text-gray-700 leading-relaxed">
                {s.list.map(i => <li key={i}>{i}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>
      <h2 className="text-lg font-bold text-gray-950 mt-8 mb-3">أسئلة شائعة</h2>
      <div className="space-y-2">
        {page.faqs.map(f => (
          <details key={f.q} className="rounded-xl border border-gray-200 bg-white p-3">
            <summary className="font-bold text-sm text-gray-900 cursor-pointer">{f.q}</summary>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="mt-8 flex flex-col sm:flex-row gap-2.5">
        <Link to="/store" className="flex-1 text-center rounded-2xl bg-gray-950 text-white font-bold py-3 text-sm">تسوقي الآن</Link>
        <a href={WA} target="_blank" rel="noopener noreferrer" className="flex-1 text-center rounded-2xl bg-[#25D366] text-white font-bold py-3 text-sm">اسألينا على واتساب</a>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        <Link to="/size-guide" className="underline">دليل المقاسات</Link>
        <Link to="/shipping" className="underline">الشحن والتوصيل</Link>
        <Link to="/returns" className="underline">الاستبدال والاسترجاع</Link>
        <Link to="/track-order" className="underline">تتبع الطلب</Link>
      </div>
    </main>
  );
}
