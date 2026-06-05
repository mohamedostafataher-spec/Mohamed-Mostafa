import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, MessageSquare, ShieldCheck, Truck } from 'lucide-react';
import { dbService } from '../services/db';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [faqs, setFaqs] = useState<FaqItem[]>([
    {
      category: 'materials',
      question: 'ما هي جودة وخامة قطع "سُلْطَة"؟',
      answer: 'في سُلْطَة، نعتمد أرقى خطوط الأقمشة العالمية بأسلوب حصري. نستخدم ساتان إيطالي فاخر مستورد بملمس حريري يمنع الكهرباء الساكنة والتعرق، وحرير باريسي طبيعي، ودانتيل "شانتيلي" الفرنسي الرفيع. تشكيلة القطن مصنوعة بالكامل من القطن المصري العضوي طويل التيلة والمعالج لملمس مخملي يسكن الحواس.'
    },
    {
      category: 'sizing',
      question: 'كيف أختار مقاسي المثالي؟',
      answer: 'لدينا جدول مقاسات دقيق مصمم بعناية فائقة لضمان الملاءمة المثالية. ننصحكِ بمراجعة "دليل المقاسات" الخاص بنا للعثور على ما يناسبكِ. إذا كنتِ بين مقاسين، نوصي باختيار المقاس الأكبر لضمان الراحة القصوى.'
    },
    {
      category: 'packaging',
      question: 'كيف يتم تغليف الطلبات؟',
      answer: 'تُشحن جميع طلبات سُلْطَة داخل "تغليفنا الملكي الفاخر"؛ صندوق صلب أسود "مات" كلاسيكي محفور عليه شعار العلامة بذهب الشمبانيا اللامع، ومربوط يدويًا بشريط مخملي وردي ناعم. القطع بداخلها مغلفة بورق حريري فريد ومرفق معها بطاقة ترحيبية.'
    },
    {
      category: 'shipping',
      question: 'كم يستغرق الشحن؟',
      answer: 'نوفر شحنًا ملكيًا سريعًا لراحتكِ. في المناطق الرئيسية، يستغرق الشحن عادةً من ٢ إلى ٤ أيام عمل.'
    },
    {
      category: 'returns',
      question: 'ما هي سياسة الاستبدال والاسترجاع؟',
      answer: 'نحن ندعم سياسة استرجاع واستبدال مرنة بالكامل خلال ١٤ يومًا من الاستلام، بشرط أن تظل القطعة في حالتها الأصلية غير المغسولة وغير المستخدمة مع جميع الملصقات والصندوق الملكي سليمًا.'
    },
    {
      category: 'payments',
      question: 'هل عمليات الدفع آمنة؟',
      answer: 'موقعنا مجهز بأعلى بروتوكولات الأمان SSL والتشفير البنكي المعتمد. نقبل بطاقات الائتمان الرئيسية وخيارات الدفع الآمنة عبر الجوال مثل Apple Pay ومدى.'
    }
  ]);

  useEffect(() => {
    const fetchFaqs = async () => {
      const data = await dbService.getFaqs();
      if (data && data.length > 0) {
        setFaqs(data);
      }
    };
    fetchFaqs();
  }, []);

  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'materials', label: 'الأقمشة والجودة' },
    { id: 'sizing', label: 'المقاسات والملاءمة' },
    { id: 'packaging', label: 'التغليف والهدايا' },
    { id: 'shipping', label: 'الشحن والتوصيل' },
    { id: 'returns', label: 'الاسترجاع والاستبدال' },
    { id: 'payments', label: 'الدفع والأمان' },
  ];

  const filteredFaqs = activeTab === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === activeTab);

  return (
    <div className="bg-white min-h-screen">
      
      {/* Editorial Header */}
      <div className="bg-[#FAF5F0] py-24 md:py-32 border-b border-[#DF8A9D]/20" dir="rtl">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="font-serif italic text-xs tracking-[0.2em] text-[#A44C5C] block mb-3 uppercase">
            كونسيرج العملاء والمساعدة
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[#0B0B0B] tracking-wide mb-6 uppercase">
            الأسئلة الشائعة
          </h2>
          <div className="w-12 h-[1px] bg-[#A44C5C] mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-sans max-w-xl mx-auto leading-relaxed">
            في "سُلْطَة"، نحن مكرسون لتقديم تجربة تسوق متميزة. تصفحي الإجابات الموثقة من خبرائنا لمساعدتكِ.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Categories Filter Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-16 select-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-2.5 rounded-sm text-xs font-sans tracking-widest uppercase transition-all border ${
                activeTab === cat.id
                  ? 'bg-[#0B0B0B] text-[#FAF5F0] border-black font-semibold'
                  : 'bg-transparent text-gray-600 border-gray-200 hover:border-[#DF8A9D]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4 font-sans" dir="rtl">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              لا توجد أسئلة في هذا القسم حالياً.
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => (
              <div 
                key={idx} 
                className={`border rounded-sm transition-all duration-300 ${
                  openIdx === idx 
                    ? 'border-[#DF8A9D]/40 bg-[#FAF5F0]/50 shadow-sm' 
                    : 'border-gray-100 bg-white hover:border-[#DF8A9D]/30'
                }`}
              >
                <button
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-right"
                >
                  <span className={`font-serif text-sm tracking-wide ${openIdx === idx ? 'text-[#0B0B0B] font-semibold' : 'text-gray-700'}`}>
                    {faq.question}
                  </span>
                  {openIdx === idx ? (
                    <ChevronUp size={18} className="text-[#A44C5C] shrink-0 mr-4" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400 shrink-0 mr-4" />
                  )}
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openIdx === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 pt-0 border-t border-gray-100/50 mt-1">
                    <p className="text-sm text-gray-500 leading-relaxed font-sans">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
