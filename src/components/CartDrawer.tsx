import SultaImage from "./SultaImage";
import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Percent, Sparkles, Check, Truck, Plus } from 'lucide-react';
import { CartItem, Country, Product, DiscountCoupon } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQty: (index: number, qty: number) => void;
  country: Country;
  onCheckout: (appliedCoupon: DiscountCoupon | null) => void;
  onSelectProduct: (product: Product) => void;
  products: Product[];
  coupons: DiscountCoupon[];
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onRemoveItem,
  onUpdateQty,
  country,
  onCheckout,
  onSelectProduct,
  products,
  coupons,
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(null);
  const [couponErr, setCouponErr] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

  if (!isOpen) return null;

  const currencyLabel = country === 'EG' ? 'ج.م' : 'ر.س';

  // Total pricing logic (Using discounted price 99 SAR)
  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = country === 'EG' 
      ? (item.product.salePriceEG || item.product.priceEG || 0) 
      : (item.product.salePriceSA || item.product.priceSA || 0);
    return sum + itemPrice * item.quantity;
  }, 0);

  // Discount calculation
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;

  const freeShippingThreshold = country === 'SA' ? 299 : 1000;
  const standardShippingFee = country === 'SA' ? 40 : 75;
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : standardShippingFee;
  const totalAmount = subtotal - discountAmount + shippingFee;

  // Coupon handle
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponErr('');
    setCouponSuccess(false);

    const found = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (found) {
      if (found.isActive === false) {
        setCouponErr('هذا الكوبون غير مفعّل حالياً.');
        setAppliedCoupon(null);
        return;
      }
      if (found.expiresAt && new Date(found.expiresAt).getTime() < new Date().setHours(0, 0, 0, 0)) {
        setCouponErr(`كود الخصم انتهت صلاحيته بتاريخ ${new Date(found.expiresAt).toLocaleDateString('ar-SA')}.`);
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(found);
      setCouponSuccess(true);
    } else {
      setCouponErr('كود الخصم غير موجود أو ميزته منتهية الصلاحية.');
      setAppliedCoupon(null);
    }
  };

  // Cross-sell suggestions (take 2 best sellers that are not in the cart)
  const suggestions = products.filter(p => p.isBestSeller && !cart.some(item => item.product.id === p.id)).slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Drawer Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 left-0 max-w-full flex pl-0">
        
        {/* Panel Frame content */}
        <div className="w-[450px] max-w-[95vw] bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-left pointer-events-auto" dir="rtl">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-150 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#111827]" />
              <h3 className="font-bold text-base text-[#111827]">سلة المشتريات 🛒</h3>
              <span className="text-[11px] bg-[#111827] text-white px-2 py-0.5 rounded-full font-bold font-mono">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 flex items-center gap-1 text-xs cursor-pointer">
              <span>إغلاق</span>
              <X size={16} />
            </button>
          </div>

          {/* Salla Free Shipping Progress Bar */}
          {cart.length > 0 && (
            <div className="bg-emerald-50/60 border-b border-emerald-100 px-6 py-2.5">
              {subtotal >= freeShippingThreshold ? (
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <Check size={14} className="stroke-[3] text-emerald-600" />
                  <span>مبروك! لقد حصلتِ على شحن مجاني لكامل الطلب 🚚</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                    <span>أضيفي بقيمة <strong className="text-emerald-700 font-mono">{freeShippingThreshold - subtotal} {currencyLabel}</strong> للحصول على شحن مجاني!</span>
                    <Truck size={14} className="text-emerald-600 shrink-0" />
                  </div>
                  <div className="w-full bg-emerald-200/50 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }} 
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Core scrollable item grid */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            
            {cart.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <span className="text-5xl mb-4">🛒</span>
                <h4 className="font-serif text-lg font-light text-[#0B0B0B] mb-2">حقيبتك المترفة فارغة حالياً</h4>
                <p className="text-gray-400 text-xs font-sans max-w-xs leading-relaxed mb-6">
                  استكشفي تشكيلات Sulta المميزة وضعي لمسات الدلال الخاصة بك في السلة لتظهر هنا.
                </p>
                <button
                  onClick={onClose}
                  className="bg-[#A44C5C] text-white hover:bg-[#F4B6C2] px-6 py-3 rounded-full text-xs font-sans transition-colors"
                >
                  الذهاب للمتجر وتصفح القطع
                </button>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-gray-100">
                {cart.map((item, idx) => {
                  const itemPrice = country === 'EG' 
                    ? (item.product.salePriceEG || item.product.priceEG || 0) 
                    : (item.product.salePriceSA || item.product.priceSA || 0);
                  
                  return (
                    <div key={idx} className="flex gap-4 pt-4 first:pt-0 group relative">
                      
                      {/* Image Thumbnail */}
                      <div className="w-20 h-26 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 cursor-pointer" onClick={() => { onSelectProduct(item.product); onClose(); }}>
                        {item.product.images[0]?.match(/\.(mp4|webm|ogg|mov)$/i) || item.product.images[0]?.includes('video') ? (
                          <video
                            src={item.product.images[0]}
                            className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform"
                            autoPlay muted loop playsInline
                          />
                        ) : (
                          <SultaImage
                            src={item.product.images[0]}
                            alt={item.product.nameAr}
                            className="w-full h-full"
                            imgClassName="w-full h-full object-cover object-center group-hover:scale-103 transition-transform"
                          />
                        )}
                      </div>

                      {/* Details specs */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="text-xs md:text-sm font-semibold text-[#0B0B0B] line-clamp-1 cursor-pointer" onClick={() => { onSelectProduct(item.product); onClose(); }}>
                              {item.product.nameAr}
                            </h4>
                            <button
                              onClick={() => onRemoveItem(idx)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="حذف القطعة"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Options specifications indicators */}
                          <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-sans mt-1.5 select-none">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full inline-block border border-gray-200" style={{ backgroundColor: item.selectedColor?.hex || '#ccc' }} />
                              {item.selectedColor?.name || 'افتراضي'}
                            </span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded-md">المقاس: {item.selectedSize}</span>
                            
                            {/* Render Custom Sensory Upgrades */}
                            {(item as any).scent && (
                              <span className="bg-pink-50 text-[#A44C5C] border border-pink-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                🌸 {(item as any).scent.split('(')[0]}
                              </span>
                            )}
                            {(item as any).luxuryWrap && (
                              <span className="bg-amber-50 text-amber-800 border border-amber-150 px-2 py-0.5 rounded-md flex items-center gap-1">
                                🎁 {(item as any).luxuryWrap.split('(')[0]}
                              </span>
                            )}
                            {(item as any).waxInitial && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                ✉️ شمع: {(item as any).waxInitial} {(item as any).waxColor && `(${(item as any).waxColor.split(' ')[0]})`}
                              </span>
                            )}
                            {(item as any).ribbonColor && (
                              <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                                🎗️ {(item as any).ribbonColor.split(' ')[0] || (item as any).ribbonColor}
                              </span>
                            )}
                            {(item as any).giftMessage && (
                              <span className="bg-amber-50/40 text-amber-900 border border-amber-100 px-2.5 py-1.5 rounded-xl flex items-start gap-1 w-full mt-1.5 font-serif italic text-right text-[10px]" dir="rtl">
                                <span>✍️ رسالة خط اليد: "{(item as any).giftMessage}"</span>
                              </span>
                            )}
                            {(item as any).partnerProduct && (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-2 py-0.5 rounded-md flex items-center gap-1 w-full mt-1">
                                👗 منسق مع: {(item as any).partnerProduct}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Adjusting units block */}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center border border-gray-100 bg-white rounded-lg scale-90">
                            <button
                              onClick={() => onUpdateQty(idx, item.quantity - 1)}
                              className="px-2 py-0.5 text-gray-500 hover:text-black font-semibold"
                            >
                              -
                            </button>
                            <span className="px-2 font-sans font-medium text-xs text-[#0B0B0B]">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQty(idx, item.quantity + 1)}
                              className="px-2 py-0.5 text-gray-500 hover:text-black font-semibold"
                            >
                              +
                            </button>
                          </div>

                          {/* Unit total pricing */}
                          <span className="text-xs font-semibold font-sans text-gray-900">
                            {(itemPrice * item.quantity).toLocaleString()} {currencyLabel}
                          </span>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* High-Impact Upselling: Frequently Bought Together */}
            {suggestions.length > 0 && cart.length > 0 && (
              <div className="pt-6 border-t border-gray-100 mt-6 bg-[#FCF5F6] p-4 rounded-2xl border border-[#DF8A9D]/20 animate-fade-in-rapid">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-[11px] font-bold text-gray-800 tracking-wider uppercase flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[#A44C5C]" />
                    <span>تنسيقات ملكية مقترحة لكِ:</span>
                  </h5>
                  <span className="text-[9px] bg-white text-[#A44C5C] px-2 py-0.5 rounded-full font-bold border border-[#DF8A9D]/20">
                    وفر شحن إضافي 🚚
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {suggestions.map((p) => {
                    const recPrice = country === 'EG' ? p.priceEG : p.priceSA;
                    return (
                      <div
                        key={p.id}
                        onClick={() => { onSelectProduct(p); onClose(); }}
                        className="bg-white rounded-xl p-2.5 cursor-pointer border border-transparent hover:border-[#DF8A9D]/40 transition-all flex flex-col justify-between shadow-4xs group"
                      >
                        <div className="relative aspect-[4/5] mb-2 overflow-hidden rounded-lg">
                          <SultaImage src={p.images[0]} alt="Recommended" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-900 line-clamp-1 block mb-0.5 group-hover:text-[#A44C5C] transition-colors">{p.nameAr}</span>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#A44C5C] font-mono">{recPrice.toLocaleString()} {currencyLabel}</span>
                            <button className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-colors">
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Footer Checkout configuration block */}
          {cart.length > 0 && (
            <div className="border-t border-gray-100 bg-white p-6 shadow-lg space-y-4">
              
              {/* Insert Coupon Code Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="هل لديك كود خصم للبراند؟"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 font-sans text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#F4B6C2] focus:bg-white"
                />
                <button
                  type="submit"
                  className="bg-[#A44C5C] text-white hover:bg-[#8e3f4e] px-4 py-2 text-xs font-bold rounded-xl font-sans transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  تطبيق
                </button>
              </form>

              {couponErr && <p className="text-[10px] text-red-500 font-sans mt-1">{couponErr}</p>}
              {couponSuccess && appliedCoupon && (
                <p className="text-[10px] text-[#25D366] font-sans mt-1 flex items-center gap-1">
                  <Check size={11} />
                  <span>تم تطبيق الرمز بنجاح! خصم بقيمة {appliedCoupon.discountPercent}% - ({appliedCoupon.description})</span>
                </p>
              )}

              {/* Unified Invoice breakdown Section */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 space-y-3">
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>المجموع الفرعي (قبل الخصم)</span>
                  <span className="font-mono">{subtotal.toLocaleString()} {currencyLabel}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between items-center bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-emerald-800 font-bold">كود الخصم المطبق ({appliedCoupon.code})</span>
                      <span className="text-[9px] text-emerald-600 font-medium">{appliedCoupon.description}</span>
                    </div>
                    <span className="text-emerald-700 font-bold font-mono">- {discountAmount.toLocaleString()} {currencyLabel}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-semibold">الشحن والتوصيل الفاخر</span>
                    {shippingFee === 0 ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-black border border-emerald-200">مجاني 🇸🇦</span>
                    ) : (
                      <span className="bg-gray-200 text-gray-700 text-[9px] px-1.5 py-0.5 rounded font-bold">رسوم ثابتة</span>
                    )}
                  </div>
                  <span className={`font-mono font-bold ${shippingFee === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {shippingFee === 0 ? '0.00 ر.س' : `${shippingFee.toLocaleString()} ${currencyLabel}`}
                  </span>
                </div>

                <div className="h-px bg-gray-200 my-1" />

                <div className="flex justify-between items-center pt-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-serif font-black text-gray-950">الإجمالي النهائي</span>
                    <span className="text-[9px] text-gray-400 font-medium">شامل ضريبة القيمة المضافة 15%</span>
                  </div>
                  <span className="text-xl font-black text-gray-950 tracking-tight font-mono">
                    {totalAmount.toLocaleString()} {currencyLabel}
                  </span>
                </div>
              </div>

              {/* Check out buttons */}
              <button
                onClick={() => onCheckout(appliedCoupon)}
                className="w-full bg-[#111827] hover:bg-[#A44C5C] text-white py-3.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                id="submit-order-checkout"
              >
                <span>إتمام الطلب والدفع السريع</span>
                <ArrowRight size={15} className="rotate-180" />
              </button>

              <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-gray-400 font-semibold">
                <span>🔒 دفع آمن ومشفر 100%</span>
                <span>•</span>
                <span>استرجاع واستبدال فوري</span>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
