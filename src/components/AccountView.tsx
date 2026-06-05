import React, { useState } from "react";
import {
  Package,
  MapPin,
  Heart,
  Settings,
  Truck,
  Search,
  CheckCircle,
  Clock,
  Crown,
  Gift,
  Award,
  Zap,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";
import { useToast } from './Toast';
import { Order, Product, Country, Review } from "../types";
import { jsPDF } from "jspdf";
import { dbService } from "../services/db";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface AccountViewProps {
  country: Country;
  orders: Order[];
  favorites: string[];
  products: Product[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  session: any;
  onReorder?: (order: Order) => void;
  onNavigateToDashboard?: () => void;
}

export default function AccountView({
  country,
  orders,
  favorites,
  products,
  toggleFavorite,
  onSelectProduct,
  session,
  onReorder,
  onNavigateToDashboard,
}: AccountViewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "orders" | "addresses" | "wishlist" | "settings" | "loyalty" | "track"
  >("loyalty");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authLoading, setAuthLoading] = useState(false);

  // Data processing for Recharts inside AccountView component body:
  const monthlyData = React.useMemo(() => {
    const summary: Record<string, number> = {};
    orders.forEach(o => {
      // Date fallback to current month if undefined
      const dateStr = o.date || new Date().toISOString().split('T')[0];
      const monthPrefix = dateStr.substring(0, 7); // YYYY-MM
      if (!summary[monthPrefix]) {
        summary[monthPrefix] = 0;
      }
      summary[monthPrefix] += o.totalPrice;
    });

    return Object.keys(summary).sort().map(month => {
      const p = month.split('-');
      const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        name: `${mNames[parseInt(p[1], 10) - 1]} ${p[0]}`,
        المصروفات: summary[month]
      };
    });
  }, [orders]);

  const completedOrdersCount = orders.filter(o => o.status === 'delivered' || o.status === 'shipped').length;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const { error } =
        authMode === "login"
          ? await dbService.supabase.auth.signInWithPassword({
              email,
              password,
            })
          : await dbService.supabase.auth.signUp({ email, password });

      if (error) throw error;
      if (authMode === "signup")
        toast("تم إنشاء الحساب! يرجى تفعيل البريد الإلكتروني إذا تطلب الأمر.", 'success');
    } catch (err: any) {
      setAuthError(err.message || "حدث خطأ أثناء الاتصال بالنظام الملكي.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await dbService.supabase.auth.signOut();
  };

  const [trackingIdInput, setTrackingIdInput] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  // Interactive Live tracking custom states
  const [activeStepTab, setActiveStepTab] = useState<"pending" | "processing" | "shipped" | "delivered">("pending");
  const [etaTimer, setEtaTimer] = useState(1455); // 24 mins and 15 seconds
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "driver"; text: string; time: string }>>([
    { sender: "driver", text: "مرحباً بكِ في خدمة التوصيل الراقي من SULTA. أنا كابتن سفيان، شحنتكِ الثمينة معي الآن وباتت في طريقها إليكِ! 🌸 هل أنتم متواجدون في المنزل لاستلامها؟", time: "الآن" }
  ]);
  const [isDriverTyping, setIsDriverTyping] = useState(false);
  const [customUserText, setCustomUserText] = useState("");
  const [checkedlistItems, setCheckedlistItems] = useState<string[]>([]);

  // Ticking countdown effect for the live shipment tracking ETA
  React.useEffect(() => {
    let interval: any = null;
    if (trackedOrder && trackedOrder.status !== "delivered") {
      interval = setInterval(() => {
        setEtaTimer(prev => {
          if (prev <= 0) return 1455; // cycle/stay
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [trackedOrder]);

  const [notifications, setNotifications] = useState<
    {
      id: string;
      orderId: string;
      oldStatus: Order["status"];
      newStatus: Order["status"];
      date: string;
      read: boolean;
    }[]
  >([]);

  const [selectedReviewItem, setSelectedReviewItem] = useState<{
    productId: string;
    productName: string;
    customerName: string;
    country: Country;
  } | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewUsername, setReviewUsername] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const prevOrdersRef = React.useRef<Order[]>([]);

  React.useEffect(() => {
    if (prevOrdersRef.current.length > 0 && orders.length > 0) {
      orders.forEach((currentOrder) => {
        const prevOrder = prevOrdersRef.current.find(
          (o) => o.id === currentOrder.id,
        );
        if (prevOrder && prevOrder.status !== currentOrder.status) {
          // Status updated live!
          const newNotif = {
            id: Math.random().toString(36).substring(2, 11).toUpperCase(),
            orderId: currentOrder.id,
            oldStatus: prevOrder.status,
            newStatus: currentOrder.status,
            date: new Date().toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            read: false,
          };
          setNotifications((prev) => [newNotif, ...prev]);

          // Live dynamic update inside the tracked stepper
          if (trackedOrder && trackedOrder.id === currentOrder.id) {
            setTrackedOrder(currentOrder);
          }
        }
      });
    }
    prevOrdersRef.current = orders;
  }, [orders, trackedOrder]);

  const handleDownloadInvoice = (order: Order) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const darkBg = [11, 11, 11]; // Charcoal
      const accentGold = [212, 175, 55]; // Gold
      const textDark = [50, 50, 50];

      // Header Banner
      doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
      doc.rect(0, 0, 210, 40, "F");

      // Gold accent line
      doc.setFillColor(accentGold[0], accentGold[1], accentGold[2]);
      doc.rect(0, 40, 210, 2, "F");

      // Header Text
      doc.setTextColor(246, 231, 166); // Cream light gold
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("SULTA COUTURE", 105, 18, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text("LUXURY BOUTIQUE & LOUNGEMASTER", 105, 25, { align: "center" });
      doc.text("EST. 2026", 105, 31, { align: "center" });

      // Invoice label
      doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE / RECEIPT", 20, 55);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);

      // Two columns for Invoice Info & Customer Info
      doc.setFont("helvetica", "bold");
      doc.text("Invoice Details:", 20, 65);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice ID:  ${order.id}`, 20, 71);
      doc.text(`Date Issued: ${order.date}`, 20, 77);
      doc.text(`Status:      ${order.status.toUpperCase()}`, 20, 83);
      doc.text(`Currency:    ${order.currency}`, 20, 89);

      doc.setFont("helvetica", "bold");
      doc.text("Ship To:", 120, 65);
      doc.setFont("helvetica", "normal");

      const cleanCustomerName = order.customerName || "Sulta Guest";
      const cleanPhone = order.phone || "";
      const cleanCity = order.city || "";
      const cleanAddress = order.address || "";

      doc.text(`Customer: ${cleanCustomerName}`, 120, 71);
      doc.text(`Phone:    ${cleanPhone}`, 120, 77);
      doc.text(`Details:  ${cleanCity}, ${cleanAddress}`, 120, 83);
      doc.text(
        `Country:  ${order.country === "EG" ? "Egypt" : "Saudi Arabia"}`,
        120,
        89,
      );

      // Horizontal separator
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(20, 96, 190, 96);

      // Items Table Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
      doc.text("PRODUCT DESCRIPTION", 20, 104);
      doc.text("QTY", 110, 104, { align: "center" });
      doc.text("UNIT PRICE", 140, 104, { align: "right" });
      doc.text("TOTAL", 180, 104, { align: "right" });

      doc.line(20, 107, 190, 107);

      // Items List
      let currentY = 114;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);

      order.items.forEach((item) => {
        const matchedP = products.find((p) => p.id === item.productId);
        const label =
          matchedP?.nameEn || item.productName || "Sulta Elegant Piece";
        const cleanLabel = label.replace(/[^\x00-\x7F]/g, ""); // strip non-ascii
        const finalLabel = cleanLabel.trim() || "Luxury Loungewear Piece";

        doc.text(
          `${finalLabel} (${item.color} - Size ${item.size})`,
          20,
          currentY,
        );
        doc.text(`${item.quantity}`, 110, currentY, { align: "center" });
        doc.text(
          `${item.price.toLocaleString()} ${order.currency}`,
          140,
          currentY,
          { align: "right" },
        );

        const rowTotal = item.price * item.quantity;
        doc.text(
          `${rowTotal.toLocaleString()} ${order.currency}`,
          180,
          currentY,
          { align: "right" },
        );

        currentY += 8;
      });

      doc.line(20, currentY, 190, currentY);
      currentY += 8;

      // Total summary
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL PRICE:", 140, currentY, { align: "right" });
      doc.setFontSize(12);
      doc.setTextColor(accentGold[0], accentGold[1], accentGold[2]);
      doc.text(
        `${order.totalPrice.toLocaleString()} ${order.currency}`,
        180,
        currentY,
        { align: "right" },
      );

      // Back to normal size
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);

      // Footer luxury messaging
      currentY = Math.max(currentY + 25, 230);
      doc.line(20, currentY, 190, currentY);

      doc.setFont("helvetica", "oblique");
      doc.setFontSize(9);
      doc.text(
        "Thank you for shopping at SULTA LUXURY COUTURE.",
        105,
        currentY + 7,
        { align: "center" },
      );
      doc.text(
        "Your comfort, elegance and royalty is our priority. Crafted with perfection. \u2726",
        105,
        currentY + 12,
        { align: "center" },
      );

      doc.save(`Sulta_Invoice_${order.id}.pdf`);
    } catch (_error) {
      alert(
        "نعتذر، حدث تعذر فني عند تجميع ومعالجة ملف الفاتورة. يرجى مراجعة تفاصيل حسابك.",
      );
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewItem) return;
    if (!reviewComment.trim()) {
      toast("من فضلكِ اكتبي تعليقكِ لتقييم المنتج.", 'error');
      return;
    }
    setSubmittingReview(true);

    const newReview: Review = {
      id: Math.random().toString(36).substring(2, 11).toUpperCase(),
      username:
        reviewUsername.trim() ||
        selectedReviewItem.customerName ||
        "عميلة ملكية متميزة 💎",
      avatar: "",
      rating: reviewRating,
      comment: reviewComment.trim(),
      date: new Date().toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      country: selectedReviewItem.country,
      productName: selectedReviewItem.productName,
    };

    try {
      await dbService.saveReview(newReview);
      alert(
        "تم إرسال تقييمكِ الرائع للمنتج بنجاح! سيتم عرضه حياً في تبويب مراجعات صفحة المنتج 🌸.",
      );
      setSelectedReviewItem(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (_un) {
      alert(
        "تعذر حفظ تقييم المنتج في منظومة البيانات حالياً. يرجى المحاولة لاحقاً.",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const favProducts = products.filter((p) => favorites.includes(p.id));

  // Order status helper translation
  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "قيد الانتظار لموافقة الإدارة";
      case "processing":
        return "يجري تجهيزها وتغليفها باهتمام 🌸";
      case "shipped":
        return "تم الشحن مع المندوب الملكي 🚀";
      case "delivered":
        return "تم التسليم بنجاح ✨";
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "text-amber-500 bg-amber-50 border-amber-200";
      case "processing":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "shipped":
        return "text-blue-500 bg-blue-50 border-blue-200";
      case "delivered":
        return "text-emerald-500 bg-emerald-50 border-emerald-200";
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackingIdInput.trim();
    if (!query) return;

    // Search by ID first
    let found = orders.find((o) => o.id.toUpperCase() === query.toUpperCase());

    // If not found, try searching by phone number (match exact or partial digits)
    if (!found) {
      const sanitizedQuery = query.replace(/[^0-9]/g, "");
      if (sanitizedQuery.length >= 5) {
        found = orders.find((o) => {
          const sanPhone = o.phone.replace(/[^0-9]/g, "");
          return sanPhone.includes(sanitizedQuery);
        });
      }
    }

    if (found) {
      setTrackedOrder(found);
      setActiveStepTab(found.status);
      setActiveTab("track");
    } else {
      // Create a gorgeous realistic simulated tracked order for demonstration so they can test easily!
      const demoOrder: Order = {
        id: query.startsWith("SUL-") ? query.toUpperCase() : `SUL-${query.toUpperCase()}`,
        customerName: session?.user?.email ? session.user.email.split('@')[0] : "سيدة الأناقة الموقرة",
        phone: "+966 50 123 4567",
        country: country || "EG",
        city: country === "EG" ? "القاهرة، مصر الجديدة" : "الرياض، حي السليمانية",
        address: "شارع الفخامة الملكية، فيلا 12",
        status: "shipped", // default interactive view defaults to shipped to show off live driver chat & map countdown
        currency: country === "EG" ? "EGP" : "SAR",
        totalPrice: 1850,
        paymentMethod: "بطاقة دفع مدى الائتمانية",
        date: new Date().toISOString().split('T')[0],
        items: [
          {
            productId: products[0]?.id || "demo-1",
            productName: products[0]?.nameAr || "طقم نوم كوتور الحرير الخالص 🌸",
            price: 1850,
            quantity: 1,
            color: products[0]?.colors?.[0]?.name || "وردي ملكي",
            size: "M"
          }
        ]
      };
      setTrackedOrder(demoOrder);
      setActiveStepTab("shipped");
      setActiveTab("track");
      setChatMessages([
        { sender: "driver", text: `أهلاً بكِ يا صانعة الأناقة! 🌸 لقد تسلمت الآن طلبيتك رقم ${demoOrder.id} وباتت معقمة داخل سيارة التوصيل لـ SULTA Express. أنا في الطريق إليكِ حالياً وفخور جداً بتقديم الخدمة لكِ. هل أنتم متواجدون حالياً بالمنزل؟`, time: "الآن" }
      ]);
    }
  };

  // Customer static addresses
  const [addresses, setAddresses] = useState<any[]>([]);

  if (!session) {
    return (
      <div
        className="max-w-md mx-auto py-16 px-6 text-right font-sans"
        dir="rtl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#F4B6C2] border border-pink-100">
            <Package size={32} />
          </div>
          <h2 className="font-serif text-2xl text-[#0B0B0B] mb-2">
            تسجيل الدخول للنادي الملكي
          </h2>
          <p className="text-xs text-gray-400">
            انضمي إلينا لمتابعة طلبياتك وإدارة مفضلتك الحصرية
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {authError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-[10px] text-center">
              {authError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 px-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#F4B6C2]"
              placeholder="example@style.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 px-1">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#F4B6C2]"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={authLoading}
            className="w-full bg-[#0B0B0B] text-[#F6E7A6] font-bold py-3 rounded-xl hover:bg-gray-800 transition-all text-xs disabled:opacity-50"
          >
            {authLoading
              ? "جاري المعالجة..."
              : authMode === "login"
                ? "دخول"
                : "إنشاء حساب جديد"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() =>
              setAuthMode(authMode === "login" ? "signup" : "login")
            }
            className="text-[11px] text-[#F4B6C2] hover:underline cursor-pointer"
          >
            {authMode === "login"
              ? "ليس لديكِ حساب؟ انضمي الآن"
              : "لديكِ حساب بالفعل؟ سجلي الدخول"}
          </button>
        </div>

        {/* Foolproof redundant Admin Gateway card */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-300/30 text-right space-y-2">
            <h4 className="text-xs font-serif font-black text-amber-900 flex items-center gap-1.5 justify-end">
              <span>بوابة الإدارة والطلبيات المباشرة ⚙️</span>
            </h4>
            <p className="text-[10px] text-gray-500 leading-normal">
              إذا كنتِ مالكة بوتيك SULTA أو مديرة نظام المتجر، تفضلي بالدخول مباشرة إلى لوحة التحكم والتقارير وإدارة الطلبيات الفاخرة:
            </p>
            <button
              onClick={() => {
                if (onNavigateToDashboard) {
                  onNavigateToDashboard();
                }
              }}
              type="button"
              className="w-full mt-1.5 bg-gradient-to-r from-amber-600 to-[#c5a059] text-white font-bold py-2.5 rounded-xl text-[11px] transition-all cursor-pointer shadow-xs hover:opacity-95"
            >
              🔐 فتح لوحة الإدارة الفاخرة (Admin Core)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Introduction with Loyalty quick status banner */}
      <div className="mb-10 text-center md:text-right pb-6 border-b border-gray-150 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 justify-center md:justify-start flex-wrap">
            <span className="bg-gradient-to-r from-teal-500 to-[#F6E7A6] text-white text-[9px] uppercase font-bold font-sans px-2.5 py-0.5 rounded-full shadow-xs">
              🎖️ عضوة النادي الملكي
            </span>
            <span className="text-gray-400 text-xs">|</span>
            <span className="text-[#0B0B0B] font-sans font-bold text-xs flex items-center gap-1">
              <Crown size={12} className="text-gray-400" />
              <span>{session.user.email}</span>
            </span>

            {/* Quick Go to Admin Dashboard Link to prevent layout navigation confusion */}
            <button
              onClick={() => {
                if (onNavigateToDashboard) {
                  onNavigateToDashboard();
                } else {
                  // Fallback dispatcher
                  window.location.reload();
                }
              }}
              className="bg-amber-100 hover:bg-[#FAF4F5] text-amber-900 border border-amber-300 hover:border-[#DF8A9C] text-[10px] font-bold px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
            >
              <span>👑 بوابة الإدارة والطلبيات (مسؤول)</span>
            </button>

            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-750 text-[10px] mr-2 font-bold hover:underline"
            >
              تسجيل خروج
            </button>
          </div>
          <h2 className="font-serif text-2xl md:text-4xl font-light text-[#0B0B0B] mt-1">
            مرحباً بكِ في نادي SULTA الملكي
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            مساحتك الحصرية لإدارة طلبياتك ومفضلتك وتفاصيل نقاط الولاء والتبديل.
          </p>
        </div>

        {/* Dynamic tracking bar shortcuts */}
        <form
          onSubmit={handleTrackSubmit}
          className="flex gap-2.5 w-full md:w-auto font-sans text-xs"
        >
          <input
            type="text"
            placeholder="أدخلي رقم الطلب للتتبع (مثال: SUL-...)"
            value={trackingIdInput}
            onChange={(e) => setTrackingIdInput(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F4B6C2] bg-white text-right w-full sm:w-60"
          />
          <button
            type="submit"
            className="bg-[#0B0B0B] text-[#F6E7A6] px-4 py-1.5 rounded-lg transition-colors hover:bg-gray-800 shrink-0 cursor-pointer"
          >
            تتبع الشحنة
          </button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar menu */}
        <aside className="lg:w-1/4 shrink-0 bg-white border border-gray-100 rounded-2xl p-4 h-fit shadow-xs">
          <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible no-scrollbar">
            <button
              onClick={() => {
                setActiveTab("loyalty");
                setTrackedOrder(null);
              }}
              className={`flex-1 lg:flex-none text-right text-xs md:text-sm px-4 py-3 rounded-xl transition-luxury flex items-center justify-between gap-3 shrink-0 cursor-pointer ${
                activeTab === "loyalty"
                  ? "bg-[#0B0B0B] text-[#F6E7A6] font-bold shadow-sm"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Crown size={16} className="text-yellow-400" />
                <span>نقاط وولاء Sulta</span>
              </span>
              <span className="bg-amber-100 text-amber-800 text-[9px] font-sans px-2 py-0.5 rounded-full">
                0 ن
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("orders");
                setTrackedOrder(null);
              }}
              className={`flex-1 lg:flex-none text-right text-xs md:text-sm px-4 py-3 rounded-xl transition-luxury flex items-center justify-between gap-3 shrink-0 cursor-pointer ${
                activeTab === "orders"
                  ? "bg-[#0B0B0B] text-[#F6E7A6] font-bold shadow-sm"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package size={16} />
                <span>طلباتي الفاخرة</span>
              </span>
              <span className="bg-gray-150 text-gray-700 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-mono">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("track");
                setTrackedOrder(null);
              }}
              className={`flex-1 lg:flex-none text-right text-xs md:text-sm px-4 py-3 rounded-xl transition-luxury flex items-center gap-2.5 shrink-0 cursor-pointer ${
                activeTab === "track"
                  ? "bg-[#0B0B0B] text-[#F6E7A6] font-bold shadow-sm"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <Truck size={16} />
              <span>تتبع حالة الشحنة</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("addresses");
                setTrackedOrder(null);
              }}
              className={`flex-1 lg:flex-none text-right text-xs md:text-sm px-4 py-3 rounded-xl transition-luxury flex items-center gap-2.5 shrink-0 cursor-pointer ${
                activeTab === "addresses"
                  ? "bg-[#0B0B0B] text-[#F6E7A6] font-bold shadow-sm"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <MapPin size={16} />
              <span>عناوين التوصيل</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("wishlist");
                setTrackedOrder(null);
              }}
              className={`flex-1 lg:flex-none text-right text-xs md:text-sm px-4 py-3 rounded-xl transition-luxury flex items-center gap-2.5 shrink-0 cursor-pointer ${
                activeTab === "wishlist"
                  ? "bg-[#0B0B0B] text-[#F6E7A6] font-bold shadow-sm"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <Heart size={16} />
              <span>المفضلة الراقية</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("settings");
                setTrackedOrder(null);
              }}
              className={`flex-1 lg:flex-none text-right text-xs md:text-sm px-4 py-3 rounded-xl transition-luxury flex items-center gap-2.5 shrink-0 cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#0B0B0B] text-[#F6E7A6] font-bold shadow-sm"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <Settings size={16} />
              <span>الإعدادات الشخصية</span>
            </button>
          </div>
        </aside>

        {/* Core dynamic body viewport based on Tab selection */}
        <main className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 md:p-8 min-h-[50vh] shadow-xs">
          {/* ROYAL LIVE ALERTS CENTER */}
          {notifications.length > 0 && (
            <div className="mb-6 space-y-2 font-sans text-xs">
              <div className="flex justify-between items-center bg-pink-50 border border-pink-100 p-3 rounded-2xl">
                <span className="font-bold text-[#0B0B0B] flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  تحديثات حالة الشحنة الملكية المباشرة ✨
                </span>
                <button
                  onClick={() => setNotifications([])}
                  className="text-gray-400 hover:text-gray-650 text-[10px] cursor-pointer"
                >
                  مسح الكل ×
                </button>
              </div>
              <div className="space-y-1.5 pr-0.5 max-h-40 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="bg-[#FAFAF7] border border-gray-150 rounded-xl p-3 flex justify-between items-center gap-3 text-right"
                  >
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        تغيرت حالة الطلب{" "}
                        <span className="font-mono text-amber-800">
                          {notif.orderId}
                        </span>
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        من{" "}
                        {notif.oldStatus === "pending"
                          ? "قيد الانتظار لموافقة الإدارة"
                          : notif.oldStatus === "processing"
                            ? "يجري تجهيزها وتغليفها باهتمام"
                            : notif.oldStatus === "shipped"
                              ? "تم الشحن مع المندوب الملكي"
                              : "تم التسليم بنجاح"}{" "}
                        ← إلى{" "}
                        <span className="font-bold text-[#DF8A9C]">
                          {notif.newStatus === "pending"
                            ? "قيد الانتظار لموافقة الإدارة"
                            : notif.newStatus === "processing"
                              ? "يجري تجهيزها وتغليفها باهتمام"
                              : notif.newStatus === "shipped"
                                ? "تم الشحن مع المندوب الملكي"
                                : "تم التسليم بنجاح"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-gray-400 font-sans">
                        {notif.date}
                      </span>
                      <button
                        onClick={() => {
                          const matchedOrder = orders.find(
                            (o) => o.id === notif.orderId,
                          );
                          if (matchedOrder) {
                            setTrackedOrder(matchedOrder);
                            setActiveTab("track");
                          }
                        }}
                        className="bg-[#0B0B0B] text-[#F6E7A6] px-3 py-1 rounded-lg text-[9px] transition-all hover:bg-gray-850 cursor-pointer font-bold"
                      >
                        عرض التحديث الملكي
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 0: LOYALTY PORTAL (SULTA COUTURE CLUB) */}
          {activeTab === "loyalty" && (
            <div className="text-right space-y-7">
              {/* Visual Card detailing points and tiers */}
              <div className="relative overflow-hidden bg-gradient-to-tr from-[#0B0B0B] via-zinc-900 to-[#1A1A1A] text-white rounded-3xl p-6 sm:p-8 border border-amber-200/25 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F6E7A6]/5 rounded-full blur-2xl" />

                <div className="space-y-3 relative z-10 w-full sm:w-2/3">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-[#F6E7A6]" />
                    <span className="font-serif italic text-xs tracking-widest text-[#F6E7A6]">
                      SULTA GOLD TIERS 👑
                    </span>
                  </div>
                  <h3 className="font-sans font-black text-2xl sm:text-3xl text-zinc-100">
                    المستوى المبدئي
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    أنتِ الآن في بداية تجربتك الملكية. تسوقي لكسب النقاط
                    والارتقاء في مستويات النادي المرموق.
                  </p>

                  {/* Metric Progress Line */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[11px] font-sans text-zinc-400 font-semibold mb-1">
                      <span>المستوى التالي: فضي (10k نقطة) 🥈</span>
                      <span>أنتِ بمعدل 0 نقطة</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-700">
                      <div
                        className="bg-gradient-to-r from-teal-500 via-[#DF8A9C] to-[#F6E7A6] h-full rounded-full"
                        style={{ width: "0%" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center sm:self-center w-full sm:w-auto shrink-0 relative z-10 min-w-[150px]">
                  <span className="text-[10px] uppercase tracking-wider text-[#F6E7A6] font-semibold block mb-1">
                    الرصيد القابل للاستبدال:
                  </span>
                  <strong className="text-3xl sm:text-4xl font-serif text-[#F6E7A6] font-bold">
                    0
                  </strong>
                  <span className="text-[10px] text-gray-400 block mt-1 font-sans">
                    نقاط Sulta الذهبية ✦
                  </span>
                </div>
              </div>

              {/* Loyalty Roadway Stepper with exact unlock rules */}
              <div className="space-y-3">
                <h4 className="font-serif text-lg font-light text-[#0B0B0B] pb-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-sans">
                    تدرج مستويات ونقاط نادي Sulta للتسوق
                  </span>
                  <span>تدرج فئات العضوية الملكية 👑</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans">
                  {/* Silver Tier */}
                  <div className="border border-gray-150 rounded-2xl p-4 space-y-2 bg-white hover:border-gray-300 transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        10k نقطة 🥈
                      </span>
                      <span className="font-bold text-gray-800">
                        العضوية الفضية
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      من 0 إلى 10k نقطة. تمنحك تواصل سريع وبطاقات خصومات 10%
                      مواسم.
                    </p>
                  </div>

                  {/* Gold Tier */}
                  <div className="border border-gray-150 rounded-2xl p-4 space-y-2 bg-white hover:border-amber-200 transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        10k+ نقطة 🥇
                      </span>
                      <span className="font-bold text-black">
                        العضوية الذهبية
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600">
                      من 10k وحتى 30k نقطة. تمنحك شحن مجاني دائم + تغليف هدايا
                      فاخر بالكامل مجاناً لكل منتج.
                    </p>
                  </div>

                  {/* Platinum Tier */}
                  <div className="border border-gray-150 rounded-2xl p-4 space-y-2 bg-white hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        باقي 11.5k 💎
                      </span>
                      <span className="font-bold text-gray-800">
                        عضوية البلاتينيوم
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      من 30k وحتى 60k نقطة. تمنحك خصومات 15% كاش باك + تجريب
                      بيجامات حصري في منزلك قبل الدفع.
                    </p>
                  </div>

                  {/* Diamond Tier */}
                  <div className="border border-gray-150 rounded-2xl p-4 space-y-2 bg-white hover:border-purple-200 transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        60k+ 👑
                      </span>
                      <span className="font-bold text-gray-800">
                        قائمة دايموند النخبة
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      دعوات خاصة لعروض الأزياء العائلية + إهداء ملكي مخصص باسمك
                      سنوياً مع بطاقة ذهب خالص.
                    </p>
                  </div>
                </div>
              </div>

              {/* Point History Ledger Table */}
              <div className="space-y-2.5">
                <h4 className="font-serif text-sm font-light text-gray-900">
                  سجل حركات كسب النقاط الفاخرة:
                </h4>
                <div className="border border-gray-150 rounded-xl overflow-hidden font-sans text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-[#0B0B0B] text-[#F6E7A6]">
                      <tr>
                        <th className="p-3 text-[10px] uppercase font-bold">
                          تاريخ الحركة
                        </th>
                        <th className="p-3 text-[10px] uppercase font-bold">
                          تفاصيل العملية
                        </th>
                        <th className="p-3 text-[10px] uppercase font-bold">
                          الربح الزمني
                        </th>
                        <th className="p-3 text-[10px] uppercase font-bold text-left">
                          التأثير
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-gray-600">
                      {/* Empty log state */}
                      <tr className="bg-white">
                        <td
                          colSpan={4}
                          className="p-6 text-center text-gray-400 font-sans"
                        >
                          لا توجد حركات مسجلة لنقاط الولاء حتى الآن. ابدئي
                          التسوق لكسب النقاط!
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ORDERS LIST VIEW */}
          {activeTab === "orders" && (
            <div>
              <h3 className="font-serif text-lg font-light text-[#0B0B0B] pb-3 border-b border-gray-100 mb-6 flex justify-between items-center">
                <span>مشترياتك الفخمة من Sulta</span>
                <span className="text-xs bg-[#FAF4F5] text-[#DF8A9C] px-3 py-1 rounded-full font-sans font-bold">
                  {completedOrdersCount} طلبيات مكتملة
                </span>
              </h3>

              {/* Data Visualization Section */}
              {monthlyData.length > 0 && (
                <div className="bg-white border border-gray-150 p-5 rounded-2xl mb-8 shadow-sm">
                  <h4 className="font-serif text-sm font-light text-gray-800 mb-4 text-right">
                    تحليل مصروفاتك الشهرية على الفخامة ✨
                  </h4>
                  <div className="h-48 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#DF8A9C" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#DF8A9C" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(val) => `\u200E${(val / 1000).toFixed(0)}k`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                          formatter={(value) => [`\u200E${value} ${country === 'EG' ? 'EGP' : 'SAR'}`, 'المصروفات']}
                        />
                        <Area type="monotone" dataKey="المصروفات" stroke="#DF8A9C" fillOpacity={1} fill="url(#colorSpend)" activeDot={{ r: 6, fill: '#0B0B0B', stroke: '#F6E7A6', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400 font-sans text-xs mb-4">
                    لا توجد طلبيات مسجلة تحت حسابكِ الملكي حالياً.
                  </p>
                  <span className="text-3xl">🛍️</span>
                </div>
              ) : (
                <div className="space-y-5">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="border border-gray-150 rounded-2xl overflow-hidden hover:border-gray-200 transition-all font-sans text-xs"
                    >
                      {/* Top Specs */}
                      <div className="bg-[#FAFAF7] p-4 flex flex-wrap justify-between items-center gap-3 border-b border-gray-150 text-right">
                        <div className="flex gap-4">
                          <div>
                            <span className="text-gray-400 block text-[10px]">
                              كود معالجة الشحنة
                            </span>
                            <span className="font-bold text-[#0B0B0B] font-mono">
                              {o.id}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">
                              تاريخ التسجيل
                            </span>
                            <span className="font-sans text-gray-700">
                              {o.date}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">
                              السعر الإجمالي للطلب
                            </span>
                            <span className="font-sans font-bold text-black">
                              {o.totalPrice.toLocaleString()} {o.currency}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 items-center">
                          <span
                            className={`px-2.5 py-1 rounded-full border text-[9px] font-sans font-bold uppercase ${getStatusColor(o.status)}`}
                          >
                            {getStatusLabel(o.status)}
                          </span>
                          <button
                            onClick={() => handleDownloadInvoice(o)}
                            className="bg-amber-100/80 hover:bg-amber-200 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer font-bold flex items-center gap-1 font-sans shadow-xs shrink-0"
                          >
                            📄 فاتورة PDF
                          </button>
                          <button
                            onClick={() => {
                              setTrackedOrder(o);
                              setActiveStepTab(o.status);
                              setActiveTab("track");
                            }}
                            className="bg-[#0B0B0B] text-white hover:bg-[#F4B6C2] px-3.5 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer"
                          >
                            تتبع الرحلة
                          </button>
                          <button
                            onClick={() => onReorder?.(o)}
                            className="border border-[#0B0B0B] text-[#0B0B0B] hover:bg-[#0B0B0B] hover:text-[#F6E7A6] px-3.5 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer flex items-center gap-1 font-bold"
                          >
                            <ShoppingBag size={12} />
                            إعادة الطلب
                          </button>
                        </div>
                      </div>

                      {/* Order Mini Progress Tracker */}
                      <div className="bg-white p-4 sm:p-5 border-b border-gray-100 hidden sm:block">
                        <div className="flex justify-between items-center relative text-[10px] font-bold text-center">
                          <div className="absolute top-1/2 left-[12%] right-[12%] h-[2px] bg-gray-100 -z-10 -translate-y-1/2" />

                          {/* 1. Pending */}
                          <div
                            className={`flex flex-col items-center gap-1.5 z-10 w-1/4 ${["pending", "processing", "shipped", "delivered"].includes(o.status) ? "text-[#0B0B0B]" : "text-gray-300"}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${["pending", "processing", "shipped", "delivered"].includes(o.status) ? "bg-[#0B0B0B] border-[#0B0B0B] text-[#F6E7A6]" : "bg-white border-gray-200 text-gray-300"}`}
                            >
                              <Clock size={14} />
                            </div>
                            <span className="font-sans">تم الطلب</span>
                          </div>

                          {/* 2. Processing */}
                          <div
                            className={`flex flex-col items-center gap-1.5 z-10 w-1/4 ${["processing", "shipped", "delivered"].includes(o.status) ? "text-[#0B0B0B]" : "text-gray-300"}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${["processing", "shipped", "delivered"].includes(o.status) ? "bg-[#0B0B0B] border-[#0B0B0B] text-[#F4B6C2]" : "bg-white border-gray-200 text-gray-300"}`}
                            >
                              <Package size={14} />
                            </div>
                            <span className="font-sans">جاري التجهيز</span>
                          </div>

                          {/* 3. Shipped */}
                          <div
                            className={`flex flex-col items-center gap-1.5 z-10 w-1/4 ${["shipped", "delivered"].includes(o.status) ? "text-[#0B0B0B]" : "text-gray-300"}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${["shipped", "delivered"].includes(o.status) ? "bg-[#0B0B0B] border-[#0B0B0B] text-[#F6E7A6]" : "bg-white border-gray-200 text-gray-300"}`}
                            >
                              <Truck size={14} />
                            </div>
                            <span className="font-sans">تم الشحن</span>
                          </div>

                          {/* 4. Delivered */}
                          <div
                            className={`flex flex-col items-center gap-1.5 z-10 w-1/4 ${["delivered"].includes(o.status) ? "text-emerald-600" : "text-gray-300"}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${["delivered"].includes(o.status) ? "bg-emerald-600 border-emerald-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-300"}`}
                            >
                              <CheckCircle size={14} />
                            </div>
                            <span className="font-sans">تم التوصيل</span>
                          </div>
                        </div>
                      </div>

                      {/* Items included */}
                      <div className="p-4 bg-white space-y-3.5">
                        {o.items.map((item, idx) => {
                          const matchedProd = products.find(
                            (p) => p.id === item.productId,
                          );
                          const itemImage = matchedProd?.images?.[0] || "";
                          return (
                            <div
                              key={idx}
                              className="flex gap-3 justify-end items-center flex-row-reverse text-right border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                            >
                              <img
                                src={itemImage}
                                alt={item.productName}
                                className="w-10 h-13 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-800">
                                  {item.productName}
                                </h5>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                  <p className="text-gray-450 text-[10px]">
                                    اللون: {item.color} • المقاس: {item.size} •
                                    الكمية: {item.quantity}
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedReviewItem({
                                        productId: item.productId,
                                        productName: item.productName,
                                        customerName: o.customerName,
                                        country: o.country,
                                      });
                                      setReviewUsername(o.customerName || "");
                                      setReviewComment("");
                                      setReviewRating(5);
                                    }}
                                    className="text-[#DF8A9C] hover:text-white hover:bg-[#DF8A9C] border border-[#F4B6C2]/40 px-2.5 py-0.5 rounded-md text-[9px] font-sans font-bold transition-all cursor-pointer inline-flex items-center gap-1 shrink-0 font-sans"
                                  >
                                    ⭐ تقييم القطعة
                                  </button>
                                </div>
                              </div>
                              <span className="font-semibold text-gray-900">
                                {country === "EG"
                                  ? (
                                      item.price * item.quantity
                                    ).toLocaleString()
                                  : (
                                      item.price * item.quantity
                                    ).toLocaleString()}{" "}
                                {o.currency}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADDRESSES VIEW */}
          {activeTab === "addresses" && (
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-6 flex-wrap gap-2">
                <button
                  onClick={() =>
                    alert(
                      "ميزة إضافة عنوان جديد بمكالمة هاتفية أو تحديد الخريطة متوفرة في الإصدار المحدث.",
                    )
                  }
                  className="text-xs bg-[#0B0B0B] hover:bg-[#DF8A9C] text-white px-3.5 py-1.5 rounded-lg font-sans transition-colors cursor-pointer"
                >
                  إضافة وجهة توصيل جديدة +
                </button>
                <h3 className="font-serif text-lg font-light text-[#0B0B0B]">
                  كرت العناوين والوجهات لتسليم الهدايا
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-right">
                {addresses.length === 0 ? (
                  <div className="col-span-2 text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <span className="text-3xl block mb-2">📍</span>
                    <p className="text-gray-500 font-semibold mb-2">
                      ليست لديك عناوين مسجلة
                    </p>
                    <p className="text-[10px] text-gray-400">
                      أضيفي عنوانك لتسهيل عملية الطلب والشحن الملكي السريع.
                    </p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`border rounded-2xl p-4 space-y-2 relative transition-all ${addr.isDefault ? "border-[#DF8A9C] bg-[#FAF4F5]/30" : "border-gray-200 bg-white"}`}
                    >
                      {addr.isDefault && (
                        <span className="absolute top-4 left-4 text-[9px] bg-[#DF8A9C] text-white font-bold px-2.5 py-0.5 rounded-full">
                          الافتراضي للشحن الملكي 🛡️
                        </span>
                      )}
                      <h4 className="font-bold text-gray-900 text-sm">
                        {addr.name}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        {addr.address}
                      </p>
                      <p className="text-gray-400">المدينة: {addr.city}</p>
                      <p className="text-gray-500">
                        الجوال المربوط: {addr.phone}
                      </p>
                      <div className="pt-3 border-t border-gray-100 flex gap-2 justify-end">
                        <button
                          onClick={() => alert("معالجة الحذف للعنوان")}
                          className="text-red-500 hover:text-red-700"
                        >
                          إزالة
                        </button>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={() => alert("معالجة تحرير العنوان")}
                          className="text-[#0B0B0B] hover:text-[#DF8A9C]"
                        >
                          تعديل
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WISHLIST VIEW */}
          {activeTab === "wishlist" && (
            <div>
              <h3 className="font-serif text-lg font-light text-[#0B0B0B] pb-3 border-b border-gray-100 mb-6 text-right">
                قائمة أمنياتك السحرية
              </h3>

              {favProducts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl text-right p-6">
                  <p className="text-gray-400 font-sans text-xs mb-4">
                    المفضلة فارغة الآن! اضغطي على زر القلب على أي بيجامة لتتوج
                    هنا فوراً.
                  </p>
                  <span className="text-3xl block text-center">💖</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                  {favProducts.map((p) => {
                    const price = country === "EG" ? p.priceEG : p.priceSA;
                    return (
                      <div
                        key={p.id}
                        className="border border-gray-200 rounded-2xl p-3 flex gap-3 items-center hover:border-gray-300 transition-colors flex-row-reverse"
                      >
                        <img
                          src={p.images[0]}
                          alt={p.nameAr}
                          className="w-14 h-18 rounded-lg object-cover cursor-pointer shrink-0"
                          onClick={() => onSelectProduct(p)}
                        />
                        <div className="flex-1 text-xs">
                          <h4
                            className="font-bold text-gray-900 line-clamp-1 cursor-pointer"
                            onClick={() => onSelectProduct(p)}
                          >
                            {p.nameAr}
                          </h4>
                          <p className="font-sans text-gray-400">
                            {p.categoryAr}
                          </p>
                          <strong className="font-sans text-gray-800 mt-1 block">
                            {price.toLocaleString()}{" "}
                            {country === "EG" ? "EGP" : "SAR"}
                          </strong>
                        </div>
                        <button
                          onClick={() => toggleFavorite(p.id)}
                          className="text-red-500 hover:text-red-700 font-bold pr-2 pl-1 cursor-pointer"
                        >
                          إزالة
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS VIEW */}
          {activeTab === "settings" && (
            <div className="text-right">
              <h3 className="font-serif text-lg font-light text-[#0B0B0B] pb-3 border-b border-gray-100 mb-6">
                تهيئة الإعدادات لنادي SULTA
              </h3>

              <div className="space-y-4 font-sans text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 block mb-1">
                      الاسم الأول والعائلة
                    </label>
                    <input
                      type="text"
                      placeholder="الاسم الكامل"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-[#F4B6C2] focus:outline-none text-right"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">
                      البريد الإلكتروني المربوط
                    </label>
                    <input
                      type="email"
                      placeholder="example@domain.com"
                      className="w-full border border-gray-150 rounded-lg px-3 py-2 bg-gray-50 text-gray-400 font-mono text-right"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 block mb-2">
                    توصيات مخصصة للعمل والمقاسات المفضلة:
                  </span>
                  <div className="flex gap-4 justify-end flex-row-reverse">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="accent-[#F4B6C2]"
                      />
                      <span>
                        استلام منشورات كتالوج Sulta الفخرية عبر البريد
                        الإلكتروني
                      </span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="accent-[#F4B6C2]"
                      />
                      <span>استبيان تجربة التغليف لطلبياتي الملكية</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() =>
                      alert("تم حفظ تفاصيل الإعدادات الشخصية بنجاح.")
                    }
                    className="bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#F4B6C2] hover:text-white px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    حفظ التعديلات الحالية
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DYNAMIC ORDER TRACKING */}
          {activeTab === "track" && (
            <div className="text-right space-y-8">
              {trackedOrder ? (
                <div className="space-y-8 animate-fade-in text-right">
                  {/* Track Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-150 gap-4 text-right">
                    <div className="text-right">
                      <h3 className="font-serif text-xl font-light text-[#0B0B0B] flex items-center gap-2 justify-end">
                        <span>تتبع تفاصيل شحنتك الملكية المباشرة</span>
                        <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 font-sans">
                        رقم تتبع الشحنة المباشر:{" "}
                        <span className="font-mono bg-neutral-900 text-[#F6E7A6] font-bold px-2.5 py-1 rounded-md text-[11px] shadow-sm ml-1">
                          {trackedOrder.id}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleDownloadInvoice(trackedOrder)}
                        className="bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                      >
                        📄 الفاتورة الضريبة PDF
                      </button>
                      <button
                        onClick={() => {
                          setTrackedOrder(null);
                          setChatMessages([
                            { sender: "driver", text: "مرحباً بكِ في خدمة التوصيل الراقي من SULTA. أنا كابتن سفيان، شحنتكِ الثمينة معي الآن وباتت في طريقها إليكِ! 🌸 هل أنتم متواجدون في المنزل لاستلامها؟", time: "الآن" }
                          ]);
                        }}
                        className="text-xs text-[#DF8A9C] hover:text-[#0B0B0B] font-bold border border-[#DF8A9C]/20 px-4 py-2 rounded-xl hover:bg-neutral-50 flex items-center gap-1.5 cursor-pointer transition-all w-full sm:w-auto justify-center"
                      >
                        <span>← رجوع للبحث</span>
                      </button>
                    </div>
                  </div>

                  {/* STEPPER METRICS INTERACTIVE */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-sans font-bold">انقري على أي مرحلة لاستعراض تفاصيل التجهيز والشحن الفريدة 👑</span>
                      <h4 className="font-serif text-sm font-semibold text-gray-900">مراحل التجهيز والتسليم المعتمدة</h4>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-8 sm:gap-4 relative pt-2">
                      {/* Connection horizontal line for desktop */}
                      <div className="hidden sm:block absolute top-[18px] left-[10%] right-[10%] h-[2px] bg-gray-200 z-0" />

                      {/* STEP 1: Pending */}
                      <button
                        onClick={() => setActiveStepTab("pending")}
                        className={`z-10 flex flex-row sm:flex-col items-center sm:text-center gap-3 sm:gap-0 sm:flex-1 w-full justify-start select-none cursor-pointer group focus:outline-none`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold font-sans shadow-md ring-4 ring-white shrink-0 sm:mb-2 transition-all ${
                          activeStepTab === "pending" ? "bg-[#0B0B0B] text-[#F6E7A6] scale-110" : "bg-[#FAF4F5] text-[#DF8A9C]"
                        }`}>
                          <Clock size={15} />
                        </div>
                        <div className="text-right sm:text-center font-sans">
                          <span className={`font-bold block ${activeStepTab === "pending" ? "text-gray-950 font-black underline decoration-[#DF8A9C]" : "text-gray-600"}`}>
                            استلام واعتماد الطلبية
                          </span>
                          <span className="text-[9.5px] text-gray-400 block sm:mt-1 font-sans">
                            تم بنجاح وتميز
                          </span>
                        </div>
                      </button>

                      {/* STEP 2: Processing */}
                      <button
                        onClick={() => setActiveStepTab("processing")}
                        className={`z-10 flex flex-row sm:flex-col items-center sm:text-center gap-3 sm:gap-0 sm:flex-1 w-full justify-start select-none cursor-pointer group focus:outline-none`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold font-sans ring-4 ring-white shrink-0 sm:mb-2 transition-all ${
                            activeStepTab === "processing" ? "bg-[#0B0B0B] text-[#F6E7A6] scale-110" :
                            (trackedOrder.status !== "pending" ? "bg-[#FAF4F5] text-[#DF8A9C]" : "bg-gray-100 text-gray-400")
                          }`}
                        >
                          <Package size={15} />
                        </div>
                        <div className="text-right sm:text-center font-sans">
                          <span
                            className={`font-bold block ${activeStepTab === "processing" ? "text-gray-950 font-black underline decoration-[#DF8A9C]" : "text-gray-500"}`}
                          >
                            تغليف الأناقة والكي 🌸
                          </span>
                          <span className="text-[9.5px] text-gray-400 block sm:mt-1 font-sans">
                            يدوياً وبحرفية تامة
                          </span>
                        </div>
                      </button>

                      {/* STEP 3: Shipped */}
                      <button
                        onClick={() => setActiveStepTab("shipped")}
                        className={`z-10 flex flex-row sm:flex-col items-center sm:text-center gap-3 sm:gap-0 sm:flex-1 w-full justify-start select-none cursor-pointer group focus:outline-none`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold font-sans ring-4 ring-white shrink-0 sm:mb-2 transition-all ${
                            activeStepTab === "shipped" ? "bg-[#0B0B0B] text-[#F6E7A6] scale-110" :
                            (trackedOrder.status === "shipped" || trackedOrder.status === "delivered" ? "bg-[#FAF4F5] text-[#DF8A9C]" : "bg-gray-100 text-gray-400")
                          }`}
                        >
                          <Truck size={15} />
                        </div>
                        <div className="text-right sm:text-center font-sans">
                          <span
                            className={`font-bold block ${
                              activeStepTab === "shipped" ? "text-gray-950 font-black underline decoration-[#DF8A9C]" : "text-gray-500"
                            }`}
                          >
                            الشحن الملكي السريع 🚚
                          </span>
                          <span className="text-[9.5px] text-gray-400 block sm:mt-1 font-sans">
                            في طريقها لعنوانكم
                          </span>
                        </div>
                      </button>

                      {/* STEP 4: Delivered */}
                      <button
                        onClick={() => setActiveStepTab("delivered")}
                        className={`z-10 flex flex-row sm:flex-col items-center sm:text-center gap-3 sm:gap-0 sm:flex-1 w-full justify-start select-none cursor-pointer group focus:outline-none`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold font-sans ring-4 ring-white shrink-0 sm:mb-2 transition-all ${
                            activeStepTab === "delivered" ? "bg-[#0B0B0B] text-[#F6E7A6] scale-110" :
                            (trackedOrder.status === "delivered" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400")
                          }`}
                        >
                          <CheckCircle size={15} />
                        </div>
                        <div className="text-right sm:text-center font-sans">
                          <span
                            className={`font-bold block ${activeStepTab === "delivered" ? "text-emerald-600 font-black underline" : "text-gray-500"}`}
                          >
                            وصول باقة الهدايا ✨
                          </span>
                          <span className="text-[9.5px] text-gray-400 block sm:mt-1 font-sans">
                            تجربة نوم استثنائية
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Step log descriptive interactive text */}
                    <div className="bg-[#FAFAF7] rounded-2xl p-4 md:p-5 border border-gray-150 text-right text-xs leading-relaxed text-gray-700 font-sans">
                      <div className="flex gap-2 items-center justify-end font-bold text-gray-900 mb-2 font-serif text-sm">
                        <span>تقرير حالة الخط المباشر ({
                          activeStepTab === "pending" ? "الاعتماد والتوثيق" :
                          activeStepTab === "processing" ? "الكي والتغليف الفاخر" :
                          activeStepTab === "shipped" ? "رحلة الشحن والتوصيل" :
                          "الاستلام الملكي والتقييم"
                        })</span>
                        <span className="text-base">💎</span>
                      </div>
                      <p className="text-right">
                        {activeStepTab === "pending" && "تم استلام طلبيتكِ الفاخرة واعتمادها بنجاح في أنظمة SULTA المركزية. قمنا بالتحقق من جودة الخياطة وتخصيص تفاصيل الدفع والتحضير الفوري الموجه من الإدارة لسرعة إخراج الطلب بنسبة جودة 100%."}
                        {activeStepTab === "processing" && "يقوم الآن خبراء الجودة لدينا بالكي البخاري اللطيف لقطع الحرير الخالص لضمان تعقيمها وتثبيت نسجها بدرجة 125 مئوية آمنة. تم تغليف الباقة بعناية بالغة داخل الصندوق الوردي المزين بشريط ساتان كوتور ومعطرة بلمسة خفيفة من زيت المسك واللافندر المنعش لفتح صندوق مبهج 🌸."}
                        {activeStepTab === "shipped" && "بشرى سارة! تم تسليم باقتك لـ SULTA Fast Express وهي بصحبة سفير توصيل الأناقة كابتن سفيان الآن. تم تحسين مسار الرحلة ذكياً للوصول في دقة فائقة، الجوال متاح لتسهيل الاتصال والوصول المباشر."}
                        {activeStepTab === "delivered" && "تم تسليم الطرد الملكي في منتهى الرقي. نتمنى لك دوماً تجربة نوم هانئة تملؤها السكينة والأناقة المفرطة مع منسوجات SULTA. سعدنا بثقتِك ونتشرف بزيارة تقيمية تذكرين فيها رأيك في القطعة!"}
                      </p>
                    </div>
                  </div>

                  {/* MAP INTERACTIVE SVG VISUALIZER & COUNTDOWN */}
                  {trackedOrder.status !== "delivered" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Active SVG Route Map */}
                      <div className="bg-white border border-gray-200 rounded-3xl p-5 md:p-6 lg:col-span-2 space-y-4 text-right">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-[10px] text-gray-400 font-sans font-bold">تتبع حي للمندوب الملكي SULTA Express 🧭</span>
                          <h4 className="font-serif text-sm font-light text-gray-950">الخريطة الحية للتوصيل والموقع الفوري</h4>
                        </div>

                        {/* Interactive Styled Route Map */}
                        <div className="relative w-full h-44 bg-neutral-900 overflow-hidden rounded-2xl flex items-center justify-center border border-neutral-800">
                          
                          {/* Grid Background Mockup */}
                          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
                          
                          {/* Route Line Connecting Points */}
                          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#DF8A9C" />
                                <stop offset="100%" stopColor="#F6E7A6" />
                              </linearGradient>
                            </defs>
                            {/* Curved Path for realistic map feeling */}
                            <path 
                              d="M 50 110 Q 180 50, 310 110 T 570 100" 
                              fill="none" 
                              stroke="#ffffff1f" 
                              strokeWidth="4" 
                              strokeLinecap="round" 
                            />
                            <path 
                              d="M 50 110 Q 180 50, 310 110 T 570 100" 
                              fill="none" 
                              stroke="url(#routeGradient)" 
                              strokeWidth="3.5" 
                              className="stroke-dash-animate"
                              strokeDasharray="10 6"
                              strokeLinecap="round" 
                            />
                          </svg>

                          {/* Source Point Label */}
                          <div className="absolute left-[3%] sm:left-[8%] bottom-[20%] text-center z-10">
                            <div className="w-5 h-5 rounded-full bg-neutral-950 border border-[#F6E7A6] flex items-center justify-center text-[10px] shadow-md text-[#F6E7A6] font-bold mx-auto ring-4 ring-[#F6E7A6]/10">
                              S
                            </div>
                            <span className="text-[8px] sm:text-[9.5px] font-bold text-gray-300 font-sans block mt-1">مركز التجهيز الملكي</span>
                          </div>

                          {/* Moving Vehicle Icon Mockup along path */}
                          <div className="absolute left-[45%] top-[18%] text-center z-10 animate-bounce">
                            <div className="w-9 h-9 rounded-full bg-[#DF8A9C] border-2 border-white flex items-center justify-center text-white shadow-xl ring-4 ring-[#DF8A9C]/40 animate-pulse">
                              🚚
                            </div>
                            <div className="bg-[#0B0B0B]/90 text-[8.5px] text-[#F6E7A6] px-1.5 py-0.5 rounded-full mt-1 border border-white/10 font-bold whitespace-nowrap">
                              في الطريق إليكِ
                            </div>
                          </div>

                          {/* Recipient Point Label */}
                          <div className="absolute right-[3%] sm:right-[8%] bottom-[25%] text-center z-10">
                            <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold mx-auto animate-pulse">
                              📍
                            </div>
                            <span className="text-[8px] sm:text-[9.5px] font-bold text-emerald-400 font-sans block mt-1">{trackedOrder.city.split('،')[0]}</span>
                          </div>

                          {/* Distance overlay tag */}
                          <div className="absolute bottom-3 right-3 bg-neutral-950/80 backdrop-blur-xs border border-white/10 px-2.5 py-1 rounded-lg text-[9px] text-gray-300 font-sans font-medium flex items-center gap-1">
                            <span>المسافة المتبقية:</span>
                            <span className="text-white font-mono font-bold animate-pulse text-[10px]">
                              {Math.max(12, Math.floor(etaTimer / 3.5))} متر
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ticking Countdown Card */}
                      <div className="bg-[#FAF4F5] border border-[#DF8A9C]/20 rounded-3xl p-5 flex flex-col justify-between text-right font-sans">
                        <div className="text-right">
                          <span className="bg-[#DF8A9C] text-white text-[8.5px] font-sans font-extrabold uppercase px-2 py-0.5 rounded-full">
                            توقيت حي ذكي ⚡
                          </span>
                          <h4 className="font-serif text-[15px] font-bold text-gray-900 mt-2.5">زمن الوصول التقديري المحسب</h4>
                          <p className="text-[10.5px] text-gray-500 mt-1">يجرى تتبع دقات عقارب الساعة لوصول أناقة الحرير الخالصة.</p>
                        </div>

                        {/* Interactive Clock Timer UI */}
                        <div className="my-5 text-center bg-white/70 backdrop-blur-xs rounded-2xl py-4 border border-white flex flex-col items-center justify-center shadow-xs">
                          <span className="text-[10px] text-gray-400 font-bold font-sans uppercase tracking-widest block mb-0.5">ESTIMATED TIME</span>
                          
                          <div className="font-mono text-3xl font-black text-gray-950 tracking-tight flex items-center gap-1.5 leading-none">
                            <span>{Math.floor(etaTimer / 60).toString().padStart(2, '0')}</span>
                            <span className="animate-ping font-sans text-xl text-[#DF8A9C]">:</span>
                            <span>{(etaTimer % 60).toString().padStart(2, '0')}</span>
                          </div>
                          
                          <span className="text-[9.5px] text-gray-400 font-sans mt-2.5 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <span>تحديث حي كل ثانية لتسهيل الاستلام</span>
                          </span>
                        </div>

                        <div className="text-[9.5px] text-gray-500 leading-relaxed text-right">
                          💡 <strong>تنبيه الدخول الفردي:</strong> يرجى إمساك شفرة الكود الملكية لتسليمها للمندوب لإنهاء الاستلام بأمان فوري.
                        </div>
                      </div>

                    </div>
                  )}

                  {/* COURIER DRIVER CARD & INTERACTIVE CHAT SIMULATOR */}
                  {trackedOrder.status !== "delivered" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                      
                      {/* Driver Details Card */}
                      <div className="bg-white border border-gray-200 rounded-3xl p-5 md:p-6 space-y-4 text-right">
                        <div className="text-right pb-2 border-b border-gray-100">
                          <h4 className="font-serif text-sm font-semibold text-gray-950">مندوب التوصيل المعتمد لطلبيتكِ</h4>
                          <p className="text-[10.5px] text-gray-400 mt-0.5">سفير الأناقة الخاص لبراند SULTA الشريك</p>
                        </div>

                        <div className="flex items-center gap-3.5 flex-row-reverse text-right pt-1">
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full bg-slate-100 border border-neutral-200 overflow-hidden flex items-center justify-center font-bold text-lg">
                              👨‍✈️
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                          </div>
                          <div className="text-right">
                            <h5 className="font-bold text-gray-950 text-xs sm:text-sm">كابتن سفيان 👑</h5>
                            <p className="text-[10.5px] text-gray-400 font-sans mt-0.5">سفير السعادة والتوصيل الفاخر</p>
                            <div className="flex gap-1 items-center justify-end font-sans text-[10px] text-amber-500 font-extrabold mt-1">
                              <span>4.9 ★ التقييم الممتاز</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-gray-600 font-sans pt-2">
                          <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex-row-reverse text-right">
                            <span className="font-bold text-gray-950">SULTA Express</span>
                            <span className="text-gray-400">شركة الشحن:</span>
                          </div>
                          <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex-row-reverse text-right">
                            <span className="font-bold text-gray-950">سيارة تعقيم مبردة</span>
                            <span className="text-gray-400">وسيلة التوصيل:</span>
                          </div>
                        </div>

                        <button
                          onClick={() => alert("📞 يجري الآن تأمين اتصال خصوصي مشفر بـ كابتن سفيان دون إظهار رقمكِ... يرجى الانتظار لحين رنين خط الهاتف الفخم.")}
                          className="w-full bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#F4B6C2] hover:text-white text-xs font-bold font-sans py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>📞 اتصال هاتفي آمن بالمندوب</span>
                        </button>
                      </div>

                      {/* Driver Chat Simulator Widget */}
                      <div className="bg-white border border-gray-200 rounded-3xl p-5 md:p-6 md:col-span-2 flex flex-col justify-between gap-4 text-right">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-[10px] text-[#DF8A9C] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <span>متصل الآن لتلبية أسئلتك</span>
                          </span>
                          <h4 className="font-serif text-sm font-light text-gray-950">دردشة فورية تفاعلية مع سفير التوصيل</h4>
                        </div>

                        {/* Conversational Box */}
                        <div className="bg-[#FAFAF7] rounded-2xl p-4 h-48 overflow-y-auto space-y-3 font-sans text-xs flex flex-col justify-end">
                          <div className="space-y-3 max-h-full">
                            {chatMessages.map((msg, mIdx) => (
                              <div 
                                key={mIdx} 
                                className={`flex flex-col max-w-[85%] rounded-2xl px-3.5 py-2 relative leading-normal shrink-0 ${
                                  msg.sender === "user" 
                                    ? "bg-[#DF8A9C] text-white mr-auto rounded-tl-none text-left" 
                                    : "bg-white border border-gray-150 text-gray-800 ml-auto rounded-tr-none text-right"
                                }`}
                              >
                                <p className="text-[11px] leading-relaxed font-medium">{msg.text}</p>
                                <span className={`text-[8.5px] mt-1 block font-sans ${msg.sender === "user" ? "text-pink-100" : "text-gray-450"}`}>{msg.time}</span>
                              </div>
                            ))}

                            {isDriverTyping && (
                              <div className="bg-white border border-gray-150 text-gray-500 max-w-[50%] rounded-2xl rounded-tr-none px-3.5 py-2.5 ml-auto text-right flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-sans">كابتن سفيان يكتب..</span>
                                <div className="flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Prepared Quick Reply tags */}
                        <div className="space-y-2.5">
                          <p className="text-[10px] text-gray-400 font-sans font-bold">انقري لإرسال سؤال جاهز للمندوب وتلقي رده الفوري الملكي 🌸:</p>
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button
                              onClick={() => {
                                // Prevent multiple triggers during typing
                                if (isDriverTyping) return;
                                const userMsg = "أنا متواجدة بالمنزل حالياً وبانتظارك بشوق كامل لتسلم باقة الأناقة! 🌸";
                                const replyText = "في منتهى السعادة لسماع ذلك يا سيدتي الموقرة! دقيقتين فقط وسأكون على باب منزلكِ لتسليمك أرقى تصاميم الحرير كوتور من SULTA. نتمنى لك دوماً فخامة مطلقة!";
                                
                                setChatMessages(prev => [...prev, { sender: "user", text: userMsg, time: "الآن" }]);
                                setIsDriverTyping(true);
                                
                                setTimeout(() => {
                                  setIsDriverTyping(false);
                                  setChatMessages(prev => [...prev, { sender: "driver", text: replyText, time: "الآن" }]);
                                }, 1200);
                              }}
                              disabled={isDriverTyping}
                              className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-[10px] px-2.5 py-1.5 rounded-full transition-all cursor-pointer font-sans disabled:opacity-50"
                            >
                              🙋‍♀️ أنا متواجدة بالمنزل حالياً بانتظاركم
                            </button>

                            <button
                              onClick={() => {
                                if (isDriverTyping) return;
                                const userMsg = "هل الطرد مغلف كهدية راقية وأنيقة تليق بـ SULTA؟ 🎁";
                                const replyText = "نعم بكل تأكيد يا سيدتي الراقية! طردك موضوع داخل علبتنا الوردية البوتيك المحمية، مغلف بورق الحرير المعطر بالمسك الأبيض وبصحبة كرت الإهداء الأنيق كتحفة فنية متكاملة.";
                                
                                setChatMessages(prev => [...prev, { sender: "user", text: userMsg, time: "الآن" }]);
                                setIsDriverTyping(true);
                                
                                setTimeout(() => {
                                  setIsDriverTyping(false);
                                  setChatMessages(prev => [...prev, { sender: "driver", text: replyText, time: "الآن" }]);
                                }, 1200);
                              }}
                              disabled={isDriverTyping}
                              className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-[10px] px-2.5 py-1.5 rounded-full transition-all cursor-pointer font-sans disabled:opacity-50"
                            >
                              🎁 هل الطرد مغلف كهدية راقية؟
                            </button>

                            <button
                              onClick={() => {
                                if (isDriverTyping) return;
                                const userMsg = "يرجى ترك الشحنة عند الباب الخلفي بأمان أو تسليمها للاستقبال 🔑";
                                const replyText = "أمرك مطاع ومستجاب سيدتي الموقرة! سأقوم بوضع الصندوق الحريري بلطف في المكان المحدد وسأرسل لك صورة فورية على الجوال تأكيداً للتسليم السالم.";
                                
                                setChatMessages(prev => [...prev, { sender: "user", text: userMsg, time: "الآن" }]);
                                setIsDriverTyping(true);
                                
                                setTimeout(() => {
                                  setIsDriverTyping(false);
                                  setChatMessages(prev => [...prev, { sender: "driver", text: replyText, time: "الآن" }]);
                                }, 1200);
                              }}
                              disabled={isDriverTyping}
                              className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-[10px] px-2.5 py-1.5 rounded-full transition-all cursor-pointer font-sans disabled:opacity-50"
                            >
                              🔑 يرجى ترك الشحنة عند الباب بأمان
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* INTERACTIVE UNBOXING CHECKLIST */}
                  <div className="bg-[#FAFAF7] border border-gray-200 rounded-3xl p-5 md:p-6 space-y-4 text-right">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="text-right">
                        <h4 className="font-serif text-sm font-semibold text-gray-950">قائمة الاستعداد الملكي لاستقبال فخامة الكوتور</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">خطوات تفاعلية بسيطة ومسلية نوصيكِ بالتحضير لها قبل رنين الجرس 🌸</p>
                      </div>
                      
                      {/* Percent badge */}
                      <span className="bg-[#DF8A9C] text-white font-mono text-[9.5px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                        الاستعداد: {Math.round((checkedlistItems.length / 4) * 100)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      {[
                        { id: "coffee", text: "تجهيز فنجان القهوة أو الشاي الساخن للاحتفال بجمال فك الطرد ☕" },
                        { id: "warranty", text: "الاستعداد لفحص كرت الضمان الأصيل والختم الفضي اللامع لـ SULTA 🏷️" },
                        { id: "camera", text: "ضبط إضاءة الغرفة الهادئة وتجهيز كاميرا الهاتف لتوثيق فديو فتح الصندوق (Unboxing Vlog) 📸" },
                        { id: "phone", text: "تهيئة الجوال والتأكد من شحن البطارية لتلقي الرمز الفوري وتسليمه للمندوب الملكي 📱" }
                      ].map((chk) => (
                        <button
                          key={chk.id}
                          onClick={() => {
                            setCheckedlistItems(prev => {
                              if (prev.includes(chk.id)) {
                                return prev.filter(x => x !== chk.id);
                              }
                              return [...prev, chk.id];
                            });
                          }}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border text-right transition-all cursor-pointer focus:outline-none flex-row-reverse ${
                            checkedlistItems.includes(chk.id) 
                              ? "bg-white border-[#DF8A9C]/50 text-gray-900 shadow-xs font-semibold" 
                              : "bg-white border-gray-200 hover:border-gray-300 text-gray-500"
                          }`}
                        >
                          <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                            checkedlistItems.includes(chk.id) ? "bg-[#DF8A9C] border-[#DF8A9C] text-white" : "border-gray-300 bg-white"
                          }`}>
                            {checkedlistItems.includes(chk.id) && <span className="text-[9px]">✓</span>}
                          </div>
                          <span className="text-[11px] font-sans leading-relaxed text-right">{chk.text}</span>
                        </button>
                      ))}
                    </div>

                    {checkedlistItems.length === 4 && (
                      <div className="bg-[#FAF4F5] border border-[#DF8A9C]/30 text-[#DF8A9C] text-xs py-2.5 px-4 rounded-xl text-center font-bold animate-pulse font-sans">
                        🎉 رائع للغاية! أنتِ الآن مستعدة بالملي لتلقي تجربة الأناقة الحريرية الملكية الأكثر دلالاً وجمالاً!
                      </div>
                    )}
                  </div>

                  {/* Destination Information details card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600 font-sans leading-relaxed text-right">
                    <div className="bg-[#FAFAF7] p-5 rounded-2xl border border-gray-150 text-right">
                      <p className="font-bold text-gray-950 text-sm mb-3 pb-1.5 border-b border-gray-200">
                        وجهة التوصيل الملكية للعنوان:
                      </p>
                      <div className="space-y-1.5 text-right font-sans">
                        <p>
                          <strong>المستلمة الموقرة:</strong>{" "}
                          {trackedOrder.customerName}
                        </p>
                        <p>
                          <strong>رقم الجوال المنشور:</strong>{" "}
                          {trackedOrder.phone}
                        </p>
                        <p>
                          <strong>المدينة والتوجيه:</strong> {trackedOrder.city}
                        </p>
                        <p>
                          <strong>العنوان المفصل للشحنة:</strong>{" "}
                          {trackedOrder.address}
                        </p>
                        <p>
                          <strong>الدولة المحددة:</strong>{" "}
                          {trackedOrder.country === "EG"
                            ? "جمهورية مصر العربية 🇪🇬"
                            : "المملكة العربية السعودية 🇸🇦"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#FAFAF7] p-5 rounded-2xl border border-gray-150 text-right">
                      <p className="font-bold text-gray-950 text-sm mb-3 pb-1.5 border-b border-gray-200">
                        الفاتورة والرسوم المعتمدة للدفع:
                      </p>
                      <div className="space-y-1.5 text-right font-sans">
                        <p>
                          <strong>طريقة السداد المعتمدة:</strong>{" "}
                          {trackedOrder.paymentMethod}
                        </p>
                        <p>
                          <strong>قنوات الشحن الفاخرة:</strong> شحن وتوصيل SULTA Express
                        </p>
                        <p>
                          <strong>تاريخ وتوقيت المعاملة:</strong>{" "}
                          {trackedOrder.date}
                        </p>
                        <p>
                          <strong>تخليص المعاملة المالية:</strong> مدفوع ومكتمل تماماً
                        </p>
                        <p className="text-gray-950 font-black text-sm mt-3 pt-2 border-t border-gray-200 flex justify-between items-center flex-row-reverse text-right">
                          <span>المجموع الكلي الفاخر:</span>
                          <span className="font-mono text-base text-gray-950 font-bold">
                            {trackedOrder.totalPrice.toLocaleString()}{" "}
                            {trackedOrder.currency}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* List items with images */}
                  <div className="space-y-3.5 text-right">
                    <h4 className="font-serif text-sm font-semibold text-[#0B0B0B] border-r-2 border-gray-400 pr-2 pb-0.5 text-right">
                      مشتملات الشحنة الملكية الفخمة:
                    </h4>
                    <div className="border border-gray-150 rounded-2xl overflow-hidden divide-y divide-gray-100 font-sans text-xs bg-white text-right">
                      {trackedOrder.items.map((item, idx) => {
                        const matchedProd = products.find(
                          (p) => p.id === item.productId,
                        );
                        const itemImage = matchedProd?.images?.[0] || "";
                        return (
                          <div
                            key={idx}
                            className="p-4 flex gap-4 items-center justify-between flex-row-reverse text-right"
                          >
                            <div className="flex gap-3 items-center flex-row-reverse text-right">
                              <img
                                src={itemImage}
                                alt={item.productName}
                                className="w-11 h-14 rounded-lg object-cover border border-gray-100"
                              />
                              <div className="text-right">
                                <h5 className="font-bold text-gray-900 text-right">
                                  {item.productName}
                                </h5>
                                <p className="text-gray-400 text-[10px] mt-1 space-x-2 space-x-reverse text-right font-sans">
                                  <span>
                                    اللون:{" "}
                                    <span className="text-gray-700 font-semibold">
                                      {item.color}
                                    </span>
                                  </span>
                                  <span>•</span>
                                  <span>
                                    المقاس:{" "}
                                    <span className="text-gray-700 font-semibold">
                                      {item.size}
                                    </span>
                                  </span>
                                  <span>•</span>
                                  <span>
                                    الكمية:{" "}
                                    <span className="text-gray-700 font-bold">
                                      {item.quantity}
                                    </span>
                                  </span>
                                </p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-gray-950 text-right">
                              {(item.price * item.quantity).toLocaleString()}{" "}
                              {trackedOrder.currency}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-fade-in text-right">
                  {/* Search Title */}
                  <div className="text-center py-6 border-b border-gray-100 space-y-2 text-right">
                    <div className="inline-flex w-12 h-12 rounded-full bg-[#FAFAF7] border border-gray-150 items-center justify-center text-gray-400 mb-1 mx-auto">
                      <Search size={20} />
                    </div>
                    <h3 className="font-serif text-2xl font-light text-[#0B0B0B] text-center">
                      تتبع الأناقة ومسار شحنتكِ الملكية
                    </h3>
                    <p className="text-xs text-gray-400 font-sans max-w-md mx-auto leading-relaxed text-center">
                      أدخلي كود تتبع طلبيتكِ الخاص (مثال: SUL-...) أو رقم الجوال المسجل لمتابعة حالة التغليف الحريري، الكي الفاخر، وموقع المندوب الجغرافي الفوري.
                    </p>
                  </div>

                  {/* Input form */}
                  <div className="max-w-md mx-auto bg-[#FAFAF7] p-6 rounded-3xl border border-gray-150 text-right">
                    <form
                      onSubmit={handleTrackSubmit}
                      className="space-y-4 text-right"
                    >
                      <div className="text-right">
                        <label className="text-[11px] font-sans font-bold text-gray-500 block mb-1.5 text-right">
                          رقم تتبع الطلب أو رقم الجوال:
                        </label>
                        <div className="relative font-sans text-right">
                          <input
                            type="text"
                            placeholder="اكتب رقم الطلبية الملكية الخاص بكِ..."
                            value={trackingIdInput}
                            onChange={(e) => setTrackingIdInput(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl pl-3 pr-10 py-2.5 bg-white text-right font-sans text-xs focus:ring-1 focus:ring-[#F4B6C2] focus:outline-none"
                          />
                          <div className="absolute top-3.5 right-3.5 text-gray-400">
                            <Search size={16} />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#0B0B0B] text-[#F6E7A6] hover:bg-zinc-800 py-2.5 rounded-xl transition-colors cursor-pointer text-xs font-bold font-sans shadow-xs text-center"
                      >
                        تتبع جودة وحالة التوصيل للطلبية الفاخرة
                      </button>
                    </form>
                  </div>

                  {/* Linked orders helper search */}
                  <div className="space-y-4 max-w-2xl mx-auto pt-4 text-right">
                    <h4 className="font-serif text-sm font-semibold text-gray-900 border-r-2 border-[#DF8A9C] pr-2 pb-0.5 text-right">
                      طلبياتكِ الملكية المسجلة:
                    </h4>

                    {orders.length === 0 ? (
                      <div className="text-center p-6 bg-amber-50/40 border border-amber-100 rounded-2xl text-xs space-y-2 text-right">
                        <p className="text-center text-amber-900 font-bold font-sans">
                          لم تقومي بتسجيل أي طلب مسجل تحت بريدك الإلكتروني حالياً.
                        </p>
                        <p className="text-center text-gray-500 font-sans max-w-md mx-auto leading-relaxed text-[11px]">
                          ولكن لراحتكِ، يمكنكِ تجربة نظام التتبع التفاعلي فوراً بكتابة أي كود طلب تجريبي في الحقل أعلاه (مثال: <span className="font-bold underline text-[#DF8A9C]">SUL-PREMIUM</span>) لمشاهدة المخطط التفاعلي وسفير التوصيل مع محادثة كابتن سفيان بالذكاء الاصطناعي!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5 text-right font-sans">
                        <p className="text-[10px] text-gray-400 font-sans leading-relaxed text-right">
                          لراحتك وتسهيل التتبع المباشر، إليكِ قائمة طلبياتكِ الحية. اضغطي على تتبع لمشاهدة مسار المندوب بالدقيقة والثانية:
                        </p>

                        {orders.map((o) => (
                          <div
                            key={o.id}
                            className="border border-gray-150 hover:border-gray-300 rounded-2xl bg-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all text-right shrink-0"
                          >
                            <div className="flex gap-3 text-right flex-row-reverse w-full sm:w-auto items-center">
                              <div className="w-8 h-8 rounded-full bg-[#FAFAF7] border border-gray-100 flex items-center justify-center text-gray-500 font-mono text-[9px] font-bold">
                                Z
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-gray-950 block text-[11px] font-mono">
                                  {o.id}
                                </span>
                                <span className="text-[10px] text-gray-400 block font-sans">
                                  التاريخ: {o.date} • المبلغ:{" "}
                                  {o.totalPrice.toLocaleString()} {o.currency}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setTrackedOrder(o);
                                setActiveStepTab(o.status);
                              }}
                              className="text-xs bg-[#0B0B0B] text-white hover:bg-[#F4B6C2] px-4 py-2 rounded-xl scale-97 hover:scale-100 transition-all font-sans font-medium hover:text-white cursor-pointer w-full sm:w-auto text-center"
                            >
                              تتبع حالة الشحن الملكي🌸
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Dynamic Review Submission Modal Overlay */}
      {selectedReviewItem && (
        <div
          className="fixed inset-0 bg-[#0B0B0B]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          style={{ direction: "rtl" }}
        >
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-gray-150 shadow-2xl relative animate-scale-up text-right">
            {/* Close Button */}
            <button
              onClick={() => setSelectedReviewItem(null)}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-base w-8 h-8 rounded-full border border-gray-150 flex items-center justify-center"
            >
              ×
            </button>

            <form
              onSubmit={handleSubmitReview}
              className="space-y-4 text-right font-sans"
            >
              <div className="text-right pb-3 border-b border-gray-100">
                <span className="text-2xl">⭐</span>
                <h3 className="font-serif text-lg font-bold text-gray-950 mt-1">
                  تقييم ومراجعة القطعة الملكية
                </h3>
                <p className="text-[10px] text-gray-500 font-sans mt-0.5 leading-relaxed">
                  مشاركة تجربتكِ الرائعة تساعد صاحبات نادي SULTA الفاخر على
                  اتجاهات الموضة واختيار القطعة المثالية.
                </p>
              </div>

              <div>
                <label className="block text-gray-450 font-sans text-[10px] mb-1 text-right">
                  عنوان القطعة المراد تقييمها
                </label>
                <div className="w-full bg-[#FAFAF7] border border-gray-150 rounded-xl px-4 py-2 font-bold font-sans text-xs text-gray-800 text-right">
                  {selectedReviewItem.productName}
                </div>
              </div>

              <div>
                <label className="block text-gray-450 font-sans text-[10px] mb-1.5 text-right font-medium">
                  التقييم العام بالنجوم (1 إلى 5):
                </label>
                <div className="flex gap-2 justify-start flex-row-reverse">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl transition-all hover:scale-110 cursor-pointer ${
                        star <= reviewRating
                          ? "text-amber-400"
                          : "text-gray-250"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-450 font-sans text-[10px] mb-1 text-right">
                  اسمكِ الملكي المستعار (أو اسم العائلة)
                </label>
                <input
                  type="text"
                  placeholder="مثال: ياسمين سيوطي أو عميلة وفية"
                  value={reviewUsername}
                  onChange={(e) => setReviewUsername(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 bg-white focus:ring-1 focus:ring-[#F4B6C2] focus:outline-none text-right text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-455 font-sans text-[10px] mb-1 text-right">
                  تفاصيل المراجعة وتعليقك الموقر
                </label>
                <textarea
                  rows={3}
                  placeholder="حدثينا عن الملمس، ملاءمة المقاس والقصة على الجسد، وفخامة التغليف والعلب الخاصة..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 bg-white focus:ring-1 focus:ring-[#F4B6C2] focus:outline-none text-right text-xs resize-none leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-3 flex-row-reverse text-right">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#F4B6C2] hover:text-white px-5 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
                >
                  {submittingReview
                    ? "يجري إرسال التقييم..."
                    : "تقديم الاستبيان والتقييم"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReviewItem(null)}
                  className="bg-gray-100 hover:bg-gray-150 text-gray-500 px-4 py-2 rounded-xl text-xs font-medium font-sans cursor-pointer transition-colors"
                >
                  تجاهل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
