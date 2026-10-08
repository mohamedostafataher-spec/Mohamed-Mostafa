import SultaImage from "./SultaImage";
import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Percent, Sparkles, Check, Truck } from 'lucide-react';
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

  // Total pricing logic
  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = country === 'EG' ? item.product.priceEG : item.product.priceSA;
    return sum + itemPrice * item.quantity;
  }, 0);

  // Discount calculation
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;

  const freeShippingThreshold = country === 'SA' ? 800 : 1500;
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
                  const itemPrice = country === 'EG' ? item.product.priceEG : item.product.priceSA;
                  
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

            {/* Upsealing Recommended Section */}
            {suggestions.length > 0 && cart.length > 0 && (
              <div className="pt-6 border-t border-gray-100 mt-6 bg-[#F6E7A6]/10 p-4 rounded-2xl border border-[#F6E7A6]/30">
                <h5 className="text-[11px] font-bold text-gray-700 tracking-wider mb-3 uppercase flex items-center gap-1">
                  <Sparkles size={11} className="text-[#F4B6C2]" />
                  إكمال الهيئة (توصيات تناسب ذوقك):
                </h5>
                <div className="grid grid-cols-2 gap-3.5">
                  {suggestions.map((p) => {
                    const recPrice = country === 'EG' ? p.priceEG : p.priceSA;
                    return (
                      <div
                        key={p.id}
                        onClick={() => { onSelectProduct(p); onClose(); }}
                        className="bg-white rounded-xl p-2 cursor-pointer border border-transparent hover:border-[#F4B6C2]/40 transition-all flex flex-col justify-between"
                      >
                        <SultaImage src={p.images[0]} alt="Recommended" className="w-full aspect-[4/5] object-cover rounded-lg mb-1.5" />
                        <div>
                          <span className="text-[9px] font-semibold text-gray-800 line-clamp-1 block">{p.nameAr}</span>
                          <span className="text-[9px] font-sans text-gray-400">{recPrice.toLocaleString()} {currencyLabel}</span>
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
                  className="bg-[#A44C5C] text-[#F6E7A6] hover:bg-[#F4B6C2] hover:text-white px-4 py-2 text-xs rounded-lg font-sans transition-colors shrink-0"
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

              {/* Invoice lines */}
              <div className="space-y-2 text-xs font-sans text-gray-600 border-b border-gray-100 pb-3">
                <div className="flex justify-between">
                  <span>المجموع الفرعي للحقيبة</span>
                  <span className="text-gray-900 font-semibold">{subtotal.toLocaleString()} {currencyLabel}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-[#25D366]">
                    <span>قيمة الخصم ({appliedCoupon.discountPercent}%)</span>
                    <span>- {discountAmount.toLocaleString()} {currencyLabel}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <span>الشحن والتوصيل للمنزل</span>
                    {shippingFee === 0 ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-bold border border-emerald-200">مجاني 🇸🇦</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-700 text-[9px] px-1.5 py-0.5 rounded font-bold">قياسي</span>
                    )}
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {shippingFee === 0 ? 'مجاني' : `${shippingFee.toLocaleString()} ${currencyLabel}`}
                  </span>
                </div>
              </div>

              {/* Net total amount */}
              <div className="flex justify-between items-center text-sm font-sans mb-4">
                <span className="font-serif font-bold text-[#0B0B0B]">الإجمالي الكلي النهائي</span>
                <span className="text-[#0B0B0B] font-bold text-lg md:text-xl tracking-tight">
                  {totalAmount.toLocaleString()} {currencyLabel}
                </span>
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
