import React from 'react';
import { Sparkles, ShoppingBag, Heart, ArrowLeft, Truck, ShieldCheck, RefreshCw, Phone } from 'lucide-react';
import SultaImage from "./SultaImage";
import { cleanImgUrl } from '../services/db';
import { Product, Collection } from '../types';
import { ProductPrice } from './ProductPrice';
import ReelsShowcase from './ReelsShowcase';
import Features from './Features';
import SEO from './SEO';

interface HomeViewProps {
  products: Product[];
  bestSellers: Product[];
  newArrivals: Product[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  handleSelectProduct: (product: Product) => void;
  handleAddToCart: (product: Product, color: any, size: string, qty: number) => void;
  setTab: (tab: string) => void;
  homepageSections: any[];
  subscribeSuccess: boolean;
  subscribeEmail: string;
  setSubscribeEmail: (email: string) => void;
  handleSubscribe: (e: React.FormEvent) => void;
}

const HomeView: React.FC<HomeViewProps> = ({
  products,
  bestSellers,
  newArrivals,
  favorites,
  toggleFavorite,
  handleSelectProduct,
  handleAddToCart,
  setTab,
  homepageSections,
  subscribeSuccess,
  subscribeEmail,
  setSubscribeEmail,
  handleSubscribe
}) => {
  return (
    <div className="space-y-0">
      <SEO 
        title="سولتة | SULTA Atelier - أزياء النوم والبيجامات الفاخرة"
        description="متجر سولتة للأزياء الراقية والبيجامات الفاخرة. تصاميم ملكية بخامات عالمية وتوصيل سريع لكل مدن المملكة العربية السعودية."
        path="/"
      />

      {/* DYNAMIC HOMEPAGE PRODUCT SECTIONS */}
      {[
        { title: 'الأكثر طلباً ومبيعاً 🔥', label: 'قطع نالت إعجاب واختيار العميلات', data: bestSellers },
        { title: 'وصل حديثاً من تشكيلة البيجامات الملكية ✨', label: 'أحدث تصاميم أزياء النوم والقطع الفاخرة', data: newArrivals },
      ].map((section, sectionIdx) => (
        <React.Fragment key={section.title}>
          {sectionIdx === 1 && (
            <ReelsShowcase 
              products={products} 
              onSelectProduct={handleSelectProduct} 
              onAddToCart={handleAddToCart}
            />
          )}
          <section className={`${sectionIdx === 0 ? 'pt-3 sm:pt-5 pb-8 sm:pb-12' : 'py-8 sm:py-12'} ${sectionIdx % 2 === 0 ? 'bg-white' : 'bg-[#F8F9FA]'}`} dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="flex items-center justify-between mb-3 sm:mb-5 pb-2 border-b border-gray-200/80">
                <div className="text-right">
                  <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                    {section.title}
                  </h1>
                  <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5 sm:mt-1">
                    {section.label}
                  </p>
                </div>
                <button
                  onClick={() => setTab('store')}
                  className="text-xs font-bold text-gray-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض الكل</span>
                  <span>←</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {section.data.length > 0 ? section.data.slice(0, 8).map((prod, prodIdx) => {
                  const isFav = favorites.includes(prod.id);

                  return (
                    <div
                      key={prod.id}
                      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg relative select-none cursor-pointer justify-between"
                      onClick={() => handleSelectProduct(prod)}
                    >
                      <div>
                        {/* Top Photo Frame - Full Bleed 3:4 */}
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 rounded-t-2xl">
                          {/* Badges */}
                          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                            <span className="bg-[#E11D48] text-white text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
                              خصم 50%
                            </span>
                            {prod.isBestSeller && (
                              <span className="bg-[#F59E0B] text-black text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
                                الأكثر طلباً 👑
                              </span>
                            )}
                            {prod.featured && (
                              <span className="bg-[#111827] text-white text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
                                جديد ✨
                              </span>
                            )}
                          </div>

                          {/* Favorite Heart Button */}
                          <div className="absolute top-2 right-2 z-10">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(prod.id); }} 
                              className="w-7 h-7 sm:w-8 sm:h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-xs text-gray-500 hover:text-red-500 transition-transform hover:scale-110 cursor-pointer"
                              title="إضافة للمفضلة"
                            >
                              <Heart size={13} className={isFav ? "fill-red-500 text-red-500" : ""} />
                            </button>
                          </div>

                          <SultaImage
                            src={cleanImgUrl(prod.images?.[0] || '', prod.category)}
                            alt={`${prod.nameAr} - ${prod.categoryAr || 'بيجامة'} سولتة`}
                            className="absolute inset-0 w-full h-full"
                            imgClassName="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                            priority={sectionIdx === 0 && prodIdx < 2}
                          />
                        </div>

                        {/* Text details bottom */}
                        <div className="p-2.5 sm:p-3 space-y-1 text-right">
                          <span className="text-[10px] text-gray-400 font-medium block">
                            {prod.categoryAr || prod.category || 'ملابس نوم فاخرة'}
                          </span>
                          <h2 className="text-xs sm:text-sm font-bold text-gray-950 line-clamp-2 leading-snug group-hover:text-black transition-colors">
                            {prod.nameAr || prod.nameEn}
                          </h2>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-1 justify-start pt-0.5">
                            <div className="flex items-center text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg key={i} className={`w-2.5 h-2.5 ${i < Math.round(prod.rating || 5) ? "fill-current" : "text-gray-200"}`} viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">({prod.reviewsCount || 28})</span>
                          </div>
                        </div>
                      </div>

                      {/* Price & Add to Cart button */}
                      <div className="p-2.5 sm:p-3 pt-0 space-y-2 mt-auto">
                        <div className="flex items-baseline justify-between border-t border-gray-100 pt-2">
                          <ProductPrice product={prod} country="SA" size="sm" showBadge={false} />
                          <span className="text-[9.5px] text-gray-400">شامل الضريبة</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const chosenCol = prod.colors?.[0] || { name: 'Rose', hex: '#DF8A9D' };
                            const chosenSz = prod.sizes?.[0] || 'S';
                            handleAddToCart(prod, chosenCol, chosenSz, 1);
                          }}
                          className="w-full py-2 px-2.5 rounded-xl bg-[#111827] hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98 cursor-pointer"
                        >
                          <ShoppingBag size={13} />
                          <span>أضف للسلة</span>
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full text-center text-gray-400 py-6 text-xs">
                    جاري تحديث تشكيلة القطع الحالية.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SALLA LUXURY BOUTIQUE HOOK RIBBON */}
          {sectionIdx === 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-black text-white p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div className="text-right space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-black font-bold text-[11px]">
                    <Sparkles size={11} />
                    <span>تغليف ملكي وتوصيل فوري لجميع مدن المملكة 🇸🇦</span>
                  </div>
                  <h2 className="text-base sm:text-xl font-black tracking-tight text-white font-serif">
                    تشكيلة السلطانة الحصرية - فخامة تليق بأميرات السعودية
                  </h2>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    أجود خامات الحرير والدانتيل الفرنسي مع خصومات مباشرة على كافة القطع الملكية. تسوقي الآن بضمان الجودة والاستبدال السهل.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setTab('offers')}
                    className="w-full sm:w-auto bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>استكشفي التشكيلة الملكية</span>
                    <ArrowLeft size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </React.Fragment>
      ))}

      {/* FEATURES & UNBOXING */}
      <Features homepageSections={homepageSections} />

      {/* NEWSLETTER JOIN SECTION */}
      <section className="py-16 bg-[#F8F9FA] text-gray-900 border-t border-gray-200">
        <div className="max-w-xl mx-auto px-6 text-center space-y-4">
          <span className="text-2xl">💌</span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
            انضمي إلى نادي SULTA الحصري
          </h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            اشتركي لتصلكِ أحدث العروض الحصرية، إشعارات توفر الموديلات الجديدة وكوبونات الخصم قبل الجميع.
          </p>

          {subscribeSuccess ? (
            <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 text-gray-900 text-xs font-bold">
              شكراً لاشتراككِ! تم تسجيل بريدكِ بنجاح. 🌸
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="pt-2 font-sans flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="أدخلي بريدكِ الإلكتروني..."
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                className="flex-1 text-xs border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black text-right"
                required
              />
              <button
                type="submit"
                className="bg-[#111827] text-white hover:bg-black font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
              >
                اشتراك
              </button>
            </form>
          )}
        </div>
      </section>

      {/* TRUST PILLARS BAR */}
      <div className="bg-white border-y border-gray-200/80 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-xs font-semibold text-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-black flex items-center justify-center shrink-0">
              <Truck size={18} />
            </div>
            <div className="text-right">
              <span className="block font-bold text-gray-950 text-xs sm:text-sm">شحن سريع ومجاني</span>
              <span className="text-[10px] sm:text-[11px] text-gray-500">لكافة مدن المملكة للطلبات فوق 299 ر.س 🇸🇦</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-black flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="text-right">
              <span className="block font-bold text-gray-950 text-xs sm:text-sm">سداد بنكي آمن</span>
              <span className="text-[10px] sm:text-[11px] text-gray-500">تحويل فوري لمصرف الراجحي عبر IBAN</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-black flex items-center justify-center shrink-0">
              <RefreshCw size={18} />
            </div>
            <div className="text-right">
              <span className="block font-bold text-gray-950 text-xs sm:text-sm">استبدال واسترجاع سهل</span>
              <span className="text-[10px] sm:text-[11px] text-gray-500">خلال 14 يوماً بكل مرونة</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-black flex items-center justify-center shrink-0">
              <Phone size={18} />
            </div>
            <div className="text-right">
              <span className="block font-bold text-gray-950 text-xs sm:text-sm">دعم فني واتساب</span>
              <a href="https://wa.me/966552823677" className="text-[10px] sm:text-[11px] text-gray-900 font-mono font-bold">0552823677 🇸🇦</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
