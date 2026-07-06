import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use the Gemini API key from environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  app.use(express.json());

  // Middleware to disable caching during development/updates
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  // API Route: Generate Splash Image
  app.get("/api/generate-splash", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    try {
      // Using gemini-3.5-flash which is the recommended model for Text tasks
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: "A high-end, luxury close-up of folded silk satin sleepwear in a soft champagne color, with an elegant rose gold SULTA logo visible on a ribbon, cinematic lighting, 8k resolution, minimalist aesthetic.",
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
          },
        },
      });

      let imageUrl = null;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${base64EncodeString}`;
          break;
        }
      }

      if (imageUrl) {
        res.json({ imageUrl });
      } else {
        res.status(500).json({ error: "Failed to generate image" });
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // API Route: Generate Banner Ideas
  app.post("/api/generate-banner-ideas", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Generate 3 sets of professional luxury titles and marketing descriptions for sliders based on the SULTA brand aesthetic, which is high-end, elegant, and focused on luxury sleepwear. Return in JSON format with an array of objects, each having 'title' and 'description'.",
        config: {
          responseMimeType: "application/json",
        },
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Banner ideas generation error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // API Route: Run SULTA AI Agents System
  app.post("/api/ai/run-agent", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const { agentId, payload } = req.body;
    if (!agentId) {
      return res.status(400).json({ error: "Missing agentId" });
    }

    try {
      let systemInstruction = "أنت مساعد ذكاء اصطناعي ملكي تعمل كخبير في دار أزياء SULTA الفاخرة لملابس النوم الراقية. تحدث بأسلوب راقٍ ومقنع ومحترف جداً يناسب العائلات والشخصيات الراقية في السعودية ومصر ومختلف الدول العربية.";
      let prompt = "";
      let isJson = false;

      switch (agentId) {
        case "store_manager":
          systemInstruction += " أنت مدير المتجر الذكي لـ SULTA. تقوم بمراقبة المبيعات وتحديد نقاط الضعف وصياغة التقارير التشغيلية والمالية بدقة.";
          prompt = `قم بتحليل مبيعات المتجر والبيانات المرفقة وصياغة تقرير تشغيلي فاخر (${payload.reportType || "يومي"}).
          البيانات الحقيقية للمتجر:
          - الطلبات الأخيرة: ${JSON.stringify(payload.orders || [])}
          - المنتجات المتاحة: ${JSON.stringify(payload.products || [])}
          - عدد العملاء: ${payload.customerCount || 0}
          
          قم بإنتاج تقرير عربي متكامل يحتوي على:
          1. ملخص المبيعات التشغيلي والأداء العام
          2. مراقبة المنتجات الأكثر مبيعاً والأقل مبيعاً
          3. رصد الطلبات المتأخرة أو المعلقة للعميلات
          4. نصائح تسويقية استراتيجية فورية لرفع معدل التحويل
          تحدث بأسلوب ملوكي فاخر وبشكل منظم للغاية.`;
          break;

        case "customer_support":
          systemInstruction += " أنت وكيل خدمة العملاء الفاخر والذكي لـ SULTA. ترد على استفسارات العميلات حول حالة الطلب والمقاسات والشحن والتبديل برقي تكنولوجي مذهل.";
          prompt = `أجب عن استفسار العميلة التالي بناءً على معطيات قاعدة البيانات الحقيقية وسياسات دار SULTA:
          - استفسار العميلة: "${payload.message}"
          - بيانات العميلة وطلباتها الحالية: ${JSON.stringify(payload.customerContext || {})}
          - المنتجات المستفسر عنها إن وجدت: ${JSON.stringify(payload.productContext || {})}
          
          سياسات دار SULTA المعتمدة:
          * الشحن: شحن ملكي سريع في مصر (100 جنيه) والسعودية (50 ريال)، مع تغليف حريري وصندوق ملكي معطر مجاناً.
          * الاسترجاع والاستبدال: متاح خلال 14 يوماً للقطع غير المستخدمة بعبوتها الأصلية المغلقة لضمان النظافة العالية.
          * المقاسات: نوفر مقاسات من S إلى XXL مع نظام قياس دقيق بالسانتيمتر لمحيط الصدر والأرداف.
          
          صغ رداً عربياً ملوكي المعشر، دقيقاً، مع عبارات ترحيب راقية مثل 'أميرتنا العزيزة' أو 'ضيفتنا الكريمة'.`;
          break;

        case "seo_agent":
          systemInstruction += " أنت أخصائي تحسين محركات البحث (SEO) لدار SULTA. تفهم في الكلمات الدلالية الفاخرة وبنية Schema.org.";
          isJson = true;
          prompt = `قم بإنشاء عناصر سيو متكاملة وجذابة للمنتج التالي لتصدر نتائج جوجل:
          - اسم المنتج: "${payload.nameAr}" / "${payload.nameEn}"
          - الوصف: "${payload.descriptionAr}"
          - القسم: "${payload.categoryAr}"
          
          يجب أن تعيد النتيجة بصيغة JSON حصرياً وتحتوي على المفاتيح التالية:
          {
            "seoTitle": "العنوان الفاخر لمحركات البحث مع كلمات دلالية راقية",
            "metaDescription": "الوصف التعريفي المثير للشراء والبحث تحت 160 حرف",
            "keywords": ["كلمة 1", "كلمة 2", "كلمة 3"],
            "openGraph": {
              "title": "عنوان مشاركة فيسبوك والمنصات الاجتماعي",
              "description": "وصف جذاب للمشاركة"
            },
            "twitterCard": {
              "card": "summary_large_image",
              "title": "عنوان تويتر",
              "description": "وصف تويتر"
            },
            "schemaJson": "نص Schema.org JSON-LD صالح بنسبة 100% لوصف منتج كوتور فاخر"
          }`;
          break;

        case "content_agent":
          systemInstruction += " أنت مبدع المحتوى والكاتب الفاخر لـ SULTA. تكتب مقالات وبوستات شبكات التواصل ببريق يلامس شغف الأناقة.";
          prompt = `قم بصياغة محتوى ترويجي استثنائي كوتور بناءً على التفاصيل التالية:
          - نوع المحتوى المطلوب: "${payload.contentType}" (خيارات: مقال مدونة، بوست انستقرام، بوست فيسبوك، نص فيديو تيك توك، رسالة واتساب جماعية)
          - الموضوع أو المنتج الموجه: "${payload.topic}"
          - تفاصيل إضافية: "${payload.additionalDetails || ""}"
          
          اكتب محتوى ترويجي متكامل وبأعلى درجات الفخامة اللغوية العربية، مع تضمين علامات الهاشتاج الراقية وأفكار مرئية للمصورين.`;
          break;

        case "marketing_agent":
          systemInstruction += " أنت المدير التسويقي الاستراتيجي لدار SULTA. تحلل البيانات لابتكار حملات وعروض تزيد المبيعات وتضمن ولاء الأميرات.";
          prompt = `قم بتحليل تفضيلات المتجر الحقيقية التالية وصياغة حملة تسويقية مقترحة وعروض ترويجية دقيقة:
          - قائمة المنتجات الأكثر مفضلة (Wishlist): ${JSON.stringify(payload.wishlistCounts || [])}
          - قائمة المنتجات الأكثر شراءً: ${JSON.stringify(payload.purchaseCounts || [])}
          
          قم بإخراج:
          1. فكرة حملة تسويقية موسمية مبتكرة لـ SULTA
          2. عرض ترويجي مقترح لرفع متوسط قيمة السلة
          3. كوبون خصم تكنولوجي مقترح مع تحديد الرمز والنسبة والاسم
          اكتب ذلك بلغة عربية تسويقية فاخرة ومنظمة جداً.`;
          break;

        case "inventory_agent":
          systemInstruction += " أنت مراقب الجودة والمخزون لدار SULTA. حريص على توفر المقاسات والألوان لضمان عدم خذلان أي عميلة راقية.";
          prompt = `قم بتحليل مستويات المخزون الحالية لـ SULTA وصياغة تقرير ذكي عن المنتجات التي توشك على النفاد والمقاسات الشحيحة:
          - المنتجات ومخزونها المتوفر: ${JSON.stringify(payload.inventoryData || [])}
          
          اكتب تقريراً عربياً دقيقاً يرصد:
          1. المنتجات الحرجة ذات المخزون الأقل من 5 قطع
          2. التنبيهات الخاصة بالألوان والمقاسات المطلوبة بشدة والتي توشك على النفاد
          3. اقتراحات لجدولة التوريد أو التصنيع لمنع نفاد المخزون.`;
          break;

        case "reviews_agent":
          systemInstruction += " أنت خبير السمعة وجودة المنتجات لدار SULTA. تحلل آراء العميلات بدقة متناهية وترصد المشاكل لتحسين التجربة.";
          prompt = `قم بتحليل آراء وتقييمات العميلات الحقيقية التالية واستخرج المشاكل المتكررة والنقاط الإيجابية:
          - التقييمات المسجلة: ${JSON.stringify(payload.reviews || [])}
          
          صغ تقريراً تحليلياً عربياً يوضح:
          1. تقييم السمعة الإجمالي للدار (متوسط النجوم والرضا)
          2. المشاكل المتكررة إن وجدت (المقاسات، سرعة الشحن، التغليف، الخامة)
          3. المنتجات الأعلى تقييماً وثناءً من الأميرات
          4. المنتجات التي تحتاج تحسيناً أو تعديلاً استراتيجياً.`;
          break;

        case "personal_shopper":
          systemInstruction += " أنت مستشار التسوق والمساعد الشخصي (Personal Shopper) لدار SULTA. تقدمين توصيات أزياء مخصصة تلبي ذوق الأميرات الرفيع.";
          prompt = `قم بتقديم جلسة استشارة أزياء ملكية مخصصة وتوصية بقطع محددة للعميلة بناءً على بياناتها الحقيقية:
          - دولة العميلة: "${payload.country}"
          - لغة التصفح المفضلة: "${payload.language || "العربية"}"
          - مقاسها المعتمد: "${payload.sizePreference || "L"}"
          - الألوان المفضلة: "${payload.colorPreference || "كحلي/وردي"}"
          - قائمة المشتريات السابقة والمفضلة: ${JSON.stringify(payload.historyContext || [])}
          - معروضات المتجر الكاملة المتاحة: ${JSON.stringify(payload.productsCatalog || [])}
          
          اكتبي رسالة عربية بالغة الرقي تقترحين فيها 3 قطع من الكتالوج تناسب ذوقها تماماً مع تفسير سبب التوصية لكل قطعة بلمسة شاعرية وأناقة كوتور.`;
          break;

        case "translation_agent":
          systemInstruction += " أنت المترجم الفوري وبواب اللغة الراقية لدار SULTA. تترجم بين العربية والإنجليزية بدقة ومع الحفاظ على رقي المصطلح الفخم.";
          prompt = `قم بترجمة النص أو الكائن التالي بدقة احترافية وسياق ملكي فاخر:
          - الاتجاه المطلوب: ${payload.direction || "العربية ↔ الإنجليزية"}
          - النص الأصلي المراد ترجمته:
          "${payload.text}"
          
          أعد الترجمة الفاخرة مباشرة وبشكل دقيق وبدون تعليقات جانبية.`;
          break;

        case "ceo_agent":
          systemInstruction += " أنت المستشار التنفيذي الأعلى (Chief Executive Agent) لمالك دار SULTA. تقدم تحليلات مالية وتوقعات نمو من فئة النخبة.";
          prompt = `أهلاً بك في الغرفة الرئاسية لـ SULTA. قم بصياغة ملخص تنفيذي استراتيجي شامل لمالك الدار بناءً على مؤشرات الأداء الحقيقية الحالية:
          - مبيعات وأرباح اليوم: ${payload.todaySales || 0}
          - مبيعات وأرباح الشهر: ${payload.monthlySales || 0}
          - إجمالي الفواتير: ${payload.totalOrdersCount || 0}
          - إجمالي قاعدة الأميرات (العملاء): ${payload.totalCustomersCount || 0}
          - أفضل فئات ومنتجات مبيعاً وألوانها ومقاساتها: ${JSON.stringify(payload.topSellingMeta || {})}
          - الدولة الأكثر شراءً: ${payload.topCountry || "السعودية"}
          
          اكتب تقريراً تنفذياً باللغة العربية بأسلوب احترافي وعميق يركز على الأرباح المتوقعة، الفجوات التشغيلية، وخطة التوسع المقترحة لمصر والخليج العربي.`;
          break;

        default:
          prompt = `تحية ملكية من دار SULTA. يرجى تزويدنا بالتوجيهات لتحليل البيانات.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          ...(isJson ? { responseMimeType: "application/json" } : {}),
        },
      });

      const textResult = response.text || "";
      if (isJson) {
        res.json(JSON.parse(textResult.trim() || "{}"));
      } else {
        res.json({ result: textResult });
      }
    } catch (error: any) {
      console.error(`AI Agent running error [${agentId}]:`, error);
      res.status(500).json({ error: error.message || "Internal agent breakdown" });
    }
  });

  // API Route: Simulate Daily Automation Cron Jobs
  app.post("/api/ai/cron-simulate", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const { products, orders, reviews } = req.body;

    try {
      // Simulate running overnight cron jobs
      const systemInstruction = "أنت العقل المدبر لجدولة الأتمتة التلقائية (Cron Jobs System) لدار SULTA الفاخرة. تقوم بتنسيق عمل جميع الوكلاء تلقائياً كل ليلة.";
      const prompt = `أهلاً بك. حان وقت التشغيل اليومي التلقائي للأتمتة في SULTA.
      الرجاء إنتاج ملخص أتمتة شامل ومبهر في صيغة JSON تحتوي على مفاتيح لنتائج أعمال الأمس:
      - عدد المنتجات: ${products?.length || 0}
      - عدد الطلبات: ${orders?.length || 0}
      - عدد المراجعات: ${reviews?.length || 0}
      
      البيانات المرفقة:
      * مبيعات الأمس: ${JSON.stringify(orders || [])}
      * المراجعات الجديدة: ${JSON.stringify(reviews || [])}
      
      صغ رداً بتنسيق JSON حصرياً يحتوي على:
      {
        "status": "success",
        "timestamp": "${new Date().toISOString()}",
        "reportsGenerated": ["تقرير مبيعات الأمس اليومي", "ملخص الجودة للمراجعات"],
        "seoUpdatesCount": 1,
        "criticalStockAlerts": ["تنبيه مخزون: بيجامة حريرية وردية S توشك على النفاد"],
        "marketingCampaignTriggered": "حملة خصم الأميرات لعطلة نهاية الأسبوع",
        "summaryAr": "ملخص عربي فاخر ومبهر يتحدث عن قيام النظام تلقائياً بتحليل الطلبات وإجراء عمليات المراجعة والتسويق وتحسين الـ SEO ليلة أمس بنجاح كامل 100% وبدون أي تدخل بشري."
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Cron Simulation failure:", error);
      res.status(500).json({ error: error.message || "Internal scheduler error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Use 'custom' to handle the main HTML response manually
    });
    
    app.use(vite.middlewares);

    // Dynamic SEO middleware for development
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API if not handled by previous routes, and skip anything that looks like a file
      if (url.startsWith('/api') || url.includes('.')) {
        return next();
      }

      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        if (!fs.existsSync(indexPath)) {
           console.error("index.html not found in dev at:", indexPath);
           return next();
        }
        
        let html = fs.readFileSync(indexPath, 'utf-8');
        // Transform the index.html for Vite features (client script injection)
        html = await vite.transformIndexHtml(url, html);
        
        const seo = {
          title: "Sulta | بيت الأزياء الملكي - لانجري وبيجامات فاخرة",
          description: "اكتشفي عالم SULTA الساحر: أرقى مجموعات البيجامات واللانجري المصنوعة من الساتان الإيطالي والحرير الطبيعي. تجربة ملكية تبدأ من اختيارك.",
          image: "/assets/images/hero_sleepwear_luxury_1780620325112.png"
        };

        const finalHtml = html
          .replace(/__TITLE__/g, seo.title)
          .replace(/__DESCRIPTION__/g, seo.description)
          .replace(/__IMAGE__/g, seo.image);
          
        res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    
    app.get('*', (req, res) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        if (!fs.existsSync(indexPath)) {
          return res.status(404).send("Index file not found");
        }
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        const seo = {
          title: "Sulta | بيت الأزياء الملكي - لانجري وبيجامات فاخرة",
          description: "اكتشفي عالم SULTA الساحر: أرقى مجموعات البيجامات واللانجري المصنوعة من الساتان الإيطالي والحرير الطبيعي. تجربة ملكية تبدأ من اختيارك.",
          image: "/assets/images/hero_sleepwear_luxury_1780620325112.png"
        };

        const finalHtml = html
          .replace(/__TITLE__/g, seo.title)
          .replace(/__DESCRIPTION__/g, seo.description)
          .replace(/__IMAGE__/g, seo.image);
          
        res.status(200).set({ 'Content-Type': 'text/html' }).send(finalHtml);
      } catch (e) {
        res.status(500).send("Error loading page");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
