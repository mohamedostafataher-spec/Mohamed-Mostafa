import SultaImage from "./SultaImage";
import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Percent, Sparkles, Check, Truck, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, Country, Product, DiscountCoupon } from '../types';
import { dbService } from '../services/db';
import PaymentMethodsDisplay from './PaymentMethodsDisplay';

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
  settings?: any;
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
  settings
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(null);
  const [couponErr, setCouponErr] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

  if (!isOpen) return null;

  const currencyLabel = country === 'EG' ? 'ج.م' : 'ر.س';

  // Total pricing logic - centralized authoritative SKU price calculation
  const subtotal = cart.reduce((sum, item) => {
    const actual = dbService.getProductActualPrice(item.product, country, settings);
    return sum + (actual.unitPrice * item.quantity);
  }, 0);

  // Discount calculation
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  // Authoritative centralized shipping logic
  const shippingFee = dbService.calculateShippingFee(discountedSubtotal, country);
  const totalAmount = discountedSubtotal + shippingFee;

  // Thresholds for UI progress bars
  const freeShippingThreshold = country === 'SA' ? 299 : 1000;

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
          <div className="px-4 py-3 border-b border-gray-150 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#111827]" />
              <h3 className="font-bold text-sm text-[#111827]">سلة المشتريات</h3>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 flex items-center gap-1 text-[10px] cursor-pointer"
            >
              <span>إغلاق</span>
              <X size={14} />
            </button>
          </div>

          {/* Salla Free Shipping Progress Bar - Premium Interactive Version */}
          {cart.length > 0 && (
            <div className="bg-white border-b border-gray-100 px-6 py-4" role="status" aria-live="polite">
              {discountedSubtotal > freeShippingThreshold ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-1">
                    <Truck size={24} className="text-emerald-600 animate-bounce" aria-hidden="true" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-sm font-black text-gray-900 block">مبروك! شحنك صار مجاني 🚚</span>
                    <p className="text-[10px] text-emerald-600 font-bold">تم تطبيق الشحن المجاني التلقائي على طلبيتكِ</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                    <span className="flex items-center gap-1.5">
                      متبقي لكِ <strong className="text-[#A44C5C] font-mono text-sm">{(freeShippingThreshold - discountedSubtotal).toLocaleString()} {currencyLabel}</strong> للشحن المجاني
                    </span>
                    <Truck size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
                  </div>
                  <div className="relative w-full bg-gray-100 rounded-full h-2.5 overflow-hidden" aria-hidden="true">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (discountedSubtotal / freeShippingThreshold) * 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="bg-[#A44C5C] h-full rounded-full relative"
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 skew-x-[-20deg] animate-pulse" />
                    </motion.div>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center font-bold">تسوقي بأكثر من {freeShippingThreshold} {currencyLabel} واحصلي على توصيل مجاني لباب البيت</p>
                </div>
              )}
            </div>
          )}

          {/* Core scrollable item grid */}
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            
            {cart.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                  <ShoppingBag size={40} className="text-gray-200" />
                </div>
                <h4 className="text-lg font-black text-gray-900 mb-2">حقيبتك المترفة فارغة حالياً</h4>
                <p className="text-gray-400 text-xs font-bold max-w-[240px] leading-relaxed mb-8">
                  استكشفي تشكيلات Sulta المميزة وضعي لمسات الدلال الخاصة بك في السلة لتظهر هنا.
                </p>
                <button
                  onClick={onClose}
                  className="bg-[#111827] text-white hover:bg-black px-8 py-3.5 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-black/5 focus-visible:ring-2 focus-visible:ring-[#A44C5C] outline-hidden"
                  aria-label="الذهاب للتسوق"
                >
                  ابدئي التسوق الآن
                </button>
              </div>
            ) : (
              <div className="space-y-2 divide-y divide-gray-50">
                {cart.map((item, idx) => {
                  const itemPrice = dbService.getProductActualPrice(item.product, country, settings).unitPrice;
                  
                  return (
                    <div key={idx} className="flex gap-4 py-5 first:pt-2 group relative" role="listitem">
                      
                      {/* Image Thumbnail */}
                      <div 
                        className="w-24 h-32 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-[#A44C5C] outline-hidden" 
                        onClick={() => { onSelectProduct(item.product); onClose(); }}
                        role="button"
                        aria-label={`عرض تفاصيل ${item.product.nameAr}`}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && (onSelectProduct(item.product), onClose())}
                      >
                        {item.product.images[0]?.match(/\.(mp4|webm|ogg|mov)$/i) || item.product.images[0]?.includes('video') ? (
                          <video
                            src={item.product.images[0]}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            autoPlay muted loop playsInline
                          />
                        ) : (
                          <SultaImage
                            src={item.product.images[0]}
                            alt=""
                            className="w-full h-full"
                            imgClassName="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>

                      {/* Details specs */}
                      <div className="flex-1 flex flex-col justify-between py-1 text-right">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 
                              className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight cursor-pointer hover:text-[#A44C5C] transition-colors focus-visible:ring-2 focus-visible:ring-[#A44C5C] rounded outline-hidden" 
                              onClick={() => { onSelectProduct(item.product); onClose(); }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && (onSelectProduct(item.product), onClose())}
                            >
                              {item.product.nameAr}
                            </h4>
                            <button
                              onClick={() => onRemoveItem(idx)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-red-500 outline-hidden"
                              aria-label={`حذف ${item.product.nameAr} من السلة`}
                              title="حذف القطعة"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </div>

                          {/* Options specifications indicators */}
                          <div className="flex flex-wrap gap-2 text-[10px] font-bold mt-2.5 select-none" aria-label="مواصفات القطعة المختارة">
                            <span className="bg-gray-50 text-gray-600 px-2 py-1 rounded-lg flex items-center gap-1.5 border border-gray-100">
                              <span className="w-2 h-2 rounded-full inline-block border border-gray-200" style={{ backgroundColor: item.selectedColor?.hex || '#ccc' }} aria-hidden="true" />
                              اللون: {item.selectedColor?.name || 'افتراضي'}
                            </span>
                            <span className="bg-gray-50 text-gray-600 px-2 py-1 rounded-lg border border-gray-100">المقاس: {item.selectedSize}</span>
                            
                            {/* Render Custom Sensory Upgrades */}
                            {(item as any).scent && (
                              <span className="bg-pink-50 text-[#A44C5C] border border-pink-100 px-2 py-1 rounded-lg flex items-center gap-1">
                                🌸 {(item as any).scent.split('(')[0]}
                              </span>
                            )}
                            {(item as any).luxuryWrap && (
                              <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-1 rounded-lg flex items-center gap-1">
                                🎁 تغليف فاخر
                              </span>
                            )}
                            {(item as any).giftMessage && (
                              <span className="bg-amber-50/40 text-amber-900 border border-amber-100 px-2.5 py-2 rounded-xl flex items-start gap-1.5 w-full mt-2 font-serif italic text-right text-[10px] leading-relaxed" dir="rtl">
                                <span>✍️ رسالة خط اليد: "{(item as any).giftMessage}"</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Adjusting units block */}
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.quantity > 1) {
                                  onUpdateQty(idx, item.quantity - 1);
                                } else {
                                  onRemoveItem(idx);
                                }
                              }}
                              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-all font-black active:scale-95 cursor-pointer focus-visible:bg-gray-200 outline-hidden"
                              aria-label={`تقليل كمية ${item.product.nameAr}`}
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-mono font-black text-xs text-gray-900" aria-label={`الكمية الحالية ${item.quantity}`}>{item.quantity}</span>
                            <button
                              type="button"
                              disabled={item.product.stock > 0 && item.quantity >= item.product.stock}
                              onClick={() => {
                                if (!(item.product.stock > 0 && item.quantity >= item.product.stock)) {
                                  onUpdateQty(idx, item.quantity + 1);
                                }
                              }}
                              className={`w-10 h-10 flex items-center justify-center transition-all font-black active:scale-95 focus-visible:bg-gray-200 outline-hidden ${
                                item.product.stock > 0 && item.quantity >= item.product.stock
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-black hover:bg-gray-100 cursor-pointer'
                              }`}
                              aria-label={`زيادة كمية ${item.product.nameAr}`}
                            >
                              +
                            </button>
                          </div>

                          {/* Unit total pricing */}
                          <div className="text-left" aria-label={`السعر الإجمالي لهذه القطعة: ${(itemPrice * item.quantity).toLocaleString()} ريال سعودي`}>
                            <span className="text-sm font-black text-gray-900 font-mono">
                              {(itemPrice * item.quantity).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-black text-gray-400 mr-1" aria-hidden="true">{currencyLabel}</span>
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* High-Impact Upselling: Frequently Bought Together - Premium Design */}
            {suggestions.length > 0 && cart.length > 0 && (
              <div className="pt-8 pb-4">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h5 className="text-[12px] font-black text-gray-900 flex items-center gap-2">
                    <div className="w-7 h-7 bg-rose-50 rounded-full flex items-center justify-center" aria-hidden="true">
                      <Sparkles size={14} className="text-[#A44C5C]" />
                    </div>
                    <span>تنسيقات ملكية مقترحة لكِ:</span>
                  </h5>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-none -mx-1 px-1 pb-2">
                  {suggestions.map((p) => {
                    const recPrice = dbService.getProductActualPrice(p, country, settings).unitPrice;
                    return (
                      <div
                        key={p.id}
                        onClick={() => { onSelectProduct(p); onClose(); }}
                        className="bg-white rounded-[1.5rem] p-3 cursor-pointer border border-gray-100 hover:border-[#DF8A9D]/40 transition-all flex flex-col justify-between shadow-sm min-w-[160px] group active:scale-95 focus-visible:ring-2 focus-visible:ring-[#A44C5C] outline-hidden"
                        role="button"
                        aria-label={`مشاهدة ${p.nameAr} بسعر ${recPrice} ريال`}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && (onSelectProduct(p), onClose())}
                      >
                        <div className="relative aspect-[3/4] mb-3 overflow-hidden rounded-2xl bg-gray-50">
                          <SultaImage src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute top-2 right-2">
                             <div className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-sm" aria-hidden="true">
                               <Plus size={14} strokeWidth={3} />
                             </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-gray-900 line-clamp-1 block mb-1">{p.nameAr}</span>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs font-black text-[#A44C5C] font-mono">{recPrice?.toLocaleString()}</span>
                            <span className="text-[9px] font-bold text-gray-400" aria-hidden="true">{currencyLabel}</span>
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
            <div className="border-t border-gray-100 bg-white p-4 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] space-y-3">
              
              {/* Payment Icons */}
              <PaymentMethodsDisplay variant="footer" />
              
              {/* Insert Coupon Code Form */}
              <div className="relative">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="كود الخصم"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full font-bold text-[11px] border border-gray-100 rounded-lg px-3 py-2.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#A44C5C] transition-all outline-hidden"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#111827] text-white hover:bg-black px-4 py-2.5 text-[11px] font-black rounded-lg transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
                  >
                    تطبيق
                  </button>
                </form>
              </div>

              {/* Unified Invoice breakdown Section */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-[11px]" aria-label="تفاصيل الحساب">
                <div className="flex justify-between font-bold text-gray-600">
                  <span>المجموع</span>
                  <span className="font-mono text-gray-950">{subtotal.toLocaleString()} {currencyLabel}</span>
                </div>
                
                <div className="flex justify-between font-bold">
                  <span className="text-gray-600">الشحن والتوصيل</span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-800 font-black">مجاني ✅</span>
                  ) : (
                    <span className="font-mono text-gray-950">{shippingFee.toLocaleString()} {currencyLabel}</span>
                  )}
                </div>

                <div className="h-px bg-gray-200/50 my-1" aria-hidden="true" />

                <div className="flex justify-between items-end pt-1">
                  <span className="text-[10px] text-gray-500 font-black">الإجمالي النهائي</span>
                  <div className="text-left">
                    <span className="text-lg font-black text-[#A44C5C] font-mono">
                      {totalAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black text-gray-400 mr-1">{currencyLabel}</span>
                  </div>
                </div>
              </div>

              {/* Check out buttons */}
              <button
                onClick={() => onCheckout(appliedCoupon)}
                className="w-full bg-[#A44C5C] hover:bg-[#8e3e4d] text-white py-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#A44C5C]/10 cursor-pointer active:scale-[0.98]"
              >
                <span>إتمام الطلب والدفع الآمن</span>
                <ArrowRight size={14} className="rotate-180" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
