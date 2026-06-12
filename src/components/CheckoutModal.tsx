import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, CheckCircle, Smartphone, Truck, ArrowRight, ArrowLeft, Gift, Sparkles, Send, Box, Award, Check } from 'lucide-react';
import { CartItem, Country, DiscountCoupon, Order, Settings } from '../types';
import { dbService } from '../services/db';

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
  // Wizard steps: 1 = Customer Info, 2 = Shipping & Packaging, 3 = Payment, 4 = Review
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Selected payment method
  const [selectedPayment, setSelectedPayment] = useState<string>('cod');
  
  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [confirmViaWhatsapp, setConfirmViaWhatsapp] = useState(true);

  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

  // Subtotal and Calculations
  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = country === 'EG' ? item.product.priceEG : item.product.priceSA;
    return sum + itemPrice * item.quantity;
  }, 0);

  // Dynamic Shipping calculation
  const getDynamicShippingCost = () => {
    if (!settings) return country === 'EG' ? 80 : 30;
    
    const userCity = city.trim().toLowerCase();
    
    if (userCity && settings.shippingRates && settings.shippingRates.length > 0) {
      const match = settings.shippingRates.find(rate => {
        const ar = rate.regionAr.toLowerCase();
        const en = rate.regionEn.toLowerCase();
        return userCity.includes(ar) || ar.includes(userCity) ||
               userCity.includes(en) || en.includes(userCity);
      });
      if (match) {
        return match.fee;
      }
    }
    
    if (settings.defaultShippingFee !== undefined && settings.defaultShippingFee !== null && settings.defaultShippingFee > 0) {
      return settings.defaultShippingFee;
    }
    
    return country === 'EG' ? 80 : 30;
  };

  const shippingCost = getDynamicShippingCost();
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const totalAmount = subtotal - discountAmount + shippingCost;

  // Ribbon details
  const ribbons = [
    { id: 'champagne', nameAr: 'شريط شامبين ميتاليك فخم', hex: '#F6E7A6' },
    { id: 'pink', nameAr: 'شريط ستان وردي كراميل ناعم', hex: '#F4B6C2' },
    { id: 'black', nameAr: 'شريط حريري أسود فاحم دراماتيكي', hex: '#0B0B0B' }
  ];

  // Country specific payment gateways
  const egyptPayments = [
    { id: 'visa', name: 'بطاقة مدى / فيزا إلكترونية مؤمنة', icon: <CreditCard size={16} /> },
    { id: 'fawry', name: 'خدمة فوري ومصاريف الدفع', icon: <CheckCircle size={16} /> },
    { id: 'wallet', name: 'المحافظ الإلكترونية (فودافون كاش)', icon: <Smartphone size={16} /> },
    { id: 'cod', name: 'الدفع نقداً عند استلام الشحنة الفاخرة', icon: <Truck size={16} /> },
  ];

  const saudiPayments = [
    { id: 'visa', name: 'بطاقة الائتمان (فيزا / ماستركارد)', icon: <CreditCard size={16} /> },
    { id: 'mada', name: 'بطاقة نقدية مدى المدعومة (Mada)', icon: <CreditCard size={16} /> },
    { id: 'apple', name: 'أبل باي السريع (Apple Pay)', icon: <Smartphone size={16} /> },
    { id: 'stc', name: 'إس تي سي باي الذكي (STC Pay)', icon: <Smartphone size={16} /> },
    { id: 'cod', name: 'الدفع عند الاستلام مع التغليف الفاخر', icon: <Truck size={16} /> },
  ];

  const activePayments = country === 'EG' ? egyptPayments : saudiPayments;

  // Validation handlers per step
  const handleNextStep = () => {
    setErrorMsg('');
    
    if (step === 1) {
      if (!name.trim()) return setErrorMsg('الرجاء إدخال اسم المستلمة بالكامل كالمسجل رسمياً.');
      if (!phone.trim()) return setErrorMsg('الرجاء كتابة رقم هاتف للتواصل متاح مع الواتساب لمندوب الشحن.');
      if (!email.trim() || !email.includes('@')) return setErrorMsg('الرجاء إدخال بريد إلكتروني صالح لاستلام كود وفواتير الطلب.');
      setStep(2);
    } else if (step === 2) {
      if (!city.trim()) return setErrorMsg('الرجاء كتابة اسم المدينة (مثال: الرياض، جدة، القاهرة).');
      if (!address.trim()) return setErrorMsg('الرجاء تسجيل تفاصيل العنوان والحي بدقة لتسهيل وصول السيارة.');
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
    if (step === 4) setStep(3);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
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
        notes: undefined,
        giftMessage: undefined,
        giftCardTheme: undefined,
        ribbon: 'default',
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
        paymentMethod: activePayments.find(p => p.id === selectedPayment)?.name || 'الدفع عند الاستلام',
        status: 'pending',
        date: new Date().toISOString().split('T')[0]
      };

      await dbService.saveOrder(newOrder);
      
      // Update stocks
      for (const item of cart) {
        if (item.product.id) {
          const nextStock = Math.max(0, (item.product.stock || 0) - item.quantity);
          await dbService.updateProductStock(item.product.id, item.product, nextStock);
        }
      }

      setSuccessOrder(newOrder);

      if (confirmViaWhatsapp) {
        const itemsText = newOrder.items.map(item => `• ${item.productName} (${item.color} - ${item.size}) [الكمية: ${item.quantity}]`).join('\n');
        const text = `✦ ملخص الطلب الفاخر من متجر SULTA ✦\n\n` +
                     `رقم الطلب: ${newOrder.id}\n` +
                     `اسم العميلة الموقرة: ${newOrder.customerName}\n` +
                     `رقم الجوال: ${newOrder.phone}\n` +
                     `شحنت إلى: ${newOrder.city} - ${newOrder.address} (${newOrder.country === 'EG' ? 'مصر' : 'السعودية'})\n` +
                     `لون الشريط: ${ribbons.find(r => r.id === newOrder.ribbon)?.nameAr || 'شريط شامبين ميتاليك فخم'}\n` +
                     `طريقة الدفع: ${newOrder.paymentMethod}\n\n` +
                     `المنتجات الحريرية المحجوزة:\n${itemsText}\n\n` +
                     `تكلفة الشحن لـ ${newOrder.country === 'EG' ? 'مصر' : 'السعودية'}: ${newOrder.shippingFee || 0} ${newOrder.currency}\n` +
                     `إجمالي الاستحقاق النهائي: ${newOrder.totalPrice.toLocaleString()} ${newOrder.currency}\n\n` +
                     `شكراً لاختياركِ رقي وأناقة SULTA 👑\n\n` +
                     `يرجى تأكيد ومعالجة طلبي هذا في أسرع وقت ممكن! ❤️`;
        
        const encodedText = encodeURIComponent(text);
        const whatsappUrl = `https://wa.me/${settings?.whatsapp || '201110095403'}?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      console.error("Failed to save order:", err);
      setErrorMsg('نعتذر، حدث تعذر فني عند حفظ طلبكِ في منظومة البيانات. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successOrder) {
    const handleSendWhatsApp = () => {
      const itemsText = successOrder.items.map(item => `• ${item.productName} (${item.color} - ${item.size}) [الكمية: ${item.quantity}]`).join('\n');
      const text = `✦ ملخص الطلب الفاخر من متجر SULTA ✦\n\n` +
                   `رقم الطلب: ${successOrder.id}\n` +
                   `اسم العميلة الموقرة: ${successOrder.customerName}\n` +
                   `رقم الجوال: ${successOrder.phone}\n` +
                   `شحنت إلى: ${successOrder.city} - ${successOrder.address} (${successOrder.country === 'EG' ? 'مصر' : 'السعودية'})\n` +
                   `لون الشريط: ${ribbons.find(r => r.id === successOrder.ribbon)?.nameAr || 'شريط شامبين ميتاليك فخم'}\n` +
                   `طريقة الدفع: ${successOrder.paymentMethod}\n\n` +
                   `المنتجات الحريرية المحجوزة:\n${itemsText}\n\n` +
                   `تكلفة الشحن لـ ${successOrder.country === 'EG' ? 'مصر' : 'السعودية'}: ${successOrder.shippingFee || 0} ${successOrder.currency}\n` +
                   `إجمالي الاستحقاق النهائي: ${successOrder.totalPrice.toLocaleString()} ${successOrder.currency}\n\n` +
                   `شكراً لاختياركِ رقي وأناقة SULTA 👑\n\n` +
                   `يرجى تأكيد ومعالجة طلبي هذا في أسرع وقت ممكن! ❤️`;
      
      const encodedText = encodeURIComponent(text);
      const whatsappUrl = `https://wa.me/${settings?.whatsapp || '201110095403'}?text=${encodedText}`;
      window.open(whatsappUrl, '_blank');
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Blurred background */}
        <div className="fixed inset-0 bg-[#0B0B0B]/75 backdrop-blur-xs transition-opacity" onClick={() => onOrderSuccess(successOrder)} />

        {/* Main Success Card container */}
        <div className="relative bg-[#FAFAF7] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl p-8 z-35 animate-scale-up border border-[#F6E7A6]/20 text-center select-none">
          {/* Decorative Crown */}
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-sans ring-8 ring-emerald-500/5 mx-auto mb-6">
            <CheckCircle size={40} className="animate-bounce" />
          </div>

          <span className="text-[10px] uppercase tracking-[0.25em] font-serif font-black text-[#DF8A9C] block mb-2">
            STATION OF SULTA COUTURE • حجوزات ناجحة ومباركة
          </span>
          
          <h3 className="font-serif text-2xl font-light text-[#0B0B0B] mb-2 leading-relaxed">
            تم تسجيل طلبكِ الملكي وحجزه بنجاح تام! 👑
          </h3>
          
          <p className="text-gray-550 text-xs font-sans max-w-md mx-auto leading-relaxed mb-6 font-medium">
            يسعدنا جداً انضمامكِ لسيدات Sulta الأنيقات. يتم الآن تجهيز طلبيتكِ وتحضيرها يدوياً مع شريط مخملي فاخر وعناية فائقة تلبي ذوقكِ الرفيع.
          </p>

          {/* Core Invoice Summary Card */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 mb-6 text-right font-sans text-xs max-w-md mx-auto space-y-3.5 shadow-xs">
            <div className="flex justify-between border-b border-gray-100 pb-2.5">
              <span className="text-gray-400">رقم الطلب للاستعلام:</span>
              <span className="font-bold text-gray-950 font-mono">{successOrder.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">اسم المستلمة الفخمة:</span>
              <span className="font-bold text-gray-950">{successOrder.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">العنوان والوجهة:</span>
              <span className="font-bold text-[#0B0B0B]">{successOrder.city} - {successOrder.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">شريط التعبئة:</span>
              <span className="font-bold text-[#DF8A9C]">{ribbons.find(r => r.id === successOrder.ribbon)?.nameAr || 'شريط شامبين ميتاليك فخم'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">تكلفة الشحن الملكي السريع:</span>
              <span className="font-bold text-gray-950 font-sans">{successOrder.shippingFee ? `${successOrder.shippingFee.toLocaleString()} ${successOrder.currency}` : `0 ${successOrder.currency}`}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2.5 text-sm font-black text-gray-950">
              <span>الإجمالي النهائي (شاملاً الشحن):</span>
              <span>{successOrder.totalPrice.toLocaleString()} {successOrder.currency}</span>
            </div>
          </div>

          {/* Informing Notice about WhatsApp */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4.5 mb-8 text-right font-sans max-w-md mx-auto shadow-xs">
            <h4 className="text-xs font-bold text-emerald-850 mb-1.5 flex items-center gap-1.5 justify-end">
              <span>تسريع عملية المعالجة والتأكيد الفوري ⚡</span>
            </h4>
            <p className="text-[11px] text-emerald-950 leading-relaxed font-semibold">
              يرجى إرسال رقم الطلب <strong className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-emerald-300 mx-1">{successOrder.id}</strong> إلى واتساب خدمة العملاء الموحد <strong className="text-emerald-700 font-mono text-xs" dir="ltr">(+201110095403)</strong> لمتابعة الشحنة وتثبيت الحجز بأقصى سرعة ممكنة.
            </p>
          </div>

          {/* Action Call buttons */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center max-w-md mx-auto flex-col-reverse">
            <button
              onClick={() => onOrderSuccess(successOrder)}
              className="w-full sm:w-1/3 border border-gray-300 text-gray-750 hover:bg-gray-150 text-xs font-sans font-bold py-3.5 rounded-xl cursor-pointer transition-all"
            >
              متابعة لحسابي
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="w-full sm:w-2/3 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-sans font-black py-4 rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Send size={15} className="rotate-45" />
              <span>إرسال الفاتورة لواتساب خدمة العملاء 📱</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Blurred background layout element */}
      <div className="fixed inset-0 bg-[#0B0B0B]/75 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Main Container */}
      <div className="relative bg-[#FAFAF7] w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh] z-30 animate-scale-up border border-[#F6E7A6]/20">
        
        {/* Close Button element */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 left-5 z-40 bg-white hover:bg-red-50 text-gray-500 hover:text-red-500 p-2.5 rounded-full border border-gray-150 transition-all shadow-sm"
          title="إغلاق حجز الشحنة"
        >
          <X size={15} />
        </button>

        {/* Right column: Form Content & Controls steps */}
        <div className="md:w-3/5 p-6 md:p-8 overflow-y-auto max-h-[50vh] md:max-h-none flex flex-col justify-between">
          
          <div>
            {/* Header Timeline Stage tracker */}
            <div className="mb-6">
              <span className="text-[10px] uppercase tracking-[0.25em] font-serif font-black text-[#DF8A9C] block mb-2">
                SULTA ATELIER LUXURY CHECKOUT • الخطوة {step} من 4
              </span>
              <h3 className="font-serif text-xl font-light text-[#0B0B0B]">
                {step === 1 && 'المعلومات الشخصية للعميلة الفاخرة'}
                {step === 2 && 'وجهة التوصيل وتخصيص التغليف'}
                {step === 3 && 'طريقة السداد المضمونة والمشفّرة'}
                {step === 4 && 'مراجعة المظهر النهائي للفاتورة والطلب'}
              </h3>
              
              {/* Steppers visualization progress lines */}
              <div className="flex gap-1.5 mt-4 items-center">
                {[1, 2, 3, 4].map((num) => (
                  <div
                    key={num}
                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                      step >= num ? 'bg-[#0B0B0B]' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-[11px] p-3 rounded-xl border border-red-200 mb-4 font-sans text-right">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* STEP 1: CUSTOMER INFO */}
            {step === 1 && (
              <div className="space-y-4 font-sans text-right">
                <p className="text-gray-400 text-xs leading-relaxed mb-1">يرجى تسجيل بياناتكِ للتأكد من وصول الصندوق الملكي بأقصى درجات العناية والأناقة.</p>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">اسم المستلمة ثلاثي بالكامل *</label>
                  <input
                    type="text"
                    placeholder="مثال: ياسمين أحمد الهاشمي"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs border border-gray-200 focus:border-[#DF8A9C] rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-4 focus:ring-pink-100/30 text-right"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">رقم جوال للتواصل المباشر (مفعل بالواتساب) *</label>
                  <input
                    type="tel"
                    placeholder="مثال: 50xxxxxx أو 01xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs text-left border border-gray-200 focus:border-[#DF8A9C] rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-4 focus:ring-pink-100/30 font-mono"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">البريد الإلكتروني للعميل *</label>
                  <input
                    type="email"
                    placeholder="البريد لاستلام كتالوج الشحنة الملكية والفاتورة"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs border border-gray-200 focus:border-[#DF8A9C] rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-4 focus:ring-pink-100/30 text-right font-sans"
                    required
                  />
                </div>

                <div className="bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 mt-2">
                  <span className="text-[10px] bg-[#0B0B0B] text-[#F6E7A6] px-2.5 py-0.5 rounded-full font-serif font-black block w-fit mb-1">
                    ✦ ميزة الزبون الموثوق
                  </span>
                  <p className="text-[10.5px] text-gray-650 leading-relaxed">بمجرد الضغط على المتابعة، يتم ربط طلبيتك بـ <strong>نادي SULTA للكوتور والولاء</strong> وحساب رصيد النقاط تلقائياً على بريد ومصادقة {email || 'البريد الإلكتروني'}.</p>
                </div>
              </div>
            )}

            {/* STEP 2: SHIPPING & ADDRESS */}
            {step === 2 && (
              <div className="space-y-4.5 font-sans text-right">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">المدينة الحالية *</label>
                    <input
                      type="text"
                      placeholder="مثال: الرياض أو جدة أو القاهرة"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs border border-gray-200 focus:border-[#DF8A9C] rounded-xl px-4 py-3 bg-white focus:outline-none text-right font-sans"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">العنوان التفصيلي والحي *</label>
                    <input
                      type="text"
                      placeholder="الحي، اسم الشارع، رقم العمارة أو الفيلا"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs border border-gray-200 focus:border-[#DF8A9C] rounded-xl px-4 py-3 bg-white focus:outline-none text-right font-sans"
                      required
                    />
                  </div>
                </div>

                {/* Sulta Couture Presentation Box */}
                <div className="bg-[#FCFCF9] border border-amber-200/60 rounded-2xl p-5 relative overflow-hidden text-right shadow-xs select-none">
                  <div className="absolute top-3 left-3 text-[9px] font-serif tracking-[0.2em] text-[#c5a059]">SULTA LUXE</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-[#0B0B0B]">مكافأة تغليف Sulta الفاخر المعتمد 🎁</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                    تقديراً لثقتِك، يتم تجهيز طلبيتكِ تلقائياً في ورشة <strong className="text-[#0B0B0B]">Sulta Couture</strong> داخل صندوق الساتان الفخم، معقوداً بشريط شامبين الحريري الفاخر، وبطاقة امتنان أنيقة مصممة لتليق بفخامتِك.
                  </p>
                  <div className="mt-3 flex items-center gap-4 justify-end text-[10px] font-serif text-[#c5a059]">
                    <span>✦ ورق عاجي مستورد</span>
                    <span>✦ شريط حرير طبيعي</span>
                    <span>✦ صندوق خشبي كوتور</span>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 3: CHOOSE PAYMENT METHOD */}
            {step === 3 && (
              <div className="space-y-4 font-sans text-right select-none animate-fade-in">
                <p className="text-gray-450 text-xs mb-4">بوابة الدفع مؤمنة بخوارزمية تشفير SSL لحماية خصوصيتك التامة. يرجى اختيار الوسيلة الأسهل لكي:</p>
                <div className="space-y-2.5">
                  {activePayments.map((p) => {
                    const active = selectedPayment === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPayment(p.id)}
                        className={`w-full text-right text-xs px-4 py-3 rounded-xl transition-all border flex items-center justify-between cursor-pointer ${
                          active
                            ? 'border-[#0B0B0B] bg-gray-50 font-bold scale-[1.01] shadow-xs'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-gray-400">{p.icon}</span>
                          <span>{p.name}</span>
                        </span>
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-[#0B0B0B]' : 'border-gray-300'}`}>
                          {active && <span className="w-2 h-2 bg-[#0B0B0B] rounded-full" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-[#FAFAF7] border border-gray-150 rounded-2xl p-4 mt-6">
                  <div className="flex gap-2 items-center flex-row-reverse mb-1">
                    <ShieldCheck className="text-[#DF8A9C]" size={15} />
                    <span className="text-xs font-bold text-gray-900">أمن الدفع وحرية التبديل</span>
                  </div>
                  <p className="text-[10.5px] text-gray-500 leading-relaxed">عند اختيار الدفع عند الاستلام (COD)، لا توجد رسوم إضافية مخفية! يحق لكي تفقد البكج وصندوق الشحن مع مندوب Sulta قبل التوقيع للتسليم.</p>
                </div>
              </div>
            )}

            {/* STEP 4: FINAL REWIEW & PLACE ORDER */}
            {step === 4 && (
              <div className="space-y-4 font-sans text-right animate-fade-in">
                <p className="text-gray-400 text-xs leading-relaxed">لقد اقتربتِ من إتمام الحجز بالكامل! مراجعة أخيرة لتفاصيل الشحنة وعنوان السكن:</p>
                
                <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden text-xs divide-y divide-gray-150">
                  <div className="p-3.5 flex justify-between bg-gray-50 text-gray-900 font-bold">
                    <span>الوجهة الملكية</span>
                    <span className="text-gray-500 font-normal">تعديل</span>
                  </div>
                  <div className="p-3.5 space-y-1 text-gray-600">
                    <p><strong>المستلمة:</strong> {name}</p>
                    <p><strong>الهاتف:</strong> {phone} | <strong>البريد:</strong> {email}</p>
                    <p><strong>العنوان:</strong> {city} • {address} • {country === 'EG' ? 'مصر' : 'المملكة العربية السعودية'}</p>
                  </div>

                  <div className="p-3.5 flex justify-between bg-gray-50 text-gray-900 font-bold">
                    <span>قنوات وتأكيد السداد</span>
                    <span className="text-gray-500 font-normal">تعديل</span>
                  </div>
                  <div className="p-3.5 text-gray-600">
                    <p>المستحق الدفع به عبر: <strong>{activePayments.find(p => p.id === selectedPayment)?.name}</strong></p>
                  </div>
                </div>

                {/* Option to confirm order via WhatsApp immediately */}
                <div 
                  onClick={() => setConfirmViaWhatsapp(!confirmViaWhatsapp)} 
                  className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer select-none transition-all flex-row-reverse text-right ${
                    confirmViaWhatsapp ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    confirmViaWhatsapp ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white'
                  }`}>
                    {confirmViaWhatsapp && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-gray-900 block font-sans">تأكيد طلبي الملكي عبر واتساب فوراً 💬</span>
                    <p className="text-[10px] text-gray-500 leading-normal mt-0.5">سيتم فتح محادثة كونسيرج خدمة العملاء الموحد تلقائياً عبر الرقم <strong className="text-emerald-700 font-mono" dir="ltr">(+201110095403)</strong> لإرسال ملخص الفاتورة وتسريع عملية تتبع البكج الملكي.</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                  <p className="text-[11px] text-gray-800 leading-relaxed font-medium">✨ بمجرد النقر على "إتمام الطلب"، يحاك بكج الشراء بكل سر في ورش Sulta للساتان مع التغليف الفاخر وتوصيله مع مندوبنا المخصص.</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer controls */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-150 mt-6 gap-3 flex-row-reverse">
            
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#F4B6C2] hover:text-white px-7 py-3 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <span>المتابعة للخطوة القادمة</span>
                <ArrowLeft size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl text-xs font-sans font-black flex items-center gap-2 cursor-pointer transition-all shadow-md shrink-0 ring-4 ring-emerald-500/10"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>تأكيد ومعالجة الحجز الحريري...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-yellow-250 animate-pulse" />
                    <span>أريد إبرام وحجز طلبيتي الحالية ✦</span>
                  </>
                )}
              </button>
            )}

            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="border border-gray-200 text-gray-600 hover:bg-gray-100 px-5 py-3 rounded-xl text-xs font-sans font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <ArrowRight size={14} />
                <span>الرجوع للمرحلة السابقة</span>
              </button>
            )}
          </div>

        </div>

        {/* Left column: Cart summary sticky panel */}
        <div className="md:w-2/5 p-6 md:p-8 bg-white border-t md:border-t-0 md:border-r border-gray-100 flex flex-col justify-between overflow-y-auto max-h-[42vh] md:max-h-none select-none">
          
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-gray-100">
              <Gift size={16} className="text-[#F4B6C2]" />
              <h4 className="font-serif text-sm uppercase tracking-wider text-[#0B0B0B] font-bold">
                محفظة الشحنة وصحيفة السلة
              </h4>
            </div>

            {/* Cart products line items loop */}
            <div className="space-y-3.5 mb-6 max-h-40 overflow-y-auto text-xs font-sans text-gray-650 pr-1 text-right">
              {cart.map((item, idx) => {
                const itemPrice = country === 'EG' ? item.product.priceEG : item.product.priceSA;
                return (
                  <div key={idx} className="flex gap-2 items-center justify-between bg-[#FAFAF7] p-2 rounded-xl border border-gray-50 flex-row-reverse text-right">
                    {item.product.images[0]?.match(/\.(mp4|webm|ogg|mov)$/i) || item.product.images[0]?.includes('video') ? (
                       <video src={item.product.images[0]} className="w-8 h-10 object-cover rounded-md shrink-0" autoPlay muted loop playsInline />
                    ) : (
                       <img src={item.product.images[0]} alt={item.product.nameAr} className="w-8 h-10 object-cover rounded-md shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="font-bold text-gray-900 line-clamp-1 block leading-tight">{item.product.nameAr}</span>
                      <span className="text-[9px] text-gray-400 block font-mono">اللون: {item.selectedColor?.name || 'افتراضي'} • مقاس: {item.selectedSize} ■ {item.quantity}×</span>
                    </div>
                    <span className="text-[11px] text-[#0B0B0B] font-bold font-sans shrink-0">{(itemPrice * item.quantity).toLocaleString()} {currencyLabel}</span>
                  </div>
                );
              })}
            </div>

            {/* Calculations breakdown details */}
            <div className="space-y-2.5 text-xs font-sans text-gray-500 border-b border-gray-100 pb-4 mb-6">
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">سعر المجموع الفرعي للقطع:</span>
                <span className="font-bold text-gray-800">{subtotal.toLocaleString()} {currencyLabel}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600 bg-green-50/50 p-1.5 rounded-lg border border-dashed border-green-200">
                  <span>تم تفعيل قسيمة الخصم ({appliedCoupon.discountPercent}%):</span>
                  <span className="font-bold">- {discountAmount.toLocaleString()} {currencyLabel}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-400">التعبئة وبكج Sulta الفاخر:</span>
                <span className="text-emerald-500 font-bold font-sans">0.00 {currencyLabel} (مجاناً)</span>
              </div>

              <div className="flex justify-between items-center text-gray-700">
                <span className="text-gray-400">رسوم الشحن الملكي السريع ({country === 'EG' ? 'شحن محلي بمصر' : 'شحن بري للمملكة'}):</span>
                <span className="font-bold font-sans text-gray-800">{shippingCost.toLocaleString()} {currencyLabel}</span>
              </div>

              <div className="flex justify-between items-center text-[#0B0B0B] text-sm font-black pt-2 border-t border-gray-100">
                <span>الإجمالي الصافي النهائي للاستحقاق:</span>
                <span className="text-[#0B0B0B] font-sans font-bold">{totalAmount.toLocaleString()} {currencyLabel}</span>
              </div>
            </div>

            {/* Secure payment shield notice badge */}
            <div className="bg-emerald-50/50 rounded-2xl p-3 border border-emerald-100 text-right">
              <div className="flex items-center gap-1.5 justify-end text-[10.5px] font-bold text-emerald-800">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>حجز مشفّر وسرية بيانات تامة</span>
              </div>
              <p className="text-[9.5px] text-gray-500 mt-1 leading-relaxed">تحفظ كافة المحادثات والوجهات بأقصى درجات الضمان السكني والائتماني المعتمد.</p>
            </div>

          </div>

          <div className="pt-4 text-center mt-6">
            <span className="text-[9px] text-gray-400 font-mono flex items-center justify-center gap-1">
              <span>SULTA High Couture Elite Experience V4.0</span>
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
