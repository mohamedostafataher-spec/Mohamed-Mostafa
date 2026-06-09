import React, { useState, useEffect } from 'react';
import { supabase, dbService } from '../services/db';
import { CheckCircle2, AlertCircle, Database, Lock, RefreshCw, Server, HelpCircle } from 'lucide-react';

export default function DatabaseTest() {
  const [results, setResults] = useState<{
    db: { status: 'idle' | 'loading' | 'success' | 'error'; message: string; count?: number; diagnosticDetails?: string };
    auth: { status: 'idle' | 'loading' | 'success' | 'error'; message: string; user?: any };
  }>({
    db: { status: 'idle', message: 'Waiting to test...' },
    auth: { status: 'idle', message: 'Waiting to test...' },
  });

  const testDatabase = async () => {
    setResults(prev => ({ 
      ...prev, 
      db: { status: 'loading', message: 'جاري فحص الاتصال بجدول المنتجات وتدقيق السياسات...' } 
    }));
    
    try {
      // Invoke the robust diagnostic test we created in dbService
      const res = await dbService.testProductsConnection();
      
      setResults(prev => ({
        ...prev,
        db: { 
          status: res.success ? 'success' : 'error', 
          message: res.message, 
          count: res.data?.length || 0,
          diagnosticDetails: res.diagnosticDetails
        }
      }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        db: { 
          status: 'error', 
          message: err.message || 'فشل الاتصال البرمجي بقاعدة البيانات', 
          diagnosticDetails: 'تأكد من ضبط وتمرير متغيرات البيئة بصورة صحيحة وبدء تشغيل ملقم Supabase.'
        }
      }));
    }
  };

  const testAuth = async () => {
    setResults(prev => ({ ...prev, auth: { status: 'loading', message: 'Checking session...' } }));
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      setResults(prev => ({
        ...prev,
        auth: { 
          status: 'success', 
          message: session ? 'Authenticated' : 'Not Authenticated (Public Access Only)',
          user: session?.user || null
        }
      }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        auth: { status: 'error', message: err.message || 'Auth check failed' }
      }));
    }
  };

  useEffect(() => {
    testDatabase();
    testAuth();
  }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'loading': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Server className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6">
          <h1 className="text-3xl font-serif text-[#c5a059] mb-2">تشخيص منظومة البيانات الملكية</h1>
          <p className="text-gray-400 text-sm">اختبار الاتصال المباشر بـ Supabase والتحقق من صلاحيات الوصول</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Test Card */}
          <div className="bg-[#161618] border border-white/10 rounded-2xl p-6 hover:border-[#c5a059]/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#c5a059]/10 rounded-lg">
                    <Database className="w-6 h-6 text-[#c5a059]" />
                  </div>
                  <h2 className="font-serif text-xl text-white">قاعدة البيانات</h2>
                </div>
                <StatusIcon status={results.db.status} />
              </div>
              
              <div className="space-y-4">
                <p className={`text-sm tracking-wide leading-relaxed ${results.db.status === 'error' ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                  {results.db.message}
                </p>
                {results.db.status === 'success' && (
                  <div className="flex items-center gap-2 text-xs text-[#c5a059] bg-[#c5a059]/5 p-2 rounded-lg border border-[#c5a059]/10">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>تم العثور على {results.db.count} منتج في الجدول</span>
                  </div>
                )}
              </div>
            </div>

            {results.db.diagnosticDetails && (
              <div className="mt-5 pt-4 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                  <HelpCircle size={13} className="text-[#c5a059]" />
                  <span>دليل توجيهي واستكشاف الأخطاء:</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5">
                  {results.db.diagnosticDetails}
                </p>
              </div>
            )}
          </div>

          {/* Auth Test Card */}
          <div className="bg-[#161618] border border-white/10 rounded-2xl p-6 hover:border-[#c5a059]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#c5a059]/10 rounded-lg">
                  <Lock className="w-6 h-6 text-[#c5a059]" />
                </div>
                <h2 className="font-serif text-xl text-white">نظام التوثيق</h2>
              </div>
              <StatusIcon status={results.auth.status} />
            </div>
            
            <div className="space-y-4">
              <p className={`text-sm ${results.auth.status === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                {results.auth.message}
              </p>
              {results.auth.user && (
                <div className="p-3 bg-[#0a0a0b] rounded-xl border border-white/5 overflow-hidden">
                  <p className="text-[10px] text-gray-500 mb-1">المستخدم الحالي:</p>
                  <code className="text-[10px] text-[#c5a059] block truncate">
                    {results.auth.user.email}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <button 
            onClick={() => {
              testDatabase();
              testAuth();
            }}
            className="flex items-center gap-2 bg-[#c5a059] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#d8b068] transition-all text-sm"
          >
            <RefreshCw size={16} />
            إعادة تشغيل الفحص الكامل
          </button>
        </div>

        <footer className="pt-12 text-center border-t border-white/5">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-serif">
            SULTA COUTURE INFRASTRUCTURE DIAGNOSTICS v1.0.4
          </p>
        </footer>
      </div>
    </div>
  );
}
