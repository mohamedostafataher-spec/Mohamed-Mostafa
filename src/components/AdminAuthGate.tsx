import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  AlertCircle,
  LogIn,
  Lock,
  CheckCircle2,
  LogOut,
  KeyRound,
  Send
} from 'lucide-react';
import { dbService, supabase } from '../services/db';
import { CanonicalAdminRole, normalizeAdminRole, ROLE_LABELS_AR } from '../utils/rbac';

export interface AuthorizedAdminUser {
  email: string;
  name: string;
  role: CanonicalAdminRole;
}

interface AdminAuthGateProps {
  session: any;
  authLoading?: boolean;
  onAuthorized: (user: AuthorizedAdminUser) => void;
  onBackToStore: () => void;
  children: React.ReactNode;
}

const ADMIN_STORAGE_KEY = 'sulta_admin_auth_user';

export default function AdminAuthGate({
  session,
  authLoading = false,
  onAuthorized,
  onBackToStore,
  children
}: AdminAuthGateProps) {
  const [authorizedUser, setAuthorizedUser] = useState<AuthorizedAdminUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authMode, setAuthMode] = useState<'direct' | 'otp' | 'password'>('direct');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);

  const onAuthorizedRef = useRef(onAuthorized);
  useEffect(() => {
    onAuthorizedRef.current = onAuthorized;
  }, [onAuthorized]);

  const authorizeVerifiedUser = (verified: AuthorizedAdminUser) => {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(verified));
    } catch {}
    setAuthorizedUser(verified);
    setUnauthorizedEmail(null);
    onAuthorizedRef.current(verified);
  };

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      if (authLoading) return;

      const sessionEmail = session?.user?.email?.trim().toLowerCase() || '';
      let storedEmail = '';
      try {
        const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.email) storedEmail = String(parsed.email).trim().toLowerCase();
        }
      } catch {}

      const candidateEmail = sessionEmail || storedEmail;
      if (!candidateEmail) {
        if (isMounted) {
          setAuthorizedUser(null);
          setUnauthorizedEmail(null);
          setIsCheckingSession(false);
        }
        return;
      }

      setIsCheckingSession(true);
      try {
        const { authorized, member } = await dbService.checkIsEmailAuthorized(candidateEmail);
        if (!isMounted) return;

        if (authorized && member) {
          const verified: AuthorizedAdminUser = {
            email: member.email,
            name: member.name || member.email.split('@')[0],
            role: normalizeAdminRole(member.role)
          };
          authorizeVerifiedUser(verified);
        } else {
          try {
            localStorage.removeItem(ADMIN_STORAGE_KEY);
          } catch {}
          setAuthorizedUser(null);
          if (sessionEmail) {
            setUnauthorizedEmail(sessionEmail);
          } else {
            setUnauthorizedEmail(null);
          }
        }
      } catch {
        if (isMounted) {
          setAuthorizedUser(null);
          setErrorMessage('تعذر التحقق من الصلاحية حالياً. يرجى المحاولة مرة أخرى.');
        }
      } finally {
        if (isMounted) setIsCheckingSession(false);
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, [session, authLoading]);

  const handleDirectEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صالح.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { authorized, member } = await dbService.checkIsEmailAuthorized(cleanEmail);
      if (authorized && member) {
        const verified: AuthorizedAdminUser = {
          email: member.email,
          name: member.name || member.email.split('@')[0],
          role: normalizeAdminRole(member.role)
        };
        authorizeVerifiedUser(verified);
      } else {
        setErrorMessage('هذا البريد غير مدرج ضمن صلاحيات لوحة التحكم المعتمدة.');
      }
    } catch {
      setErrorMessage('تعذر التحقق من البريد الإلكتروني حالياً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) {
        setErrorMessage(
          'تعذر تشغيل تسجيل الدخول عبر Google OAuth حالياً. يمكنك استخدام الدخول السريع بالبريد أعلاه.'
        );
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء فتح نافذة Google OAuth.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صالح.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) {
        setErrorMessage(error.message || 'تعذر إرسال رابط الدخول. تأكد من تفعيل Email Auth في Supabase.');
      } else {
        setSuccessMessage(
          `تم إرسال رابط الدخول الآمن إلى (${cleanEmail}). افتح بريدك واضغط على الرابط لتسجيل الدخول.`
        );
      }
    } catch {
      setErrorMessage('تعذر الاتصال بخدمة المصادقة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });
      if (error) {
        setErrorMessage('بيانات الدخول غير صحيحة أو الحساب غير مفعّل في Supabase Auth.');
      }
    } catch {
      setErrorMessage('تعذر إتمام تسجيل الدخول.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOutWrongAccount = async () => {
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch {}
    await supabase.auth.signOut().catch(() => {});
    setUnauthorizedEmail(null);
    setAuthorizedUser(null);
  };

  if (authLoading || isCheckingSession) {
    return (
      <div
        className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-4 text-center font-sans"
        dir="rtl"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#FCF5F6] border border-[#A44C5C]/25 text-[#A44C5C] flex items-center justify-center mb-4 animate-pulse">
          <ShieldCheck size={28} />
        </div>
        <p className="text-sm font-bold text-gray-900">جاري التحقق من دخول الإدارة...</p>
        <p className="text-xs text-gray-600 mt-1">سولته · لوحة التحكم</p>
      </div>
    );
  }

  if (authorizedUser) {
    return <>{children}</>;
  }

  return (
    <div
      className="min-h-screen bg-[#FAF9F6] text-gray-950 flex flex-col justify-center items-center px-4 py-10 font-sans"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FCF5F6] border border-[#A44C5C]/25 text-[#A44C5C] flex items-center justify-center">
            <ShieldCheck size={28} />
          </div>
          <h1 className="font-serif text-2xl font-black text-gray-950 pt-1">
            سولته · دخول لوحة التحكم
          </h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            أدخل بريدك الإلكتروني المعتمد لفتح لوحة التحكم مباشرة وفق صلاحيات دورك.
          </p>
        </div>

        {/* Signed in via OAuth but email is NOT in authorized admin_users list */}
        {unauthorizedEmail ? (
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle size={16} className="text-rose-700 shrink-0" />
                <span>الحساب غير مصرح له بالوصول للوحة التحكم</span>
              </div>
              <p className="leading-relaxed">
                أنت مسجل حالياً بالبريد{' '}
                <strong className="font-mono" dir="ltr">
                  {unauthorizedEmail}
                </strong>{' '}
                ولكن هذا البريد غير مدرج في جدول الفريق المصرح له.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOutWrongAccount}
              className="w-full min-h-[44px] bg-[#111827] hover:bg-black text-white text-xs font-bold py-3 px-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              <span>تسجيل الخروج والدخول ببريد آخر</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Auth Method Switcher */}
            <div className="grid grid-cols-3 gap-1.5 bg-[#FAF9F6] p-1 rounded-2xl border border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('direct');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  authMode === 'direct'
                    ? 'bg-white text-[#A44C5C] shadow-2xs border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail size={13} />
                <span>بريد مباشر</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  authMode === 'otp'
                    ? 'bg-white text-[#A44C5C] shadow-2xs border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Send size={13} />
                <span>رابط OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  authMode === 'password'
                    ? 'bg-white text-[#A44C5C] shadow-2xs border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <KeyRound size={13} />
                <span>كلمة مرور</span>
              </button>
            </div>

            {authMode === 'direct' && (
              <form onSubmit={handleDirectEmailSignIn} className="space-y-3">
                <div>
                  <label htmlFor="admin-email-direct" className="block text-xs font-bold text-gray-800 mb-1.5">
                    البريد الإلكتروني المعتمد:
                  </label>
                  <div className="relative">
                    <input
                      id="admin-email-direct"
                      type="email"
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-h-[44px] bg-[#FAF9F6] border border-gray-300 focus:border-[#A44C5C] focus:ring-2 focus:ring-[#A44C5C]/20 rounded-2xl py-2.5 pr-4 pl-10 text-sm font-mono text-left text-gray-950 outline-none"
                      dir="ltr"
                      autoFocus
                      required
                    />
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] bg-[#A44C5C] hover:bg-[#8E3E4D] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-2xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogIn size={16} />
                  <span>{isSubmitting ? 'جاري التحقق...' : 'فتح لوحة التحكم'}</span>
                </button>
              </form>
            )}

            {authMode === 'otp' && (
              <form onSubmit={handleMagicLinkSignIn} className="space-y-3">
                <div>
                  <label htmlFor="admin-email-otp" className="block text-xs font-bold text-gray-800 mb-1.5">
                    البريد الإلكتروني المعتمد:
                  </label>
                  <div className="relative">
                    <input
                      id="admin-email-otp"
                      type="email"
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-h-[44px] bg-[#FAF9F6] border border-gray-300 focus:border-[#A44C5C] focus:ring-2 focus:ring-[#A44C5C]/20 rounded-2xl py-2.5 pr-4 pl-10 text-sm font-mono text-left text-gray-950 outline-none"
                      dir="ltr"
                      required
                    />
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] bg-[#A44C5C] hover:bg-[#8E3E4D] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-2xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال رابط التحقق لبريدي'}</span>
                </button>
              </form>
            )}

            {authMode === 'password' && (
              <form onSubmit={handlePasswordSignIn} className="space-y-3">
                <div>
                  <label htmlFor="admin-email-pw" className="block text-xs font-bold text-gray-800 mb-1.5">
                    البريد الإلكتروني:
                  </label>
                  <input
                    id="admin-email-pw"
                    type="email"
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[44px] bg-[#FAF9F6] border border-gray-300 focus:border-[#A44C5C] rounded-2xl py-2.5 px-4 text-sm font-mono text-left text-gray-950 outline-none"
                    dir="ltr"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="admin-pw" className="block text-xs font-bold text-gray-800 mb-1.5">
                    كلمة المرور:
                  </label>
                  <div className="relative">
                    <input
                      id="admin-pw"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full min-h-[44px] bg-[#FAF9F6] border border-gray-300 focus:border-[#A44C5C] rounded-2xl py-2.5 pr-4 pl-10 text-sm text-left text-gray-950 outline-none"
                      dir="ltr"
                      required
                    />
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] bg-[#A44C5C] hover:bg-[#8E3E4D] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-2xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogIn size={15} />
                  <span>{isSubmitting ? 'جاري التحقق...' : 'دخول لوحة التحكم'}</span>
                </button>
              </form>
            )}

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-gray-200" />
              <span className="shrink mx-3 text-[11px] font-bold text-gray-500">أو عبر Google</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full min-h-[44px] bg-[#111827] hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-2xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn size={15} />
              <span>المتابعة بحساب Google (Supabase OAuth)</span>
            </button>

            {errorMessage && (
              <div
                className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-900 flex items-start gap-2"
                role="alert"
              >
                <AlertCircle size={16} className="text-rose-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-start gap-2"
                role="status"
              >
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Back to store */}
        <div className="text-center pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onBackToStore}
            className="min-h-[44px] px-4 text-xs text-gray-700 hover:text-black transition-colors inline-flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <span>العودة إلى واجهة المتجر الرئيسية</span>
            <ArrowRight size={14} className="rotate-180" />
          </button>
        </div>
      </div>

      {/* Roles Footnote */}
      <p className="text-center text-[11px] text-gray-600 mt-5 max-w-md leading-relaxed">
        الأدوار المعتمدة: {Object.values(ROLE_LABELS_AR).join(' · ')}
      </p>
    </div>
  );
}
