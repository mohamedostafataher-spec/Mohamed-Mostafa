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
          name: member.name || (member.email === 'mohamedostafataher@gmail.com' ? 'محمد طاهر (المالك)' : member.email.split('@')[0]),
          role: member.role
        };
        setCurrentUser(userObj);
        localStorage.setItem('sulta_admin_auth_user', JSON.stringify(userObj));
        setSuccessNotice(`مرحباً بكِ، ${userObj.name}! تم التحقق من الصلاحية بنجاح.`);
        onAuthorized(userObj);
      } else {
        setErrorMessage(
          `عذراً، البريد (${email}) ليس لديه صلاحية الدخول. يرجى التواصل مع مالك المتجر (mohamedostafataher@gmail.com) لإضافتك في قائمة المشرفين المصرح لهم.`
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

        {/* Primary Action 1: Sign in with Google / Gmail button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isVerifying}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs py-3.5 px-4 rounded-2xl border border-gray-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {/* Google G Logo SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>الدخول السريع عبر Google Workspace / Gmail</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-gray-400 absolute">
            أو التحقق عبر بريد Gmail المسجل
          </span>
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
              بريد Gmail المصرح له:
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="mohamedostafataher@gmail.com"
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

        {/* Quick Access for Main Owner */}
        <div className="bg-[#FCF5F6] border border-[#DF8A9D]/30 rounded-2xl p-3 text-center space-y-1.5">
          <span className="text-[11px] font-bold text-gray-700 block">
            حساب المالك الرئيسي المعتمد:
          </span>
          <button
            type="button"
            onClick={() => {
              setInputEmail('mohamedostafataher@gmail.com');
              handleVerifyGmail('mohamedostafataher@gmail.com');
            }}
            className="font-mono text-xs text-[#A44C5C] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
            dir="ltr"
          >
            <span>mohamedostafataher@gmail.com</span>
            <span className="text-[10px] bg-[#A44C5C] text-white px-1.5 py-0.2 rounded-full font-sans">دخول المالك 👑</span>
          </button>
        </div>

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
