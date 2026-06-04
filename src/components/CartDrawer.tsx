import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Percent, Sparkles, Check } from 'lucide-react';
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

  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

  // Total pricing logic
  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = country === 'EG' ? item.product.priceEG : item.product.priceSA;
    return sum + itemPrice * item.quantity;
  }, 0);

  // Discount calculation
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const totalAmount = subtotal - discountAmount;

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
        <div className="w-[450px] max-w-[95vw] bg-[#FAFAF7] h-full shadow-2xl flex flex-col justify-between animate-slide-left pointer-events-auto">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#0B0B0B]" />
              <h3 className="font-serif text-lg font-light text-[#0B0B0B]">حقيبة التسوق الفاخرة</h3>
              <span className="text-[10px] bg-[#0B0B0B] text-[#F6E7A6] px-2 py-0.5 rounded-full font-sans font-medium">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} قطع
              </span>
            </div>
            
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-[#0B0B0B] hover:bg-gray-50 flex items-center gap-1 text-xs">
              <span>إغلاق</span>
              <X size={18} />
            </button>
          </div>

          {/* Core scrollable item grid */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            
            {cart.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <span className="text-5xl mb-4">🛒</span>
                <h4 className="font-serif text-lg font-light text-[#0B0B0B] mb-2">حقيبتك المترفة فارغة حالياً</h4>
                <p className="text-gray-400 text-xs font-sans max-w-xs leading-relaxed mb-6">
                  استكشفي تشكيلات سولتا المميزة وضعي لمسات الدلال الخاصة بك في السلة لتظهر هنا.
                </p>
                <button
                  onClick={onClose}
                  className="bg-[#0B0B0B] text-white hover:bg-[#F4B6C2] px-6 py-3 rounded-full text-xs font-sans transition-colors"
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
                        <img
                          src={item.product.images[0]}
                          alt={item.product.nameAr}
                          className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform"
                        />
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
                              <span className="w-1.5 h-1.5 rounded-full inline-block border border-gray-200" style={{ backgroundColor: item.selectedColor.hex }} />
                              {item.selectedColor.name}
                            </span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded-md">المقاس: {item.selectedSize}</span>
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
                        <img src={p.images[0]} alt="Recommended" className="w-full aspect-[4/5] object-cover rounded-lg mb-1.5" />
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
                  className="bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#F4B6C2] hover:text-white px-4 py-2 text-xs rounded-lg font-sans transition-colors shrink-0"
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
                    <span>رسوم الشحن الملكي للباب</span>
                    <span className="bg-green-50 text-green-600 text-[9px] px-1.5 py-0.5 rounded font-bold">مجاني</span>
                  </span>
                  <span className="text-gray-900 font-semibold">0.00 {currencyLabel}</span>
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
                className="w-full bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#F4B6C2] hover:text-white py-3.5 rounded-xl text-xs font-sans font-bold tracking-wide transition-luxury flex items-center justify-center gap-2 shadow-xs"
                id="submit-order-checkout"
              >
                <span>إتمام الطلب والدفع الفاخر</span>
                <ArrowRight size={14} className="rotate-180" />
              </button>

              <p className="text-center text-[9px] text-gray-400 uppercase tracking-widest font-serif">
                SULTA COUTUBE • SECURE SSL ENCRYPTED checkout
              </p>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
