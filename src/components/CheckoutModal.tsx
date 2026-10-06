import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle, 
  Smartphone, 
  Truck, 
  ArrowRight, 
  ArrowLeft, 
  Gift, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Building2,
  Lock
} from 'lucide-react';
import { CartItem, Country, DiscountCoupon, Order, Settings } from '../types';
import { dbService } from '../services/db';
import { agentSystem } from '../services/agentSystem';
import { trackInitiateCheckout, trackPurchase } from '../utils/analytics';
import SultaImage from './SultaImage';

interface CheckoutModalProps {
  country: Country;
  cart: CartItem[];
  appliedCoupon: DiscountCoupon | null;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  settings?: Settings;
}

export default function CheckoutModal({
  country,
  cart,
  appliedCoupon,
  onClose,
  onOrderSuccess,
  settings,
}: CheckoutModalProps) {
  // Simplified 2-Step Salla-style Checkout: Step 1 = Shipping Info, Step 2 = Payment & Confirm
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Selected payment method (default: apple for SA)
  const [selectedPayment, setSelectedPayment] = useState<string>('apple');
  
  // Submission & copy states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [confirmViaWhatsapp, setConfirmViaWhatsapp] = useState(true);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  // Auto-redirect effect for WhatsApp on success (mobile optimized)
  useEffect(() => {
    if (successOrder && confirmViaWhatsapp) {
      const itemsList = successOrder.items.map(i => `• ${i.productName} (${i.color} - ${i.size}) × ${i.quantity}`).join('\n');
      const invoiceText = `🌸 مرحباً متجر SULTA للأزياء الملكية الفاخرة، قمت بإتمام حجز طلبيتي:\n\n` +
                   `📋 رقم الطلب: ${successOrder.id.slice(0, 18)}\n` +
                   `👤 الاسم: ${successOrder.customerName}\n` +
                   `📱 الجوال: ${successOrder.phone}\n` +
                   `📍 العنوان: ${successOrder.city} - ${successOrder.address}\n` +
                   `💳 وسيلة الدفع: ${successOrder.paymentMethod}\n` +
                   `💰 الإجمالي: ${successOrder.totalPrice.toLocaleString()} ${successOrder.currency}\n\n` +
                   `📦 تفاصيل المنتجات:\n${itemsList}\n\n` +
                   `✨ يرجى تأكيد استلام الطلب وتجهيز التغليف الملكي للشحن السريع ❤️`;
      
      const encodedText = encodeURIComponent(invoiceText);
      const targetWhatsapp = (settings?.whatsappSaudi || settings?.whatsapp || '966596894393').replace(/\D/g, '');
      const cleanWhatsapp = targetWhatsapp.startsWith('05') ? ('966' + targetWhatsapp.slice(1)) : (targetWhatsapp.startsWith('966') ? targetWhatsapp : '966596894393');
      const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodedText}`;

      // Only auto-trigger on mount of success screen
      const timer = setTimeout(() => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = whatsappUrl;
        } else {
          window.open(whatsappUrl, '_blank');
        }
      }, 1500); // Small delay for user to see the success checkmark

      return () => clearTimeout(timer);
    }
  }, [successOrder, confirmViaWhatsapp, settings]);

  const currencyLabel = 'ر.س';

  // Subtotal and Calculations
  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = item.product.priceSA;
    return sum + itemPrice * item.quantity;
  }, 0);

  // Dynamic Shipping calculation
  const getDynamicShippingCost = () => {
    if (!settings) return 30;
    const userCity = city.trim().toLowerCase();
    
    if (userCity && settings.shippingRates && settings.shippingRates.length > 0) {
      const match = settings.shippingRates.find(rate => {
        const ar = rate.regionAr.toLowerCase();
        const en = rate.regionEn.toLowerCase();
        return userCity.includes(ar) || ar.includes(userCity) ||
               userCity.includes(en) || en.includes(userCity);
      });
      if (match) return match.fee;
    }
    
    if (settings.defaultShippingFee !== undefined && settings.defaultShippingFee !== null && settings.defaultShippingFee > 0) {
      return settings.defaultShippingFee;
    }
    
    return 30;
  };

  const shippingCost = getDynamicShippingCost();
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost);

  // Official Saudi Bank Account Details (Enjaz / Bank AlJazira)
  const saudiBankAccount = {
    bankName: 'بنك الجزيرة / إنجاز (Bank AlJazira - Enjaz)',
    accountNumber: '4550 1704 0413 3727',
    accountName: 'متجر سُلطة للأزياء الفاخرة (SULTA Boutique)',
    country: 'المملكة العربية السعودية 🇸🇦'
  };

  // Country specific payment gateways restricted strictly to Apple Pay, COD, and Bank Transfer
  const activePayments = [
    { 
      id: 'apple', 
      name: 'Apple Pay (أبل باي)', 
      subtitle: 'الدفع الفوري السريع بنقرة واحدة عبر بطاقتك البنكية المعتمدة',
      badge: 'الأسرع ⚡',
      icon: <span className="font-sans font-bold text-sm">Pay</span> 
    },
    { 
      id: 'cod', 
      name: 'الدفع عند الاستلام (Cash on Delivery)', 
      subtitle: 'السداد نقداً لمندوب التوصيل فور استلام ومعاينة طلبيتكِ الفاخرة',
      badge: 'معاينة قبل الدفع 📦',
      icon: <Truck size={18} className="text-emerald-700" /> 
    },
    { 
      id: 'bank_transfer', 
      name: 'تحويل بنكي مباشر (بنك الجزيرة / إنجاز)', 
      subtitle: 'التحويل المباشر لحساب المتجر الرسمي المعتمد برقم البطاقة',
      badge: 'حساب موثق 🏛️',
      icon: <Building2 size={18} className="text-[#A44C5C]" /> 
    },
  ];

  const handleCopyBank = () => {
    try {
      navigator.clipboard.writeText(saudiBankAccount.accountNumber.replace(/\s/g, ''));
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 3000);
    } catch {
      setCopiedBank(true);
    }
  };

  // Validation handlers per step
  const handleProceedToPayment = () => {
    setErrorMsg('');
    if (!name.trim()) return setErrorMsg('الرجاء إدخال اسم المستلمة بالكامل.');
    if (!phone.trim()) return setErrorMsg('الرجاء كتابة رقم الجوال للتواصل والواتساب.');
    if (!city.trim()) return setErrorMsg('الرجاء كتابة اسم المدينة (مثال: الرياض، جدة، الدمام).');
    if (!address.trim()) return setErrorMsg('الرجاء كتابة الحي والشارع لتسهيل وصول المندوب.');

    try {
      trackInitiateCheckout(cart, totalAmount, country === 'EG' ? 'EGP' : 'SAR');
    } catch (e) {
      console.warn("InitiateCheckout pixel tracking error:", e);
    }

    setStep(2);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (selectedPayment === 'apple') {
        // Biometric/token simulation delay for Apple Pay
        await new Promise(r => setTimeout(r, 1000));
      }

      const generatedCode = `SULTA-${Math.floor(100000 + Math.random() * 900000)}`;
      const newUuid = crypto.randomUUID();
      
      const newOrder: Order = {
        id: newUuid,
        trackingNumber: generatedCode,
        customerName: name,
        phone: phone,
        country: country,
        city: city,
        address: address,
        notes: selectedPayment === 'bank_transfer' ? 'طلب تحويل بنكي على حساب بنك الجزيرة / إنجاز 4550 1704 0413 3727' : undefined,
        shippingFee: shippingCost,
        items: cart.map(item => {
          const itemPrice = country === 'EG' ? item.product.priceEG : item.product.priceSA;
          return {
            productId: item.product.id,
            productName: item.product.nameAr,
            color: item.selectedColor?.name || 'افتراضي',
            size: item.selectedSize,
            quantity: item.quantity,
            price: itemPrice
          };
        }),
        totalPrice: totalAmount,
        currency: country === 'EG' ? 'EGP' : 'SAR',
        paymentMethod: selectedPayment === 'apple'
          ? 'Apple Pay (مدفوع إلكترونياً Pay)'
          : (activePayments.find(p => p.id === selectedPayment)?.name || 'الدفع عند الاستلام'),
        status: selectedPayment === 'apple' ? 'confirmed' : 'pending',
        date: new Date().toISOString().split('T')[0]
      };

      await dbService.saveOrder(newOrder);

      // Trigger Pixel Purchase Tracking immediately for all connected ad networks
      try {
        trackPurchase(newOrder);
      } catch (err) {
        console.warn("Purchase pixel tracking error:", err);
      }
      
      // Trigger SULTA Agent System automation
      try {
        await agentSystem.onOrderCreated(newOrder);
      } catch (err) {
        console.warn("Agent automation background error:", err);
      }

      setSuccessOrder(newOrder);
    } catch (err) {
      console.error("Order submission critical error:", err);
      setErrorMsg('تعذر تسجيل الطلب، يرجى التحقق من الاتصال والمحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (successOrder) {
    const itemsList = successOrder.items.map(i => `• ${i.productName} (${i.color} - ${i.size}) × ${i.quantity}`).join('\n');
    const invoiceText = `🌸 مرحباً متجر SULTA للأزياء الملكية الفاخرة، قمت بإتمام حجز طلبيتي:\n\n` +
                 `📋 رقم الطلب: ${successOrder.id.slice(0, 18)}\n` +
                 `👤 الاسم: ${successOrder.customerName}\n` +
                 `📱 الجوال: ${successOrder.phone}\n` +
                 `📍 العنوان: ${successOrder.city} - ${successOrder.address}\n` +
                 `💳 وسيلة الدفع: ${successOrder.paymentMethod}\n` +
                 `💰 الإجمالي: ${successOrder.totalPrice.toLocaleString()} ${successOrder.currency}\n\n` +
                 `📦 تفاصيل المنتجات:\n${itemsList}\n\n` +
                 `✨ يرجى تأكيد استلام الطلب وتجهيز التغليف الملكي للشحن السريع ❤️`;
    
    const encodedText = encodeURIComponent(invoiceText);
    const targetWhatsapp = (settings?.whatsappSaudi || settings?.whatsapp || '966596894393').replace(/\D/g, '');
    const cleanWhatsapp = targetWhatsapp.startsWith('05') ? ('966' + targetWhatsapp.slice(1)) : (targetWhatsapp.startsWith('966') ? targetWhatsapp : '966596894393');
    const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodedText}`;

    const handleSendWhatsApp = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank');
      }
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" dir="rtl">
        <div className="fixed inset-0 bg-[#0B0B0B]/75 backdrop-blur-xs transition-opacity" onClick={() => onOrderSuccess(successOrder)} />

        <div className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 z-35 animate-scale-up border border-gray-200 text-center select-none font-sans">
          
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
            <CheckCircle size={36} />
          </div>

          <span className="text-[10px] font-bold text-[#A44C5C] tracking-widest uppercase block mb-1">
            SULTA ATELIER • تم حجز طلبكِ بنجاح
          </span>
          
          <h3 className="text-xl sm:text-2xl font-black text-gray-950 mb-2">
            تهانينا! تم تسجيل طلبكِ بنجاح 👑
          </h3>
          
          <p className="text-gray-600 text-xs max-w-md mx-auto leading-relaxed mb-5">
            شكراً لثقتكِ بـ SULTA. يتم الآن تجهيز طلبيتكِ بعناية وتغليفها الفاخر للشحن السريع.
          </p>

          {/* Invoice Summary Box */}
          <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-4 mb-5 text-right text-xs space-y-2.5">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">رقم الطلب:</span>
              <span className="font-bold text-gray-950 font-mono">{successOrder.id.slice(0, 18)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">المستلمة:</span>
              <span className="font-bold text-gray-950">{successOrder.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">العنوان:</span>
              <span className="font-bold text-gray-950">{successOrder.city} - {successOrder.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">وسيلة الدفع:</span>
              <span className="font-bold text-emerald-800">{successOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-black text-gray-950">
              <span>الإجمالي النهائي:</span>
              <span>{successOrder.totalPrice.toLocaleString()} {successOrder.currency}</span>
            </div>
          </div>

          {/* WhatsApp Action & Notification Banner */}
          <div className="mb-4 text-right">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs sm:text-sm font-black py-3.5 sm:py-4 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Send size={18} />
              <span>📱 إرسال الفاتورة وتأكيد الطلب فوراً عبر واتساب المتجر الملكي</span>
            </a>
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-gray-500">
              <span className="font-mono" dir="ltr">WhatsApp: +{cleanWhatsapp}</span>
              <span className="text-emerald-700 font-bold">
                {confirmViaWhatsapp ? '✓ خيار الواتساب مفعل' : 'تأكيد فوري متاح'}
              </span>
            </div>
          </div>

          {/* Bank Transfer Notification Card (if bank transfer chosen) */}
          {successOrder.paymentMethod.includes('بنك الجزيرة') && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 mb-5 text-right text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <Building2 size={16} />
                <span>بيانات التحويل البنكي المباشر:</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                يرجى تحويل مبلغ <strong className="font-bold font-mono">{successOrder.totalPrice.toLocaleString()} ر.س</strong> إلى حساب بنك الجزيرة:
              </p>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between font-mono font-bold text-sm">
                <span>{saudiBankAccount.accountNumber}</span>
                <span className="text-[10px] text-gray-500 font-sans">بنك الجزيرة 🇸🇦</span>
              </div>
              <p className="text-[10px] text-amber-700">ثم إرسال إشعار أو لقطة شاشة التحويل للواتساب لتأكيد الشحن فوراً.</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-center">
            <button
              onClick={handleSendWhatsApp}
              className="w-full sm:flex-1 bg-gray-900 hover:bg-black text-white text-xs font-bold py-3.5 px-4 rounded-xl cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Send size={14} />
              <span>فتح المحادثة مجدداً 💬</span>
            </button>
            <button
              onClick={() => {
                const invoiceSummary = `رقم الطلب: ${successOrder.id}\nالاسم: ${successOrder.customerName}\nالعنوان: ${successOrder.city} - ${successOrder.address}\nالإجمالي: ${successOrder.totalPrice} ر.س`;
                navigator.clipboard.writeText(invoiceSummary);
                setCopiedInvoice(true);
                setTimeout(() => setCopiedInvoice(false), 3000);
              }}
              className="w-full sm:w-auto border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold py-3.5 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              {copiedInvoice ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedInvoice ? 'تم النسخ ✓' : 'نسخ الفاتورة'}</span>
            </button>
            <button
              onClick={() => onOrderSuccess(successOrder)}
              className="w-full sm:w-auto border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold py-3.5 px-5 rounded-xl cursor-pointer transition-all"
            >
              العودة للمتجر
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN CHECKOUT MODAL
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh] z-30 border border-gray-200 font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 left-4 z-40 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 p-2 rounded-full border border-gray-200 transition-all cursor-pointer"
          title="إغلاق"
        >
          <X size={16} />
        </button>

        {/* Right Section: 2-Step Form */}
        <div className="md:w-3/5 p-5 sm:p-7 overflow-y-auto flex flex-col justify-between">
          
          <div>
            {/* Header Stage Tracker */}
            <div className="mb-5 pb-3 border-b border-gray-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#A44C5C] uppercase tracking-wider">
                  إتمام الطلب السريع • الخطوة {step} من 2
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {step === 1 ? '50%' : '100%'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-950">
                {step === 1 ? 'بيانات التوصيل والشحن 🚚' : 'طريقة الدفع وتأكيد الحجز 💳'}
              </h3>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-[#111827] h-full transition-all duration-300 rounded-full" 
                  style={{ width: step === 1 ? '50%' : '100%' }}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 mb-4 text-right">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* STEP 1: SHIPPING & CONTACT INFO */}
            {step === 1 && (
              <div className="space-y-3.5 text-right">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    اسم المستلمة بالكامل *
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: نورة محمد العتيبي"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:border-[#111827] focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    رقم الجوال للتوصيل والواتساب *
                  </label>
                  <input
                    type="tel"
                    placeholder={country === 'SA' ? '05xxxxxxxx' : '01xxxxxxxxx'}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:border-[#111827] focus:outline-none transition-all font-mono text-left"
                    dir="ltr"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      المدينة *
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: الرياض، جدة، الدمام"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:border-[#111827] focus:outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      الحي والشارع *
                    </label>
                    <input
                      type="text"
                      placeholder="اسم الحي، رقم المبنى"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:border-[#111827] focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Salla Trust Note */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 mt-2 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                  <p className="text-[11px] text-emerald-900 leading-snug">
                    تغليف فاخر مجاني مع كل طلب + شحن سريع وتوصيل آمن لباب بيتك.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: PAYMENT METHOD & REVIEW */}
            {step === 2 && (
              <div className="space-y-4 text-right animate-fade-in">
                <p className="text-xs text-gray-600 mb-2">
                  اختاري وسيلة الدفع المفضلة لديكِ:
                </p>

                <div className="space-y-2.5">
                  {activePayments.map((p: any) => {
                    const active = selectedPayment === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPayment(p.id)}
                        className={`w-full text-right p-3 rounded-2xl transition-all border cursor-pointer ${
                          active
                            ? 'border-gray-950 bg-gray-50/80 shadow-xs ring-1 ring-gray-950'
                            : 'border-gray-200 bg-white hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
                              {p.icon}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-gray-950">{p.name}</span>
                                {p.badge && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    {p.badge}
                                  </span>
                                )}
                              </div>
                              {p.subtitle && (
                                <p className="text-[10px] text-gray-500 mt-0.5">{p.subtitle}</p>
                              )}
                            </div>
                          </div>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-gray-950' : 'border-gray-300'}`}>
                            {active && <span className="w-2 h-2 bg-gray-950 rounded-full" />}
                          </span>
                        </div>

                        {/* SPECIAL EXPANDED VIEW: APPLE PAY */}
                        {active && p.id === 'apple' && (
                          <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                            <div className="bg-black text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
                              <span className="text-base font-sans"></span>
                              <span>الدفع السريع المعتمد بواسطة Apple Pay</span>
                            </div>
                            <span className="text-[10px] text-gray-500 block mt-1">
                              مؤمن ومربوط مع بوابة الدفع للتاجر السعودي
                            </span>
                          </div>
                        )}

                        {/* SPECIAL EXPANDED VIEW: CASH ON DELIVERY */}
                        {active && p.id === "cod" && (
                          <div className="mt-3 pt-3 border-t border-gray-200 text-right">
                            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                              <span className="font-bold text-emerald-950 block">✓ ميزة المعاينة قبل السداد:</span>
                              <p className="text-[11px] text-emerald-900 leading-relaxed">
                                استلمي طلبيتكِ مفحوصة ومغلفة بالكرتون الملكي، وقومي بسداد المبلغ ({totalAmount.toLocaleString()} {currencyLabel}) نقداً للمندوب عند باب المنزل.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* SPECIAL EXPANDED VIEW: SAUDI BANK TRANSFER */}
                        {active && p.id === 'bank_transfer' && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                            <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 space-y-2 text-xs">
                              <div className="flex items-center justify-between text-emerald-950 font-bold">
                                <span>حساب المتجر في بنك الجزيرة:</span>
                                <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">حساب سعودي رسمي</span>
                              </div>
                              
                              <div className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
                                <div className="text-right">
                                  <span className="text-[10px] text-gray-400 block">رقم الحساب / البطاقة:</span>
                                  <span className="font-mono font-bold text-xs text-gray-950" dir="ltr">
                                    {saudiBankAccount.accountNumber}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyBank();
                                  }}
                                  className="bg-gray-100 hover:bg-emerald-100 text-gray-800 text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-all border border-gray-200"
                                >
                                  {copiedBank ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                  <span>{copiedBank ? 'تم النسخ ✓' : 'نسخ الرقم'}</span>
                                </button>
                              </div>

                              <div className="text-[10px] text-gray-600 space-y-0.5 pt-1">
                                <p><strong>اسم البنك:</strong> {saudiBankAccount.bankName}</p>
                                <p><strong>اسم المستفيد:</strong> {saudiBankAccount.accountName}</p>
                                <p className="text-emerald-800 font-semibold pt-1">
                                  ✓ فور التحويل، يتم إرسال إشعار السداد لواتساب المتجر لتأكيد شحن طلبكِ مباشرة.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Option to confirm order via WhatsApp */}
                <div 
                  onClick={() => setConfirmViaWhatsapp(!confirmViaWhatsapp)} 
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all flex-row-reverse text-right text-xs ${
                    confirmViaWhatsapp ? 'bg-emerald-50/50 border-emerald-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    confirmViaWhatsapp ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white'
                  }`}>
                    {confirmViaWhatsapp && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 block">إرسال تفاصيل الفاتورة إلى واتساب مباشرة 📱</span>
                    <span className="text-[10px] text-gray-500">لتسريع التوصيل ومتابعة الشحنة خطوة بخطوة</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-5 border-t border-gray-150 mt-5 flex items-center justify-between gap-3">
            {step === 1 ? (
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full bg-[#111827] hover:bg-[#A44C5C] text-white py-3 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <span>الانتقال لاختيار طريقة الدفع</span>
                <ArrowLeft size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-gray-200 text-gray-700 hover:bg-gray-100 py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <ArrowRight size={14} />
                  <span>تعديل العنوان</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className={`flex-1 text-white py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-98 ${
                    selectedPayment === 'apple' 
                      ? 'bg-black hover:bg-gray-900 ring-2 ring-black/10' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{selectedPayment === 'apple' ? 'جاري الدفع بـ Apple Pay...' : 'جاري تأكيد حجز الطلب...'}</span>
                    </>
                  ) : selectedPayment === 'apple' ? (
                    <>
                      <span className="text-base font-sans font-bold">Pay</span>
                      <span>سداد فوري عبر Apple Pay ({totalAmount.toLocaleString()} {currencyLabel})</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>تأكيد الطلب الآن ({totalAmount.toLocaleString()} {currencyLabel})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Left Section: Order Summary (Salla Clean White Style) */}
        <div className="md:w-2/5 p-5 sm:p-7 bg-[#F8F9FA] border-t md:border-t-0 md:border-r border-gray-200 flex flex-col justify-between overflow-y-auto">
          
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
              <span className="font-bold text-xs text-gray-900">ملخص الطلب ({cart.length} قطع)</span>
              <Gift size={16} className="text-[#A44C5C]" />
            </div>

            {/* Cart products list */}
            <div className="space-y-2.5 mb-5 max-h-48 overflow-y-auto text-xs text-right pr-1">
              {cart.map((item, idx) => {
                const itemPrice = country === 'EG' ? item.product.priceEG : item.product.priceSA;
                return (
                  <div key={idx} className="flex gap-2.5 items-center justify-between bg-white p-2 rounded-xl border border-gray-200">
                    <div className="w-9 h-11 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <SultaImage 
                        src={item.product.images[0]} 
                        alt={item.product.nameAr} 
                        className="w-full h-full" 
                        imgClassName="object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-right pr-1">
                      <span className="font-bold text-gray-900 line-clamp-1 text-[11px]">{item.product.nameAr}</span>
                      <span className="text-[10px] text-gray-500 block font-mono">
                        {item.selectedSize} • {item.quantity}×
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-950 font-mono shrink-0">
                      {(itemPrice * item.quantity).toLocaleString()} {currencyLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center text-gray-600">
                <span>المجموع الفرعي:</span>
                <span className="font-bold font-mono text-gray-900">{subtotal.toLocaleString()} {currencyLabel}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 text-[11px]">
                  <span>خصم الكوبون ({appliedCoupon.discountPercent}%):</span>
                  <span className="font-bold font-mono">- {discountAmount.toLocaleString()} {currencyLabel}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-gray-600">
                <span>الشحن والتوصيل:</span>
                <span className="font-bold font-mono text-emerald-700">
                  {shippingCost === 0 ? 'مجاني 🇸🇦' : `${shippingCost.toLocaleString()} ${currencyLabel}`}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>التغليف الفاخر الملوكي:</span>
                <span className="font-bold text-emerald-700">مجاناً 🎁</span>
              </div>

              <div className="flex justify-between items-center text-gray-950 text-sm font-black pt-2 border-t border-gray-200">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono text-base">{totalAmount.toLocaleString()} {currencyLabel}</span>
              </div>
            </div>
          </div>

          {/* Trust seal bottom note */}
          <div className="pt-4 mt-4 border-t border-gray-200 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
              <Lock size={12} className="text-emerald-700" />
              <span>دفع مشفر 100% وحماية كاملة لبيانات العميل</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
