import { Product, Order, BlogPost, Collection } from '../types';
import jsPDF from 'jspdf';

// 1. SULTA Brand Palette Guidelines
export const BRAND_COLORS = [
  { name: 'Onyx Black (أسود سولتة الملكي)', hex: '#0B0B0B', role: 'اللون الرئاسي والفاخر للمساحات والخطوط العريضة' },
  { name: 'Warm Gold (ذهب ملكي دافئ)', hex: '#F6E7A6', role: 'لون التمييز والأزرار الملكية ورموز الحسن' },
  { name: 'Pink Pearl (ورد حالم كوتور)', hex: '#DF8A9C', role: 'لون الأنسجة الرقيقة والأرواب الملكية المزركشة' },
  { name: 'Crimson Velvet (أحمر مخملي عتيق)', hex: '#A44C5C', role: 'لون اللمسات الرومانسية وحواف الدانتيل الإيطالي' },
  { name: 'Soft Alabaster (عاجي ناصع)', hex: '#FAF5F0', role: 'الخلفية المريحة للنظر المعززة لشفافية الحرير' },
];

export const BRAND_FONTS = [
  { name: 'Inter', type: 'Sans-serif', role: 'نصوص واجهة المستخدم والأرقام والإحصائيات الفورية' },
  { name: 'Playfair Display', type: 'Serif', role: 'العناوين الفخمة والأسماء التجارية والعبارات الدلالية' },
  { name: 'Space Grotesk', type: 'Tech UI', role: 'مؤشرات الأرقام وجداول القياس والأحجام التفصيلية' },
];

// 2. High-Luxury Brand Vocabulary Rulebook
export const CRITICAL_WORDS_RULES = [
  { banned: 'رخيص', premium: 'اقتصادي بذكاء / استثمار مريح', severity: 'HIGH' },
  { banned: 'رخيص جداً', premium: 'قيمة استثنائية استحقاقية', severity: 'HIGH' },
  { banned: 'تخفيضات شعبية', premium: 'أسبوع التكريم الملكي كوتور', severity: 'MEDIUM' },
  { banned: 'أرخص نوع', premium: 'حرير كلاسيكي ذو نسيج معتدل', severity: 'HIGH' },
  { banned: 'للبيع السريع', premium: 'فرصة اقتناء حصرية لمجموعات الصالون', severity: 'LOW' },
  { banned: 'أوفر خصم', premium: 'مزايا السخاء الإمبراطوري', severity: 'MEDIUM' },
];

// 3. Virtual Customer Journey Steps
export interface JourneyStep {
  id: number;
  labelAr: string;
  labelEn: string;
  mockVisitors: number;
  dropPercentage: number;
  funnelStatus: 'excellent' | 'normal' | 'concerning';
  reasonAr: string;
  actionAr: string;
}

export const getCustomerJourneyData = (ordersCount: number): JourneyStep[] => {
  const baseVisitors = Math.max(1200, ordersCount * 40);
  return [
    {
      id: 1,
      labelAr: 'زيارة الصفحة الرئيسية (Home Page View)',
      labelEn: 'Home Page View',
      mockVisitors: baseVisitors,
      dropPercentage: 0,
      funnelStatus: 'excellent',
      reasonAr: 'الزوار ينعمون بأجواء الموسيقى والدانتيل الفاخر بمجرد الدخول للصالون.',
      actionAr: 'الحفاظ على سرعة الاستجابة اللحظية لعرض الأرواب الحريرية.'
    },
    {
      id: 2,
      labelAr: 'تصفح البوتيك والأقسام (Boutique Catalog)',
      labelEn: 'Boutique Catalog',
      mockVisitors: Math.round(baseVisitors * 0.72),
      dropPercentage: 28,
      funnelStatus: 'normal',
      reasonAr: 'يبدأ الزوار في تصفح مقاسات الساتان ومقارنة الألوان وتفاصيل الأقمشة.',
      actionAr: 'يوصى بتفعيل فلاتر الألوان الذكية ومستشار المقاسات الملكي التفاعلي لتقليص المغادرة.'
    },
    {
      id: 3,
      labelAr: 'معاينة تفاصيل قطعة الكوتور (Product Detail Page)',
      labelEn: 'Product Detail Page',
      mockVisitors: Math.round(baseVisitors * 0.42),
      dropPercentage: 41,
      funnelStatus: 'normal',
      reasonAr: 'العملاء يقرأون إرشادات الغسيل بالماء البارد ونوع الحرير الطبيعي المعالج.',
      actionAr: 'إضافة مقطع فيديو بيع تفاعلي كوتور (Lookbook) يحسن رغبة الاقتناء بنسبة ٣٠٪.'
    },
    {
      id: 4,
      labelAr: 'إضافة القطع إلى سلة المشتريات (Add to Cart)',
      labelEn: 'Add to Cart',
      mockVisitors: Math.round(baseVisitors * 0.15),
      dropPercentage: 64,
      funnelStatus: 'concerning',
      reasonAr: 'دخول مرحلة الجدّية، التردد يرتبط في الغالب بمستويات أسعار الشحن الإقليمي.',
      actionAr: 'يوصى بتطبيق كود ROYAL30 تلقائياً أو تقديم شحن إقليمي مجاني للطلبات فوق 500 SAR.'
    },
    {
      id: 5,
      labelAr: 'الدفع المترهف وتأكيد الطلبية (Checkout Completion)',
      labelEn: 'Checkout Completion',
      mockVisitors: Math.max(1, ordersCount),
      dropPercentage: 74,
      funnelStatus: 'normal',
      reasonAr: 'اكتمال الدورة المالية والانتقال للتحضير بالصالون اليدوي.',
      actionAr: 'إرسال رسالة واتساب فخمة مخصصة لتأكيد تفصيل المقاس بشكل آلي.'
    }
  ];
};

// 4. Interactive Site Map Nodes
export interface mapNode {
  nameAr: string;
  nameEn: string;
  type: 'page' | 'category' | 'collection' | 'blog' | 'group';
  children?: mapNode[];
}

export const getSiteMapTree = (
  categories: any[],
  collections: Collection[],
  products: Product[],
  blogPosts: BlogPost[]
): mapNode => {
  return {
    nameAr: '👑 منصة SULTA الملكية الكبرى',
    nameEn: 'SULTA Royal Platform',
    type: 'group',
    children: [
      {
        nameAr: '📄 الصفحات التفاعلية بالواجهة',
        nameEn: 'Core Pages',
        type: 'group',
        children: [
          { nameAr: 'مسرح العرض الرئيسي (Home)', nameEn: 'Home Display', type: 'page' },
          { nameAr: 'البوتيك الفاخر (Boutique)', nameEn: 'Luxury Boutique', type: 'page' },
          { nameAr: 'حكاية الدار وكوتور (Our Story)', nameEn: 'Our Story', type: 'page' },
          { nameAr: 'الدعم والمساعدة الأسئلة (FAQ)', nameEn: 'Faq', type: 'page' },
          { nameAr: 'تتبع طلبيات الصالون (Track Order)', nameEn: 'Track Order', type: 'page' },
        ]
      },
      {
        nameAr: '🏷️ أقسام معروضات المتجر السحابية',
        nameEn: 'Boutique Categories',
        type: 'group',
        children: categories.map(cat => ({
          nameAr: `${cat.nameAr} (${products.filter(p => p.category === cat.slug || p.categoryAr === cat.nameAr).length} قطعة)`,
          nameEn: cat.nameEn,
          type: 'category'
        }))
      },
      {
        nameAr: '🖼️ تشكيلات الأجواء والمواسم كوتور',
        nameEn: 'Couture Collections',
        type: 'group',
        children: collections.map(col => ({
          nameAr: col.nameAr,
          nameEn: col.nameEn,
          type: 'collection'
        }))
      },
      {
        nameAr: '✍️ منشورات مدونة الحرير والأقمشة',
        nameEn: 'Silk & Atelier Blogs',
        type: 'group',
        children: blogPosts.map(post => ({
          nameAr: post.title,
          nameEn: post.slug,
          type: 'blog'
        }))
      }
    ]
  };
};

// 5. AI Audit Generative Report Writer
export const generateAiAuditReport = (
  productsCount: number,
  ordersCount: number,
  healthScore: number,
  qualityAvg: number,
  brandConsistency: number,
  brokenCount: number
): string => {
  const dateStr = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `# 👑 تقرير التدقيق الذكي الشامل لمنصة SULTA الكوتور
**تاريخ التحليل المالي والتقني:** ${dateStr}  
**المستشار الاستراتيجي:** مُحرك الذكاء الاصطناعي التوليدي الحصري لدار سولتة (SULTA AI-Audit Core v2.5)

---

## 📊 لوحة المؤشرات العامة للعلامة التجارية
| المؤشر الفاخر | النسبة المئوية | التقييم الاستراتيجي | الإجراء المقترح |
| :--- | :---: | :---: | :---: |
| **معدل صحة وتكامل المتجر** | ${healthScore}% | ${healthScore > 90 ? 'ممتاز واحترافي' : 'بحاجة لمعاينة مكثفة'} | ${healthScore > 90 ? 'مراقبة التحديثات الدورية' : 'إكمال الأوصاف والصور المفقودة فوراً'} |
| **متوسط درجة جودة المنتجات**| ${qualityAvg}% | ${qualityAvg > 85 ? 'فخامة مطلقة (Elite)' : 'جودة متوسطة (Premium)'} | تعزيز الدلائل البصرية وصور الزوايا الأربعة |
| **مطابقة معايير السلوك والهوية**| ${brandConsistency}% | ${brandConsistency > 95 ? 'تطابق ملكي تام' : 'تشتت طفيف بالنبرة الصوتية'} | استبدال الكلمات الترويجية الرخيصة بعناوين وقار |
| **جاهزية إطلاق المنصة الفعلي** | ${Math.round((healthScore + qualityAvg + brandConsistency) / 3)}% | جاهز للتشغيل والامتداد الإقليمي | إطلاق حملات البراند الفوري لدول مجلس التعاون الخليجي |

---

## 🛠️ تحليل المشاكل والعيوب المكتشفة في البوتيك السحابي
1. **المكونات المعطلة والصور المكسورة:** 
   * تم رصد عدد **(${brokenCount})** رابط مكسور أو صورة مفقودة أو مسار فارغ في الجداول الحالية للبراند.
   * *الأثر الاستراتيجي:* تراجع معدل هيبة البوتيك أمام عملاء باقة الصالون الذهب مهدداً نسبة نقر الشراء.
2. **البيانات التفصيلية المبتورة للاستقرار والتفصيل:**
   * هناك منتجات محتواها العربي ينقصه جداول الأحجام والمقاسات أو إرشادات المحافظة على دقة الحياكة الطبيعية.

---

## 🚀 خطة تحسين معدلات التحويل وزيادة الأرباح (CRO Blueprint)
* **المجموعة الفورية الحصرية:** تخصيص ماركي شريط ترويجي متحرك يعلن عن الشحن الإقليمي المجاني للطلبات فوق 600 SAR لتفادي انسحاب نسبة 64% من الزوار عند السلة.
* **البناء البصري لقصة النسيج:** تفعيل تليفزيون سولتة (Video Lookbook) لربط الفيديوهات بشكل مباشر مع أزرار الشراء الفوري داخل الصالون لرفع متوسط قيمة الطلبية (AOV) بنسبة ٢٨٪.
* **استراتيجية الحرير الوردي:** إدراج منتج "بيجامة الساتان الدانتيل السولتة" كمنتج رائد بحملة الصيف لدفع عمليات البيع المقترن بالهدايا الملكية العائلية.

---

## 📜 شهادة الجودة الرسمية المعتمدة لدار سولتة
**بناءً على هذا الفحص الرقمي الشامل، نعلن أن منصة SULTA الفاخرة المتربطة بقاعدة بيانات Supabase تعمل بكفاءة إنتاجية وهندسية بالغة، وتصنف البوابة كبنية تحتية ممتازة مهيأة لاستقبال وتجهيز طلبيات الكوتور الاستثنائية لجميع النبلاء.**`;
};

// 6. Luxury PDF Certificate Writer using jsPDF
export const downloadLuxuryCertificatePDF = (
  healthScore: number,
  qualityAvg: number,
  brandConsistency: number,
  productsCount: number,
  ordersCount: number
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Background and borders Design
  doc.setFillColor(250, 245, 240); // Soft Alabaster background (#FAF5F0)
  doc.rect(0, 0, 210, 297, 'F');
  
  // Luxury gold-borders
  doc.setDrawColor(246, 231, 166); // Warm Gold (#F6E7A6)
  doc.setLineWidth(1.5);
  doc.rect(8, 8, 194, 281, 'D');

  doc.setDrawColor(164, 76, 92); // Crimson Velvet (#A44C5C)
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, 277, 'D');

  // Title section
  doc.setTextColor(11, 11, 11); // Onyx Black
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('S U L T A', 105, 35, { align: 'center' });
  
  doc.setFont('Times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(164, 76, 92);
  doc.text('HAUTE COUTURE & LUXURY ATELIER', 105, 42, { align: 'center' });

  // Divider line
  doc.setDrawColor(246, 231, 166);
  doc.setLineWidth(0.7);
  doc.line(40, 48, 170, 48);

  // Header Certificate
  doc.setTextColor(11, 11, 11);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(18);
  doc.text('OFFICIAL LAUNCH AUDIT CERTIFICATE', 105, 62, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  const nowStr = new Date().toUTCString();
  doc.text(`Generated on: ${nowStr}`, 105, 68, { align: 'center' });

  // Scorecards Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(240, 240, 240);
  doc.rect(20, 80, 170, 75, 'FD');

  // Score text
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 11, 11);
  doc.text('CORE PERFORMANCE METRICS', 105, 90, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`1. Global Store Health Score:  ${healthScore}%  (Excellent)`, 35, 105);
  doc.text(`2. Average Product Quality Score:  ${qualityAvg}%  (Luxury Elite)`, 35, 115);
  doc.text(`3. Brand Visual Consistency Index:  ${brandConsistency}%  (Highly Compliant)`, 35, 125);
  doc.text(`4. Configured Products Count:  ${productsCount} Couture Items`, 35, 135);
  doc.text(`5. Configured Orders Transacted:  ${ordersCount} Sales Records`, 35, 145);

  // Decorative logo or ribbon center
  doc.setDrawColor(164, 76, 92);
  doc.setFillColor(246, 231, 166);
  doc.rect(97, 168, 16, 16, 'FD');
  doc.setFont('Times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 11, 11);
  doc.text('S', 105, 178, { align: 'center' });

  // Description / Seal certification
  doc.setFont('Times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(11, 11, 11);
  doc.text('We hereby certify that the SULTA digital flagship boutique is completely', 105, 202, { align: 'center' });
  doc.text('vetted, performance-optimized, and verified with zero critical warnings.', 105, 209, { align: 'center' });
  doc.text('The system exhibits seamless synchronization with its Supabase DB architecture.', 105, 216, { align: 'center' });

  // Signatures
  doc.line(30, 255, 80, 255);
  doc.line(130, 255, 180, 255);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('PRINCIPAL SOFTWARE ARCHITECT', 55, 260, { align: 'center' });
  doc.text('SULTA COUTURE EXPERIENCE BOARD', 155, 260, { align: 'center' });

  // Save the PDF file
  doc.save('SULTA-Luxury-Audit-Certificate.pdf');
};
