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
      question: 'ما هي جودة وخامات بيجامات وملابس سولتا (SULTA)؟',
      answer: 'نوظف في SULTA أفخر خطوط الأقمشة العالمية بخصوصية مطلقة. نستخدم الساتان الإيطالي الفاخر المستورد ذو الظهر الحريري الناعم الملمس المانع للشحنات والتعريق، والحرير الطبيعي الباريسي مع الدانتيل الفرنسي الرقة (Chantilly Lace). كما نصنع مجموعتنا القطنية بالكامل من القطن المصري العضوي طويل التيلة ذو المعالجة المخملية الملطفة للبشرة.'
    },
    {
      category: 'sizing',
      question: 'كيف أختار مقاسي الأنسب لبيت الأزياء SULTA؟',
      answer: 'لدينا جدول قياسات دقيق يتوافق مع منحنيات الجسم العربي بدقة. لجميع ملابس النوم واللانج وير، نوصي دوماً بمراجعة صفحة "دليل المقاسات" المتوفر في شريط التصفح لترتيب مقاس مناسب. إذا كنتِ في المنتصف بين مقاسين، ننصحك باختياز المقاس الأكبر لراحة قصوى أثناء الحركة والاسترخاء في المنزل.'
    },
    {
      category: 'packaging',
      question: 'ما هو شكل وطريقة التغليف المرفقة مع الطلبات؟',
      answer: 'جميع طلبيات SULTA تشحن داخل علبة "البكج الفاخر الملكي" المات الأسود الكلاسيكي الفاخر المتين، ومحفورة بشعار العلامة باللون الذهبي الشامبين اللامع، ومربوطة يدويًا بشريط وردي مخملي ناعم الملمس. وتغلف القطع بالداخل بورق حرير فريد لحماية المنسوجات مع بطاقة ترحيب منسوجة بخصوصية.'
    },
    {
      category: 'shipping',
      question: 'كم يستغرق الشحن والوصول في السعودية ومصر؟',
      answer: 'نوفر شحناً ملكياً سريعاً مجدداً لراحتك. في السعودية: يستغرق الشحن عبر أرامكس وسمسا ٣ أيام عمل لكافة المناطق الكبرى (الرياض، جدة، الدمام). في مصر: شحن سريع خلال ٤٨ ساعة للقاهرة والجيزة و٣ أيام عمل للمحافظات الأخرى.'
    },
    {
      category: 'returns',
      question: 'ما هي سياسة الاسترجاع والتبديل المطبقة بالمتجر؟',
      answer: 'يسعدنا جداً ملاءمتك، لذا ندعم سياسة الاستبدال والاسترجاع بمرونة كاملة خلال ١٤ يوماً من الاستلام. شريطة أن تكون القطعة بحالتها الأصلية غير مغسولة أو مستخدمة، مجهزةً بالتاج والورق الداخلي لـ SULTA ومعبأة ببطاقة الشكر في الصندوق الفاخر المستلم.'
    },
    {
      category: 'payments',
      question: 'هل عمليات السداد آمنة تزييفاً وما هي الطرق المتوفرة؟',
      answer: 'موقعنا مجهز بأعلى بروتوكولات حظر التتبع SSL الأمنية والتشفير البنكي المعتمد. نقبل المدفوعات عبر بطاقات مدى (Mada)، أبل باي (Apple Pay)، STC Pay في السعودية، وفوري (Fawry)، فيزا (Visa) والماستر في مصر، بالإضافة لبرنامج "الدفع نقدًا عند الاستلام" مع خدمة فحص وتأكيد الطرد.'
    },
    {
      category: 'materials',
      question: 'هل تتأثر خامة الساتان والحرير بطرق التغليف والشحن المتبعة؟',
      answer: 'على الإطلاق، طرق التغليف المتبعة في SULTA صُممت خصيصاً لتمنح ألياف الحرير والساتان الطبيعي القدرة على التنفس بنقاء، لضمان وصول القطعة لكي بنعومتها الأصلية وبدون أي روائح تخزين غير مرغوبة.'
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
    { id: 'all', label: 'الجميع' },
    { id: 'materials', label: 'الأقمشة والجودة' },
    { id: 'sizing', label: 'المقاسات ودعم الاختيار' },
    { id: 'packaging', label: 'التغليف والهدايا' },
    { id: 'shipping', label: 'الشحن الملكي والتوصيل' },
    { id: 'returns', label: 'المرتجعات والبدائل' },
    { id: 'payments', label: 'المدفوعات والأمان' },
  ];

  const filteredFaqs = activeTab === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === activeTab);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      
      {/* Editorial Header */}
      <div className="text-center space-y-4 mb-16">
        <span className="text-xs uppercase tracking-[0.2em] text-[#F4B6C2] font-serif block font-medium">Customer Concierge & Help • أسئلة العرائس الشائعة</span>
        <h2 className="font-serif text-3xl md:text-5xl font-light text-[#0B0B0B] tracking-wide">
          الأسئلة الشائعة ودليلك للمتعة الفاخرة
        </h2>
        <div className="w-16 h-0.5 bg-[#F6E7A6] mx-auto mt-4" />
        <p className="max-w-xl mx-auto text-gray-500 text-xs md:text-sm font-sans leading-relaxed">
          نحن في SULTA حريصون على تقديم تجربة تسوق راقية تمنحك الأنوثة المتكاملة والدفء المطلق. تصفحي الإجابات المعتمدة من خبرائنا لمساعدتك.
        </p>
      </div>

      {/* Categories Filter Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-10 select-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-sans transition-all border ${
              activeTab === cat.id
                ? 'bg-[#0B0B0B] text-[#F6E7A6] border-black shadow-md font-medium'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion Questions Container */}
      <div className="space-y-4 max-w-3xl mx-auto">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs hover:border-[#F4B6C2] transition-colors"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full text-right px-6 py-5 flex items-center justify-between gap-4 font-serif text-sm md:text-base font-light text-[#0B0B0B] hover:text-[#F4B6C2] transition-colors"
              >
                <span>{faq.question}</span>
                <span className="text-[#F4B6C2]">
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>

              {isOpen && (
                <div className="px-6 pb-5 border-t border-gray-50 pt-3">
                  <p className="text-gray-600 text-xs md:text-sm font-sans leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* WhatsApp Concierge Banner */}
      <div className="mt-16 bg-[#FAFAF7] rounded-3xl p-6 md:p-8 border border-gray-150 flex flex-col md:flex-row items-center justify-between gap-6 max-w-3xl mx-auto">
        <div className="text-center md:text-right space-y-1">
          <h4 className="font-serif text-lg text-gray-900 font-medium">لم تجدي ما تبحثين عنه في الدليل؟</h4>
          <p className="text-xs text-gray-500 font-sans">فريق الدعم الشخصي والكونسيرج لـ SULTA متاح لمساعدتِك وتوصية المنسوجات الملائمة عبر واتساب.</p>
        </div>
        <a
          href="https://wa.me/966500000000?text=مرحباً كونسيرج سولتا 🌸، لدي استفسار بخصوص المنتجات والمقاسات."
          target="_blank"
          rel="referrer noopener"
          className="bg-[#25D366] text-white hover:bg-[#20ba59] px-6 py-3 rounded-full text-xs font-sans font-bold flex items-center gap-2 shadow-md hover:scale-103 transition-transform shrink-0"
        >
          <MessageSquare size={14} />
          <span>محادثة الخبير الفوري</span>
        </a>
      </div>

    </div>
  );
}
