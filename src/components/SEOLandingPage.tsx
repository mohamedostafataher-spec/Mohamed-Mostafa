import React from 'react';
import { Sparkles, ArrowLeft, Filter } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import SEO from './SEO';

interface SEOLandingPageProps {
  keyword: string;
  titleAr: string;
  descriptionAr: string;
  products: Product[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onSelectProduct: (p: Product) => void;
  path: string;
}

export default function SEOLandingPage({
  keyword,
  titleAr,
  descriptionAr,
  products,
  favorites,
  toggleFavorite,
  onSelectProduct,
  path
}: SEOLandingPageProps) {
  // Filter products by keyword in name or description
  const filteredProducts = products.filter(p => 
    p.status === 'active' && 
    (p.nameAr.toLowerCase().includes(keyword.toLowerCase()) || 
     p.descriptionAr.toLowerCase().includes(keyword.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right" dir="rtl">
      <SEO 
        title={titleAr}
        description={descriptionAr}
        path={path}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-8 uppercase tracking-widest">
        <a href="/" className="hover:text-[#A44C5C] transition-colors">الرئيسية</a>
        <span>/</span>
        <a href="/store" className="hover:text-[#A44C5C] transition-colors">المتجر</a>
        <span>/</span>
        <span className="text-gray-900">{keyword}</span>
      </nav>

      {/* Hero Header */}
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-2 text-[#A44C5C] text-xs font-black">
          <Sparkles size={14} />
          <span className="tracking-widest uppercase">مجموعة Sulta المختارة</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-950 font-serif leading-tight">
          {titleAr}
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-3xl leading-relaxed">
          {descriptionAr}
        </p>
      </div>

      {/* Result Count & Filter Status */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <Filter size={14} />
          <span>تم العثور على {filteredProducts.length} قطعة</span>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold italic text-sm">
            نعتذر غاليتي، لم نجد قطعاً تطابق هذا البحث حالياً. استكشفي أحدث وصل حديثاً من الصفحة الرئيسية ✨
          </p>
          <a 
            href="/store"
            className="mt-6 inline-flex items-center gap-2 text-[#A44C5C] font-black text-xs hover:underline"
          >
            <span>العودة لجميع تشكيلات المتجر</span>
            <ArrowLeft size={14} />
          </a>
        </div>
      )}

      {/* SEO Content Block (Footer) */}
      <div className="mt-20 p-8 bg-[#FAF8F8] rounded-[2.5rem] border border-[#A44C5C]/5">
        <h2 className="text-xl font-black text-gray-950 mb-4 font-serif">
          لماذا تختارين {keyword} من متجر سولته؟
        </h2>
        <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-600 leading-relaxed">
          <div className="space-y-3">
            <p>
              في سولته، ندرك أن ملابس النوم هي جزء أساسي من روتينك اليومي للاسترخاء. لذلك، نحرص على توفير <span className="font-bold text-gray-900">{keyword}</span> بأعلى معايير الجودة السعودية.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#A44C5C]">✦</span>
                <span>أقمشة قطنية ناعمة 100% تسمح للبشرة بالتنفس.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#A44C5C]">✦</span>
                <span>تصاميم عصرية تناسب الذوق الرفيع.</span>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p>
              جميع قطعنا تأتي بمقاس وان سايز (One Size) المدروس بعناية ليناسب الأوزان من 45 إلى 80 كيلو، مما يضمن لكِ راحة تامة وحرية في الحركة طوال الليل.
            </p>
            <p className="font-bold text-[#A44C5C]">
              شحن مجاني للطلبات فوق 299 ر.س وتوصيل سريع لكافة مناطق المملكة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
