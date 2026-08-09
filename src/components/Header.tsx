import React, { useState } from 'react';
import { 
  ShieldAlert, 
  BookOpen, 
  Sun, 
  Moon, 
  MessageSquare, 
  Search, 
  BrainCircuit, 
  History, 
  Building2, 
  Calendar, 
  Cpu, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  Sparkles,
  ChevronRight,
  Database
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  onOpenGuide: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isAnalyzing?: boolean;
  onOpenChat: () => void;
  onOpenSearch: () => void;
  onOpenDeepAudit: () => void;
  onOpenHistory: () => void;
  onOpenSuppliersCatalog?: () => void;
  onOpenCalendar?: () => void;
  onOpenCustomerVerification?: () => void;
  onOpenAISettings?: () => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenGuide, 
  isDarkMode, 
  onToggleDarkMode, 
  isAnalyzing,
  onOpenChat,
  onOpenSearch,
  onOpenDeepAudit,
  onOpenHistory,
  onOpenSuppliersCatalog,
  onOpenCalendar,
  onOpenCustomerVerification,
  onOpenAISettings,
  currentUser,
  onOpenAuthModal,
  onSignOut,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isGoogleUser = currentUser && !currentUser.isAnonymous;

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-30 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 min-w-0 shrink">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 truncate">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none truncate">
                  TenderAgent
                </h1>
                <span className="text-[9px] sm:text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                  44/223-ФЗ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 hidden lg:block truncate">
                Интеллектуальный анализ закупок, контрактов и проверок заказчиков
              </p>
            </div>
          </div>

          {/* DESKTOP NAVIGATION BAR (md and larger) */}
          <div className="hidden md:flex p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 items-center gap-1 shadow-2xs shrink-0">
            {/* AI Chat Button */}
            <button
              type="button"
              onClick={onOpenChat}
              className="flex items-center gap-1.5 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Открыть ИИ-Чат Консультант 223-ФЗ"
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
              <span>ИИ-Чат</span>
            </button>

            {/* Customer INN Check Button */}
            {onOpenCustomerVerification && (
              <button
                type="button"
                onClick={onOpenCustomerVerification}
                className="flex items-center gap-1.5 text-xs font-extrabold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
                title="Проверка заказчика по ИНН (ФНС, РНП, Арбитраж)"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>ИНН</span>
              </button>
            )}

            {/* Deadlines Calendar Button */}
            {onOpenCalendar && (
              <button
                type="button"
                onClick={onOpenCalendar}
                className="flex items-center gap-1.5 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
                title="Календарь дедлайнов и сроков"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Календарь</span>
              </button>
            )}

            {/* AI Models Button */}
            {onOpenAISettings && (
              <button
                type="button"
                onClick={onOpenAISettings}
                className="flex items-center gap-1.5 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
                title="Настройка ИИ моделей"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Модели</span>
              </button>
            )}

            {/* Saved History Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
              title="База данных сохраненных закупок"
            >
              <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>База</span>
            </button>

            <div className="w-px h-4 bg-slate-300/80 dark:bg-slate-700 my-auto shrink-0" />

            {/* Google Auth Badge */}
            {isGoogleUser ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-2 py-1 rounded-xl hover:bg-emerald-100 transition-all cursor-pointer"
                  title={`Google Аккаунт: ${currentUser.email}`}
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Google Avatar"
                      className="w-4 h-4 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {(currentUser.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-[11px] font-extrabold max-w-[90px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </button>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer shrink-0"
                    title="Выйти из Google аккаунта"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 text-xs font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
                title="Войти с помощью Google Аккаунта"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="text-[11px]">Вход Google</span>
              </button>
            )}

            <div className="w-px h-4 bg-slate-300/80 dark:bg-slate-700 my-auto shrink-0" />

            {/* Dark Mode Switcher */}
            <button
              type="button"
              id="toggle-dark-mode-btn"
              onClick={onToggleDarkMode}
              className="p-1.5 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
              title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </button>

            {/* Guide Button */}
            <button
              id="open-guide-btn"
              type="button"
              onClick={onOpenGuide}
              className="flex items-center gap-1 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer"
              title="Регламент работы (44-ФЗ & 223-ФЗ)"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs">Регламент</span>
            </button>
          </div>

          {/* MOBILE TOP CONTROLS (Google Status + Mobile Menu Toggle) */}
          <div className="flex md:hidden items-center gap-2">
            {isGoogleUser ? (
              <button
                type="button"
                onClick={onOpenHistory}
                className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-xl text-emerald-800 dark:text-emerald-200 shrink-0"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Google Avatar"
                    className="w-4 h-4 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {(currentUser.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-[11px] font-bold max-w-[70px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 text-xs font-extrabold bg-indigo-600 text-white px-2 py-1 rounded-xl shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="text-[10px]">Вход</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer active:scale-95"
              aria-label="Открыть меню"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE DRAWER / SLIDE-OVER MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/70 backdrop-blur-sm animate-fade-in flex flex-col justify-end sm:justify-start">
          <div className="bg-white dark:bg-slate-900 border-t sm:border-b border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-b-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up">
            
            {/* Header of Mobile Menu */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                  TA
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Меню TenderAgent</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Быстрый доступ к сервисам</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Account Status Banner */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 truncate">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">
                    {isGoogleUser ? 'Google Аккаунт' : 'Гостевой режим'}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate block">
                    {isGoogleUser ? currentUser?.email : 'Требуется вход Google'}
                  </span>
                </div>
              </div>

              {isGoogleUser ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onSignOut) onSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Выйти</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAuthModal) onOpenAuthModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Войти</span>
                </button>
              )}
            </div>

            {/* Menu Links List */}
            <div className="space-y-1.5">
              
              <button
                type="button"
                onClick={() => {
                  onOpenChat();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 rounded-2xl flex items-center justify-between text-indigo-900 dark:text-indigo-200 font-extrabold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>ИИ-Чат Консультант 223-ФЗ</span>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-400" />
              </button>

              {onOpenCustomerVerification && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCustomerVerification();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full p-3 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-2xl flex items-center justify-between text-amber-900 dark:text-amber-200 font-extrabold text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Проверка заказчика по ИНН</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>
              )}

              {onOpenCalendar && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCalendar();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Календарь дедлайнов</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {onOpenAISettings && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAISettings();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Настройка ИИ Моделей</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onOpenHistory();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>База данных и История закупок</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenGuide();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Регламент работы (44-ФЗ & 223-ФЗ)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

            </div>

            {/* Footer Quick Controls inside Mobile Drawer */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                Оформление темы:
              </span>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-extrabold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Светлая</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>Тёмная</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
