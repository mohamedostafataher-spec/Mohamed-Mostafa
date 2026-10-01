import React, { useState, useEffect } from 'react';
import { AlertCircle, Terminal, Clock, RefreshCw, Filter } from 'lucide-react';
import { errorLogs, LogEntry } from '../utils/logger';

export default function AdminSystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const refreshLogs = () => {
    setLogs([...errorLogs].reverse());
  };

  useEffect(() => {
    refreshLogs();
    const interval = setInterval(refreshLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => filter === 'all' || log.type === filter);

  const types = ['all', ...Array.from(new Set(logs.map(l => l.type)))];

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm font-sans animate-fade-in-rapid">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#0B0B0B] flex items-center gap-2">
            <Terminal className="text-[#A44C5C]" size={20} />
            سجل أخطاء النظام (System Logs)
          </h2>
          <p className="text-xs text-gray-500 mt-1">يتم تحديثه تلقائياً. يعرض المشاكل التقنية مثل فشل تحميل الصور.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none"
          >
            {types.map(t => (
              <option key={t} value={t}>{t === 'all' ? 'جميع الأخطاء' : t}</option>
            ))}
          </select>
          <button onClick={refreshLogs} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <CheckCircleIcon />
            <p className="mt-2 text-sm">النظام يعمل بكفاءة ولا توجد أخطاء مسجلة حالياً.</p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="bg-red-50/50 border border-red-100 p-4 rounded-xl flex gap-4 items-start">
              <div className="mt-0.5">
                <AlertCircle className="text-red-500" size={18} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm text-red-900">{log.type}</h4>
                  <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                </div>
                <p className="text-xs text-red-700">{log.message}</p>
                {log.details && (
                  <pre className="mt-2 text-[9px] text-gray-600 bg-white/60 p-2 rounded-lg border border-red-50 overflow-x-auto" dir="ltr">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-green-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
