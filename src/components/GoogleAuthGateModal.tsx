import React, { useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, User } from 'firebase/auth';
import { 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  LogIn, 
  AlertCircle, 
  Building2, 
  FileText,
  UserCheck
} from 'lucide-react';

interface GoogleAuthGateModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onSuccess?: () => void;
}

export const GoogleAuthGateModal: React.FC<GoogleAuthGateModalProps> = ({
  isOpen,
  currentUser,
  onSuccess
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && !result.user.isAnonymous) {
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Авторизация Google не завершена');
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Окно входа Google было закрыто до завершения авторизации.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Запрос авторизации был отменен.');
      } else {
        setError(err.message || 'Ошибка входа через Google Аккаунт. Попробуйте еще раз.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transition-all duration-200">
        
        {/* Top Header Card Accent */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 bg-indigo-600/30 border border-indigo-400/40 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-950/50">
              <ShieldAlert className="w-8 h-8 text-indigo-300" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5 text-indigo-300" />
              <span>Безопасная авторизация</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              TenderAgent 44/223-ФЗ
            </h2>
            <p className="text-xs text-indigo-200 font-medium mt-1 max-w-md">
              Вход по Google Аккаунту обязателен для доступа к базам данных и аналитике
            </p>
          </div>
        </div>

        {/* Content & Action Area */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Требуется вход через Google Аккаунт
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              Для обеспечения безопасности данных, хранения истории анализов контрактов и персонализации реестра заказчиков войдите в систему.
            </p>
          </div>

          {/* Access Value Points */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-lg shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 dark:text-white block">Полная история анализов</span>
                <span className="text-slate-500 dark:text-slate-400">Сохранение карточек закупок и реестра рисков</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 dark:text-white block">Проверка заказчиков по ИНН</span>
                <span className="text-slate-500 dark:text-slate-400">Автоматическая синхронизация с базой заказчиков</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-lg shrink-0 mt-0.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 dark:text-white block">Персональный доступ</span>
                <span className="text-slate-500 dark:text-slate-400">Привязка данных исключительно к вашему Google аккаунту</span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl p-3 flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {/* Main Google Sign-In Action Button */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-sm border-2 border-slate-300 dark:border-slate-600 rounded-2xl shadow-md transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {isSigningIn ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Подключение Google...</span>
                </div>
              ) : (
                <>
                  {/* Official Google G Logo SVG */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span>Войти с помощью Google</span>
                </>
              )}
            </button>

            <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Авторизация использует стандартный защищенный сервис Google OAuth 2.0
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
