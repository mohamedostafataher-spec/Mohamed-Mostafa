import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, Plus, Minus, History, Search } from 'lucide-react';
import { dbService } from '../services/db';
import { Product, InventoryLog } from '../types';

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLogs, setViewLogs] = useState<string | null>(null);

  useEffect(() => {
    let unmounted = false;
    const unsubP = dbService.subscribeProducts((data) => {
      if (!unmounted) setProducts(data);
    }, () => {});
    const unsubL = dbService.subscribeInventoryLogs((data) => {
      if (!unmounted) {
         setLogs(data);
         setLoading(false);
      }
    }, () => setLoading(false));

    return () => {
      unmounted = true;
      unsubP();
      unsubL();
    };
  }, []);

  const handleAdjustInventory = async (product: Product, size: string, color: string, change: number, reason: string) => {
    try {
      const variant = `${size} - ${color}`;
      await dbService.updateInventory(product.id, variant, change, reason);
      
      // Update overall product stock simply for representation
      const newStock = Math.max(0, product.stock + change);
      await dbService.updateProductStock(product.id, product, newStock);
      
      alert('تم تحديث المخزون بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل التحديث');
    }
  };

  const filteredProducts = products.filter(p => 
    p.nameAr.includes(searchQuery) || 
    p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 font-sans animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-serif text-[#0B0B0B] flex items-center gap-2">
            <Package size={24} className="text-[#A44C5C]" />
            إدارة المخزون
          </h3>
          <p className="text-gray-500 text-xs mt-1">تتبع الكميات وتنبيهات النقص السريع</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="w-full relative">
          <input
            type="text"
            placeholder="بحث بالاسم أو SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-1/3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-[#A44C5C] outline-none"
          />
          <Search size={16} className="absolute left-[33%] top-3 -ml-6 text-gray-400 pointer-events-none hidden md:block" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="p-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">المنتج</th>
              <th className="p-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">SKU</th>
              <th className="p-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">المخزون الكلي</th>
              <th className="p-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">الحالة</th>
              <th className="p-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center p-8 text-gray-400">جاري التحميل...</td></tr>
            ) : filteredProducts.map(p => (
              <React.Fragment key={p.id}>
                <tr className="hover:bg-gray-50/50">
                  <td className="p-4 font-semibold text-sm text-[#0B0B0B]">{p.nameAr} / {p.nameEn}</td>
                  <td className="p-4 text-xs font-mono text-gray-500">{p.sku || '-'}</td>
                  <td className="p-4 text-sm font-bold">{p.stock}</td>
                  <td className="p-4">
                    {p.stock === 0 ? (
                      <span className="text-red-500 flex items-center gap-1 text-[10px] font-bold"><AlertCircle size={14}/> نفدت الكمية</span>
                    ) : p.stock < 10 ? (
                      <span className="text-amber-500 flex items-center gap-1 text-[10px] font-bold"><AlertCircle size={14}/> مخزون منخفض</span>
                    ) : (
                      <span className="text-emerald-500 text-[10px] font-bold">متوفر</span>
                    )}
                  </td>
                  <td className="p-4 flex gap-2">
                    <button 
                      onClick={() => setViewLogs(viewLogs === p.id ? null : p.id)}
                      className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1 font-semibold"
                    >
                      <History size={14} /> التفاصيل
                    </button>
                  </td>
                </tr>
                {viewLogs === p.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-sm font-bold mb-4 border-b pb-2">تعديل سريع</h4>
                          <div className="space-y-4">
                            {p.sizes.map(size => (
                              p.colors.map(color => (
                                <div key={`${size}-${color.name}`} className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: color.hex }}></span>
                                    <span>{size} - {color.name}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => handleAdjustInventory(p, size, color.name, -1, 'مبيعات خارجية')} className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"><Minus size={14}/></button>
                                    <button onClick={() => handleAdjustInventory(p, size, color.name, 1, 'إضافة مخزون')} className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"><Plus size={14}/></button>
                                  </div>
                                </div>
                              ))
                            ))}
                          </div>
                        </div>
                        <div>
                           <h4 className="text-sm font-bold mb-4 border-b pb-2">سجل الحركات الأخير</h4>
                           <div className="space-y-2 max-h-48 overflow-y-auto">
                              {logs.filter(l => l.productId === p.id).length === 0 ? (
                                <p className="text-xs text-gray-400 italic">لا يوجد حركات مسجلة</p>
                              ) : logs.filter(l => l.productId === p.id).slice(0, 10).map((log, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px] bg-white p-2 border border-gray-100 rounded-lg">
                                  <div>
                                    <p className="font-bold">{log.variant}</p>
                                    <p className="text-gray-500 line-clamp-1">{log.reason}</p>
                                  </div>
                                  <div className="text-left font-mono">
                                    <span className={log.change > 0 ? 'text-emerald-500' : 'text-red-500'}>
                                      {log.change > 0 ? '+' : ''}{log.change}
                                    </span>
                                    <p className="text-gray-400 mt-0.5">{new Date(log.date).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
