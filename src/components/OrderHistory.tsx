import React, { useState, useEffect } from 'react';
import { supabase } from '../services/db';
import { Order } from '../types';
import { ShoppingBag, Loader2, Package } from 'lucide-react';

export default function OrderHistory({ customerPhone }: { customerPhone: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('phone', customerPhone)
        .order('date', { ascending: false });

      if (!error && data) {
        setOrders(data as Order[]);
      }
      setLoading(false);
    };

    if (customerPhone) fetchOrders();
  }, [customerPhone]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-xl font-bold">تاريخ طلباتك الملكية</h3>
      {orders.length === 0 ? (
        <p className="text-gray-500">لا توجد طلبات سابقة لهذا الرقم.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-150 flex justify-between items-center">
              <div>
                <p className="font-bold">رقم الطلب: {order.id.slice(0, 8)}</p>
                <p className="text-sm text-gray-600">الحالة: {order.status}</p>
              </div>
              <ShoppingBag className="text-[#A44C5C]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
