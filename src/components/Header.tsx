import React from 'react';
import { ShieldAlert, BookOpen, Sun, Moon, Sparkles, MessageSquare, Search, BrainCircuit, History, Globe, Building2 } from 'lucide-react';

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
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none truncate">
                Анализатор Закупок <span className="text-indigo-600 dark:text-indigo-400">44-ФЗ & 223-ФЗ AI</span>
              </h1>
              <span className="hidden xs:inline-block text-[9px] sm:text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                44-ФЗ / 223-ФЗ
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 hidden lg:block">
              Интеллектуальный анализ закупочной документации, контрактов 44-ФЗ/223-ФЗ и правовых рисков
            </p>
          </div>
        </div>

        {/* COHESIVE NAVIGATION CLUSTER */}
        <div className="p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1 shadow-2xs shrink-0">
          {/* Main AI Chat Consultant Button */}
          <button
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-1.5 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title="Открыть ИИ-Чат Консультант 223-ФЗ"
          >
            <MessageSquare className="w-3.5 h-3.5 text-white" />
            <span>ИИ-Чат</span>
          </button>

          {/* Saved Tenders & History Drawer Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
            title="База данных сохраненных закупок (Firestore)"
          >
            <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">История</span>
          </button>

          <div className="w-px h-4 bg-slate-300/80 dark:bg-slate-700 my-auto" />

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

          {/* Guide / Regulations Button */}
          <button
            id="open-guide-btn"
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer"
            title="Регламент работы (44-ФЗ & 223-ФЗ)"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">Регламент</span>
          </button>
        </div>
      </div>
    </header>
  );
};

