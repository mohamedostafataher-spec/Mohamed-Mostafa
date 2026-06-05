import React, { useState, useEffect } from 'react';
import { History, Search, ShieldAlert } from 'lucide-react';
import { dbService } from '../services/db';
import { ActivityLog } from '../types';

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = dbService.subscribeActivityLogs(
      (data) => {
        setLogs(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-serif text-[#0B0B0B] flex items-center gap-2">
            <ShieldAlert size={20} className="text-[#A44C5C]" />
            سجل نشاط الإدارة
          </h3>
          <p className="text-gray-500 text-xs mt-1">تتبع التعديلات والعمليات في النظام</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-[10px] uppercase text-gray-500 font-bold">تاريخ</th>
              <th className="p-3 text-[10px] uppercase text-gray-500 font-bold">الإجراء</th>
              <th className="p-3 text-[10px] uppercase text-gray-500 font-bold">التفاصيل</th>
              <th className="p-3 text-[10px] uppercase text-gray-500 font-bold">المسؤول</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan={4} className="text-center p-8 text-gray-400">جاري التحميل...</td></tr>
            ) : logs.length === 0 ? (
               <tr><td colSpan={4} className="text-center p-8 text-gray-400">لا يوجد بيانات مسجلة</td></tr>
            ) : logs.slice(0,100).map(l => (
              <tr key={l.id} className="border-b hover:bg-gray-50 text-xs">
                <td className="p-3 text-gray-500 font-mono" dir="ltr">{new Date(l.date).toLocaleString()}</td>
                <td className="p-3 font-semibold text-gray-700">{l.action}</td>
                <td className="p-3 text-gray-600 line-clamp-2" title={l.details}>{l.details}</td>
                <td className="p-3 text-gray-500">{l.adminId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
