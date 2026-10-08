import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, CornerUpLeft, Clock, MessageCircle, Star, Sparkles, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function ReturnsExchanges() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = "سياسة الاستبدال والاسترجاع | SULTA ✨";
    
    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", "تعرفي على سياسة الاستبدال والاسترجاع في SULTA. رضاكِ هو أولويتنا. ضمان الجودة، شحن آمن، وتجربة تسوق فاخرة ترضيكِ.");

    // Update Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", "سياسة الاستبدال والاسترجاع | SULTA");

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", "تعرفي على سياسة الاستبدال والاسترجاع في SULTA. رضاكِ هو أولويتنا.");

    // Structured Data for FAQPage
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "هل يمكن تعديل الطلب بعد إرساله؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "نعم إذا لم يتم شحن الطلب بعد."
          }
        },
        {
          "@type": "Question",
          "name": "كيف أتابع حالة طلبي؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "من صفحة تتبع الطلب."
          }
        },
        {
          "@type": "Question",
          "name": "هل الصور مطابقة للمنتج؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "نعم، جميع الصور تمثل المنتج بأفضل شكل ممكن."
          }
        }
      ]
    };

    let scriptTag = document.querySelector('#faq-structured-data');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('id', 'faq-structured-data');
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData);

    return () => {
      // Cleanup on unmount if necessary
      if (scriptTag) scriptTag.remove();
    };
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "هل يمكن تعديل الطلب بعد إرساله؟",
      answer: "نعم إذا لم يتم شحن الطلب بعد."
    },
    {
      question: "كيف أتابع حالة طلبي؟",
      answer: "من صفحة تتبع الطلب."
    },
    {
      question: "هل الصور مطابقة للمنتج؟",
      answer: "نعم، جميع الصور تمثل المنتج بأفضل شكل ممكن."
    }
  ];

  const features = [
    {
      icon: <ShieldCheck size={28} className="text-[#A44C5C]" />,
      title: "فحص جودة قبل الشحن",
    },
    {
      icon: <Truck size={28} className="text-[#A44C5C]" />,
      title: "شحن آمن",
    },
    {
      icon: <MessageCircle size={28} className="text-[#A44C5C]" />,
      title: "دعم عملاء سريع",
    },
    {
      icon: <Star size={28} className="text-[#A44C5C]" />,
      title: "منتجات مختارة بعناية",
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans" dir="rtl">
      {/* Hero Section */}
      <div className="bg-[#FAF5F0] py-24 px-6 border-b border-[#DF8A9D]/20 text-center relative overflow-hidden">
        <Sparkles className="absolute top-10 right-10 text-[#DF8A9D]/30" size={32} />
        <Sparkles className="absolute bottom-10 left-10 text-[#DF8A9D]/30" size={48} />
        
        <div className="max-w-3xl mx-auto relative z-10 animate-fade-in-up">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-[#0B0B0B] mb-4 uppercase tracking-wide">
            سياسة الاستبدال والاسترجاع
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-sans mt-4">
            رضاكِ هو أولويتنا في SULTA ✨
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20 space-y-8 animate-fade-in">
        
        {/* Features grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-xs border border-gray-150 flex flex-col items-center justify-center text-center gap-4 hover:shadow-md transition-all group">
              <div className="w-14 h-14 bg-[#FAF5F0] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <span className="font-bold text-gray-900 text-sm">{item.title}</span>
            </div>
          ))}
        </div>

        {/* Quality Section */}
        <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-150 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#FAF5F0] rounded-xl flex items-center justify-center shadow-xs">
               <ShieldCheck size={24} className="text-[#A44C5C]" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#0B0B0B]">ضمان الجودة 💎</h2>
          </div>
          <p className="text-gray-600 mb-6 text-base md:text-lg leading-relaxed">
            جميع منتجات SULTA يتم فحصها بعناية قبل الشحن لضمان:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['جودة الخامات', 'سلامة المنتج', 'دقة المقاسات', 'مطابقة المنتج للصور والوصف'].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-150 hover:bg-white hover:shadow-xs transition-colors">
                <CheckCircle2 size={20} className="text-[#A44C5C] shrink-0" />
                <span className="text-gray-900 font-bold text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Preparation Section */}
        <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-150">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#FAF5F0] rounded-xl flex items-center justify-center shadow-xs">
               <Truck size={24} className="text-[#A44C5C]" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#0B0B0B]">تجهيز الطلب 📦</h2>
          </div>
          <div className="space-y-5">
            <div className="flex gap-4 items-start bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div className="w-2 h-2 rounded-full bg-[#A44C5C] shrink-0 mt-2" />
              <p className="text-gray-700 font-medium text-base leading-relaxed">يتم تجهيز الطلب خلال 1 إلى 3 أيام عمل.</p>
            </div>
            <div className="flex gap-4 items-start bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div className="w-2 h-2 rounded-full bg-[#A44C5C] shrink-0 mt-2" />
              <p className="text-gray-700 font-medium text-base leading-relaxed">قد تصل مدة التجهيز والشحن إلى 5 أيام عمل في المواسم والعروض الخاصة.</p>
            </div>
          </div>
        </section>

        {/* Exchange and Return Terms */}
        <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-150">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#FAF5F0] rounded-xl flex items-center justify-center shadow-xs">
               <CornerUpLeft size={24} className="text-[#A44C5C]" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#0B0B0B]">شروط الاستبدال والاسترجاع (خلال 14 يوماً) 🔄</h2>
          </div>
          <p className="text-gray-600 mb-6 text-base leading-relaxed">
            نحرص في SULTA على تجربة تسوق راقية ومرنة ترضيكِ تماماً، وفق الضوابط التالية:
          </p>
          <ul className="grid grid-cols-1 gap-4">
            {[
              {
                title: 'مهلة الاستبدال والاسترجاع ⏳',
                desc: 'يحق للعميلة طلب الاستبدال أو الاسترجاع خلال 14 يوماً من تاريخ استلام الشحنة (مع التنويه بضرورة فحص الطرد وإبلاغنا عن أي كسر أو عيب مصنعي خلال أول 48 ساعة).'
              },
              {
                title: 'شروط سلامة القطع والملابس 🏷️',
                desc: 'يجب أن تكون القطعة بحالتها الأصلية غير ملبوسة، غير مغسولة، ببطاقات الأسعار وداخل كيس وتغليف SULTA الفاخر دون تلف.'
              },
              {
                title: 'استثناءات الملابس الداخلية والقطع المفتوحة 🔒',
                desc: 'حفاظاً على الصحة العامة والسلامة الشخصية، لا يمكن استرجاع أو استبدال القطع الداخلية (Lingerie) أو البيجامات التي فُتحت أو تم ارتداؤها مباشرة إلا في حال وجود عيب مصنعي مؤكد وموثق بالصور قبل الاستخدام.'
              },
              {
                title: 'من يتحمل رسوم الشحن؟ 🚚',
                desc: '• في حال وجود خطأ في المقاس أو اللون من قِبل المتجر، أو وجود عيب مصنعي: يتحمل المتجر كافة رسوم الشحن والاسترجاع 100% دون أي تكلفة على العميلة.\n• في حال الرغبة بالاستبدال أو الاسترجاع لأسباب شخصية (تغيير الرأي أو رغبة بموديل آخر): تتحمل العميلة رسوم شحن البوليصة بقيمة 40 ر.س ويُعاد باقي المبلغ لحسابها البنكي فور استلام الشحنة وفحصها.'
              }
            ].map((item, idx) => (
              <li key={idx} className="bg-gray-50 border border-gray-200/80 p-5 rounded-2xl space-y-1.5">
                <span className="font-bold text-gray-950 text-sm block">{item.title}</span>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{item.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Not eligible */}
        <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-150">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shadow-xs">
               <span className="text-red-500 text-2xl font-bold">❌</span>
            </div>
            <h2 className="font-serif text-xl md:text-2xl font-bold text-[#0B0B0B] leading-snug">لا يمكن الاستبدال أو الاسترجاع في الحالات التالية:</h2>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['استخدام المنتج.', 'غسل المنتج.', 'إزالة التغليف أو البطاقات.', 'تلف المنتج بسبب سوء الاستخدام.', 'انتهاء مدة تقديم الطلب.'].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 bg-red-50/50 border border-red-100 p-4 rounded-xl">
                <span className="text-red-500 font-black shrink-0 text-lg leading-none">•</span>
                <span className="text-gray-900 font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Time Limit */}
        <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-150">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#FAF5F0] rounded-xl flex items-center justify-center shadow-xs">
               <Clock size={24} className="text-[#A44C5C]" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#0B0B0B]">المدة الزمنية لتقديم الطلب ⏳</h2>
          </div>
          <div className="bg-[#FAF5F0]/50 p-6 rounded-2xl border border-[#A44C5C]/20 space-y-2 shadow-sm text-right">
            <p className="text-gray-900 text-base sm:text-lg font-bold leading-relaxed">
              • مهلة الاستبدال والاسترجاع العامة: <span className="text-[#A44C5C] bg-white px-2 py-0.5 rounded-md border border-[#A44C5C]/20 mx-1">14 يوماً</span> من تاريخ استلام الشحنة للقطع السليمة غير المفتوحة.
            </p>
            <p className="text-gray-600 text-xs sm:text-sm font-medium leading-relaxed">
              • الإبلاغ عن تلف الشحن أو العيب المصنعي: يُشترط إخطارنا خلال أول <span className="font-bold text-gray-900">48 ساعة</span> من الاستلام لسرعة التعويض وشحن قطعة بديلة فوراً.
            </p>
          </div>
        </section>

        {/* Shipping & Delivery */}
        <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-150">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#FAF5F0] rounded-xl flex items-center justify-center shadow-xs">
               <Truck size={24} className="text-[#A44C5C]" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#0B0B0B]">الشحن والتوصيل 🚚</h2>
          </div>
          <ul className="space-y-4">
            <li className="flex gap-4 items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="w-2 h-2 rounded-full bg-[#A44C5C] shrink-0" />
              <p className="text-gray-800 font-medium text-base">يتم الشحن لجميع المناطق المتاحة.</p>
            </li>
            <li className="flex gap-4 items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="w-2 h-2 rounded-full bg-[#A44C5C] shrink-0" />
              <p className="text-gray-800 font-medium text-base">تختلف مدة التوصيل حسب المدينة وشركة الشحن.</p>
            </li>
            <li className="flex gap-4 items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="w-2 h-2 rounded-full bg-[#A44C5C] shrink-0" />
              <p className="text-gray-800 font-medium text-base">يمكن متابعة حالة الطلب من صفحة تتبع الطلب.</p>
            </li>
          </ul>
        </section>

        {/* Customer Support */}
        <section className="bg-[#A44C5C] text-white p-8 md:p-10 rounded-3xl shadow-xl relative overflow-hidden">
          <Sparkles className="absolute top-4 left-4 text-white/10" size={48} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-sm">
                 <MessageCircle size={24} />
              </div>
              <h2 className="font-serif text-2xl font-bold">خدمة العملاء 📞</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                <span className="text-[#F6E7A6] block mb-2 text-sm uppercase tracking-wider font-bold">واتساب كونسيرج المملكة 🇸🇦:</span>
                <a href="https://wa.me/966596894393?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20SULTA%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%A8%D8%AF%D8%A7%D9%84%20%D9%88%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%B1%D8%AC%D8%A7%D8%B9" target="_blank" rel="noopener noreferrer" dir="ltr" className="text-xl font-bold hover:text-[#DF8A9D] transition-colors inline-block text-right w-full font-mono">
                  0596894393
                </a>
                <span className="text-[10px] text-gray-400 block mt-1">+966 59 689 4393 (خدمة عميلات النخبة)</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                <span className="text-gray-300 block mb-2 text-sm uppercase tracking-wider font-bold">البريد الإلكتروني الملكي:</span>
                <a href="mailto:concierge@sulta.sa" dir="ltr" className="text-lg md:text-xl font-bold hover:text-[#DF8A9D] transition-colors inline-block text-right w-full font-serif">
                  concierge@sulta.sa
                </a>
                <span className="text-[10px] text-gray-400 block mt-1">الرد الملكي السريع والمتابعة الفورية</span>
              </div>
            </div>
          </div>
        </section>

        {/* SULTA Promise */}
        <section className="bg-gradient-to-br from-white to-[#FAF5F0] p-10 md:p-12 rounded-3xl shadow-sm border border-[#DF8A9D]/20 text-center relative">
          <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-6 shadow-md border border-gray-100">
            <span className="text-4xl">👑</span>
          </div>
          <h2 className="font-serif text-3xl font-black text-[#0B0B0B] mb-6 tracking-wide">وعد SULTA</h2>
          <p className="text-gray-600 mb-8 text-lg md:text-xl max-w-lg mx-auto">
            نلتزم بتقديم تجربة تسوق تجمع بين:
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['✨ الأناقة', '✨ الراحة', '✨ الجودة', '✨ الثقة'].map((item, idx) => (
              <span key={idx} className="bg-white border border-[#DF8A9D]/30 px-8 py-3 rounded-full text-gray-900 font-bold text-lg shadow-sm hover:scale-105 transition-transform duration-300">
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-150">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shadow-xs">
                <span className="text-2xl font-serif text-gray-900">?</span>
             </div>
             <h2 className="font-serif text-2xl font-bold text-[#0B0B0B]">الأسئلة الشائعة</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-150 rounded-2xl overflow-hidden shadow-xs transition-colors hover:border-gray-200">
                <button
                  className="w-full text-right bg-white p-5 flex justify-between items-center transition-colors font-bold text-gray-900"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="text-base">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${openFaq === index ? 'bg-[#FAF5F0]' : 'bg-gray-50'}`}>
                    <ChevronDown size={18} className={`text-gray-600 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-[#A44C5C]' : ''}`} />
                  </div>
                </button>
                {openFaq === index && (
                  <div className="p-5 bg-gray-50/50 border-t border-gray-100 text-gray-700 leading-relaxed font-medium animate-fade-in text-sm md:text-base">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

