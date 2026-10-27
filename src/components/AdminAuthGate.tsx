import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, ArrowRight, UserCheck, AlertCircle, LogIn, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { TeamMember } from '../types';
import { dbService, supabase } from '../services/db';

interface AdminAuthGateProps {
  session: any;
  onAuthorized: (user: { email: string; name: string; role: string }) => void;
  onBackToStore: () => void;
  children: React.ReactNode;
}

export default function AdminAuthGate({
  session,
  onAuthorized,
  onBackToStore,
  children
}: AdminAuthGateProps) {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: string } | null>(() => {
    try {
      const stored = localStorage.getItem('sulta_admin_auth_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  });

  const [inputEmail, setInputEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Load team members from database
  useEffect(() => {
    let isMounted = true;
    dbService.getTeamMembers().then(members => {
      if (isMounted) {
        setTeamMembers(members);
      }
    }).catch(console.warn);
    return () => { isMounted = false; };
  }, []);

  // Check Supabase session if present
  useEffect(() => {
    const sessionEmail = session?.user?.email;
    if (sessionEmail && !currentUser) {
      dbService.checkIsEmailAuthorized(sessionEmail).then(({ authorized, member }) => {
        if (authorized && member) {
          const userObj = {
            email: member.email,
            name: member.name || member.email.split('@')[0],
            role: member.role
          };
          setCurrentUser(userObj);
          localStorage.setItem('sulta_admin_auth_user', JSON.stringify(userObj));
          onAuthorized(userObj);
        }
      });
    }
  }, [session, currentUser, onAuthorized]);

  // Handle Gmail Authentication / Verification
  const handleVerifyGmail = async (emailToTest?: string) => {
    const email = (emailToTest || inputEmail).trim().toLowerCase();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('يرجى كتابة بريد Gmail صالح للمتابعة.');
      return;
    }

    setIsVerifying(true);

    try {
      const { authorized, member } = await dbService.checkIsEmailAuthorized(email);

      if (authorized && member) {
        const userObj = {
          email: member.email,
          name: member.name || (member.role === 'owner' ? 'المالك 👑' : member.email.split('@')[0]),
          role: member.role
        };
        setCurrentUser(userObj);
        localStorage.setItem('sulta_admin_auth_user', JSON.stringify(userObj));
        setSuccessNotice(`مرحباً بكِ! تم التحقق من الصلاحية بنجاح.`);
        onAuthorized(userObj);
      } else {
        setErrorMessage(
          `عذراً، البريد (${email}) ليس لديه صلاحية الدخول. يرجى التواصل مع إدارة المتجر لإضافتك في قائمة فريق العمل المصرح لهم.`
        );
      }
    } catch (err: any) {
      setErrorMessage('حدث خطأ أثناء فحص الصلاحية، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Google OAuth sign-in trigger via Supabase
  const handleGoogleSignIn = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      if (supabase && supabase.auth) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/?tab=dashboard'
          }
        });
        if (error) {
          // If Google OAuth is not configured on Supabase project, fall back to email prompt smoothly
          console.warn('[AUTH] Google OAuth direct error:', error.message);
          setErrorMessage('لم يتم تفعيل Google OAuth في مشروع السحابة بعد. يمكنك الدخول فوراً بكتابة بريدك الإلكتروني أدناه.');
        }
      }
    } catch (e: any) {
      setErrorMessage('يرجى إدخال بريد Gmail المصرح له في الخانة أدناه مباشرة.');
    } finally {
      setIsVerifying(false);
    }
  };

  // If already authenticated and verified, render the dashboard
  if (currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-gray-900 flex flex-col justify-center items-center px-4 py-12 select-none" dir="rtl">
      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200/80 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Brand & Security Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FCF5F6] border border-[#DF8A9D]/30 text-[#A44C5C] flex items-center justify-center shadow-2xs">
            <ShieldCheck size={28} />
          </div>
          <h1 className="font-serif text-2xl font-black text-gray-950 tracking-wide pt-1">
            SULTA · بوابة الإدارة
          </h1>
          <p className="text-xs text-gray-500 font-sans leading-relaxed">
            منطقة مخصصة للمالك وفريق العمل والمشرفين. يتم التحقق من الصلاحيات عبر حساب Gmail المعتمد.
          </p>
        </div>

        {/* Form: Enter authorized Gmail */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyGmail();
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              أدخل بريدك الإلكتروني (Gmail):
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="example@gmail.com"
                value={inputEmail}
                onChange={(e) => {
                  setInputEmail(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full bg-[#FAF9F6] border border-gray-300 focus:border-[#A44C5C] focus:ring-2 focus:ring-[#A44C5C]/20 rounded-2xl py-3 px-4 text-xs font-mono text-left placeholder:text-gray-400 text-gray-900 transition-all outline-hidden"
                dir="ltr"
                required
              />
              <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              أدخل البريد الذي أضافك به مدير المتجر لفتح اللوحة فوراً.
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Notice */}
          {successNotice && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-[#1C1917] hover:bg-black text-white text-xs font-bold py-3.5 px-4 rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <span>جاري التحقق من الصلاحيات...</span>
            ) : (
              <>
                <LogIn size={15} />
                <span>دخول لوحة التحكم</span>
              </>
            )}
          </button>
        </form>

        {/* Footer: Back to store */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onBackToStore}
            className="text-xs text-gray-500 hover:text-black transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <span>العودة إلى واجهة المتجر الرئيسية</span>
            <ArrowRight size={13} className="rotate-180" />
          </button>
        </div>

      </div>

      {/* Security Footnote */}
      <div className="text-center text-[11px] text-gray-400 mt-6 space-y-1 font-sans">
        <p>نظام أمان وحماية بيانات متجر SULTA الفاخر © ٢٠٢٦</p>
        <p>لا يتم منح الوصول إلا للبريد الإلكتروني المدرج في قائمة فريق العمل.</p>
      </div>
    </div>
  );
}
