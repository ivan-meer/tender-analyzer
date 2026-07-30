import React from 'react';
import { ShieldAlert, BookOpen, Sun, Moon, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isAnalyzing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenGuide, 
  isDarkMode, 
  onToggleDarkMode, 
  isAnalyzing 
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                Анализатор 223-ФЗ <span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </h1>
              <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Регламент 223-ФЗ
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 hidden sm:block">
              Интеллектуальный анализ закупочной документации и правовых рисков
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark Mode Switcher */}
          <button
            type="button"
            id="toggle-dark-mode-btn"
            onClick={onToggleDarkMode}
            className="flex items-center gap-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Светлая</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Тёмная</span>
              </>
            )}
          </button>

          <button
            id="open-guide-btn"
            onClick={onOpenGuide}
            className="flex items-center gap-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
          >
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">Памятка / Регламент</span>
          </button>

          <div className="flex items-center gap-2 text-xs bg-indigo-50/80 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900 text-slate-600 dark:text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400 font-medium">Статус ИИ:</span>
            <span className="text-indigo-700 dark:text-indigo-300 font-bold font-mono text-[11px]">Gemini 3.6 Flash</span>
          </div>
        </div>
      </div>
    </header>
  );
};

