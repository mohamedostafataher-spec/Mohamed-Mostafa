import React from 'react';
import { Link } from 'react-router-dom';
import SEO from './SEO';

const WA = 'https://wa.me/966552823677?text=' + encodeURIComponent('Hello Sulta, I have a question about an order.');

const faqs: [string, string][] = [
  ['What sizes do you have?', 'Every pajama is one size, made for 45 to 80 kg. If you are near either end and have a question about length or fit, message us on WhatsApp before ordering.'],
  ['What is the fabric?', 'Our pajamas are made from crinkle cotton. Care instructions are on each product page.'],
  ['Where do you deliver?', 'We deliver to cities across Saudi Arabia. Delivery usually takes 2 to 4 business days.'],
  ['How much is shipping?', 'Shipping is 40 SAR. It is free on orders over 299 SAR.'],
  ['What about Gulf countries outside Saudi Arabia?', 'Message us on WhatsApp. Rates and delivery time for other Gulf countries are confirmed at the time of your order.'],
  ['How do I pay?', 'Cash on delivery or bank transfer. We do not take online card payments.'],
  ['What is the return policy?', 'You can return or exchange within 14 days of receiving your order, if the item is in its original condition. If something arrives damaged or faulty, tell us within 48 hours.'],
  ['How do I start a return?', 'Use the return form on our returns page. It opens a WhatsApp message with your order number.']
];

export default function EnglishPage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-20" dir="ltr" lang="en">
      <SEO
        title="Sulta | Women's pajamas, delivered across Saudi Arabia"
        description="Sulta sells women's crinkle cotton pajamas in one size (45-80 kg). Delivery across Saudi Arabia in 2-4 business days. Cash on delivery or bank transfer. 14-day returns."
        path="/en"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
        }}
      />
      <header className="bg-[#FAF5F0] py-16 px-6 text-center border-b border-[#DF8A9D]/20">
        <h1 className="text-3xl font-extrabold text-[#0B0B0B]">Sulta women's pajamas</h1>
        <p className="mt-3 text-gray-600 max-w-xl mx-auto">Crinkle cotton pajamas in one size, delivered to cities across Saudi Arabia.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/store" className="bg-[#111827] text-white font-bold py-3 px-6 rounded-2xl">Shop pajamas</Link>
          <a href={WA} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white font-bold py-3 px-6 rounded-2xl">Chat on WhatsApp</a>
        </div>
        <p className="mt-4 text-xs text-gray-500">The store itself is in Arabic.</p>
      </header>
      <main className="max-w-3xl mx-auto px-6 mt-8 space-y-4">
        <section className="bg-white rounded-3xl border border-gray-150 p-6 space-y-2">
          <h2 className="text-xl font-bold">At a glance</h2>
          <ul className="list-disc ps-5 text-gray-700 space-y-1 text-sm">
            <li>One size, 45 to 80 kg</li>
            <li>Delivery in 2 to 4 business days across Saudi Arabia</li>
            <li>Shipping 40 SAR, free over 299 SAR</li>
            <li>Cash on delivery or bank transfer</li>
            <li>Return or exchange within 14 days</li>
          </ul>
        </section>
        <section className="bg-white rounded-3xl border border-gray-150 p-6">
          <h2 className="text-xl font-bold mb-3">Questions</h2>
          <div className="space-y-4">
            {faqs.map(([q, a]) => (
              <div key={q}><h3 className="font-bold text-gray-900 text-sm">{q}</h3><p className="text-gray-700 text-sm mt-1">{a}</p></div>
            ))}
          </div>
        </section>
        <section className="bg-white rounded-3xl border border-gray-150 p-6 text-sm text-gray-700 space-y-1">
          <h2 className="text-xl font-bold text-gray-900">Contact</h2>
          <p>WhatsApp: <a className="font-bold" href={WA}>0552823677</a></p>
          <p><Link className="font-bold underline" to="/returns">Returns and exchanges</Link> | <Link className="font-bold underline" to="/track-order">Track your order</Link></p>
        </section>
      </main>
    </div>
  );
}
