import { Product, Category } from '../types';

// ==========================================
// SULTA OFFLINE SEO & CONTENT ENGINE V2.0
// ==========================================

const FABRICS_AR: Record<string, string> = {
  'حرير': 'الحرير الطبيعي الفاخر',
  'ساتان': 'الساتان الحريري الناعم',
  'قطن': 'القطن المصري الممتاز',
  'دانتيلا': 'الدانتيل الفرنسي الرقيق',
  'مخمل': 'المخمل الدافئ والأنيق'
};

const FABRICS_EN: Record<string, string> = {
  'حرير': 'Premium Natural Silk',
  'ساتان': 'Silky Soft Satin',
  'قطن': 'Premium Egyptian Cotton',
  'دانتيلا': 'Delicate French Lace',
  'مخمل': 'Elegant Warm Velvet'
};

/**
 * Calculates SEO Health Score (0-100)
 */
export const calculateSeoScore = (product: Product): { score: number, suggestions: string[] } => {
  let score = 0;
  const suggestions: string[] = [];

  // Title check (30pts)
  if (product.nameAr.length > 20) {
    score += 15;
  } else {
    suggestions.push("العنوان العربي قصير جداً، أضيفي كلمات وصفية لزيادة التأثير.");
  }
  if (product.nameEn.length > 20) {
    score += 15;
  } else {
    suggestions.push("English title is too short, add descriptive adjectives.");
  }

  // Meta Description check (20pts)
  if (product.seo?.metaDescriptionAr && product.seo.metaDescriptionAr.length > 100) {
    score += 10;
  } else {
    suggestions.push("وصف الميتا العربي مفقود أو قصير جداً لمحركات البحث.");
  }
  if (product.seo?.metaDescriptionEn && product.seo.metaDescriptionEn.length > 100) {
    score += 10;
  } else {
    suggestions.push("English Meta Description is missing or too short.");
  }

  // Images Alt Text check (10pts)
  if (product.seo?.altTextAr && product.seo?.altTextEn) {
    score += 10;
  } else {
    suggestions.push("نصوص Alt للصور مفقودة، وهي ضرورية لظهور الصور في جوجل.");
  }

  // Full Description Depth (20pts)
  if (product.descriptionAr && product.descriptionAr.length > 300) {
    score += 10;
  } else {
    suggestions.push("الوصف التفصيلي العربي يحتاج لمزيد من العمق (أكثر من 300 حرف).");
  }
  if (product.descriptionEn && product.descriptionEn.length > 300) {
    score += 10;
  } else {
    suggestions.push("English full description needs more depth (300+ chars).");
  }

  // FAQ check (10pts)
  if (product.faqs && product.faqs.length >= 3) {
    score += 10;
  } else {
    suggestions.push("أضيفي على الأقل 3 أسئلة شائعة لتقوية الربط الداخلي والـ SEO.");
  }

  // Keywords check (10pts)
  if (product.seo?.keywordsAr && product.seo?.keywordsEn) {
    score += 10;
  } else {
    suggestions.push("الكلمات المفتاحية Focus Keywords غير محددة.");
  }

  return { score, suggestions };
};

export const generateProductContent = (product: Product) => {
  const fabric = product.fabricEn || 'Satin';
  const fabricAr = product.fabricAr || 'الأقمشة الفاخرة';
  const nameAr = product.nameAr;
  const nameEn = product.nameEn || product.nameAr;
  const category = product.categoryAr || 'ملابس نوم';
  const season = product.season || 'صيف 2026';

  // --- ARABIC CONTENT ---
  const shortDescriptionAr = `تألقي براحة لا مثيل لها مع ${nameAr}. صُمم هذا الطقم بعناية فائقة من ${fabricAr} ليمنحكِ نعومة خيالية ونوماً هانئاً في موسم ${season}.`;
  const seoTitleAr = `شراء ${nameAr} | SULTA لملابس النوم الفاخرة | ${category}`;
  const metaDescriptionAr = `اكتشفي فخامة ${nameAr} من SULTA. طقم نوم مصنوع من ${fabricAr} لراحة ونعومة مثالية. اطلبي الآن لتمتلكي قطعة كوتور فريدة من نوعها من أرقى بيوت الأزياء في مصر والسعودية.`;
  const keywordsAr = `${nameAr}, ملابس نوم فاخرة, ${fabricAr}, SULTA, بيجامات عرايس, كوتور, ${category}`;

  const fullDescriptionAr = `
رؤية SULTA للمنتج:
ارتقي بتجربة نومكِ إلى مستوى الكوتور الفاخر مع طقم ${nameAr}. قطعة فنية تجمع بين الأناقة المطلقة والراحة الفائقة، مصممة خصيصاً للمرأة التي لا ترضى بأقل من الكمال.

تفاصيل النسيج (Fabric Details):
منسوج بكل حرفية من ${fabricAr} اللطيف على البشرة، والذي يسمح بتنفس المسام ويحافظ على برودة الجسم طوال الليل. نختار أرقى الخيوط لنضمن لكِ متانة تدوم طويلاً مع لمسة حريرية لا تذبل.

مميزات التصميم (Design Features):
• قصة مريحة (Relaxed Fit) تناسب انحناءات الجسم بأناقة.
• خياطة يدوية مزدوجة لمتانة استثنائية.
• تفاصيل فاخرة وأزرار مغلفة تعكس هوية SULTA الأصلية.
• مناسب لـ ${season} ليمنحكِ التوازن المثالي بين الدفء والتهوية.

لماذا تختارين SULTA؟:
نحن في SULTA نؤمن أن ملابس النوم هي أغلى ما ترتديه المرأة في خصوصيتها، لذا نجعل من كل قطعة حكاية ترف تبدأ من اختيار القماش وتنتهي بتغليف ملكي يصلكِ أينما كنتِ.
`;

  // --- ENGLISH CONTENT ---
  const titleEn = `Premium ${nameEn} Sleepwear | ${fabric} Luxury Set | SULTA`;
  const shortDescriptionEn = `Experience unparalleled comfort with the ${nameEn}. Carefully crafted from ${fabric} to bring you dreamy softness and elegant nights in the ${season} collection.`;
  const seoTitleEn = `Buy ${nameEn} Luxury Sleepwear | SULTA Official | Luxury ${product.category}`;
  const metaDescriptionEn = `Discover the luxury of the ${nameEn} by SULTA. A sleepwear set made of ${fabric} for ultimate comfort and softness. Order your couture piece now from the leaders of luxury fashion in Egypt & Saudi Arabia.`;
  const keywordsEn = `luxury sleepwear, ${nameEn}, ${fabric}, women's pajamas, SULTA pajamas, elegant loungewear, couture sleepwear, ${product.category}`;

  const fullDescriptionEn = `
SULTA Product Vision:
Elevate your lounging experience to luxury couture with the ${nameEn} set. A masterpiece that blends absolute elegance with supreme comfort, designed for the woman who demands perfection in every detail.

Fabric Details:
Expertly woven with skin-friendly ${fabric}, promoting breathability and maintaining a cool body temperature all night long. We select only the finest threads to ensure lasting durability with a silky touch that remains pristine over time.

Design Highlights:
• Relaxed fit tailored to elegantly trace your silhouette with ease.
• Precision hand-stitching for exceptional quality.
• Luxurious accents and wrapped buttons reflecting the authentic SULTA brand DNA.
• Perfect for ${season}, providing the ideal balance of temperature regulation.

The SULTA Difference:
At SULTA, we believe sleepwear is the most precious garment a woman wears in her private moments. Every piece is a tale of opulence, from fabric selection to the royal packaging delivered directly to your doorstep.
`;

  // --- FAQ & Schema ---
  const faqs = [
    { q: "ما هي خامات هذا المنتج؟", a: `يتم تصنيع ${nameAr} من ${fabricAr} الفاخر المخصص لماركة سولتا.` },
    { q: "هل يتوفر شحن للسعودية؟", a: "نعم، نشحن لجميع مدن المملكة العربية السعودية ومصر مع توفير خدمة الدفع عند الاستلام." },
    { q: "كيف أختار المقاس المناسب؟", a: "يمكنكِ استخدام حاسبة المقاسات الذكية في صفحة المنتج لضمان الملاءمة المثالية." }
  ];

  const schemaMarkup = JSON.stringify({
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": nameEn,
    "image": product.images,
    "description": metaDescriptionEn,
    "brand": {
      "@type": "Brand",
      "name": "SULTA"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "SAR",
      "price": product.priceSA,
      "availability": "https://schema.org/InStock"
    }
  });

  return {
    ar: {
      seoTitle: seoTitleAr,
      metaDescription: metaDescriptionAr,
      keywords: keywordsAr,
      shortDescription: shortDescriptionAr,
      fullDescription: fullDescriptionAr,
      altText: `طقم ${nameAr} من سولتا - ملابس نوم فاخرة`
    },
    en: {
      seoTitle: seoTitleEn,
      metaDescription: metaDescriptionEn,
      keywords: keywordsEn,
      shortDescription: shortDescriptionEn,
      fullDescription: fullDescriptionEn,
      altText: `${nameEn} by SULTA - Luxury Sleepwear`
    },
    schemaMarkup,
    faqs
  };
};

export const generateCategorySeo = (category: Category) => {
  const name = category.name;
  return {
    ar: {
      title: `طقم ${name} فاخر | تسوقي مجموعة ${name} - SULTA`,
      description: `اكتشفي أرقى تصاميم ${name} في مصر والسعودية. مجموعة مُختارة بعناية من SULTA لتمنحكِ الأناقة والراحة المطلقة.`,
      keywords: `${name}, تسوق ${name}, SULTA ${name}, ملابس نوم`
    },
    en: {
      title: `Luxury ${name} Collection | Shop Elegant ${name} - SULTA`,
      description: `Explore the finest ${name} designs in Egypt & KSA. A hand-picked collection by SULTA for ultimate elegance and comfort.`,
      keywords: `${name}, shop ${name}, SULTA ${name}, luxury loungewear`
    }
  };
};

export const generateBlogDrafts = () => {
  return [
    {
      title: "أسرار النوم الملكي: كيف يغير الحرير الطبيعي جودة نومك؟",
      excerpt: "اكتشفي الفوائد الجمالية والصحية للنوم في بيجامات الحرير وكيف تعزز نضارة بشرتك.",
      content: `نومكِ هو وقت الاستشفاء لجسدك، وعندما تختارين ملابس نوم من الحرير، فأنت تستثمرين في صحتك وجمالك. الحرير يحافظ على ترطيب البشرة ولا يمتص الكريمات الليلية، كما أنه ينظم درجة حرارة الجسم بفضل أليافه الطبيعية...`,
      seo: "النوم الملكي, فوائد الحرير بيجامات, بيجامات حرير, SULTA blog"
    },
    {
      title: "دليل العروس لإعداد جهاز ملابس النوم المثالي",
      excerpt: "اكتشفي القطع الأساسية التي لا غنى عنها في جهازكِ من SULTA لتتألقي في كل أيام زفافك.",
      content: `إعداد جهاز العروس يتطلب ذكاءً واختيارات راقية. نحن في SULTA ننصح ببدء مجموعتك المكونة من: ٣ أطقم حريرية ناعمة للاستخدام اليومي، وقطعتين من الساتان الفاخر للمناسبات، وروب دانتيل ملكي لاستقبال الصباحية...`,
      seo: "دليل العروس ملابس نوم, جهاز العروس, بيجامات عرايس, SULTA جهاز عروس"
    },
    {
      title: "كيفية اختيار المقاس الذهبي لملابس النوم؟",
      excerpt: "دليل شامل لكيفية استخدام مكتشف القياس الذكي واختيار ما يناسب شكل قوامك.",
      content: `راحة ملابس النوم تعتمد بشكل كلي على المقاس. القاعدة الذهبية في ملابس النوم هي "مساحة التنفس". عند اختيار بيجامات الساتان، احرصي دائماً على إضافة 2 سم لضمان حرية الحركة ليلاً...`,
      seo: "مقاس ملابس النوم, اختيار المقاس المثالي, دليل مقاسات SULTA"
    }
  ];
};

