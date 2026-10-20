import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle, 
  Truck, 
  ArrowRight, 
  ArrowLeft, 
  Gift, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Lock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Globe,
  PackageSearch
} from 'lucide-react';
import { CartItem, Country, DiscountCoupon, Order, Settings } from '../types';
import { WhatsAppService } from '../services/whatsappService';
import { agentSystem } from '../services/agentSystem';
import { trackInitiateCheckout, trackPurchase } from '../utils/analytics';
import SultaImage from './SultaImage';
import { 
  paymentService, 
  PaymentMethodType, 
  PaymentGatewayStatus,
  isPaymobConfigured
} from '../payment';

interface CheckoutModalProps {
  country: Country;
  cart: CartItem[];
  appliedCoupon: DiscountCoupon | null;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  onTrackOrder?: (orderId: string) => void;
  settings?: Settings;
}

export default function CheckoutModal({
  country,
  cart,
  appliedCoupon,
  onClose,
  onOrderSuccess,
  onTrackOrder,
  settings,
}: CheckoutModalProps) {
  // Step 1: Shipping and Contact Details, Step 2: Payment Selection and Processing
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields State (Saudi Specific)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);

  // Selected Payment Method: 'cod' | 'bank_transfer'
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodType>('cod');

  // Processing & Verification States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentGatewayStatus | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [iframePaymentUrl, setIframePaymentUrl] = useState<string | null>(null);

  const currencyLabel = country === 'EG' ? 'ج.م' : 'ر.س';

  // Check device capabilities on mount
  useEffect(() => {
    // Check if device supports specific features if needed
  }, []);

  // Subtotal and Calculations (99 SAR after discount)
  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = country === 'EG' 
      ? (item.product.salePriceEG || item.product.priceEG) 
      : (item.product.salePriceSA || (item.product.priceSA <= 120 ? item.product.priceSA : 99));
    return sum + itemPrice * item.quantity;
  }, 0);

  // Dynamic Shipping calculation:
  // Free shipping for orders >= 800 SAR (Saudi) or 1500 EGP (Egypt).
  const getDynamicShippingCost = () => {
    const freeThreshold = country === 'SA' ? 800 : 1500;
    const standardFee = country === 'SA' ? 40 : 75;

    if (subtotal >= freeThreshold) return 0;

    // Check if there are city-specific rates in settings (mostly for EG if added, or special SA regions)
    if (settings && settings.shippingRates && settings.shippingRates.length > 0) {
      const userCity = city.trim().toLowerCase();
      if (userCity) {
        const match = settings.shippingRates.find(rate => {
          const ar = rate.regionAr.toLowerCase();
          const en = rate.regionEn.toLowerCase();
          return userCity.includes(ar) || ar.includes(userCity) ||
                 userCity.includes(en) || en.includes(userCity);
        });
        if (match) return match.fee;
      }
    }
    
    // Default to unified standard fee
    return standardFee;
  };

  const shippingCost = getDynamicShippingCost();
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost);

  // Saudi Mobile Phone Validator: accepts 05xxxxxxxx or +9665xxxxxxxx
  const validateSaudiPhone = (inputPhone: string): boolean => {
    const cleanPhone = inputPhone.replace(/[\s-]/g, '');
    const saudiRegex = /^(?:\+?966|0)?5[0-9]{8}$/;
    return saudiRegex.test(cleanPhone);
  };

  // Formats phone to normalized Saudi standard (+9665XXXXXXXX)
  const formatSaudiPhone = (inputPhone: string): string => {
    const digits = inputPhone.replace(/\D/g, '');
    if (digits.startsWith('9665') && digits.length === 12) return `+${digits}`;
    if (digits.startsWith('05') && digits.length === 10) return `+966${digits.slice(1)}`;
    if (digits.startsWith('5') && digits.length === 9) return `+966${digits}`;
    return inputPhone.trim();
  };

  // Step 1 Validation Handler
  const handleProceedToPayment = () => {
    setErrorMsg('');
    if (!name.trim()) {
      return setErrorMsg('الرجاء إدخال اسم المستلمة بالكامل.');
    }
    if (!phone.trim()) {
      return setErrorMsg('الرجاء إدخال رقم الجوال السعودي للتواصل والشحن.');
    }
    if (!validateSaudiPhone(phone)) {
      return setErrorMsg('الرجاء كتابة رقم جوال سعودي صحيح يبدأ بـ 05 أو 9665+ (مثال: 0552823677).');
    }
    if (!city.trim()) {
      return setErrorMsg('الرجاء تحديد المدينة في المملكة العربية السعودية (مثال: الرياض، جدة، الدمام).');
    }
    if (!address.trim()) {
      return setErrorMsg('الرجاء كتابة الحي واسم الشارع لتسهيل وصول المندوب لباب منزلك.');
    }

    try {
      trackInitiateCheckout(cart, totalAmount, 'SAR');
    } catch (e) {
      console.warn("InitiateCheckout tracking notice:", e);
    }

    setStep(2);
  };

  // Step 2 Submission Handler
  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const normalizedPhone = formatSaudiPhone(phone);
    const orderParams = {
      customer: {
        name: name.trim(),
        phone: normalizedPhone,
        city: city.trim(),
        address: address.trim(),
        email: `${normalizedPhone.replace(/\D/g, '')}@sulta.sa`
      },
      country,
      cart,
      shippingFee: shippingCost,
      totalPrice: totalAmount,
      paymentMethodType: selectedPayment,
      couponCode: appliedCoupon?.code,
      whatsappOptIn
    };

    try {
      // 1. CASH ON DELIVERY (COD)
      if (selectedPayment === 'cod') {
        const { order } = await paymentService.processCashOnDelivery(orderParams);
        setActiveOrder(order);
        setPaymentStatus('cod');

        // Analytics tracking
        try { trackPurchase(order); } catch (e) {}
        try { await agentSystem.onOrderCreated(order); } catch (e) {}

        // WhatsApp invoice notification
        try {
          WhatsAppService.sendInvoice(order, order.phone);
        } catch (e) {}

        return;
      }

      // 2. DIRECT BANK TRANSFER
      if (selectedPayment === 'bank_transfer') {
        const { order, paymentIntent } = await paymentService.initiateElectronicPayment(
          orderParams,
          'bank_transfer'
        );

        setActiveOrder(order);

        if (!paymentIntent.success) {
          setPaymentStatus('failed');
          setErrorMsg(paymentIntent.errorMessage || 'لم يتم تسجيل الطلب. يرجى المحاولة مرة أخرى.');
          return;
        }

        // Track order and notify systems
        try { trackPurchase(order); } catch (e) {}
        try { await agentSystem.onOrderCreated(order); } catch (e) {}
        try { WhatsAppService.sendInvoice(order, order.phone); } catch (e) {}

        setPaymentStatus('pending');
        return;
      }

    } catch (err: any) {
      console.error("Order processing error:", err);
      setPaymentStatus('failed');
      setErrorMsg('لم تكتمل عملية الدفع. حاول مرة أخرى أو اختر طريقة دفع أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS / CONFIRMATION SCREEN
  if (activeOrder && (paymentStatus === 'cod' || paymentStatus === 'paid' || paymentStatus === 'pending')) {
    const isCod = paymentStatus === 'cod';
    const isPending = paymentStatus === 'pending';
    const targetWhatsapp = (settings?.whatsappSaudi || settings?.whatsapp || '966552823677').replace(/\D/g, '');
    const cleanWhatsapp = targetWhatsapp.startsWith('05') 
      ? ('966' + targetWhatsapp.slice(1)) 
      : (targetWhatsapp.startsWith('966') ? targetWhatsapp : '966552823677');

    const handleCopyInvoice = () => {
      let summary = `رقم الطلب: ${activeOrder.trackingNumber || activeOrder.id}\nالاسم: ${activeOrder.customerName}\nالجوال: ${activeOrder.phone}\nالمدينة: ${activeOrder.city}\nالإجمالي: ${activeOrder.totalPrice.toLocaleString()} ر.س\nوسيلة الدفع: ${activeOrder.paymentMethod}`;
      if (activeOrder.paymentMethod && activeOrder.paymentMethod.includes('بنكي')) {
        summary += `\n\nبيانات التحويل البنكي:\nمصرف الراجحي - مؤسسة سُلطة للأزياء\nالآيبان: SA82 8000 0000 1234 5678 9012\n* فضلاً أرسلي صورة إشعار التحويل لتأكيد الشحن فوراً 📸`;
      }
      navigator.clipboard.writeText(summary);
      setCopiedInvoice(true);
      setTimeout(() => setCopiedInvoice(false), 3000);
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4" dir="rtl">
        <div className="fixed inset-0 bg-[#A44C5C]/80 backdrop-blur-xs transition-opacity" onClick={() => onOrderSuccess(activeOrder)} />

        <div className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 z-30 border border-gray-200 text-center select-none font-sans animate-scale-up">
          
          {/* Header Icon */}
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
            <CheckCircle size={36} />
          </div>

          <span className="text-[11px] font-bold text-[#A44C5C] tracking-widest uppercase block mb-1">
            SULTA ATELIER 🇸🇦 المملكة العربية السعودية
          </span>
          
          <h3 className="text-xl sm:text-2xl font-black text-gray-950 mb-2">
            {isCod ? 'تم استلام طلبكِ بنجاح 📦' : 'طلبكِ بانتظار إشعار التحويل البنكي 🕒'}
          </h3>
          
          <p className="text-gray-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed mb-6 font-medium">
            {isCod 
              ? 'تم استلام طلبكِ بنجاح وسيتم التواصل معكِ لتأكيد الطلب وشحنه لباب منزلكِ مع ميزة الدفع عند الاستلام.'
              : 'تم تسجيل حجز طلبكِ بنجاح! فضلاً حولي المبلغ على الحساب البنكي أدناه وأرسلي صورة إشعار التحويل عبر الواتساب لتأكيد الشحن فوراً 📸.'}
          </p>

          {/* Invoice Summary Box */}
          <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-4 sm:p-5 mb-4 text-right text-xs space-y-2.5">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-medium">رقم التتبع والطلب:</span>
              <span className="font-bold text-gray-950 font-mono text-sm">{activeOrder.trackingNumber || activeOrder.id.slice(0, 16)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">اسم المستلمة:</span>
              <span className="font-bold text-gray-950">{activeOrder.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الجوال:</span>
              <span className="font-bold text-gray-950 font-mono" dir="ltr">{activeOrder.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">العنوان:</span>
              <span className="font-bold text-gray-950">{activeOrder.city} - {activeOrder.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">طريقة الدفع:</span>
              <span className="font-bold text-emerald-800">{activeOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">حالة الطلب:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${isCod ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'}`}>
                {isCod ? 'بانتظار المعاينة والتأكيد (COD)' : 'بانتظار إشعار التحويل البنكي'}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-black text-gray-950">
              <span>الإجمالي النهائي المطلوب:</span>
              <span className="font-mono text-base">{activeOrder.totalPrice.toLocaleString()} {currencyLabel}</span>
            </div>
          </div>

          {/* Bank Account Details Card for Bank Transfer */}
          {(isPending || (activeOrder.paymentMethod && activeOrder.paymentMethod.includes('بنكي'))) && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 mb-6 text-right text-xs space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <span className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                  <span>🏦 بيانات الحساب البنكي لإتمام التحويل:</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  مصرف الراجحي
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">اسم المستفيد:</span>
                <span className="font-bold text-gray-950">مؤسسة سُلطة للأزياء</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">رقم الآيبان (IBAN):</span>
                <span className="font-bold font-mono text-gray-950 select-all bg-white px-2 py-0.5 rounded border border-gray-300">
                  SA82 8000 0000 1234 5678 9012
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-blue-200/60 pt-2 font-bold text-blue-950">
                <span>المبلغ المطلوب تحويله:</span>
                <span className="font-mono text-sm">{activeOrder.totalPrice.toLocaleString()} {currencyLabel}</span>
              </div>
              <p className="text-[10px] text-blue-900 font-bold bg-white/80 p-2.5 rounded-xl border border-blue-100 text-center">
                📸 يرجى إرسال صورة أو لقطة شاشة لإشعار التحويل عبر زر الواتساب أدناه لتأكيد حجز طلبكِ وبدء التجهيز والشحن فوراً.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                if (onTrackOrder) {
                  onTrackOrder(activeOrder.trackingNumber || activeOrder.id);
                } else {
                  onOrderSuccess(activeOrder);
                }
              }}
              className="w-full bg-[#A44C5C] hover:bg-[#8e3b4a] active:scale-98 text-white text-xs font-bold py-3.5 px-4 rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
            >
              <PackageSearch size={16} />
              <span>تتبع طلبيتكِ الآن مباشرة بالمتجر 📦</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-center">
              <button
                onClick={() => WhatsAppService.sendInvoice(activeOrder, activeOrder.phone)}
                className="w-full sm:flex-1 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold py-3.5 px-4 rounded-xl cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Send size={15} />
                <span>متابعة الطلب عبر واتساب</span>
              </button>
              <button
                onClick={handleCopyInvoice}
                className="w-full sm:w-auto border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold py-3.5 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                {copiedInvoice ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedInvoice ? 'تم النسخ ✓' : 'نسخ الفاتورة'}</span>
              </button>
              <button
                onClick={() => onOrderSuccess(activeOrder)}
                className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white text-xs font-bold py-3.5 px-5 rounded-xl cursor-pointer transition-all"
              >
                العودة للمتجر
              </button>
            </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#A44C5C] uppercase tracking-wider">
                  {step === 1 ? 'الخطوة 1 من 2 — بيانات التوصيل والشحن' : 'الخطوة 2 من 2 — اختيار وسيلة الدفع'}
                </span>
                <span className="text-[10px] text-gray-500 font-bold font-sans">
                  {step === 1 ? 'مرحلة 1 / 2' : 'مرحلة 2 / 2'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-950">
                {step === 1 ? 'بيانات التوصيل والشحن 🚚' : 'اختر طريقة الدفع 💳'}
              </h3>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2.5">
                <div 
                  className="bg-[#111827] h-full transition-all duration-300 rounded-full" 
                  style={{ width: step === 1 ? '50%' : '100%' }}
                />
              </div>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 mb-4 text-right flex items-start gap-2 animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1">
                  <p className="font-bold mb-0.5">تنبيه:</p>
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* STEP 1: SHIPPING & CONTACT INFO (SAUDI CLIENTS) */}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      رقم الجوال للتوصيل والواتساب *
                    </label>
                    <span className="text-[10px] text-gray-400 font-mono">05xxxxxxxx أو +9665xxxxxxxx</span>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="0552823677"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:border-[#111827] focus:outline-none transition-all font-mono text-left pl-14"
                      dir="ltr"
                      required
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-gray-500 font-mono border-r border-gray-200 pr-2 pointer-events-none">
                      <span>🇸🇦</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      المدينة بالمملكة *
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: الرياض، جدة، مكة، الدمام..."
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

                {/* Saudi Fast Shipping Banner */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 mt-2 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                  <p className="text-[11px] text-emerald-900 leading-snug">
                    تغليف فاخر مجاني مع كل طلب + شحن سريع وتوصيل آمن لكافة مناطق المملكة.
                  </p>
                </div>

                {/* visible Payment Methods in Step 1 to eliminate uncertainty */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-right space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5">
                      <Lock size={13} className="text-emerald-600" />
                      <span>وسائل الدفع المتاحة في الخطوة التالية:</span>
                    </span>
                    <span className="text-[10px] text-gray-400">خيارات مرنة ومباشرة</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[9.5px] font-bold">الدفع عند الاستلام (COD)</span>
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[9.5px] font-bold">تحويل بنكي مباشر (الراجحي)</span>
                  </div>
                </div>

                {/* WhatsApp Opt-in as per Meta guidelines (not pre-selected) */}
                <label className="flex items-start gap-3 p-4 bg-white border border-gray-150 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors group">
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={whatsappOptIn}
                      onChange={(e) => setWhatsappOptIn(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-emerald-500 checked:bg-emerald-500 hover:border-gray-400"
                    />
                    <Check className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={4} />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-bold text-gray-950">أوافق على استلام رسائل واتساب من SULTA 🌸</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      سأستلم تحديثات الطلب، عروض حصرية، وتذكيرات السلة. يمكنني إلغاء الاشتراك في أي وقت بكتابة "إيقاف".
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* STEP 2: CHOOSE PAYMENT METHOD */}
            {step === 2 && (
              <div className="space-y-4 text-right animate-fade-in">
                
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  اختر طريقة الدفع المناسبة لكِ:
                </p>

                <div className="space-y-3">
                  
                  {/* OPTION 1: CASH ON DELIVERY (COD) */}
                  <div
                    onClick={() => setSelectedPayment('cod')}
                    className={`w-full text-right p-4 rounded-2xl transition-all border cursor-pointer ${
                      selectedPayment === 'cod'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <Truck size={18} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-gray-950">
                              الدفع عند الاستلام (Cash on Delivery)
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              معاينة قبل الدفع 📦
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            سداد قيمة الطلبية نقداً لمندوب الشحن فور وصولها لباب منزلكِ
                          </p>
                        </div>
                      </div>

                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedPayment === 'cod' ? 'border-emerald-600' : 'border-gray-300'
                      }`}>
                        {selectedPayment === 'cod' && <span className="w-2 h-2 bg-emerald-600 rounded-full" />}
                      </span>
                    </div>

                    {selectedPayment === 'cod' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/60 text-right">
                        <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                          <span className="font-bold text-emerald-950 block">✓ راحة وأمان:</span>
                          <p className="text-[11px] text-emerald-900 leading-relaxed">
                            استلمي طلبيتكِ مفحوصة ومغلفة بعناية، وسددي المبلغ ({totalAmount.toLocaleString()} {currencyLabel}) نقداً للمندوب عند الاستلام.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OPTION 2: DIRECT BANK TRANSFER (SAUDI BANK ACCOUNT) */}
                  <div
                    onClick={() => setSelectedPayment('bank_transfer')}
                    className={`w-full text-right p-4 rounded-2xl transition-all border cursor-pointer ${
                      selectedPayment === 'bank_transfer'
                        ? 'border-gray-900 bg-gray-50 shadow-xs ring-1 ring-gray-900'
                        : 'border-gray-200 bg-white hover:bg-gray-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                          <Check size={18} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-gray-950">
                              تحويل للحساب البنكي (Bank Transfer)
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                              مصرف الراجحي 🏦
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            تحويل مباشر لحساب المتجر البنكي وإرسال صورة الإشعار عبر الواتساب لتأكيد الشحن
                          </p>
                        </div>
                      </div>

                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedPayment === 'bank_transfer' ? 'border-gray-900' : 'border-gray-300'
                      }`}>
                        {selectedPayment === 'bank_transfer' && <span className="w-2 h-2 bg-gray-900 rounded-full" />}
                      </span>
                    </div>

                    {selectedPayment === 'bank_transfer' && (
                      <div className="mt-3 pt-3 border-t border-gray-200 text-right">
                        <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-[11px] space-y-2">
                          <p className="font-bold text-blue-950 mb-1">بيانات الحساب البنكي المعتمد:</p>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">اسم البنك:</span>
                            <span className="font-bold text-gray-900">مصرف الراجحي</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">اسم الحساب:</span>
                            <span className="font-bold text-gray-900">مؤسسة سُلطة للأزياء</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">رقم الآيبان (IBAN):</span>
                            <div className="font-mono text-gray-900 font-bold select-all bg-white px-2 py-0.5 rounded border border-gray-300">
                              <span>SA82 8000 0000 1234 5678 9012</span>
                            </div>
                          </div>
                          <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[10.5px] text-amber-900 font-medium">
                            📸 عند الضغط على إتمام الطلب، سيتم إرسال بيانات الحساب ورقم الطلب لرسائل الواتساب، يرجى إرسال صورة أو سكرين شوت لإشعار التحويل لتأكيد الشحن فوراً.
                          </div>
                        </div>
                      </div>
                    )}
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
                className="w-full bg-[#111827] hover:bg-black text-white py-3.5 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-98"
              >
                <span>الانتقال لاختيار طريقة الدفع</span>
                <ArrowLeft size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-gray-200 text-gray-700 hover:bg-gray-100 py-3.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <ArrowRight size={14} />
                  <span>تعديل العنوان</span>
                </button>
                
                {selectedPayment === 'bank_transfer' ? (
                  <button
                    type="button"
                    onClick={() => handleSubmitOrder()}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-900 hover:bg-black active:scale-98 text-white py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري تسجيل الطلب وتجهيز بيانات التحويل...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>إتمام طلب التحويل البنكي ({totalAmount.toLocaleString()} {currencyLabel})</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmitOrder()}
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-3.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري تسجيل الطلب...</span>
                      </>
                    ) : (
                      <>
                        <Truck size={15} />
                        <span>تأكيد الطلب والدفع عند الاستلام ({totalAmount.toLocaleString()} {currencyLabel})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Left Section: Order Summary (Saudi Sleek White Style) */}
        <div className="md:w-2/5 p-5 sm:p-7 bg-[#F8F9FA] border-t md:border-t-0 md:border-r border-gray-200 flex flex-col justify-between overflow-y-auto">
          
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
              <span className="font-bold text-xs text-gray-900">ملخص الطلب ({cart.length} قطع)</span>
              <Gift size={16} className="text-[#A44C5C]" />
            </div>

            {/* Cart products list */}
            <div className="space-y-2.5 mb-5 max-h-48 overflow-y-auto text-xs text-right pr-1">
              {cart.map((item, idx) => {
                const itemPrice = country === 'EG' 
                  ? (item.product.salePriceEG || item.product.priceEG) 
                  : (item.product.salePriceSA || (item.product.priceSA <= 120 ? item.product.priceSA : 99));
                return (
                  <div key={idx} className="flex gap-2.5 items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200">
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
                <span>الشحن والتوصيل بالمملكة:</span>
                <span className="font-bold font-mono text-emerald-700">
                  {shippingCost === 0 ? 'مجاني 🇸🇦' : `${shippingCost.toLocaleString()} ${currencyLabel}`}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>التغليف الملكي الفاخر:</span>
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
              <span>دفع آمن ومشفر 100% وحماية كاملة لبيانات العميل</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
