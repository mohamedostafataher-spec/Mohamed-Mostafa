import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Critical App Error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    
    if (hasError) {
      return (
        <div className="min-h-screen bg-[#FAF4F5] flex items-center justify-center p-6 text-right font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-red-100 space-y-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertCircle size={32} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-gray-900">نعتذر عن هذا العطل التقني المفاجئ</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                واجه نظام SULTA الملكي خطأً غير متوقع. جاري محاولة التعافي آلياً، أو يمكنك تجربة إعادة تحميل الصفحة.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl text-[10px] text-gray-400 font-mono break-all text-left">
              {error?.message || 'Unknown Runtime Error'}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-[#0B0B0B] text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>إعادة تحميل الصفحة الآن</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-white text-gray-700 border border-gray-200 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Home size={16} />
                <span>العودة للرئيسية</span>
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400">
              إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني عبر واتساب 
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
