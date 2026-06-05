import React, { useState } from 'react';
import { PackageSearch, Mail, Phone, Package, Send, CheckCircle2, ChevronLeft, MapPin } from 'lucide-react';
import { dbService } from '../services/db';
import { Order } from '../types';

export default function TrackOrder() {
  const [method, setMethod] = useState<'id' | 'email' | 'phone'>('id');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundOrders, setFoundOrders] = useState<Order[] | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // In a real app we'd query Supabase. Since dbService currently gets all orders:
      const orders = await new Promise<Order[]>((resolve) => {
         // Using the subscription to fetch ones (hack for now without writing a new specific query in dbService to avoid over-complicating this prototype)
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
      if (method === 'id') {
        results = orders.filter(o => o.id === query || o.trackingNumber === query);
      } else if (method === 'email') {
        results = orders.filter(o => o.email === query);
      } else if (method === 'phone') {
        results = orders.filter(o => o.phone === query);
      }

      if (results.length === 0) {
        setError('تعذر العثور على طلب بهذا المعرّف. يرجى التأكد من البيانات.');
      } else {
        // Sort by date descending
        setFoundOrders(results.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { label: string, step: number, desc: string }> = {
    new: { label: 'طلب جديد', step: 1, desc: 'تم استلام طلبك وهو قيد المراجعة' },
    processing: { label: 'جاري التجهيز', step: 2, desc: 'نقوم بتغليف وإعداد طلبك بعناية فائقة' },
    shipped: { label: 'تم الشحن', step: 3, desc: 'غادرت الشحنة منشأتنا في طريقها إليك' },
    delivered: { label: 'تم التسليم', step: 4, desc: 'تم إيصال الشحنة بنجاح' }
  };

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

        {foundOrders && foundOrders.map(order => {
          const currentStep = statusMap[order.status]?.step || 1;
          
          return (
            <div key={order.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 mb-6 animate-fade-in" dir="rtl">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-6">
                 <div>
                   <span className="text-gray-400 text-xs font-sans block mb-1">الطلبية رقم</span>
                   <strong className="font-mono text-xl tracking-wider text-gray-900">{order.id}</strong>
                 </div>
                 <div className="text-left">
                   <span className="text-gray-400 text-xs font-sans block mb-1">تاريخ الطلب</span>
                   <span className="text-sm font-bold font-sans">{new Date(order.date).toLocaleDateString('ar-SA')}</span>
                 </div>
              </div>

              {/* Status Stepper */}
              <div className="relative mb-12 mt-8 px-4">
                <div className="absolute top-1/2 left-8 right-8 h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full">
                  <div 
                    className="h-full bg-[#A44C5C] transition-all duration-1000 rounded-full" 
                    style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                  />
                </div>
                
                <div className="flex justify-between relative z-10">
                  {[1, 2, 3, 4].map((stepNumber) => {
                    const isCompleted = stepNumber <= currentStep;
                    const isActive = stepNumber === currentStep;
                    let icon = <Package size={16} />;
                    if (stepNumber === 1) icon = <Package size={16} />;
                    if (stepNumber === 2) icon = <MapPin size={16} />;
                    if (stepNumber === 3) icon = <Send size={16} />;
                    if (stepNumber === 4) icon = <CheckCircle2 size={16} />;

                    return (
                      <div key={stepNumber} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                          ${isActive ? 'bg-[#A44C5C] text-white shadow-lg scale-110' : 
                            isCompleted ? 'bg-[#0B0B0B] text-white' : 'bg-white border-2 border-gray-200 text-gray-300'}`}
                        >
                          {icon}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-4 text-[10px] sm:text-xs font-bold font-sans text-gray-500 text-center px-1">
                  <span className={currentStep >= 1 ? 'text-[#0B0B0B]' : ''}>مُستلم</span>
                  <span className={currentStep >= 2 ? 'text-[#0B0B0B]' : ''}>تجهيز</span>
                  <span className={currentStep >= 3 ? 'text-[#0B0B0B]' : ''}>بالطريق</span>
                  <span className={currentStep >= 4 ? 'text-[#0B0B0B]' : ''}>تم التسليم</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                 <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                   <ChevronLeft size={16} className="text-[#A44C5C]" />
                   تحديث الحالة:
                 </h4>
                 <p className="text-gray-600 font-sans text-sm pr-6">
                   {statusMap[order.status]?.desc || 'جاري معالجة الطلب'}
                 </p>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
