import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Clock, Package, Truck, CheckCircle, 
  MapPin, CreditCard, Download, RefreshCw, MessageSquare, 
  ShieldCheck, AlertTriangle, Printer, PhoneCall, Copy, Check, FileText, Star,
  Send, Upload, Sparkles, Award, Image as ImageIcon, CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase, cleanImgUrl, dbService } from '../services/db';
import { Order, Product, OrderStatus, Settings, Review } from '../types';
import { jsPDF } from 'jspdf';
import { agentSystem, VipCustomer } from '../services/agentSystem';

interface OrderDetailViewProps {
  orderId: string;
  initialOrder?: Order;
  onClose?: () => void;
  onReorder?: (order: Order) => void;
  allProducts?: Product[];
}

export default function OrderDetailView({ 
  orderId, 
  initialOrder, 
  onClose, 
  onReorder,
  allProducts = [] 
}: OrderDetailViewProps) {
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({
    'المنتج': 5,
    'التغليف': 5,
    'الشحن': 5,
    'التجربة': 5
  });

  // --- SULTA AI AGENT SYSTEMS STATES ---
  const [vipCustomer, setVipCustomer] = useState<VipCustomer | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [isDelayed, setIsDelayed] = useState(false);
  const [delayDays, setDelayDays] = useState(0);
  
  // AI Chatbot State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Satisfaction Review Form State
  const [satisfactionComment, setSatisfactionComment] = useState('');
  const [satisfactionRating, setSatisfactionRating] = useState(5);
  const [satisfactionPhoto, setSatisfactionPhoto] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [satisfactionUploading, setSatisfactionUploading] = useState(false);

  // Fetch shop settings to utilize the live dynamic WhatsApp number
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const s = await dbService.getSettings();
        if (s) {
          setSettings(s);
        }
      } catch (err) {
        console.error("Failed to load settings in tracking page:", err);
      }
    };
    fetchSettings();
  }, []);

  // 1. Map products array into dictionary for fast access
  useEffect(() => {
    if (allProducts.length > 0) {
      const dict: Record<string, Product> = {};
      allProducts.forEach(p => { dict[p.id] = p; });
      setProductsMap(dict);
    }
  }, [allProducts]);

  // 2. Fetch order and subscribe to live changes in Supabase
  useEffect(() => {
    if (!orderId) return;

    const mapOrder = (data: any): Order => {
      return {
        id: data.id,
        customerName: data.customer_name || '',
        phone: data.phone || '',
        country: data.country || 'SA',
        city: data.city || '',
        address: data.address || '',
        notes: data.notes || undefined,
        giftMessage: data.gift_message || undefined,
        giftCardTheme: data.gift_card_theme || undefined,
        items: Array.isArray(data.items) ? data.items : (data.items ? JSON.parse(data.items) : []),
        totalPrice: Number(data.total_price ?? data.total ?? 0),
        currency: data.currency || 'SAR',
        paymentMethod: data.payment_method || '',
        status: data.status || 'pending',
        date: data.date || '',
        trackingNumber: data.tracking_number || undefined
      };
    };

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: dbErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();

        if (dbErr) throw dbErr;
        
        if (data) {
          const mapped = mapOrder(data);
          setOrder(mapped);

          // If no products loaded, query products in this order
          if (mapped.items && mapped.items.length > 0) {
            const productIds = mapped.items.map(it => it.productId);
            const { data: pData } = await supabase
              .from('products')
              .select('*')
              .in('id', productIds);
            
            if (pData) {
              const dict: Record<string, Product> = { ...productsMap };
              pData.forEach((rawP: any) => {
                // simple mapping matching mapping function
                const cat = rawP.category || 'sleepwear';
                const imgs = Array.isArray(rawP.images) ? rawP.images : (rawP.images ? JSON.parse(rawP.images) : []);
                const cleanImgs = imgs.map((img: any) => {
                  let path = img;
                  if (img && !img.startsWith('/') && !img.startsWith('http')) {
                    path = `/img/${img}.png`;
                  }
                  return cleanImgUrl(path, cat);
                });

                dict[rawP.id] = {
                  id: rawP.id,
                  nameAr: rawP.name_ar || rawP.name || '',
                  nameEn: rawP.name_en || rawP.name || '',
                  category: cat,
                  categoryAr: rawP.category_ar || 'تصاميم الحرير',
                  priceEG: Number(rawP.price_eg ?? 0),
                  priceSA: Number(rawP.price_sa ?? 0),
                  descriptionAr: rawP.description_ar || '',
                  descriptionEn: rawP.description_en || '',
                  fabricAr: rawP.fabric_ar || '',
                  fabricEn: rawP.fabric_en || '',
                  washInstructionsAr: rawP.wash_instructions_ar || '',
                  images: cleanImgs.length > 0 ? cleanImgs : ['/img/placeholder.png'],
                  colors: Array.isArray(rawP.colors) ? rawP.colors : (rawP.colors ? JSON.parse(rawP.colors) : []),
                  sizes: Array.isArray(rawP.sizes) ? rawP.sizes : (rawP.sizes ? JSON.parse(rawP.sizes) : []),
                  rating: Number(rawP.rating ?? 5),
                  reviewsCount: Number(rawP.reviews_count ?? 0),
                  stock: Number(rawP.stock ?? 10)
                };
              });
              setProductsMap(dict);
            }
          }
        } else {
          // Check localStorage as robust resilient duplicate fallback
          const offlineOrders = JSON.parse(localStorage.getItem('sulta_offline_orders') || '[]');
          const localO = offlineOrders.find((o: any) => o.id === orderId);
          if (localO) {
            setOrder(localO);
          } else {
            setError('تعذر العثور على طلبكِ في منظومة سولتة السحابية. يرجى التأكد من الكود المكتوب.');
          }
        }
      } catch (err: any) {
        console.error("Failed to read order from DB:", err);
        // Localstorage fallback
        const offlineOrders = JSON.parse(localStorage.getItem('sulta_offline_orders') || '[]');
        const localO = offlineOrders.find((o: any) => o.id === orderId);
        if (localO) {
          setOrder(localO);
        } else {
          setError('نعـتذر، حدث تعذر أثناء جلب بيانات طلبكِ المحدثة. يرجى التحقق من اتصال شبكتكِ.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // 3. Realtime sync subscription
    const channelName = `live-order-sync-${orderId}-${Math.random().toString(36).substring(2,7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders', 
        filter: `id=eq.${orderId}` 
      }, (payload) => {
        console.log("[SULTA REALTIME] Live change identified:", payload);
        if (payload.new) {
          setOrder(mapOrder(payload.new));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // --- SULTA AI AGENT SYSTEMS INITIALIZATIONS ---
  useEffect(() => {
    if (!order) return;

    // 1. Delivery Prediction AI
    const pred = agentSystem.getDeliveryPrediction(order);
    setPrediction(pred);

    // 2. VIP Status Detection
    const vips = agentSystem.getVipCustomers();
    const matchedVip = vips.find(v => 
      (order.phone && v.emailOrPhone.includes(order.phone)) || 
      (order.customerName && v.customerName === order.customerName)
    );
    if (matchedVip) {
      setVipCustomer(matchedVip);
    } else {
      // Try to check if eligible right now in background
      agentSystem.checkVipPromotion(order.customerName, order.phone, '').then(isPromoted => {
        if (isPromoted) {
          const freshVips = agentSystem.getVipCustomers();
          const freshVip = freshVips.find(v => v.customerName === order.customerName);
          if (freshVip) setVipCustomer(freshVip);
        }
      });
    }

    // 3. Delayed Status Detection
    if (order.status === 'pending' || order.status === 'processing') {
      const orderDate = new Date(order.date || new Date());
      const differenceInTime = new Date().getTime() - orderDate.getTime();
      const differenceInDays = differenceInTime / (1000 * 3600 * 24);
      if (differenceInDays >= 2) {
        setIsDelayed(true);
        setDelayDays(Math.floor(differenceInDays));
        // Verify delay log triggers
        agentSystem.checkDelayedOrders([order]);
      }
    }

    // 4. Chatbot Initial Welcome Greeting
    setChatMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `أهلاً بكِ يا أميرة SULTA الموقرة، ${order.customerName}! 🌸 أنا رفيقكِ الذكي لمساعد كوتور. ومستعد لمساعدتكِ فوراً في الإجابة عن أي استفسار يخص طلبيتكِ الفاخرة رقم #${order.id}. كيف يسعدني تدليل رغبات تساؤلاتكِ الكريمة اليوم؟ ✨`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }
    ]);

  }, [order]);

  // Scroll chat messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChatMessage = async (customMessage?: string) => {
    const textToSend = customMessage || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!customMessage) setChatInput('');
    setIsChatLoading(true);

    try {
      // Call server-side API proxy to hide Gemini API key safely
      const response = await fetch('/api/ai/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'customer_support',
          payload: {
            message: textToSend,
            customerContext: {
              id: order?.id,
              name: order?.customerName,
              phone: order?.phone,
              city: order?.city,
              address: order?.address,
              status: order?.status,
              totalPrice: order?.totalPrice,
              currency: order?.currency,
              date: order?.date
            },
            productContext: order?.items?.map(it => ({
              name: it.productName,
              color: it.color,
              size: it.size,
              price: it.price
            })) || []
          }
        })
      });

      const data = await response.json();
      const aiReply = data.text || "نعتذر يا أميرتنا الموقرة، حدث أمر فني طارئ في مخدم الكوتور السحابي. يسعدنا دائماً خدمتكِ هاتفياً أو عبر الواتساب في حال تطلب الأمر.";

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMsg]);

      // Log activity to the owner's dashboard
      agentSystem.addLog(
        'analytics_agent',
        'AI Customer Assistant',
        `💬 تواصل نشط! تفاعلت العميلة ${order?.customerName} مع المساعد الذكي حول طلبيتها الاستفسار: "${textToSend.slice(0, 30)}..."`,
        'info',
        { question: textToSend, response: aiReply }
      );

    } catch (err) {
      console.error("Chat message send failure:", err);
      const errMsg = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: "نعتذر للغاية عن هذا الانقطاع الفني الخارجي. يرجى إعادة إرسال رسالتك أو استخدام زر الدعم المباشر.",
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- REVIEW DRAG & DROP + SUBMIT HANDLERS ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSatisfactionUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSatisfactionPhoto(reader.result as string);
      setSatisfactionUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitSatisfactionForm = async () => {
    if (!order) return;
    setSatisfactionUploading(true);
    try {
      const newReview: Review = {
        id: `REV-${Date.now()}`,
        username: order.customerName,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop',
        rating: satisfactionRating,
        comment: satisfactionComment + (satisfactionPhoto ? ` [صورة مرفقة مضافة من العميل]` : ''),
        date: new Date().toISOString().split('T')[0],
        country: order.country === 'EG' ? 'مصر' : 'السعودية',
        productName: order.items[0]?.productName || 'تصميم كوتور فاخر'
      };

      await dbService.saveReview(newReview);
      setRatingSubmitted(true);

      // Log in agent system
      agentSystem.addLog(
        'satisfaction_agent',
        'Customer Satisfaction Agent',
        `⭐ تم تقديم مراجعة تجربة عملاء لطلب ${order.id} من العميلة ${order.customerName} بتقييم ${satisfactionRating}/5 وصور مرفقة. تم الحفظ سحابياً في جدول Reviews.`,
        'success',
        newReview
      );
    } catch (err) {
      console.error("Failed to save satisfaction review:", err);
    } finally {
      setSatisfactionUploading(false);
    }
  };

  // Copy order id handler
  const handleCopyId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Pre-configured custom luxury WhatsApp channel
  const handleContactSupport = () => {
    if (!order) return;
    const msg = encodeURIComponent(
      `مرحباً بوتيك سولتا لخدمة النخبة، أود الاستفسار بخصوص طلبي الملكي الحاصل على كود المعالجة: "${order.id}".\n` +
      `باسم المستلم الموقر: (${order.customerName})\n` +
      `المبلغ الإجمالي المعتمد: ${order.totalPrice.toLocaleString()} ${order.currency}\n` +
      `الحالة الحالية: ${getStatusTitle(order.status)}\n` +
      `يرجى موافاتي بالتفاصيل الملكية الإضافية. شكراً لكم 🌸`
    );
    const targetWhatsapp = settings?.whatsapp || '201110095403';
    const cleanWhatsapp = targetWhatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanWhatsapp}?text=${msg}`, '_blank');
  };

  // PDF Download Helper
  const handleDownloadPdf = async () => {
    if (!order) return;
    setIsDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const darkBg = [11, 11, 11]; // Charcoal
      const accentGold = [212, 175, 55]; // Gold
      const textDark = [50, 50, 50];

      // Header Banner color band
      doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
      doc.rect(0, 0, 210, 40, "F");

      // Grand gold accent line
      doc.setFillColor(accentGold[0], accentGold[1], accentGold[2]);
      doc.rect(0, 40, 210, 2, "F");

      // Brand Typography
      doc.setTextColor(246, 231, 166); // Cream light gold
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("SULTA ATELIER", 105, 18, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text("LUXURY COUTURE BOUTIQUE & LOUNGEMASTER", 105, 25, { align: "center" });
      doc.text("EST. 2026 • ELITE SERVICES", 105, 31, { align: "center" });

      // Invoice Title Label
      doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL LUXURY INVOICE", 20, 55);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);

      // Columns metadata: Left for details, right for destination
      doc.setFont("helvetica", "bold");
      doc.text("Invoice Details:", 20, 65);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice ID:  ${order.id}`, 20, 71);
      doc.text(`Order Date:  ${order.date}`, 20, 77);
      doc.text(`Payment:     ${order.paymentMethod.toUpperCase()}`, 20, 83);
      doc.text(`Status:      ${order.status.toUpperCase()}`, 20, 89);

      doc.setFont("helvetica", "bold");
      doc.text("Ship To Address:", 120, 65);
      doc.setFont("helvetica", "normal");
      doc.text(`Customer: ${order.customerName}`, 120, 71);
      doc.text(`Phone:    ${order.phone}`, 120, 77);
      doc.text(`Details:  ${order.city}, ${order.address}`, 120, 83);
      doc.text(`Country:  ${order.country === "EG" ? "Egypt" : "Saudi Arabia"}`, 120, 89);

      // Dividing separator
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(20, 96, 190, 96);

      // Table Header Row
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
      doc.text("PRODUCT DESCRIPTION", 20, 104);
      doc.text("QTY", 110, 104, { align: "center" });
      doc.text("UNIT PRICE", 140, 104, { align: "right" });
      doc.text("TOTAL", 180, 104, { align: "right" });

      doc.line(20, 107, 190, 107);

      // Output values
      let currentY = 114;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);

      order.items.forEach((item) => {
        const matchedP = productsMap[item.productId];
        const rawLabel = matchedP?.nameEn || item.productName || "Sulta Elegant Piece";
        // Clean Arabic/Unicode to keep PDF output clean & standard
        const cleanLabel = rawLabel.replace(/[^\x00-\x7F]/g, "").trim() || "Luxury Couture Atelier PJ";

        doc.text(
          `${cleanLabel} (${item.color} - ${item.size})`,
          20,
          currentY
        );
        doc.text(`${item.quantity}`, 110, currentY, { align: "center" });
        doc.text(`${item.price.toLocaleString()} ${order.currency}`, 140, currentY, { align: "right" });
        
        const lineTotal = item.price * item.quantity;
        doc.text(`${lineTotal.toLocaleString()} ${order.currency}`, 180, currentY, { align: "right" });

        currentY += 8;
      });

      doc.line(20, currentY, 190, currentY);
      currentY += 8;

      // Price aggregate block
      doc.setFont("helvetica", "bold");
      doc.text("GRAND NET SUMMARY TOTAL:", 140, currentY, { align: "right" });
      doc.setFontSize(12);
      doc.setTextColor(accentGold[0], accentGold[1], accentGold[2]);
      doc.text(`${order.totalPrice.toLocaleString()} ${order.currency}`, 180, currentY, { align: "right" });

      // Footer brand statement
      currentY = Math.max(currentY + 25, 235);
      doc.setDrawColor(230, 230, 230);
      doc.line(20, currentY, 190, currentY);

      doc.setFont("helvetica", "oblique");
      doc.setFontSize(8.5);
      doc.setTextColor(130, 130, 130);
      doc.text("Thank you for choosing SULTA. Your exquisite couture sleepwear, crafted elegantly with finest silks", 105, currentY + 6, { align: "center" });
      doc.text("is backed by our 100% royal comfort warranty.", 105, currentY + 11, { align: "center" });

      doc.save(`Sulta_Order_Invoice_${order.id}.pdf`);
    } catch (e) {
      console.error("PDF generation error:", e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Status mapping functions
  const getStatusTitle = (status: OrderStatus | string): string => {
    switch (status) {
      case 'new': case 'pending': return 'تم استلام الطلب الملكي';
      case 'confirmed': return 'تم تأكيد الطلب والمراجعة';
      case 'processing': return 'جاري تجهيز وتغليف الباقة';
      case 'packed': return 'مغلف وجاهز للتسليم';
      case 'shipped': return 'تم الشحن وهو في الطريق إليكِ';
      case 'out_for_delivery': return 'خارج مع سفير التوصيل الملكي';
      case 'delivered': return 'تم التسليم وتدشين الأناقة';
      case 'cancelled': return 'الطلب ملغي';
      case 'returned': case 'refunded': return 'طلب مسترجع ومسترد بالكامل';
      default: return 'قيد التدقيق والتحقق';
    }
  };

  const getStatusBadgeStyle = (status: OrderStatus | string): string => {
    switch (status || 'pending') {
      case 'new': case 'pending':
        return 'bg-[#FCF8E3] border-[#EEDC9A] text-[#8A6D3B]';
      case 'confirmed':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'processing': case 'packed':
        return 'bg-pink-50 border-pink-200 text-[#DF8A9C]';
      case 'shipped': case 'out_for_delivery':
        return 'bg-[#EDF2FC] border-[#B9CDEC] text-[#2F5496]';
      case 'delivered':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'cancelled':
        return 'bg-rose-50 border-rose-150 text-rose-800';
      case 'returned': case 'refunded':
        return 'bg-zinc-100 border-zinc-300 text-zinc-800';
      default:
        return 'bg-gray-50 border-gray-150 text-gray-800';
    }
  };

  // Timeline Step calculation
  const getTimelineStep = (status: OrderStatus | string): number => {
    switch (status) {
      case 'new': case 'pending': return 1;
      case 'confirmed': return 2;
      case 'processing': return 3;
      case 'packed': return 4;
      case 'shipped': return 5;
      case 'out_for_delivery': return 6;
      case 'delivered': return 7;
      default: return 1;
    }
  };

  // Percentage complete calculation matching Phase 8 specs
  const getProgressPercentage = (status: OrderStatus | string): number => {
    switch (status) {
      case 'new': case 'pending': return 15;
      case 'confirmed': return 30;
      case 'processing': return 45;
      case 'packed': return 60;
      case 'shipped': return 75;
      case 'out_for_delivery': return 90;
      case 'delivered': return 100;
      case 'cancelled': case 'returned': case 'refunded': return 0;
      default: return 15;
    }
  };

  // Helper to safely format email
  const getPrivateEmail = (emailStr?: string) => {
    if (!emailStr) return 's***@sulta.com';
    const parts = emailStr.split('@');
    if (parts.length < 2) return emailStr;
    const name = parts[0];
    const masked = name.substring(0, Math.min(3, name.length)) + '***';
    return `${masked}@${parts[1]}`;
  };

  // Helper to safely format phone
  const getPrivatePhone = (phoneStr?: string) => {
    if (!phoneStr) return '********';
    return phoneStr.replace(/.(?=.{4})/g, '*');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-pulse text-right" dir="rtl">
        <div className="flex justify-between items-center pb-6 border-b border-gray-100">
          <div className="h-6 w-32 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-24 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-40 bg-gray-150 rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-100 rounded-2xl"></div>
          <div className="h-32 bg-gray-100 rounded-2xl"></div>
          <div className="h-32 bg-gray-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-xl my-12 animate-fade-in" dir="rtl">
        <AlertTriangle className="mx-auto mb-4 text-amber-500" size={48} />
        <h3 className="font-serif text-xl text-gray-900 mb-2">تعذر تجميع بيانات الطلبية</h3>
        <p className="text-gray-500 font-sans text-xs leading-relaxed mb-6">{error || 'لم يتم العثور على أي تفاصيل للطلب المكتوب.'}</p>
        
        <div className="flex gap-4 justify-center">
          {onClose && (
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-200 hover:border-gray-400 text-xs font-bold font-sans transition-colors cursor-pointer"
            >
              العودة للتتبع
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentStep = getTimelineStep(order.status);
  const itemsCount = order.items ? order.items.reduce((acc, current) => acc + current.quantity, 0) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto p-4 md:p-8 bg-[#FAF9F5] rounded-3xl border border-[#FAFAF7]/50 text-right" 
      dir="rtl"
    >
      {/* 1. Header Luxury Action Nav */}
      <div className="flex justify-between items-center mb-6 pb-5 border-b border-gray-200/60 flex-row-reverse sm:flex-row">
        {onClose && (
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 bg-white px-3.5 py-2 rounded-xl transition-all font-sans font-bold cursor-pointer"
          >
            <ArrowRight size={14} />
            <span>العودة للتتبع</span>
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-[10px] text-gray-400 font-sans font-semibold">مزامنة فورية حية نشطة </span>
        </div>
      </div>

      {/* 2. Top Luxury Card Banner */}
      <div className="bg-[#0B0B0B] text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden mb-8 border border-amber-900/10">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
        <div className="absolute left-6 top-6 opacity-5 select-none text-8xl font-serif">S</div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3.5 flex-wrap">
              <span className="text-gray-400 text-xs font-sans tracking-wide">الطلبية الاستثنائية كود:</span>
              <button 
                onClick={handleCopyId}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/15 text-[#F6E7A6] px-2.5 py-1 rounded-lg text-xs font-mono tracking-wider font-bold transition-all border border-white/5 active:scale-95"
                title="نسخ كود الشحنة للذاكرة"
              >
                {copiedId ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{order.id}</span>
              </button>
            </div>
            
            <h1 className="font-serif text-2xl md:text-3xl text-[#F6E7A6] mt-3.5 mb-1.5 font-light">
              جاهزية طلبكِ كوتور {order.customerName ? `🌸` : ''}
            </h1>
            
            <p className="text-gray-300 text-xs font-sans leading-relaxed">
              سعداء جداً بثقتكِ الفائقة. تم تسجيل طلبكِ بتاريخ <strong className="text-white font-medium">{order.date}</strong> وتخصيص خط معالجة تتبع فوري بمقاييس سولتة الفاخرة لعلامتنا البوتيك الخاصة.
            </p>
          </div>

          <div className="text-right sm:text-left shrink-0 sm:border-r sm:border-white/10 sm:pr-6">
            <span className="text-[10px] text-gray-400 font-sans block mb-1">صافي القيمة المعتمدة للفوترة</span>
            <div className="text-3xl font-serif text-[#F6E7A6] font-light tracking-tight">
              {order.totalPrice.toLocaleString()} <span className="text-sm font-sans font-bold">{order.currency}</span>
            </div>
            <span className={`inline-block mt-3 px-3 py-1.5 rounded-full border text-[10px] font-sans font-bold tracking-wider ${getStatusBadgeStyle(order.status)}`}>
              {getStatusTitle(order.status)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Luxury Order Stepper Timeline */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm mb-8">
        <h3 className="font-serif text-sm font-semibold text-gray-900 border-r-4 border-[#DF8A9C] pr-3 pb-0.5 mb-6 opacity-90">
          الخط الزمني المباشر وتتبع رحلة الباقة:
        </h3>

        {/* Visual progress bar with checkmarks (Phase 8 details) */}
        {order.status !== 'cancelled' && order.status !== 'returned' && (
          <div className="mb-8 font-sans bg-[#FCFAF6] p-5 rounded-2.5xl border border-amber-900/5 text-right shadow-xs" dir="rtl">
            <div className="flex justify-between items-center mb-2.5 flex-row-reverse">
              <span className="text-xs font-bold text-gray-700">معدل اكتمال خط المعالجة:</span>
              <span className="text-sm font-serif font-bold text-[#A44C5C]">{getProgressPercentage(order.status)}%</span>
            </div>
            <div className="w-full bg-[#EFECE6] h-2.5 rounded-full overflow-hidden mb-5">
              <div 
                className="bg-gradient-to-l from-[#DF8A9C] to-[#A44C5C] h-full transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${getProgressPercentage(order.status)}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-[11px] text-gray-600 font-sans border-t border-gray-150/40 pt-3.5">
              <div className="flex items-center gap-1.5 justify-start">
                <span className="text-[12px]">{getProgressPercentage(order.status) >= 15 ? '✅' : '⏳'}</span>
                <span className={getProgressPercentage(order.status) >= 15 ? 'font-bold text-gray-800' : 'text-gray-400'}>تم استلام الطلب</span>
              </div>
              <div className="flex items-center gap-1.5 justify-start">
                <span className="text-[12px]">{getProgressPercentage(order.status) >= 55 ? '✅' : '⏳'}</span>
                <span className={getProgressPercentage(order.status) >= 55 ? 'font-bold text-gray-800' : 'text-gray-400'}>تم التجهيز</span>
              </div>
              <div className="flex items-center gap-1.5 justify-start">
                <span className="text-[12px]">{getProgressPercentage(order.status) >= 75 ? '✅' : '⏳'}</span>
                <span className={getProgressPercentage(order.status) >= 75 ? 'font-bold text-gray-800' : 'text-gray-400'}>تم الشحن</span>
              </div>
              <div className="flex items-center gap-1.5 justify-start">
                <span className="text-[12px]">{getProgressPercentage(order.status) >= 85 ? '✅' : '⏳'}</span>
                <span className={getProgressPercentage(order.status) >= 85 ? 'font-bold text-gray-800' : 'text-gray-400'}>في الطريق</span>
              </div>
              <div className="flex items-center gap-1.5 justify-start">
                <span className="text-[12px]">{getProgressPercentage(order.status) >= 100 ? '✅' : '⏳'}</span>
                <span className={getProgressPercentage(order.status) >= 100 ? 'font-bold text-gray-800' : 'text-gray-400'}>تم التسليم</span>
              </div>
            </div>
          </div>
        )}

        {/* Vertical/Horizontal Stepper Container */}
        <div className="relative py-4 px-2" dir="rtl">
          {/* Main timeline track background line */}
          <div className="absolute top-8 left-4 right-4 sm:left-[10%] sm:right-[10%] h-[3px] bg-slate-100 -translate-y-1/2 z-0 rounded-full hidden sm:block">
            <div 
              className="h-full bg-[#DF8A9C] transition-all duration-1000 ease-out rounded-full" 
              style={{ width: `${((currentStep - 1) / 6) * 100}%` }}
            />
          </div>

          {/* Steps container */}
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-4 relative z-10 text-center">
            {[
              { step: 1, label: 'تم الطلب', icon: Clock, desc: 'سجلنا طلبكِ في المنظومة' },
              { step: 2, label: 'تم التأكيد', icon: ShieldCheck, desc: 'مراجعة وتأكيد البيانات' },
              { step: 3, label: 'جاري التجهيز', icon: Package, desc: 'تحضير البجامة وكوتور الخياطة' },
              { step: 4, label: 'تم التغليف', icon: CheckCircle, desc: 'وضع شريط الستان والختم الشمعي' },
              { step: 5, label: 'تم الشحن', icon: Truck, desc: 'مغادرة الشحنة مع الناقل الملكي' },
              { step: 6, label: 'في الطريق', icon: MapPin, desc: 'المندوب متوجه حالياً لعتبة الدار' },
              { step: 7, label: 'تم التسليم', icon: GiftIconPlaceholder, desc: 'استلام مبارك وسعيد بتمام الأناقة' }
            ].map((node) => {
              const IconComp = node.icon;
              const isCompleted = node.step <= currentStep;
              const isActive = node.step === currentStep;

              return (
                <div key={node.step} className="flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-2 text-right sm:text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-700 shrink-0
                    ${isActive ? 'bg-[#DF8A9C] border-[#DF8A9C] text-white shadow-md scale-110 animate-pulse' : 
                      isCompleted ? 'bg-[#0B0B0B] border-[#0B0B0B] text-[#F6E7A6]' : 'bg-white border-slate-200 text-slate-300'}`}
                  >
                    <IconComp size={16} />
                  </div>
                  <div className="text-right sm:text-center">
                    <h4 className={`text-[11px] font-sans font-bold leading-none ${isActive ? 'text-[#DF8A9C]' : (isCompleted ? 'text-gray-900' : 'text-gray-400')}`}>
                      {node.label}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-sans mt-1 leading-snug max-w-[110px] mx-auto hidden sm:block">
                      {node.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancellation or return status alerts if applicable */}
        {(order.status === 'cancelled' || order.status === 'returned') && (
          <div className="mt-6 bg-rose-50 border border-rose-150 p-4 rounded-2xl flex items-start gap-3 text-right">
            <AlertTriangle className="text-rose-700 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="font-sans font-bold text-rose-900 text-xs mb-1">
                تنبيه بخصوص حالة الشحنة الخاصة بكِ:
              </h4>
              <p className="text-[11px] text-rose-700 leading-relaxed font-sans">
                {order.status === 'cancelled' 
                  ? 'تم إلغاء معالجة هذا الطلب من منظومة البيانات السحابية، لمزيد من الاستفسارات يُرجى التواصل معنا عبر الرقم الموحد لخدمة كوتور.' 
                  : 'تم استلام ومعالجة مرتجع هذه الفاتورة الحالية ملكياً في خزنتنا وإيداع المبالغ لحسابكِ المعتمد.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* --- SULTA AI AGENT SYSTEMS CENTER PANEL --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 text-right" dir="rtl">
        
        {/* Left/Middle Column (span 2 on desktop): SULTA AI Chat Support */}
        <div className="lg:col-span-2 bg-[#0B0B0B] text-white p-6 rounded-3xl border border-[#3A3326] shadow-xl flex flex-col min-h-[460px] relative overflow-hidden">
          {/* Subtle gold background glare effect */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4 flex-wrap gap-2 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#A44C5C] to-[#F6E7A6] flex items-center justify-center border border-white/25">
                <Sparkles size={14} className="text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold text-[#F6E7A6]">المساعد الذكي لبوتيك SULTA 👑</h3>
                <p className="text-[10px] text-gray-400 font-sans">مستشار الكوتور الشخصي يعمل بالذكاء الاصطناعي التوليدي 24/7</p>
              </div>
            </div>
            <span className="text-[9px] bg-[#A44C5C]/20 text-[#DF8A9C] px-2.5 py-1 rounded-full border border-[#A44C5C]/30 font-sans font-bold">
              متصل بقاعدة البيانات مباشرة ●
            </span>
          </div>

          {/* Message Thread container */}
          <div className="flex-1 overflow-y-auto max-h-[260px] space-y-3.5 pr-1 mb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {chatMessages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 items-start ${isAi ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] border
                    ${isAi 
                      ? 'bg-amber-50 border-[#F6E7A6]/30 text-[#F6E7A6] bg-gradient-to-tr from-[#1E1C1A] to-[#2B2620]' 
                      : 'bg-[#A44C5C] border-white/10 text-white'}`}
                  >
                    {isAi ? '👑' : order.customerName.charAt(0) || 'أ'}
                  </div>
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%]
                    ${isAi 
                      ? 'bg-white/5 border border-white/5 text-gray-250 font-sans' 
                      : 'bg-[#A44C5C]/90 text-white font-sans'}`}
                  >
                    <p>{msg.text}</p>
                    <span className="block text-[8px] text-gray-500 mt-1.5 text-left font-sans">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
            
            {isChatLoading && (
              <div className="flex gap-3 items-start flex-row">
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] bg-gradient-to-tr from-[#1E1C1A] to-[#2B2620] border border-[#F6E7A6]/30 animate-spin">
                  🔄
                </div>
                <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl text-xs max-w-[80%] text-gray-400 font-sans flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#F6E7A6] rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[#F6E7A6] rounded-full animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 bg-[#F6E7A6] rounded-full animate-bounce delay-300" />
                  <span className="font-serif italic text-[#F6E7A6]">يقوم مستشار SULTA بمراجعة قياساتك وبيانات طلبك...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions suggestion pills */}
          <div className="flex flex-wrap gap-2 mb-3 z-10 relative">
            <button 
              onClick={() => handleSendChatMessage("متى يتوقع وصول طلبي كوتور؟")}
              className="text-[10px] bg-white/5 hover:bg-white/10 text-[#F6E7A6] border border-white/10 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              🕒 متى يصل طلبي؟
            </button>
            <button 
              onClick={() => handleSendChatMessage("هل تم شحن باقة الحرير؟ وما هي التفاصيل؟")}
              className="text-[10px] bg-white/5 hover:bg-white/10 text-[#F6E7A6] border border-white/10 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              🚚 هل تم الشحن؟
            </button>
            <button 
              onClick={() => handleSendChatMessage("ما هي سياسة استبدال أو استرجاع المقاسات لدراكم؟")}
              className="text-[10px] bg-white/5 hover:bg-white/10 text-[#F6E7A6] border border-white/10 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              🔄 كيف يمكنني الاستبدال؟
            </button>
          </div>

          {/* Chat entry bar */}
          <div className="relative z-10 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="اكتبي استفساركِ الملكي هنا حول المقاسات، الشحن، أو المواد..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F6E7A6] transition-colors"
            />
            <button
              onClick={() => handleSendChatMessage()}
              disabled={isChatLoading || !chatInput.trim()}
              className="bg-[#A44C5C] hover:bg-[#A44C5C]/80 disabled:opacity-40 text-white px-4 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send size={12} />
              <span>أرسلي ✨</span>
            </button>
          </div>
        </div>

        {/* Right Column: VIP Badge + Delivery Prediction AI + Delayed warning */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* VIP Card Indicator */}
          {vipCustomer ? (
            <div className="relative overflow-hidden bg-gradient-to-tr from-[#1E1B15] via-[#2A2318] to-[#12110E] p-5 rounded-3xl border border-[#D5A848] shadow-xl text-right">
              {/* Golden glitter lines */}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-[#D5A848]/10 rounded-full filter blur-xl animate-pulse" />
              <div className="relative z-10">
                <div className="flex justify-between items-start flex-row-reverse mb-3">
                  <div className="bg-[#D5A848]/25 text-[#F5C767] border border-[#D5A848]/45 p-1 rounded-lg">
                    <Award size={18} className="animate-spin-slow" />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-sans font-bold bg-[#D5A848] text-[#1E1B15] px-2.5 py-0.5 rounded-full">
                    SULTA VIP CUSTOMER
                  </span>
                </div>
                <h4 className="font-serif text-sm font-bold text-[#F5C767] mb-1">
                  أميرتنا المرموقة والوفية 👑
                </h4>
                <p className="text-[10px] text-gray-300 leading-relaxed font-sans mb-3.5">
                  تم رصد نشاط شرائك التراكمي المترف وتثبيت تصنيفكِ كعضوة ممتازة بـ SULTA. لكِ أولوية معالجة الشحنات الفورية وهدية خاصة.
                </p>
                <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-gray-400 block font-sans">كوبون نخبة الأميرات الدائم:</span>
                    <strong className="text-xs text-white font-mono tracking-wider">VIPWELCOME15</strong>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('VIPWELCOME15');
                      alert('تم نسخ كود خصم الأميرات الخاص بكِ (15%) للاستخدام الفوري 👑');
                    }}
                    className="bg-[#D5A848] hover:bg-[#F5C767] text-[#1E1B15] px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    نسخ الكود 📋
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-right">
              <div className="flex gap-2 items-center flex-row-reverse mb-2">
                <Award size={16} className="text-gray-400" />
                <h4 className="font-serif text-xs font-bold text-gray-800">نظام ترقيات الأميرات المرموق 👑</h4>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
                عند تخطي قيمة مشترياتك الإجمالية حاجز 1,500 ريال أو 10,000 جنيه، يتم ترقيتك تلقائياً لدرجة الـ VIP وتفعيل حزمة الخصومات الدائمة والهدايا الخاصة في عتبة الدار.
              </p>
            </div>
          )}

          {/* Delivery Prediction AI Card */}
          {prediction && (
            <div className="bg-gradient-to-tr from-[#FAF8F5] to-white p-5 rounded-3xl border border-[#EBE4D8] shadow-sm text-right flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    <Sparkles size={14} className="text-amber-600 shrink-0" />
                    <h4 className="font-serif text-xs font-bold text-gray-900">توقع ذكي للوصول الملكي 🕒</h4>
                  </div>
                  <span className="text-[8px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-sans font-bold">
                    {prediction.confidence}
                  </span>
                </div>

                <div className="bg-[#FAF5EE] border border-[#F3EFE9] p-3.5 rounded-2xl text-center mb-3">
                  <span className="text-[10px] text-gray-500 block mb-1">نافذة الوصول المجدولة المقدرة:</span>
                  <strong className="text-sm font-serif text-[#A44C5C] tracking-tight block">
                    {prediction.predictedRange}
                  </strong>
                </div>

                <p className="text-[10px] text-gray-600 leading-relaxed font-sans mb-3">
                  {prediction.explanation}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center flex-row-reverse text-right">
                <span className="text-[9px] text-gray-400">الناقل المعيّن:</span>
                <span className="text-[9px] text-gray-800 font-bold font-sans">{prediction.carrier}</span>
              </div>
            </div>
          )}

          {/* Delay Apology Compensation Banner */}
          {isDelayed && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200 p-4 rounded-3xl text-right relative overflow-hidden"
            >
              <div className="flex gap-2.5 items-start flex-row-reverse relative z-10">
                <AlertTriangle className="text-rose-700 shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-serif text-xs font-bold text-rose-900 mb-1">
                    نعتذر لعميلتنا الكريمة عن التأخير 🌸
                  </h4>
                  <p className="text-[10px] text-rose-700 leading-relaxed font-sans mb-3">
                    لحق بنا تأخر طفيف في تجهيز قطعة الكوتور الفاخرة الخاصة بكِ لضمان أدق تفاصيل فحص الخياطة. تم تخصيص هدية تعويض ملكية وكوبون خصم صالح لطلبكِ القادم:
                  </p>
                  <div className="bg-white/60 border border-rose-150 p-2.5 rounded-xl flex justify-between items-center flex-row-reverse">
                    <span className="text-xs font-mono font-bold text-rose-950">APOLOGY20</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText('APOLOGY20');
                        alert('تم نسخ كود خصم الاعتذار والتعويض الملكي (20%) بنجاح 🌸');
                      }}
                      className="bg-rose-900 text-white px-2.5 py-1 rounded-lg text-[8px] font-sans font-bold hover:bg-rose-950 transition-all cursor-pointer"
                    >
                      انسخي التعويض 📋
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* 4. Main Two Column Details: Products & Shipments details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Area (2 cols on Desktop): Products grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm text-right">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100 flex-wrap gap-2">
              <h3 className="font-serif text-sm font-semibold text-gray-950 pr-2 border-r-3 border-[#DF8A9C]">
                تفاصيل السلع المترفة والقطع المطلوبة:
              </h3>
              <span className="bg-gray-50 border border-gray-150 text-gray-600 px-3 py-1 rounded-lg text-[10px] font-sans font-bold">
                إجمالي القطع: {itemsCount}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items && order.items.map((item, idx) => {
                const matchedP = productsMap[item.productId];
                const imagePath = matchedP?.images && matchedP.images[0] ? matchedP.images[0] : '/img/placeholder.png';
                const arName = matchedP?.nameAr || item.productName || "قطعة بن لومين المترفة";
                const itemTotal = item.price * item.quantity;

                return (
                  <div key={idx} className="py-4 flex gap-4 items-center flex-row-reverse text-right">
                    <div className="w-16 h-20 bg-gray-50 rounded-xl border border-gray-150 overflow-hidden shrink-0 flex items-center justify-center relative">
                      <img 
                        src={imagePath} 
                        alt={arName} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = cleanImgUrl('/img/bridal_satin_robe_pink_1.png', 'sleepwear'); // Beautiful safe fallback
                        }}
                      />
                    </div>

                    <div className="flex-1 text-right font-sans">
                      <h4 className="font-serif text-xs text-gray-900 font-bold mb-1 line-clamp-2 leading-relaxed">
                        {arName}
                      </h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 font-sans mt-1">
                        <span>اللون: <strong className="text-gray-800 font-medium">{item.color}</strong></span>
                        <span>المقاس: <strong className="text-gray-800 font-medium">{item.size}</strong></span>
                        <span>الكمية: <strong className="text-gray-800 font-medium">{item.quantity}</strong></span>
                      </div>
                    </div>

                    <div className="text-left shrink-0 pl-1">
                      <div className="text-xs font-serif text-gray-950 font-semibold mb-0.5">
                        {itemTotal.toLocaleString()} {order.currency}
                      </div>
                      <div className="text-[9px] text-gray-400 font-sans">
                        {item.price.toLocaleString()} {order.currency} / القطعة
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sub/Total specs display */}
            <div className="border-t border-gray-100 pt-5 mt-4 space-y-3 text-xs text-gray-600 font-sans">
              <div className="flex justify-between items-center text-right flex-row-reverse">
                <span className="text-gray-400">سعر المجموع الفرعي للقطع:</span>
                <span className="font-medium text-gray-900">
                  {((order.totalPrice ?? 0) - (order.shippingFee ?? 0)).toLocaleString()} {order.currency}
                </span>
              </div>
              <div className="flex justify-between items-center text-right flex-row-reverse">
                <span className="text-gray-400">التعبئة وبكج Sulta الفاخر المزين بشريط الدانتيل:</span>
                <span className="text-[#DF8A9C] font-semibold font-sans">مجانًا كليا (هدية)</span>
              </div>
              <div className="flex justify-between items-center text-right flex-row-reverse">
                <span className="text-gray-400">رسوم الشحن والعبور السريع:</span>
                <span className="font-medium text-gray-900">
                  {order.shippingFee ? `${order.shippingFee.toLocaleString()} ${order.currency}` : 'شحن بري مجاني'}
                </span>
              </div>
              
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-right text-sm font-bold text-gray-950 flex-row-reverse">
                <span className="font-serif text-gray-900">الإجمالي الصافي النهائي المفوتر:</span>
                <span className="font-serif text-[#0B0B0B] text-base font-bold underline decoration-[#DF8A9C] decoration-2 underline-offset-4">
                  {order.totalPrice.toLocaleString()} {order.currency}
                </span>
              </div>
            </div>
          </div>
          
          {/* Packaging & Gift Options Details */}
          {(order.notes || order.giftMessage) && (
            <div className="bg-[#FCFBF8] p-5 rounded-3xl border border-gray-150 shadow-xs text-right">
              <h3 className="font-serif text-sm font-semibold text-gray-950 mb-3 pr-2 border-r-3 border-amber-500/70">
                مذكرة التقديم والغلاف الشخصي للطلب:
              </h3>
              
              <div className="space-y-3 font-sans text-xs text-gray-700 leading-relaxed text-right">
                {order.giftMessage && (
                  <div className="p-3 bg-white border border-pink-100 rounded-2xl">
                    <span className="text-[#DF8A9C] font-bold block mb-1">🎀 بطاقة التهنئة الشخصية المرفقة بطلبكِ:</span>
                    <p className="italic text-gray-800 font-serif font-light text-[13px] leading-relaxed pr-2 border-r-2 border-pink-200">
                      "{order.giftMessage}"
                    </p>
                    {order.giftCardTheme && (
                      <span className="text-[9px] text-[#DF8A9C] block mt-2">ثيم البطاقة المعتمد: {order.giftCardTheme}</span>
                    )}
                  </div>
                )}
                {order.notes && (
                  <div className="p-3 bg-white border border-gray-150 rounded-2xl">
                    <span className="text-gray-400 block mb-1">📝 ملاحظات التوجيه أو تعليمات التسليم المكتوبة:</span>
                    <p className="text-gray-800 text-[11px] leading-relaxed">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Area (1 col on Desktop): Customer, shipping, payment summaries */}
        <div className="space-y-6">
          
          {/* Tracking / Carrier Block */}
          <div className="bg-[#FFFDF9] border border-[#FAFAF7]/60 p-5 rounded-3xl shadow-sm space-y-4">
            <h4 className="font-serif text-xs font-bold text-black border-r-3 border-amber-500/60 pr-2">
              مسار الشحن اللوجستي وتحديث شركة النقل:
            </h4>
            
            <div className="font-sans text-xs space-y-3">
              <div className="flex justify-between items-center flex-row-reverse text-right">
                <span className="text-gray-400">رقم تتبع الشحنة:</span>
                <span className="font-mono font-bold text-gray-950">
                  {order.trackingNumber || 'SUL-TRK-PENDING'}
                </span>
              </div>
              <div className="flex justify-between items-center flex-row-reverse text-right">
                <span className="text-gray-400">شركة الخدمات اللوجستية:</span>
                <span className="font-serif text-gray-900 font-bold">
                  {order.country === 'EG' ? 'سولتا إكسبريس (الأسرع بمصر)' : 'أرامكس لخدمات الطيران المتقدم'}
                </span>
              </div>
              <div className="flex justify-between items-center flex-row-reverse text-right">
                <span className="text-gray-400">النافذة الزمنية للتسليم:</span>
                <span className="font-sans text-[#DF8A9C] font-bold">
                  {order.country === 'EG' ? 'خلال ٢٤ إلى ٤٨ ساعة' : 'خلال ٣ إلى ٥ أيام عمل كحد أقصى'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Profile Card */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-right">
            <h4 className="font-serif text-xs font-bold text-gray-950 border-r-3 border-[#DF8A9C] pr-2">
              الملف التعريفي للعميل:
            </h4>
            
            <div className="font-sans text-xs space-y-2.5 leading-relaxed text-right">
              <div>
                <span className="text-gray-400 block text-[10px]">الاسم الكامل المعتمد بالفاتورة</span>
                <strong className="text-gray-950 font-bold text-[12px]">{order.customerName}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">البريد الإلكتروني للتحقق</span>
                <span className="text-gray-700">{order.email ? getPrivateEmail(order.email) : 's***@sulta.com'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">رقم الجوال لتنسيق موعد الاستلام</span>
                <span className="text-gray-700 font-mono tracking-wider">{order.phone ? getPrivatePhone(order.phone) : '********'}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address Details */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-right">
            <h4 className="font-serif text-xs font-bold text-gray-950 border-r-3 border-amber-500/70 pr-2">
              عنوان التوجيه والوجهة الملكية:
            </h4>
            
            <div className="font-sans text-xs space-y-2.5 leading-relaxed text-right">
              <div>
                <span className="text-gray-400 block text-[10px]">الدولة المسجل بها التوجيه</span>
                <span className="text-gray-900 font-bold">
                  {order.country === 'EG' ? 'جمهورية مصر العربية 🇪🇬' : 'المملكة العربية السعودية 🇸🇦'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">المدينة / المحافظة</span>
                <span className="text-gray-850 font-semibold">{order.city}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">تفاصيل العنوان الدقيق واللوحات الإرشادية</span>
                <p className="text-gray-700 text-[11px] leading-relaxed mt-0.5">{order.address}</p>
              </div>
            </div>
          </div>

          {/* Payment & Security Status Card */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-right">
            <h4 className="font-serif text-xs font-bold text-gray-950 border-r-3 border-[#DF8A9C] pr-2">
              قنوات الدفع وضمان المعاملات:
            </h4>
            
            <div className="font-sans text-xs space-y-3 leading-relaxed text-right">
              <div className="flex justify-between items-center flex-row-reverse text-right">
                <span className="text-gray-400">قناة الدفع المعتمدة:</span>
                <span className="font-sans text-gray-900 font-bold bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-lg text-[10px]">
                  {order.paymentMethod || 'الدفع عند الاستلام'}
                </span>
              </div>
              <div className="flex justify-between items-center flex-row-reverse text-right">
                <span className="text-gray-400">الحالة المالية للفاتورة:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>مكتمل ومؤكد بالكامل</span>
                </span>
              </div>
              <div className="flex justify-between items-center flex-row-reverse text-right">
                <span className="text-gray-400">تاريخ تسوية وتأكيد السند:</span>
                <span className="font-sans text-gray-600">{order.date}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 5. Luxury Order Actions Footer Panel (Download, Re-order, Concierge support, Live help) */}
      {/* Smart Ratings (If Delivered) */}
      {order.status === 'delivered' && (
        <div className="bg-gradient-to-tr from-[#FAF5F0] to-white p-6 md:p-8 rounded-3xl border border-amber-100 shadow-sm mt-8 text-right font-sans" dir="rtl">
          {ratingSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 text-emerald-800"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h3 className="font-serif text-xl font-bold">نشكر ثقتك ورأيكِ المرموق 🌸</h3>
              <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                تم تسجيل معايير الجودة بنجاح ونقل تقديراتكِ وملاحظاتكِ لمدراء بوتيك SULTA لضمان الأفضل دائماً لتاج طلّتكِ البهيّة.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <span className="font-serif italic text-[#A44C5C] text-xs tracking-[0.2em] block mb-2 uppercase">تقييم تجربة سولتة كوتور</span>
                <h3 className="font-serif text-lg font-bold text-[#0B0B0B]">يسعدنا سماع رأيك الملكي 👑</h3>
                <p className="text-xs text-gray-500 mt-2">
                  بعد تسليم طلبيتكِ الفاخرة، يسرنا جداً معرفة لمساتكِ وتجربتكِ لقطع الحرير. تفضلي بتقييم الخدمة ورفع صورة لتجربة التغليف لربح مميزات الـ VIP.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left col in feedback: Star selection and comment text area */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-750 mb-2">كيف تقيّمين جودة التصميم والحرير؟</label>
                    <div className="flex gap-2 flex-row-reverse justify-end">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <button 
                          key={star} 
                          type="button"
                          onClick={() => setSatisfactionRating(star)}
                          className={`transition-colors cursor-pointer p-1 ${star <= satisfactionRating ? 'text-amber-400' : 'text-gray-200'}`}
                        >
                          <Star size={24} fill={star <= satisfactionRating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-750 mb-2">أضيفي ملاحظاتكِ أو رأيكِ المرموق:</label>
                    <textarea
                      rows={3}
                      value={satisfactionComment}
                      onChange={(e) => setSatisfactionComment(e.target.value)}
                      placeholder="اكتبي تجربتكِ مع مقاسات البجامة، ونعومة الحرير، وروائح البوتيك المعطرة للمنتجات..."
                      className="w-full text-xs p-3.5 rounded-2xl border border-gray-250 bg-white placeholder-gray-400 focus:outline-none focus:border-[#A44C5C] focus:ring-1 focus:ring-[#A44C5C] font-sans"
                    />
                  </div>
                </div>

                {/* Right col in feedback: Drag and drop file upload */}
                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-gray-750 mb-2">ارفعي صورة من تجربتكِ الفاخرة (اختياري):</label>
                  
                  {satisfactionPhoto ? (
                    <div className="relative border border-amber-200 p-2 bg-amber-50/25 rounded-2xl flex flex-col items-center">
                      <img 
                        src={satisfactionPhoto} 
                        alt="Customer upload" 
                        className="w-full max-h-[140px] object-cover rounded-xl"
                      />
                      <button 
                        type="button"
                        onClick={() => setSatisfactionPhoto(null)}
                        className="absolute top-4 right-4 bg-[#0B0B0B]/80 text-white rounded-full p-1.5 hover:bg-rose-700 transition-colors cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                      <span className="text-[10px] text-gray-500 font-sans mt-2">تم تجهيز الصورة للرفع بنجاح 📸</span>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[155px]
                        ${dragActive 
                          ? 'border-[#A44C5C] bg-[#A44C5C]/5' 
                          : 'border-gray-250 bg-white hover:border-[#A44C5C] hover:bg-pink-50/10'}`}
                    >
                      <input
                        type="file"
                        id="satisfaction-file-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <label 
                        htmlFor="satisfaction-file-upload" 
                        className="cursor-pointer flex flex-col items-center text-center w-full"
                      >
                        <Upload size={24} className="text-gray-400 mb-2 animate-bounce" />
                        <span className="text-xs font-bold text-gray-800">اسحبي الصورة وأفلتيها هنا</span>
                        <span className="text-[10px] text-gray-400 mt-1">أو انقري لتصفح ملفات جهازكِ</span>
                        <span className="text-[8px] text-gray-400 mt-1 font-mono">PNG, JPG, WebP</span>
                      </label>
                    </div>
                  )}
                </div>

              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleSubmitSatisfactionForm}
                  disabled={satisfactionUploading}
                  className="bg-[#0B0B0B] text-white hover:bg-[#A44C5C] px-8 py-3.5 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2"
                >
                  {satisfactionUploading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>جاري الرفع والحفظ سحابياً...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-[#F6E7A6]" />
                      <span>تقديم التقييم الملوكي والاحتفاظ بالهدايا 👑</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action panel */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm mt-8 flex flex-col md:flex-row justify-between items-center gap-4 flex-wrap" dir="rtl">
        <div>
          <h4 className="font-serif text-sm font-semibold text-gray-950 mb-1">لوحة التفاعل والتحكم الملكي بالطلبية:</h4>
          <p className="text-[10px] text-gray-400 font-sans">تتوفر لكافة زبائن سولتا حزمة خدمات تكميلية وتعديلات سريعة بضغطة واحدة.</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          {/* Action 1: Download Invoice */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex-1 md:flex-none bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 px-5 py-3 rounded-2xl text-xs font-sans font-bold flex justify-center items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none active:scale-97 disabled:opacity-50"
          >
            {isDownloadingPdf ? (
              <RefreshCw size={14} className="animate-spin text-amber-800" />
            ) : (
              <Download size={14} className="text-amber-800" />
            )}
            <span>تحميل الفاتورة 📄</span>
          </button>

          {/* Action 2: Reorder */}
          {onReorder && (
            <button
              onClick={() => onReorder(order)}
              className="flex-1 md:flex-none border border-black/10 hover:border-black text-gray-900 px-5 py-3 rounded-2xl text-xs font-sans font-bold flex justify-center items-center gap-1.5 transition-all cursor-pointer select-none active:scale-97"
            >
              <RefreshCw size={14} className="text-gray-700" />
              <span>أعيدي طلب الشراء 🔄</span>
            </button>
          )}

          {/* Action 3: Contact support */}
          <button
            onClick={handleContactSupport}
            className="flex-1 md:flex-none bg-[#0B0B0B] text-white hover:bg-[#DF8A9C] px-6 py-3 rounded-2xl text-xs font-sans font-bold flex justify-center items-center gap-1.5 transition-all shadow-md cursor-pointer select-none active:scale-97"
          >
            <MessageSquare size={14} className="text-[#F6E7A6]" />
            <span>اتصلي بخدمة النخبة 🌸</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Simple fallback icon component when Lucide lacks a physical match so that we avoid empty space or layout rupture
function GiftIconPlaceholder(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size || 16} 
      height={props.size || 16} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={props.className}
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.3 4.3 0 0 1 12 5a4.3 4.3 0 0 1 4.5-2 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}
