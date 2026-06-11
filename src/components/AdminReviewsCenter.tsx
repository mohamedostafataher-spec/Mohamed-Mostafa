import React, { useState, useMemo } from 'react';
import { Star, MessageSquare, Image as ImageIcon, CheckCircle, XCircle, Trash2, EyeOff, Search, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { dbService, cleanImgUrl } from '../services/db';
import { Review, Product } from '../types';

interface AdminReviewsCenterProps {
  reviews: Review[];
  products: Product[];
}

export default function AdminReviewsCenter({ reviews, products }: AdminReviewsCenterProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Analytics
  const analytics = useMemo(() => {
    const approvedReviews = reviews.filter(r => r.status === 'approved' || !r.status);
    const avgRating = approvedReviews.length > 0 ? approvedReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / approvedReviews.length : 0;
    
    // Group by product
    const productStats = products.map(p => {
      const pReviews = approvedReviews.filter(r => r.productId === p.id || r.productName === p.nameAr);
      const rating = pReviews.length > 0 ? pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length : 0;
      return { ...p, avgRating: rating, reviewCount: pReviews.length };
    }).filter(p => p.reviewCount > 0);
    
    // Sort
    const topRated = [...productStats].sort((a, b) => b.avgRating - a.avgRating).slice(0, 3);
    const lowestRated = [...productStats].sort((a, b) => a.avgRating - b.avgRating).slice(0, 3);
    const mostReviewed = [...productStats].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 3);

    return { total: reviews.length, avgRating, topRated, lowestRated, mostReviewed };
  }, [reviews, products]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (filterStatus !== 'all' && (r.status || 'pending') !== filterStatus) return false;
      if (searchTerm && !`${r.username} ${r.productName} ${r.comment}`.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reviews, filterStatus, searchTerm]);

  const handleStatusChange = async (id: string, status: 'approved' | 'hidden' | 'deleted') => {
    try {
      await dbService.updateReviewStatus(id, status);
      // Let the live subscription handle state update, or force page reload in real scenario
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-right">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-serif text-[#0B0B0B]">إدارة التقييمات والمراجعات</h2>
          <p className="text-sm text-gray-500 font-sans mt-1">الموافقة على آراء العميلات وإدارة معرض الصور</p>
        </div>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start mb-2">
             <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Star className="w-5 h-5" /></div>
             <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-bold">المتوسط</span>
           </div>
           <h3 className="text-2xl font-bold font-sans">{analytics.avgRating.toFixed(1)} <span className="text-sm text-gray-400">/ 5</span></h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start mb-2">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MessageSquare className="w-5 h-5" /></div>
             <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-bold">إجمالي المراجعات</span>
           </div>
           <h3 className="text-2xl font-bold font-sans">{analytics.total}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm md:col-span-2 overflow-x-auto">
           <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-600" /> أعلى القطع تقييماً</h4>
           <div className="flex gap-4">
             {analytics.topRated.map(p => (
               <div key={p.id} className="flex items-center gap-2">
                 <img src={cleanImgUrl(p.images[0], p.category)} className="w-8 h-8 rounded-md object-cover" />
                 <div className="text-right">
                   <p className="text-[10px] font-bold truncate max-w-[100px]">{p.nameAr}</p>
                   <p className="text-[9px] text-amber-500">{'⭐'.repeat(Math.round(p.avgRating))} ({p.reviewCount})</p>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Moderation Panel */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden font-sans">
        <div className="p-4 border-b border-gray-150 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
           <div className="flex items-center gap-2">
             <div className="relative">
               <input 
                 type="text" 
                 placeholder="بحث في المراجعات..."
                 className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs w-64 text-right bg-white"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
               <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
             </div>
           </div>
           <div className="flex gap-2">
             {['all', 'pending', 'approved', 'hidden'].map(status => (
               <button
                 key={status}
                 onClick={() => setFilterStatus(status as any)}
                 className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize ${filterStatus === status ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200'} transition-all`}
               >
                 {status === 'all' ? 'الكل' : status === 'pending' ? 'بانتظار الموافقة' : status === 'approved' ? 'معتمد' : 'مخفي'}
               </button>
             ))}
           </div>
        </div>

        <div className="divide-y divide-gray-150">
           {filteredReviews.length === 0 && (
             <div className="p-8 text-center text-gray-400 text-sm">
               لا توجد مراجعات تطابق البحث
             </div>
           )}
           {filteredReviews.map(r => (
             <div key={r.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start hover:bg-gray-50/50 transition-colors">
               <div className="flex flex-1 gap-4">
                 <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-serif shrink-0">
                   {r.username.charAt(0)}
                 </div>
                 <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{r.username}</span>
                      {r.isVerifiedPurchase && <span className="bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> مشتري موثق</span>}
                      <span className="text-[10px] text-gray-400">{new Date(r.date).toLocaleString('ar-EG')}</span>
                    </div>
                    <div className="text-amber-400 text-sm">{'⭐'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                    <p className="text-xs text-gray-700 font-medium leading-relaxed">{r.comment}</p>
                    <p className="text-[9px] text-pink-600 font-bold mt-1 max-w-[200px] truncate">المنتج: {r.productName}</p>
                    
                    {r.images && r.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {r.images.map((img, idx) => (
                           <div key={idx} className="relative group rounded-md border border-gray-200 overflow-hidden w-16 h-16 bg-gray-50">
                             <img src={cleanImgUrl(img)} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <ImageIcon className="w-4 h-4 text-white" />
                             </div>
                           </div>
                        ))}
                      </div>
                    )}
                 </div>
               </div>

               <div className="flex flex-row md:flex-col gap-2 shrink-0 md:w-32 items-end">
                 {/* Status Badge */}
                 <div className={`text-[10px] font-bold px-2 py-1 rounded-md mb-2 ${
                   (r.status || 'pending') === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                   (r.status || 'pending') === 'hidden' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                   'bg-amber-50 text-amber-700 border border-amber-200'
                 }`}>
                   {(r.status || 'pending') === 'approved' ? 'معتمد ومنشور' : (r.status || 'pending') === 'hidden' ? 'مخفي من المتجر' : 'مراجعة معلقة'}
                 </div>

                 {/* Actions */}
                 <div className="flex items-center gap-1 shrink-0">
                    {(r.status || 'pending') !== 'approved' && (
                      <button onClick={() => handleStatusChange(r.id, 'approved')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors" title="نشر">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {(r.status || 'pending') !== 'hidden' && (
                      <button onClick={() => handleStatusChange(r.id, 'hidden')} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" title="إخفاء">
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => { if(confirm('متأكد من الحذف النهائي للتقييم؟')) handleStatusChange(r.id, 'deleted'); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
