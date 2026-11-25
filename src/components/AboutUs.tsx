import React from 'react';
import { Link } from 'react-router-dom';
import RibbonBowDivider from './RibbonBowDivider';
import SEO from './SEO';

interface AboutUsProps {
  homepageSections?: any[];
}

// Story text approved by the store owner. Written only from facts the store really states.
export default function AboutUs(_props: AboutUsProps) {
  return (
    <div className="bg-[#FAF4F5] min-h-screen animate-fade-in py-12" dir="rtl">
      <SEO
        title="عن سولته | بيجامات نسائية قطن كوريشة"
        description="سولته براند بيجامات نسائية قطن كوريشة بمقاس وان سايز من 45 إلى 80 كيلو. توصيل لجميع مدن المملكة، استبدال واسترجاع خلال 14 يوم."
        path="/about"
      />

      <div className="bg-[#FAF5F0] py-16 border-b border-[#DF8A9D]/20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B0B0B] mb-4">عن سولته</h1>
          <div className="py-2"><RibbonBowDivider /></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14 space-y-6 text-base md:text-lg text-gray-700 leading-loose">
        <p>سولته براند بيجامات نسائية قطن، تصميمها للراحة في البيت وللنوم. نختار كل قطعة بعناية عشان تحسّين فيها بنعومة القطن وتطلعين فيها بشكل أنيق حتى في ليلة عادية.</p>
        <p>بيجاماتنا من قطن كوريشة الناعم، يتنفس وخفيف على الجلد، وبمقاس واحد (وان سايز) يناسب من 45 إلى 80 كيلو. تشكيلتنا فيها ألوان وطبعات هادئة وأنثوية: فيونكات، ورد، نقاط، وتوليب.</p>
        <p>نوصّل لجميع مدن المملكة، والتوصيل داخل السعودية من 2 إلى 4 أيام عمل. الشحن 40 ر.س، ومجاني للطلبات فوق 299 ر.س. الدفع عند الاستلام أو بالتحويل البنكي. وعندك استبدال واسترجاع خلال 14 يوم، وإذا وصلتك القطعة فيها ضرر تقدرين تبلغينا خلال 48 ساعة.</p>
        <p>نتابع طلبك من أول ما تتواصلين معنا على واتساب لين يوصلك، ونحب نسمع رأيك. تابعينا على إنستغرام <a href="https://www.instagram.com/sultabrand" target="_blank" rel="noopener noreferrer" className="text-[#A44C5C] font-bold" dir="ltr">@sultabrand</a>.</p>
        <div className="pt-6 text-center">
          <Link to="/store" className="inline-block bg-[#111827] text-white font-bold px-8 py-3 rounded-full">تصفحي التشكيلة</Link>
        </div>
      </div>
    </div>
  );
}
