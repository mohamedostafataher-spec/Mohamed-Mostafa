import React, { useState } from 'react';
import { PackageSearch, Mail, Phone, Package, Send, CheckCircle2, ChevronLeft, MapPin, Eye } from 'lucide-react';
import { dbService } from '../services/db';
import { Order } from '../types';
import OrderDetailView from './OrderDetailView';

export default function TrackOrder() {
  const [method, setMethod] = useState<'id' | 'email' | 'phone'>('id');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundOrders, setFoundOrders] = useState<Order[] | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const orders = await new Promise<Order[]>((resolve) => {
         const unsub = dbService.subscribeOrders(
           (data) => {
             unsub();
             resolve(data);
           },
           (err) => {
             unsub();
             resolve([]);
           }
         )
      });

      let results: Order[] = [];
      const trimmedQuery = query.trim().toUpperCase();
      if (method === 'id') {
        results = orders.filter(o => o.id.toUpperCase() === trimmedQuery || (o.trackingNumber && o.trackingNumber.toUpperCase() === trimmedQuery));
      } else if (method === 'email') {
        results = orders.filter(o => o.email && o.email.toLowerCase().trim() === query.toLowerCase().trim());
      } else if (method === 'phone') {
        results = orders.filter(o => o.phone.replace(/\s+/g, '') === query.replace(/\s+/g, ''));
      }

      if (results.length === 0) {
        setError('تعذر العثور على طلب بهذا المعرّف. يرجى التأكد من البيانات.');
      } else {
        const sorted = results.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setFoundOrders(sorted);
        // If exactly one order matches, auto-open the glorious tracking view
        if (sorted.length === 1) {
          setActiveOrderId(sorted[0].id);
        }
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, string> = {
    new: 'طلب جديد',
    pending: 'طلب جديد',
    confirmed: 'تم تأكيد الطلب',
    processing: 'جاري التجهيز',
    packed: 'مغلف وجاهز للتسليم',
    shipped: 'تم الشحن',
    out_for_delivery: 'في التوصيل الاخير',
    delivered: 'تم التسليم بنجاح',
    cancelled: 'ملغي',
    returned: 'مسترجع',
    refunded: 'مسترجع ومسترد'
  };

  if (activeOrderId) {
    return (
      <div className="py-24 px-4 bg-[#FAFAF8] min-h-screen">
        <OrderDetailView orderId={activeOrderId} onClose={() => setActiveOrderId(null)} />
      </div>
    );
  }

  return (
    <div className="py-24 px-4 bg-[#FAFAF8] min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <PackageSearch size={40} className="mx-auto mb-4 text-[#A44C5C]" />
          <h1 className="font-serif text-3xl text-gray-900 mb-2">نافذة التتبع الملكية</h1>
          <p className="text-gray-500 font-sans">تتبعي مسار شحنتك المترفة خطوة بخطوة</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-2 mb-6 p-1 bg-gray-50 rounded-lg w-fit mx-auto" dir="rtl">
            <button onClick={() => setMethod('id')} className={`px-4 py-2 rounded-md text-sm font-bold font-sans transition-all ${method === 'id' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              رقم الطلب
            </button>
            <button onClick={() => setMethod('phone')} className={`px-4 py-2 rounded-md text-sm font-bold font-sans transition-all ${method === 'phone' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              رقم الجوال
            </button>
            <button onClick={() => setMethod('email')} className={`px-4 py-2 rounded-md text-sm font-bold font-sans transition-all ${method === 'email' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              البريد الإلكتروني
            </button>
          </div>

          <form onSubmit={handleTrack} className="space-y-4" dir="rtl">
            <div>
              <input
                type="text"
                placeholder={method === 'id' ? 'أدخلي رقم الطلب (مثال: ST-1234)' : method === 'phone' ? 'أدخلي رقم الجوال' : 'أدخلي بريدك الإلكتروني'}
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full border-b-2 border-gray-200 px-4 py-3 bg-transparent focus:outline-none focus:border-[#A44C5C] transition-colors font-sans text-center text-lg"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center font-sans">{error}</p>}
            <button 
              type="submit" 
              disabled={loading || !query}
              className="w-full bg-[#0B0B0B] text-white py-4 rounded-xl font-bold font-sans hover:bg-[#F4B6C2] transition-colors disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
            >
              {loading ? 'جاري البحث...' : 'ابدأ التتبع'}
            </button>
          </form>
        </div>

        {foundOrders && foundOrders.length > 1 && (
          <div className="space-y-4" dir="rtl">
            <h3 className="font-serif text-sm font-bold text-gray-900 pr-2 border-r-3 border-[#A44C5C] mb-4">طلبيات مطابقة للبحث:</h3>
            {foundOrders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                <div>
                  <div className="text-xs font-mono font-bold text-gray-500">رقم الطلب: {order.id}</div>
                  <div className="text-[11px] font-sans text-gray-400 mt-0.5">التاريخ: {order.date} • القيمة: {order.totalPrice.toLocaleString()} {order.currency}</div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-1 rounded-full font-sans font-bold">
                    {statusMap[order.status] || order.status}
                  </span>
                  <button
                    onClick={() => setActiveOrderId(order.id)}
                    className="flex-1 sm:flex-none text-xs bg-[#0B0B0B] text-white hover:bg-[#A44C5C] px-4 py-2 rounded-xl transition-all font-sans font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>عرض التفاصيل الكاملة</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
