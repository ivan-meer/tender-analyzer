import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  BookOpen, 
  Sun, 
  Moon, 
  MessageSquare, 
  History, 
  Building2, 
  Calendar, 
  Cpu, 
  LogIn, 
  LogOut, 
  ChevronDown,
  Package,
  Wrench,
  FileDiff,
  Scale,
  Calculator
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Tooltip } from './Tooltip';

interface HeaderProps {
  onOpenGuide: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isAnalyzing?: boolean;
  onOpenChat: () => void;
  onOpenSearch?: () => void;
  onOpenDeepAudit?: () => void;
  onOpenHistory: () => void;
  onOpenSuppliersCatalog?: () => void;
  onOpenCalendar?: () => void;
  onOpenCustomerVerification?: () => void;
  onOpenAISettings?: () => void;
  onOpenContractDiff?: () => void;
  onOpenFasComplaint?: () => void;
  onOpenBankGuarantee?: () => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenGuide, 
  isDarkMode, 
  onToggleDarkMode, 
  onOpenChat,
  onOpenHistory,
  onOpenSuppliersCatalog,
  onOpenCalendar,
  onOpenCustomerVerification,
  onOpenAISettings,
  onOpenContractDiff,
  onOpenFasComplaint,
  onOpenBankGuarantee,
  currentUser,
  onOpenAuthModal,
  onSignOut,
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const isGoogleUser = currentUser && !currentUser.isAnonymous;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm shrink-0">
              <ShieldAlert className="w-4 h-4 text-white dark:text-slate-900" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight leading-none">
                TenderAgent
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                223/44-ФЗ
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Clean, minimal, 3 core + dropdown) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            {onOpenSuppliersCatalog && (
              <Tooltip content="Каталог товарных позиций и складских остатков" position="bottom">
                <button
                  type="button"
                  onClick={onOpenSuppliersCatalog}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span>Каталог товаров</span>
                </button>
              </Tooltip>
            )}

            <Tooltip content="История предыдущих аудитов и сохраненных закупок" position="bottom">
              <button
                type="button"
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>База закупок</span>
              </button>
            </Tooltip>

            <Tooltip content="Интерактивный диалог с экспертом по 223/44-ФЗ" position="bottom">
              <button
                type="button"
                onClick={onOpenChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>ИИ-Чат</span>
              </button>
            </Tooltip>

            {/* Tools & Services Dropdown */}
            <div className="relative" ref={toolsRef}>
              <Tooltip content="Юридические калькуляторы, сравнение версий и проверка контрагентов" position="bottom">
                <button
                  type="button"
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isToolsOpen 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 text-slate-400" />
                  <span>Инструменты</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>
              </Tooltip>

              {/* Dropdown Menu Popover */}
              {isToolsOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1 z-50 animate-fade-in text-xs font-normal">
                  {onOpenCustomerVerification && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenCustomerVerification();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="font-medium block">Проверка по ИНН</span>
                        <span className="text-[10px] text-slate-400">ФНС, РНП, Арбитраж</span>
                      </div>
                    </button>
                  )}

                  {onOpenCalendar && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenCalendar();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="font-medium block">Календарь сроков</span>
                        <span className="text-[10px] text-slate-400">Дедлайны и этапы</span>
                      </div>
                    </button>
                  )}

                  {onOpenContractDiff && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenContractDiff();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <FileDiff className="w-4 h-4 text-indigo-500" />
                      <div>
                        <span className="font-medium block">Сравнение договоров</span>
                        <span className="text-[10px] text-slate-400">Contract Diff & правки</span>
                      </div>
                    </button>
                  )}

                  {onOpenFasComplaint && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenFasComplaint();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <Scale className="w-4 h-4 text-red-500" />
                      <div>
                        <span className="font-medium block">Жалобы в ФАС РФ</span>
                        <span className="text-[10px] text-slate-400">ст. 105 44-ФЗ / 135-ФЗ</span>
                      </div>
                    </button>
                  )}

                  {onOpenBankGuarantee && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenBankGuarantee();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <Calculator className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="font-medium block">Калькулятор гарантий</span>
                        <span className="text-[10px] text-slate-400">Обеспечение и БГ</span>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onOpenGuide();
                      setIsToolsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="font-medium block">Регламент работы</span>
                      <span className="text-[10px] text-slate-400">Нормы 223/44-ФЗ</span>
                    </div>
                  </button>

                  {onOpenAISettings && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAISettings();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer border-t border-slate-100 dark:border-slate-800 mt-1"
                    >
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="font-medium block">Настройка ИИ</span>
                        <span className="text-[10px] text-slate-400">Модели и ключи</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Theme Toggle & User Auth */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <Tooltip content={isDarkMode ? 'Включить светлую тему' : 'Включить тёмную тему'} position="bottom">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </Tooltip>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 my-auto" />

          {/* User Auth */}
          {isGoogleUser ? (
            <div className="flex items-center gap-1.5">
              <Tooltip content={`Личный кабинет: ${currentUser.email}`} position="bottom">
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      className="w-5 h-5 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">
                      {(currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs max-w-[100px] truncate hidden sm:inline">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </button>
              </Tooltip>

              {onSignOut && (
                <Tooltip content="Выйти из учетной записи" position="bottom">
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </Tooltip>
              )}
            </div>
          ) : (
            <Tooltip content="Авторизация для сохранения закупок и отчетов в облаке" position="bottom">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Войти</span>
              </button>
            </Tooltip>
          )}
        </div>

      </div>
    </header>
  );
};

