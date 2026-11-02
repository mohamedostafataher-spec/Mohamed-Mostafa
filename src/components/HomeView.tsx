import React from 'react';
import { Sparkles, ShoppingBag, Heart, ArrowLeft, Truck, ShieldCheck, RefreshCw, Phone } from 'lucide-react';
import SultaImage from "./SultaImage";
import { cleanImgUrl } from '../services/db';
import { Product, Collection } from '../types';
import { ProductPrice } from './ProductPrice';
import ReelsShowcase from './ReelsShowcase';
import Features from './Features';
import SEO from './SEO';
import { getProductSlug } from '../utils/slugify';
import ProductCard from './ProductCard';

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
  settings?: any;
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
  handleSubscribe,
  settings
}) => {
  return (
    <div className="space-y-0">
      <SEO 
        title="بيجامات نسائية قطن ووان سايز | سولته"
        description="تسوقي بيجامات نسائية من قطن ناعم ومريح بمقاس وان سايز يناسب من 45 إلى 80 كيلو. تصاميم أنثوية بكميات محدودة من سولته."
        path="/"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 text-right">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mb-0">
          بيجامات نسائية قطن ناعمة — سولته
        </h1>
      </div>

      {/* DYNAMIC HOMEPAGE PRODUCT SECTIONS */}
      {[
        { title: 'الأكثر طلباً ومبيعاً 🔥', label: 'قطع نالت إعجاب واختيار العميلات', data: bestSellers },
        { title: 'وصل حديثاً من تشكيلة البيجامات القطنية ✨', label: 'أحدث تصاميم أزياء النوم والقطع المريحة', data: newArrivals },
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
                  <h2 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                    {section.title}
                  </h2>
                  <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5 sm:mt-1">
                    {section.label}
                  </p>
                </div>
                <button
                  onClick={() => setTab('store')}
                  className="text-xs font-bold text-gray-900 hover:underline flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#A44C5C] focus-visible:ring-offset-2 rounded-lg px-2 py-1"
                  aria-label={`عرض كل منتجات ${section.title}`}
                >
                  <span>عرض الكل</span>
                  <span>←</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {section.data.length > 0 ? section.data.slice(0, 8).map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    favorites={favorites || []}
                    isFavorite={Array.isArray(favorites) ? favorites.includes(prod.id) : false}
                    toggleFavorite={toggleFavorite}
                    onToggleFavorite={() => toggleFavorite?.(prod.id)}
                    onSelect={() => handleSelectProduct?.(prod)}
                    onSelectProduct={handleSelectProduct}
                    onAddToCart={(p, c, s, q) => {
                      const chosenCol = c || prod.colors?.[0] || { name: 'Rose', hex: '#DF8A9D' };
                      const chosenSz = s || prod.sizes?.[0] || 'S';
                      handleAddToCart(prod, chosenCol, chosenSz, q || 1);
                    }}
                  />
                )) : (
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
                    تشكيلة السلطانة الحصرية — أناقة تليق بكِ
                  </h2>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    أرقى تصاميم ملابس النوم والبيجامات القطنية المريحة بضمان الجودة والاستبدال السهل. تسوقي الآن واستمتعي بتغليف ملكي.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setTab('offers')}
                    className="w-full sm:w-auto bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    aria-label="استكشفي التشكيلة الملكية الحصرية"
                  >
                    <span>استكشفي التشكيلة الملكية</span>
                    <ArrowLeft size={13} aria-hidden="true" />
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
            انضمي إلى نادي Sulta الحصري
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
                className="bg-[#111827] text-white hover:bg-black font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                aria-label="اشتركي الآن في النشرة البريدية"
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
