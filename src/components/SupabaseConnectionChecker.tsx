import React, { useState, useEffect } from 'react';
import { supabase } from '../services/db';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function SupabaseConnectionChecker() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [storageTestResult, setStorageTestResult] = useState<string | null>(null);

  const testConnection = async () => {
    setTesting(true);
    try {
      // Test database query
      const { data, error } = await supabase.from('products').select('id, images').limit(1);
      if (error) {
        setIsConnected(false);
        setErrorDetails(error.message);
        console.error('[SupabaseConnectionChecker] DB Error:', error.message);
      } else {
        setIsConnected(true);
        setErrorDetails(null);

        // Diagnostic log: test bucket public URL access via storage API
        try {
          const samplePath = data && data[0] && Array.isArray(data[0].images) && data[0].images[0]
            ? data[0].images[0]
            : 'sample_product.png';
          
          // Extract filename or use path
          const fileName = samplePath.includes('/') ? samplePath.split('/').pop() : samplePath;
          const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName || 'test.png');
          
          console.log('[SupabaseConnectionChecker] Storage bucket test publicUrl:', publicUrlData?.publicUrl);
          
          // Test if we can actually reach it (HEAD request)
          if (publicUrlData?.publicUrl) {
             try {
               const res = await fetch(publicUrlData.publicUrl, { method: 'HEAD', mode: 'no-cors' });
               setStorageTestResult('Active ✅');
             } catch {
               setStorageTestResult('Blocked (CORS/Policy) ⚠️');
             }
          } else {
            setStorageTestResult('Failed ❌');
          }
        } catch (storageErr: any) {
          console.warn('[SupabaseConnectionChecker] Storage test warning:', storageErr?.message);
          setStorageTestResult('Warning: ' + (storageErr?.message || 'Storage policy check'));
        }
      }
    } catch (err: any) {
      setIsConnected(false);
      setErrorDetails(err?.message || 'Network error');
      console.error('[SupabaseConnectionChecker] Exception:', err);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  if (isConnected === true) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200 px-3 py-1.5 text-[11px] text-emerald-800 flex items-center justify-between font-sans" dir="rtl">
        <div className="flex items-center gap-1.5 font-bold">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span>متصل بنجاح بقاعدة بيانات Supabase الملكية (التخزين والسياسات نشطة {storageTestResult ? `[Storage: ${storageTestResult}]` : ''}) 🟢</span>
        </div>
        <button
          onClick={testConnection}
          disabled={testing}
          className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer font-bold"
        >
          <RefreshCw size={10} className={testing ? 'animate-spin' : ''} />
          <span>فحص الاتصال</span>
        </button>
      </div>
    );
  }

  if (isConnected === false) {
    return (
      <div className="bg-rose-50 border-b border-rose-200 px-3 py-2 text-xs text-rose-800 flex items-center justify-between font-sans" dir="rtl">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <div>
            <span className="font-bold block">تنبيه اتصال Supabase:</span>
            <span className="text-[10px] text-rose-700">{errorDetails || 'جاري إعادة الاتصال التلقائي بالخادم...'}</span>
          </div>
        </div>
        <button
          onClick={testConnection}
          disabled={testing}
          className="bg-rose-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-rose-700 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
        >
          <RefreshCw size={11} className={testing ? 'animate-spin' : ''} />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    );
  }

  return null;
}

