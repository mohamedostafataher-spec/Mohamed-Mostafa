import React, { useEffect } from 'react';
import { AlertTriangle, Inbox, Loader2, RefreshCw, X } from 'lucide-react';

// ============================================================================
// SULTA ADMIN DESIGN SYSTEM (WCAG AA, RTL-first, 44px Touch Targets, #A44C5C)
// ============================================================================

export type AdminButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const AdminButton: React.FC<AdminButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const variantClasses: Record<AdminButtonVariant, string> = {
    primary: 'bg-[#A44C5C] hover:bg-[#8E3E4D] text-white border border-transparent shadow-xs',
    secondary: 'bg-[#111827] hover:bg-black text-white border border-transparent shadow-xs',
    outline: 'bg-white hover:bg-[#FAF8F8] text-gray-800 border border-gray-300',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white border border-transparent shadow-xs',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-transparent'
  };

  const sizeClasses = {
    sm: 'min-h-[44px] px-3.5 py-2 text-xs rounded-xl',
    md: 'min-h-[44px] px-4 py-2.5 text-xs sm:text-sm rounded-xl',
    lg: 'min-h-[48px] px-5 py-3 text-sm rounded-2xl'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A44C5C] focus-visible:ring-offset-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin shrink-0" /> : icon}
      {children}
    </button>
  );
};

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const AdminCard: React.FC<AdminCardProps> = ({
  children,
  className = '',
  padding = 'md'
}) => {
  const padClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };
  return (
    <section
      className={`bg-white rounded-2xl border border-gray-200/90 shadow-2xs ${padClasses[padding]} ${className}`}
    >
      {children}
    </section>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: 'brand' | 'emerald' | 'amber' | 'rose' | 'neutral';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  hint,
  icon,
  accent = 'neutral',
  onClick
}) => {
  const accentBg = {
    brand: 'bg-[#FCF5F6] text-[#A44C5C] border-[#A44C5C]/20',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200'
  }[accent];

  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 text-right shadow-2xs flex items-start justify-between gap-3 w-full ${
        onClick ? 'hover:border-[#A44C5C]/50 hover:shadow-sm transition-all cursor-pointer min-h-[44px]' : ''
      }`}
    >
      <div className="min-w-0 space-y-1">
        <span className="text-xs font-bold text-gray-600 block">{label}</span>
        <div className="text-xl sm:text-2xl font-black text-gray-950 font-mono tabular-nums truncate">
          {value}
        </div>
        {hint && <span className="text-[11px] text-gray-600 block">{hint}</span>}
      </div>
      {icon && (
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${accentBg}`}>
          {icon}
        </div>
      )}
    </Wrapper>
  );
};

export type AdminBadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const AdminBadge: React.FC<{
  tone?: AdminBadgeTone;
  children: React.ReactNode;
  className?: string;
}> = ({ tone = 'neutral', children, className = '' }) => {
  const toneClasses: Record<AdminBadgeTone, string> = {
    brand: 'bg-[#FCF5F6] text-[#8E3E4D] border-[#A44C5C]/25',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    danger: 'bg-rose-50 text-rose-900 border-rose-200',
    info: 'bg-sky-50 text-sky-900 border-sky-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const AdminInput: React.FC<AdminInputProps> = ({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? `admin-input-${label.replace(/\s+/g, '-')}` : undefined);
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-gray-800">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full min-h-[44px] bg-[#FAF9F6] border ${
          error ? 'border-rose-500' : 'border-gray-300'
        } focus:bg-white focus:border-[#A44C5C] focus:ring-2 focus:ring-[#A44C5C]/20 rounded-xl px-3.5 py-2.5 text-sm text-gray-950 placeholder:text-gray-500 outline-none transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}
      {hint && !error && <p className="text-[11px] text-gray-600">{hint}</p>}
    </div>
  );
};

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const AdminSelect: React.FC<AdminSelectProps> = ({
  label,
  error,
  id,
  children,
  className = '',
  ...props
}) => {
  const selectId = id || (label ? `admin-select-${label.replace(/\s+/g, '-')}` : undefined);
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-bold text-gray-800">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full min-h-[44px] bg-[#FAF9F6] border ${
          error ? 'border-rose-500' : 'border-gray-300'
        } focus:bg-white focus:border-[#A44C5C] focus:ring-2 focus:ring-[#A44C5C]/20 rounded-xl px-3.5 py-2.5 text-sm text-gray-950 outline-none transition-all cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}
    </div>
  );
};

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  details?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'تأكيد الإجراء',
  cancelLabel = 'إلغاء',
  variant = 'danger',
  isLoading = false,
  details,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      dir="rtl"
    >
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isLoading) onCancel();
        }}
      />
      <div className="relative bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-5 text-right z-10 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                variant === 'danger'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-[#FCF5F6] text-[#A44C5C] border-[#A44C5C]/25'
              }`}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 id="confirm-modal-title" className="font-bold text-base text-gray-950">
                {title}
              </h3>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="إغلاق النافذة"
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {details && (
          <div className="bg-[#FAF9F6] rounded-2xl p-3.5 border border-gray-200 text-xs text-gray-800">
            {details}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
          <AdminButton
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </AdminButton>
          <AdminButton
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={isLoading}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
};

export const AdminSkeleton: React.FC<{ rows?: number; cards?: number }> = ({
  rows = 5,
  cards = 4
}) => (
  <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="جاري التحميل">
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: cards }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-7 w-32 bg-gray-200 rounded" />
          <div className="h-2.5 w-20 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <div className="h-4 w-44 bg-gray-200 rounded mb-4" />
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-12 bg-gray-100 rounded-xl w-full" />
      ))}
    </div>
  </div>
);

export const AdminEmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center space-y-3">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF8F8] border border-gray-200 text-gray-500 flex items-center justify-center">
      {icon || <Inbox size={26} />}
    </div>
    <h3 className="text-sm sm:text-base font-bold text-gray-950">{title}</h3>
    {description && (
      <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
    )}
    {action && <div className="pt-2 flex justify-center">{action}</div>}
  </div>
);

export const AdminErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'تعذر تحميل البيانات', message, onRetry }) => (
  <div
    className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 text-center space-y-3"
    role="alert"
  >
    <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
      <AlertTriangle size={22} />
    </div>
    <h3 className="text-sm sm:text-base font-bold text-rose-950">{title}</h3>
    <p className="text-xs sm:text-sm text-rose-800 max-w-md mx-auto leading-relaxed">{message}</p>
    {onRetry && (
      <div className="pt-2 flex justify-center">
        <AdminButton variant="outline" onClick={onRetry} icon={<RefreshCw size={15} />}>
          إعادة المحاولة
        </AdminButton>
      </div>
    )}
  </div>
);
