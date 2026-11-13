import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:right-auto sm:left-6 z-[1100] flex flex-col gap-2.5 pointer-events-none max-w-md"
        dir="rtl"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl animate-fade-in border ${
              t.type === 'success'
                ? 'bg-[#FCF5F6] text-[#8E3E4D] border-[#A44C5C]/30'
                : t.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-white text-gray-900 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {t.type === 'success' ? (
                <CheckCircle size={18} className="text-[#A44C5C] shrink-0" />
              ) : t.type === 'error' ? (
                <AlertCircle size={18} className="text-rose-700 shrink-0" />
              ) : (
                <Info size={18} className="text-[#A44C5C] shrink-0" />
              )}
              <p className="text-xs sm:text-sm font-bold font-sans leading-snug">{t.message}</p>
            </div>
            <button
              type="button"
              aria-label="إغلاق الإشعار"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl opacity-75 hover:opacity-100 hover:bg-black/5 cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
