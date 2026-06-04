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
      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl animate-scaleIn dir-rtl ${
              t.type === 'success' ? 'bg-[#25D366] text-white' : 
              t.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#0B0B0B] text-[#F6E7A6]'
            }`}
          >
            {t.type === 'success' ? <CheckCircle size={20} /> : t.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
            <p className="text-sm font-bold">{t.message}</p>
            <button onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="opacity-70 hover:opacity-100">
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
