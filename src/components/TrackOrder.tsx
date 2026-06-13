import React, { useState, useEffect } from 'react';
import { 
  PackageSearch, Mail, Phone, Package, Send, CheckCircle2, ChevronLeft, 
  MapPin, Eye, Clock, ShieldCheck, Box, Truck, Sparkles, Check, Search, Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';
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

  useEffect(() => {
    // 1. Check direct query parameters first
    const params = new URLSearchParams(window.location.search);
    const trackingId = params.get('id') || params.get('track');
    if (trackingId) {
      setActiveOrderId(trackingId);
      return;
    }

    // 2. Check router-transition path parameter fallback stored in localStorage
    const savedId = window.localStorage.getItem('sulta_auto_track_order_id');
    if (savedId) {
      setActiveOrderId(savedId);
      window.localStorage.removeItem('sulta_auto_track_order_id');
    }
  }, []);

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
      const cleanedQueryNum = query.replace(/\D/g, ''); // leave only digits for phone matching

      if (method === 'id') {
        results = orders.filter(o => 
          o.id.toUpperCase() === trimmedQuery || 
          (o.trackingNumber && o.trackingNumber.toUpperCase() === trimmedQuery) ||
          (o.id.split('-')[0].toUpperCase() === trimmedQuery)
        );
      } else if (method === 'email') {
        results = orders.filter(o => o.email && o.email.toLowerCase().trim() === query.toLowerCase().trim());
      } else if (method === 'phone') {
        results = orders.filter(o => o.phone.replace(/\D/g, '').includes(cleanedQueryNum) || cleanedQueryNum.includes(o.phone.replace(/\D/g, '')));
      }

      // Magic Fallback search: if no results are found, scan all parameters for a smart match regardless of method selected
      if (results.length === 0) {
        results = orders.filter(o => {
          const matchedId = o.id.toUpperCase() === trimmedQuery || (o.trackingNumber && o.trackingNumber.toUpperCase() === trimmedQuery) || (o.id.split('-')[0].toUpperCase() === trimmedQuery);
          const matchedEmail = o.email && o.email.toLowerCase().trim() === query.toLowerCase().trim();
          const oPhoneClean = o.phone.replace(/\D/g, '');
          const matchedPhone = cleanedQueryNum.length >= 4 && (oPhoneClean.includes(cleanedQueryNum) || cleanedQueryNum.includes(oPhoneClean));
          return matchedId || matchedEmail || matchedPhone;
        });
      }

      if (results.length === 0) {
        setError('تعذر العثور على أي طلبيات مطابقة. يرجى مراجعة إدخال البيانات ثانيةً.');
      } else {
        const sorted = results.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setFoundOrders(sorted);
        // If exactly one order matches, auto-open the glorious tracking view
        if (sorted.length === 1) {
          setActiveOrderId(sorted[0].id);
        }
      }
    } catch (err) {
      setError('حدث خطأ فني أثناء البحث، يرجى التحديث والمحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'new':
      case 'pending':
        return {
          icon: Clock,
          colorClass: 'text-amber-700 bg-amber-50/75 border-amber-200/50',
          label: 'طلب جديد ⏳'
        };
      case 'confirmed':
        return {
          icon: ShieldCheck,
          colorClass: 'text-indigo-700 bg-indigo-50/75 border-indigo-200/50',
          label: 'تم التأكيد والمراجعة ✅'
        };
      case 'processing':
        return {
          icon: Sparkles,
          colorClass: 'text-[#DF8A9C] bg-pink-50/60 border-pink-100',
          label: 'جاري التجهيز والتغليف 📦'
        };
      case 'packed':
        return {
          icon: Box,
          colorClass: 'text-purple-700 bg-purple-50/60 border-purple-100',
          label: 'جاهز لمندوب الشحن 🏷️'
        };
      case 'shipped':
        return {
          icon: Truck,
          colorClass: 'text-blue-700 bg-blue-50/75 border-blue-200/50',
          label: 'تم الشحن للناقل السريع 🚚'
        };
      case 'out_for_delivery':
        return {
          icon: MapPin,
          colorClass: 'text-[#A44C5C] bg-[#FAF4F5] border-[#DF8A9C]/20',
          label: 'في الطريق مع المندوب الملكي 📍'
        };
      case 'delivered':
        return {
          icon: CheckCircle2,
          colorClass: 'text-emerald-800 bg-emerald-50/70 border-emerald-200/50',
          label: 'تم التسليم النهائي 🎉'
        };
      case 'cancelled':
        return {
          icon: Check,
          colorClass: 'text-rose-700 bg-rose-50/75 border-rose-200/50',
          label: 'ملغي ❌'
        };
      case 'returned':
      case 'refunded':
        return {
          icon: Check,
          colorClass: 'text-slate-700 bg-slate-50/75 border-slate-200/50',
          label: 'مسترجع ↩️'
        };
      default:
        return {
          icon: Package,
          colorClass: 'text-gray-700 bg-gray-50 border-gray-150',
          label: 'قيد المعالجة'
        };
    }
  };

  if (activeOrderId) {
    return (
      <div className="py-24 px-4 bg-[#FCFAF7] min-h-screen">
        <OrderDetailView orderId={activeOrderId} onClose={() => setActiveOrderId(null)} />
      </div>
    );
  }

  return (
    <div className="py-24 px-4 bg-[#FCFAF7] min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Decorative luxury vector highlights */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-[#DF8A9C]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-96 h-96 bg-amber-500/3 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-2xl w-full mx-auto relative z-15">
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex p-3 bg-white/80 rounded-2.5xl shadow-xs border border-amber-900/5 mb-4 items-center justify-center shrink-0">
            <PackageSearch size={36} className="text-[#A44C5C] stroke-1.25" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#A44C5C]/70 block mb-1 font-sans">SULTA Atelier & Boutique</span>
          <h1 className="font-serif text-3.5xl text-gray-950 font-light tracking-tight mb-2.5">بوابة التتبع المباشرة</h1>
          <p className="text-gray-500 font-sans text-xs max-w-sm mx-auto leading-relaxed">أدخلي بيانات طلبكِ الحريري للاستعلام العاجل ومتابعة رحلة الباقة الملكية حتى عتبة داركم.</p>
        </motion.div>

        {/* Grand Luxury Segment Switcher & Control Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-3.5xl shadow-xl shadow-amber-950/2 border border-amber-900/5 mb-8 text-right"
        >
          <div className="flex gap-1.5 mb-8 p-1 bg-gray-100/70 rounded-2xl w-fit mx-auto border border-gray-200/40" dir="rtl">
            <button 
              onClick={() => { setMethod('id'); setQuery(''); setError(''); }} 
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${method === 'id' ? 'bg-white shadow-xs text-gray-950 border border-gray-150' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Package size={13} className={method === 'id' ? 'text-[#A44C5C]' : ''} />
              <span>رقم الطلب</span>
            </button>
            <button 
              onClick={() => { setMethod('phone'); setQuery(''); setError(''); }} 
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${method === 'phone' ? 'bg-white shadow-xs text-gray-950 border border-gray-150' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Smartphone size={13} className={method === 'phone' ? 'text-[#A44C5C]' : ''} />
              <span>رقم الجوال</span>
            </button>
            <button 
              onClick={() => { setMethod('email'); setQuery(''); setError(''); }} 
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${method === 'email' ? 'bg-white shadow-xs text-gray-950 border border-gray-150' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Mail size={13} className={method === 'email' ? 'text-[#A44C5C]' : ''} />
              <span>البريد الإلكتروني</span>
            </button>
          </div>

          <form onSubmit={handleTrack} className="space-y-6" dir="rtl">
            <div className="relative group">
              <input
                type="text"
                placeholder={
                  method === 'id' 
                    ? 'أدخلي رقم الطلب الملكي (مثال: ST-1234)' 
                    : method === 'phone' 
                      ? 'أدخلي رقم الجوال المعتمد بالفاتورة' 
                      : 'أدخلي بريدك الإلكتروني المستخدم للشراء'
                }
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full border-b border-gray-200 px-4 py-4 bg-transparent focus:outline-none focus:border-[#A44C5C]/80 transition-all font-sans text-center text-lg text-gray-950 placeholder-gray-400 font-light tracking-wide focus:placeholder-transparent"
                autoFocus
                required
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#DF8A9C] to-[#A44C5C] transition-all duration-500 group-focus-within:w-full" />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center"
              >
                <p className="text-rose-700 text-xs font-sans font-semibold">{error}</p>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading || !query}
              className="w-full bg-[#0B0B0B] text-white py-4.5 rounded-2.5xl font-sans text-xs font-bold tracking-widest uppercase hover:bg-[#A44C5C] hover:shadow-lg hover:shadow-[#A44C5C]/10 transition-all active:scale-[0.99] disabled:opacity-40 select-none mt-6 flex justify-center items-center gap-2 cursor-pointer shadow-md shadow-gray-950/5 border border-white/5"
            >
              {loading ? (
                <>
                  <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span>جاري البحث في الأرشيف...</span>
                </>
              ) : (
                <>
                  <Search size={14} strokeWidth={2.5} />
                  <span>بدء الاستعلام الفوري</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Multiple Matches Card Layout */}
        {foundOrders && foundOrders.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4" 
            dir="rtl"
          >
            <div className="flex items-center gap-2 pr-2 mb-4">
              <span className="w-1.5 h-3 bg-[#A44C5C] rounded-full" />
              <h3 className="font-serif text-[13px] font-bold text-gray-950">لقد عثرنا على عِدة طلبيات متطابقة:</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {foundOrders.map(order => {
                const statusDetails = getStatusDetails(order.status);
                const StatusIcon = statusDetails.icon;

                return (
                  <div 
                    key={order.id} 
                    className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-gray-150/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#DF8A9C]/40 hover:shadow-md transition-all duration-300"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-150">
                          {order.id}
                        </span>
                        <span className="text-[10px] text-gray-400 font-sans">
                          {order.date}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-gray-500 leading-relaxed">
                        العميلة: <strong className="text-gray-800 font-semibold">{order.customerName}</strong> • الشحنة لمدينة: <strong className="text-gray-800 font-semibold">{order.city}</strong>
                      </p>
                      <p className="text-[11px] font-serif font-bold text-[#A44C5C]">
                        الإجمالي الصافي: {order.totalPrice.toLocaleString()} {order.currency}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 self-stretch sm:self-center">
                      <span className={`text-[10px] flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-sans font-bold leading-none ${statusDetails.colorClass}`}>
                        <StatusIcon size={12} strokeWidth={2.5} />
                        <span>{statusDetails.label}</span>
                      </span>

                      <button
                        onClick={() => setActiveOrderId(order.id)}
                        className="flex-1 sm:flex-none text-[10px] bg-[#0B0B0B] text-white hover:bg-[#A44C5C] px-4 py-2.5 rounded-xl transition-all font-sans font-bold flex items-center justify-center gap-1.5 hover:shadow-sm cursor-pointer select-none"
                      >
                        <Eye size={12} strokeWidth={2.5} />
                        <span>عرض لوحة التتبع</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

